const { resolveTenant }       = require('/opt/nodejs/middleware/tenant-resolver')
const { requirePermission }   = require('/opt/nodejs/middleware/auth-guard')
const { validate }            = require('/opt/nodejs/middleware/input-validator')
const { withConnection }      = require('/opt/nodejs/middleware/with-connection')
const { log }                 = require('/opt/nodejs/middleware/request-logger')
const { publishEvent }        = require('/opt/nodejs/utils/event-publisher')
const { generateId }          = require('/opt/nodejs/utils/id-generator')
const { MongoRepository }     = require('/opt/nodejs/db/mongo-repository')
const { NotFoundError }       = require('/opt/nodejs/middleware/error-handler')
const { normalizePagination } = require('/opt/nodejs/utils/pagination')

const {
  getDepartmentSchema,
  listDepartmentsSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  deleteDepartmentSchema
} = require('../schemas/validation')

const Department = require('../schemas/department.model')

const departmentRepo = new MongoRepository({
  model:      Department,
  primaryKey: 'department_id'
})

/* ─────────────────────────────
   Response Normalizer
─────────────────────────────*/

function toDepartmentResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    departmentId: plain.department_id || (plain._id ? plain._id.toString() : null),
    tenantId:     plain.tenant_id     || null
  }
}

/* ─────────────────────────────
   Query Builder
─────────────────────────────*/

function buildQuery(args) {
  const query = {}

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { name:        { $regex: args.search.trim(), $options: 'i' } },
      { shortName:   { $regex: args.search.trim(), $options: 'i' } },
      { hod:         { $regex: args.search.trim(), $options: 'i' } },
      { description: { $regex: args.search.trim(), $options: 'i' } }
    ]
  }

  if (args.status) query.status = args.status

  return query
}

function buildSort(sortBy, sortOrder) {
  const order = sortOrder === 'desc' ? -1 : 1
  const field = sortBy || 'createdAt'
  return { [field]: order }
}

/* ─────────────────────────────
   Event Router
─────────────────────────────*/

async function handleEvent(event) {
  const ctx = resolveTenant(event)
  log(ctx, 'department', event.field)

  switch (event.field) {
    case 'getDepartment':
      return await getDepartment(ctx, event.arguments)

    case 'listDepartments':
      return await listDepartments(ctx, event.arguments)

    case 'createDepartment':
      await requirePermission(ctx, 'department:department:create')
      return await createDepartment(ctx, event.arguments)

    case 'updateDepartment':
      await requirePermission(ctx, 'department:department:update')
      return await updateDepartment(ctx, event.arguments)

    case 'deleteDepartment':
      await requirePermission(ctx, 'department:department:delete')
      return await deleteDepartment(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)


/* ─────────────────────────────
   Get Department
─────────────────────────────*/

async function getDepartment(ctx, args) {
  const { departmentId } = validate(getDepartmentSchema, args || {})
  // tenant filter skipped — public query
  const doc = await Department.findOne({ department_id: departmentId }).lean()
  if (!doc) throw new NotFoundError('Department not found')
  return toDepartmentResponse(doc)
}


/* ─────────────────────────────
   List Departments
─────────────────────────────*/

async function listDepartments(ctx, args) {
  const validated = validate(listDepartmentsSchema, args || {})
  const query     = buildQuery(validated)
  const sort      = buildSort(validated.sortBy, validated.sortOrder)

  // tenant filter skipped — public query
  const docs = await Department.find(query).sort(sort).lean()

  return {
    items:     docs.map(toDepartmentResponse),
    nextToken: null
  }
}


/* ─────────────────────────────
   Create Department
─────────────────────────────*/

async function createDepartment(ctx, args) {
  const input = validate(createDepartmentSchema, args?.input || args || {})

  const department_id = generateId()

  const data = {
    department_id,
    name:          input.name,
    shortName:     input.shortName,
    hod:           input.hod         || '',
    established:   input.established || null,
    totalFaculty:  0,
    totalStudents: 0,
    status:        input.status      || 'active',
    description:   input.description || '',
    imageUrl:      input.imageUrl    || '',
    created_by:    ctx.user_id
  }

  const created  = await departmentRepo.create(ctx, data)
  const response = toDepartmentResponse(created)

  await publishEvent('department', 'DepartmentCreated', {
    department_id: response.departmentId,
    name:          response.name,
    shortName:     response.shortName,
    tenant_id:     ctx.tenant_id,
    created_by:    ctx.user_id,
    timestamp:     new Date().toISOString()
  })

  return response
}


/* ─────────────────────────────
   Update Department
─────────────────────────────*/

async function updateDepartment(ctx, args) {
  const input = validate(updateDepartmentSchema, args?.input || args || {})

  const existing = await departmentRepo.findById(ctx, input.departmentId)
  if (!existing) throw new NotFoundError('Department not found')

  const updates = {}
  if (input.name          !== undefined) updates.name          = input.name
  if (input.shortName     !== undefined) updates.shortName     = input.shortName
  if (input.hod           !== undefined) updates.hod           = input.hod
  if (input.established   !== undefined) updates.established   = input.established
  if (input.totalFaculty  !== undefined) updates.totalFaculty  = input.totalFaculty
  if (input.totalStudents !== undefined) updates.totalStudents = input.totalStudents
  if (input.description   !== undefined) updates.description   = input.description
  if (input.imageUrl      !== undefined) updates.imageUrl      = input.imageUrl
  if (input.status        !== undefined) updates.status        = input.status

  const updated = await departmentRepo.updateById(ctx, input.departmentId, updates)

  await publishEvent('department', 'DepartmentUpdated', {
    department_id: input.departmentId,
    changes:       Object.keys(updates),
    tenant_id:     ctx.tenant_id,
    updated_by:    ctx.user_id,
    timestamp:     new Date().toISOString()
  })

  return toDepartmentResponse(updated)
}


/* ─────────────────────────────
   Delete Department
─────────────────────────────*/

async function deleteDepartment(ctx, args) {
  const { departmentId } = validate(deleteDepartmentSchema, args || {})

  const existing = await departmentRepo.findById(ctx, departmentId)
  if (!existing) throw new NotFoundError('Department not found')

  await departmentRepo.deleteById(ctx, departmentId)

  await publishEvent('department', 'DepartmentDeleted', {
    department_id: departmentId,
    name:          existing.name,
    tenant_id:     ctx.tenant_id,
    deleted_by:    ctx.user_id,
    timestamp:     new Date().toISOString()
  })

  return toDepartmentResponse(existing)
}
