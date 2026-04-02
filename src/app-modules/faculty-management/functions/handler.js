const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver')
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard')
const { validate } = require('/opt/nodejs/middleware/input-validator')
const { withConnection } = require('/opt/nodejs/middleware/with-connection')
const { log } = require('/opt/nodejs/middleware/request-logger')
const { publishEvent } = require('/opt/nodejs/utils/event-publisher')
const { generateId } = require('/opt/nodejs/utils/id-generator')
const { MongoRepository } = require('/opt/nodejs/db/mongo-repository')
const { NotFoundError } = require('/opt/nodejs/middleware/error-handler')
const { normalizePagination } = require('/opt/nodejs/utils/pagination')

const {
  getFacultySchema,
  listFacultySchema,
  createFacultySchema,
  updateFacultySchema,
  deleteFacultySchema
} = require('../schemas/validation')

const Faculty = require('../schemas/faculty.model')

const facultyRepo = new MongoRepository({ model: Faculty, primaryKey: 'faculty_id' })

const DESIGNATION_OPTIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'HOD',
  'Principal'
]

function toFacultyResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    facultyId:   plain.faculty_id || (plain._id ? plain._id.toString() : null),
    name:        plain.name || [plain.firstName, plain.lastName].filter(Boolean).join(' ') || null,
    designation: plain.designation || plain.title || null,
    department:  plain.department || null,
  }
}


