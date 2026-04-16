const { resolveTenant }       = require('/opt/nodejs/middleware/tenant-resolver')
const { requirePermission }   = require('/opt/nodejs/middleware/auth-guard')
const { validate }            = require('/opt/nodejs/middleware/input-validator')
const { withConnection }      = require('/opt/nodejs/middleware/with-connection')
const { log }                 = require('/opt/nodejs/middleware/request-logger')
const { generateId }          = require('/opt/nodejs/utils/id-generator')
const { MongoRepository }     = require('/opt/nodejs/db/mongo-repository')
const { NotFoundError }       = require('/opt/nodejs/middleware/error-handler')
const { normalizePagination } = require('/opt/nodejs/utils/pagination')

const {
  getAlumniSchema,
  listAlumniSchema,
  createAlumniSchema,
  updateAlumniSchema,
  deleteAlumniSchema
} = require('../schemas/validation')

const Alumni = require('../schemas/alumni.model')

const alumniRepo = new MongoRepository({ model: Alumni, primaryKey: 'alumni_id' })

function toAlumniResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    alumniId: plain.alumni_id || (plain._id ? plain._id.toString() : null)
  }
}

/* ── Handler ── */

async function handleEvent(event) {
  const ctx = resolveTenant(event)
  log(ctx, 'alumni-management', event.field)

  switch (event.field) {

    case 'getAlumni':
      await requirePermission(ctx, 'alumni:alumni:read')
      return await getAlumni(ctx, event.arguments)

    case 'listAlumni':
      await requirePermission(ctx, 'alumni:alumni:list')
      return await listAlumni(ctx, event.arguments)

    case 'createAlumni':
      await requirePermission(ctx, 'alumni:alumni:create')
      return await createAlumni(ctx, event.arguments)

    case 'updateAlumni':
      await requirePermission(ctx, 'alumni:alumni:update')
      return await updateAlumni(ctx, event.arguments)

    case 'deleteAlumni':
      await requirePermission(ctx, 'alumni:alumni:delete')
      return await deleteAlumni(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)


/* ── Get Alumni ── */

async function getAlumni(ctx, args) {
  const { alumniId } = validate(getAlumniSchema, args || {})
  // Always use authenticated tenant context - never allow override
  const doc = await alumniRepo.findById(ctx, alumniId)
  if (!doc) throw new NotFoundError('Alumni not found')
  return toAlumniResponse(doc)
}


/* ── List Alumni ── */

async function listAlumni(ctx, args) {
  const validated   = validate(listAlumniSchema, args || {})
  const resolvedCtx = validated.tenantId ? { ...ctx, tenant_id: validated.tenantId } : ctx

  const query = {}
  if (validated.deptId) query.deptId = validated.deptId
  if (validated.batch)  query.batch  = validated.batch
  if (validated.search) query.$or = [
    { name:        { $regex: validated.search, $options: 'i' } },
    { company:     { $regex: validated.search, $options: 'i' } },
    { designation: { $regex: validated.search, $options: 'i' } },
    { batch:       { $regex: validated.search, $options: 'i' } }
  ]

  const pagination = normalizePagination(validated)
  const result     = await alumniRepo.findMany(resolvedCtx, query, pagination)

  return {
    items:     result.items.map(toAlumniResponse),
    nextToken: result.nextCursor
  }
}


/* ── Create Alumni ── */

async function createAlumni(ctx, args) {
  const input     = validate(createAlumniSchema, args || {})
  const { deptId, name, batch, department, company, designation, location, achievement, email, linkedin, image } = input.input
  const alumni_id = generateId()

  const created = await alumniRepo.create(ctx, {
    alumni_id,
    deptId,
    name,
    batch,
    department:  department  ?? null,
    company,
    designation,
    location:    location    ?? null,
    achievement: achievement ?? null,
    email:       email       ?? null,
    linkedin:    linkedin    ?? null,
    image:       image       ?? null,
    created_by:  ctx.user_id
  })

  return toAlumniResponse(created)
}


/* ── Update Alumni ── */

async function updateAlumni(ctx, args) {
  const input       = validate(updateAlumniSchema, args || {})
  const { alumniId, ...fields } = input.input

  const existing = await alumniRepo.findById(ctx, alumniId)
  if (!existing) throw new NotFoundError('Alumni not found')

  const updates = {}
  if (fields.name        !== undefined) updates.name        = fields.name
  if (fields.batch       !== undefined) updates.batch       = fields.batch
  if (fields.department  !== undefined) updates.department  = fields.department
  if (fields.company     !== undefined) updates.company     = fields.company
  if (fields.designation !== undefined) updates.designation = fields.designation
  if (fields.location    !== undefined) updates.location    = fields.location
  if (fields.achievement !== undefined) updates.achievement = fields.achievement
  if (fields.email       !== undefined) updates.email       = fields.email
  if (fields.linkedin    !== undefined) updates.linkedin    = fields.linkedin
  if (fields.image       !== undefined) updates.image       = fields.image

  const updated = await alumniRepo.updateById(ctx, alumniId, updates)
  return toAlumniResponse(updated)
}


/* ── Delete Alumni ── */

async function deleteAlumni(ctx, args) {
  const { alumniId } = validate(deleteAlumniSchema, args || {})
  const existing = await alumniRepo.findById(ctx, alumniId)
  if (!existing) throw new NotFoundError('Alumni not found')
  await alumniRepo.deleteById(ctx, alumniId)
  return toAlumniResponse(existing)
}