async function handleEvent(event) {

  const ctx = resolveTenant(event)

  log(ctx, 'faculty-management', event.field)

  switch (event.field) {

    case 'getFaculty':
      return await getFaculty(ctx, event.arguments)

    case 'listFaculty':
      return await listFaculty(ctx, event.arguments)

    case 'listDesignationOptions':
      return { items: DESIGNATION_OPTIONS }

    case 'createFaculty':
      await requirePermission(ctx, 'faculty:faculty:create')
      return await createFaculty(ctx, event.arguments)

    case 'updateFaculty':
      await requirePermission(ctx, 'faculty:faculty:update')
      return await updateFaculty(ctx, event.arguments)

    case 'deleteFaculty':
      await requirePermission(ctx, 'faculty:faculty:delete')
      return await deleteFaculty(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }

}

exports.handler = withConnection(handleEvent)


/* ─────────────────────────────
   Get Faculty
─────────────────────────────*/

async function getFaculty(ctx, args) {
  const { facultyId, tenantId } = validate(getFacultySchema, args || {})
  const resolvedCtx = tenantId ? { ...ctx, tenant_id: tenantId } : ctx
  const doc = await facultyRepo.findById(resolvedCtx, facultyId)
  if (!doc) throw new NotFoundError('Faculty not found')
  return toFacultyResponse(doc)
}


/* ─────────────────────────────
   List Faculty
─────────────────────────────*/

async function listFaculty(ctx, args) {
  const validated   = validate(listFacultySchema, args || {})
  const resolvedCtx = validated.tenantId ? { ...ctx, tenant_id: validated.tenantId } : ctx

  const query = {}
  if (validated.deptId)      query.deptId      = validated.deptId
  if (validated.designation) query.designation  = validated.designation
  if (validated.status)      query.status       = validated.status
  if (validated.search)      query.name         = { $regex: validated.search, $options: 'i' }

  const limit = Math.min(validated.limit || 50, 100)

  if (validated.nextToken) {
    const cursor = JSON.parse(Buffer.from(validated.nextToken, 'base64').toString('utf8'))
    query.order = { $gt: cursor.order }
  }

  const fullFilter = { ...query, tenant_id: resolvedCtx.tenant_id }
  const items = await Faculty.find(fullFilter).sort({ order: 1 }).limit(limit + 1).lean()

  const hasMore  = items.length > limit
  const page     = hasMore ? items.slice(0, limit) : items
  const nextToken = hasMore
    ? Buffer.from(JSON.stringify({ order: page[page.length - 1].order })).toString('base64')
    : null

  return {
    items:     page.map(toFacultyResponse),
    nextToken
  }
}


/* ─────────────────────────────
   Create Faculty
─────────────────────────────*/

async function createFaculty(ctx, args) {
  const input      = validate(createFacultySchema, args?.input || args || {})
  const faculty_id = generateId()

  let order = input.order ?? null
  if (order === null) {
    const count = await Faculty.countDocuments({ tenant_id: ctx.tenant_id, deptId: input.deptId })
    order = count + 1
  } else if (input.insertMode) {
    await Faculty.updateMany(
      { tenant_id: ctx.tenant_id, deptId: input.deptId, order: { $gte: order } },
      { $inc: { order: 1 } }
    )
  }

  const created = await facultyRepo.create(ctx, {
    faculty_id,
    name:         input.name,
    designation:  input.designation,
    deptId:       input.deptId,
    department:   input.department   ?? null,
    profileImage: input.profileImage ?? null,
    cvUrl:        input.cvUrl        ?? null,
    status:       input.status       ?? 'active',
    order,
    created_by:   ctx.user_id
  })

  const response = toFacultyResponse(created)

  await publishEvent('faculty-management', 'FacultyCreated', {
    faculty_id: response.facultyId,
    tenant_id:  ctx.tenant_id,
    created_by: ctx.user_id,
    timestamp:  new Date().toISOString()
  })

  return response
}


/* ─────────────────────────────
   Update Faculty
─────────────────────────────*/

async function updateFaculty(ctx, args) {
  const input    = validate(updateFacultySchema, args?.input || args || {})
  const existing = await facultyRepo.findById(ctx, input.facultyId)
  if (!existing) throw new NotFoundError('Faculty not found')

  const updates = {}
  if (input.name         !== undefined) updates.name         = input.name
  if (input.designation  !== undefined) updates.designation  = input.designation
  if (input.deptId       !== undefined) updates.deptId       = input.deptId
  if (input.department   !== undefined) updates.department   = input.department
  if (input.profileImage !== undefined) updates.profileImage = input.profileImage
  if (input.cvUrl        !== undefined) updates.cvUrl        = input.cvUrl
  if (input.status       !== undefined) updates.status       = input.status
  if (input.order !== undefined) {
    updates.order = input.order
    const oldOrder = existing.order
    const newOrder = input.order
    const scope    = { tenant_id: ctx.tenant_id, deptId: existing.deptId, faculty_id: { $ne: existing.faculty_id } }

    if (oldOrder !== newOrder) {
      if (newOrder > oldOrder) {
        // moving down: shift records between old+1 and new down by 1
        await Faculty.updateMany(
          { ...scope, order: { $gt: oldOrder, $lte: newOrder } },
          { $inc: { order: -1 } }
        )
      } else {
        // moving up: shift records between new and old-1 up by 1
        await Faculty.updateMany(
          { ...scope, order: { $gte: newOrder, $lt: oldOrder } },
          { $inc: { order: 1 } }
        )
      }
    }
  }

  const updated = await facultyRepo.updateById(ctx, input.facultyId, updates)
  return toFacultyResponse(updated)
}


/* ─────────────────────────────
   Delete Faculty
─────────────────────────────*/

async function deleteFaculty(ctx, args) {
  const { facultyId } = validate(deleteFacultySchema, { facultyId: args?.facultyId || args?.faculty_id })
  const existing = await facultyRepo.findById(ctx, facultyId)
  if (!existing) throw new NotFoundError('Faculty not found')

  await facultyRepo.deleteById(ctx, facultyId)

  // reorder remaining faculty sequentially 1, 2, 3...
  const remaining = await Faculty.find({ tenant_id: ctx.tenant_id, deptId: existing.deptId }).sort({ order: 1 }).lean()
  if (remaining.length > 0) {
    await Faculty.bulkWrite(
      remaining.map((doc, idx) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { order: idx + 1 } }
        }
      }))
    )
  }

  await publishEvent('faculty-management', 'FacultyDeleted', {
    faculty_id: facultyId,
    tenant_id:  ctx.tenant_id,
    deleted_by: ctx.user_id,
    timestamp:  new Date().toISOString()
  })

  return toFacultyResponse(existing)
}
