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
  getDeptStaffSchema,
  listDeptStaffSchema,
  createDeptStaffSchema,
  updateDeptStaffSchema,
  deleteDeptStaffSchema,
  getAccreditationSchema,
  listAccreditationsSchema,
  createAccreditationSchema,
  updateAccreditationSchema,
  deleteAccreditationSchema
} = require('../schemas/validation')

const {
  DeptStaff,
  Accreditation
} = require('../schemas/dept.people.model')

/* ─────────────────────────────
   Repositories
─────────────────────────────*/

const deptStaffRepo = new MongoRepository({
  model:      DeptStaff,
  primaryKey: 'dept_staff_id'
})

const accreditationRepo = new MongoRepository({
  model:      Accreditation,
  primaryKey: 'accreditation_id'
})

/* ─────────────────────────────
   Response Normalizers
─────────────────────────────*/

function toDeptStaffResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    deptStaffId: plain.dept_staff_id || (plain._id ? plain._id.toString() : null)
  }
}

function toAccreditationResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    accreditationId: plain.accreditation_id || (plain._id ? plain._id.toString() : null)
  }
}

/* ─────────────────────────────
   Query Builders
─────────────────────────────*/

function buildStaffQuery(args) {
  const query = {}

  if (args.deptId) query.deptId = args.deptId
  if (args.status) query.status = args.status

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { name:        { $regex: args.search.trim(), $options: 'i' } },
      { designation: { $regex: args.search.trim(), $options: 'i' } },
      { email:       { $regex: args.search.trim(), $options: 'i' } }
    ]
  }

  return query
}

function buildAccreditationQuery(args) {
  const query = {}

  if (args.deptId) query.deptId = args.deptId
  if (args.status) query.status = args.status

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { name:         { $regex: args.search.trim(), $options: 'i' } },
      { accreditedBy: { $regex: args.search.trim(), $options: 'i' } },
      { grade:        { $regex: args.search.trim(), $options: 'i' } }
    ]
  }

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
  log(ctx, 'dept-people', event.field)

  switch (event.field) {

    // ── DeptStaff ─────────────────────────────────
    case 'getDeptStaff':
      await requirePermission(ctx, 'dept-people:staff:read')
      return await getDeptStaff(ctx, event.arguments)

    case 'listDeptStaff':
      await requirePermission(ctx, 'dept-people:staff:list')
      return await listDeptStaff(ctx, event.arguments)

    case 'createDeptStaff':
      await requirePermission(ctx, 'dept-people:staff:create')
      return await createDeptStaff(ctx, event.arguments)

    case 'updateDeptStaff':
      await requirePermission(ctx, 'dept-people:staff:update')
      return await updateDeptStaff(ctx, event.arguments)

    case 'deleteDeptStaff':
      await requirePermission(ctx, 'dept-people:staff:delete')
      return await deleteDeptStaff(ctx, event.arguments)

    // ── Accreditation ─────────────────────────────
    case 'getAccreditation':
      await requirePermission(ctx, 'dept-people:accreditation:read')
      return await getAccreditation(ctx, event.arguments)

    case 'listAccreditations':
      await requirePermission(ctx, 'dept-people:accreditation:list')
      return await listAccreditations(ctx, event.arguments)

    case 'createAccreditation':
      await requirePermission(ctx, 'dept-people:accreditation:create')
      return await createAccreditation(ctx, event.arguments)

    case 'updateAccreditation':
      await requirePermission(ctx, 'dept-people:accreditation:update')
      return await updateAccreditation(ctx, event.arguments)

    case 'deleteAccreditation':
      await requirePermission(ctx, 'dept-people:accreditation:delete')
      return await deleteAccreditation(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)


/* ─────────────────────────────
   Get DeptStaff
─────────────────────────────*/

async function getDeptStaff(ctx, args) {
  const { deptStaffId } = validate(getDeptStaffSchema, args || {})
  const doc = await deptStaffRepo.findById(ctx, deptStaffId)
  if (!doc) throw new NotFoundError('Staff member not found')
  return toDeptStaffResponse(doc)
}


/* ─────────────────────────────
   List DeptStaff
─────────────────────────────*/

async function listDeptStaff(ctx, args) {
  const validated  = validate(listDeptStaffSchema, args || {})
  const query      = buildStaffQuery(validated)
  const sort       = buildSort(validated.sortBy, validated.sortOrder)
  const pagination = normalizePagination(validated)

  const result = await deptStaffRepo.findMany(ctx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toDeptStaffResponse),
    nextToken: result.nextCursor
  }
}


/* ─────────────────────────────
   Create DeptStaff
─────────────────────────────*/

async function createDeptStaff(ctx, args) {
  const input = validate(createDeptStaffSchema, args || {})
  const { deptId, name, designation, qualification, experience, email, phone, status } = input.input

  const dept_staff_id = generateId()

  const created = await deptStaffRepo.create(ctx, {
    dept_staff_id,
    deptId,
    name,
    designation,
    qualification: qualification ?? '',
    experience:    experience    ?? 0,
    email:         email         ?? '',
    phone:         phone         ?? '',
    status:        status        ?? 'active',
    created_by:    ctx.user_id
  })

  return toDeptStaffResponse(created)
}


/* ─────────────────────────────
   Update DeptStaff
─────────────────────────────*/

async function updateDeptStaff(ctx, args) {
  const input = validate(updateDeptStaffSchema, args || {})
  const { deptStaffId, ...fields } = input.input

  const existing = await deptStaffRepo.findById(ctx, deptStaffId)
  if (!existing) throw new NotFoundError('Staff member not found')

  const updates = {}
  if (fields.name          !== undefined) updates.name          = fields.name
  if (fields.designation   !== undefined) updates.designation   = fields.designation
  if (fields.qualification !== undefined) updates.qualification = fields.qualification
  if (fields.experience    !== undefined) updates.experience    = fields.experience
  if (fields.email         !== undefined) updates.email         = fields.email
  if (fields.phone         !== undefined) updates.phone         = fields.phone
  if (fields.status        !== undefined) updates.status        = fields.status

  const updated = await deptStaffRepo.updateById(ctx, deptStaffId, updates)

  return toDeptStaffResponse(updated)
}


/* ─────────────────────────────
   Delete DeptStaff
─────────────────────────────*/

async function deleteDeptStaff(ctx, args) {
  const { deptStaffId } = validate(deleteDeptStaffSchema, args || {})

  const existing = await deptStaffRepo.findById(ctx, deptStaffId)
  if (!existing) throw new NotFoundError('Staff member not found')

  await deptStaffRepo.deleteById(ctx, deptStaffId)

  return toDeptStaffResponse(existing)
}


/* ─────────────────────────────
   Get Accreditation
─────────────────────────────*/

async function getAccreditation(ctx, args) {
  const { accreditationId } = validate(getAccreditationSchema, args || {})
  const doc = await accreditationRepo.findById(ctx, accreditationId)
  if (!doc) throw new NotFoundError('Accreditation not found')
  return toAccreditationResponse(doc)
}


/* ─────────────────────────────
   List Accreditations
─────────────────────────────*/

async function listAccreditations(ctx, args) {
  const validated  = validate(listAccreditationsSchema, args || {})
  const query      = buildAccreditationQuery(validated)
  const sort       = buildSort(validated.sortBy, validated.sortOrder)
  const pagination = normalizePagination(validated)

  const result = await accreditationRepo.findMany(ctx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toAccreditationResponse),
    nextToken: result.nextCursor
  }
}


/* ─────────────────────────────
   Create Accreditation
─────────────────────────────*/

async function createAccreditation(ctx, args) {
  const input = validate(createAccreditationSchema, args || {})
  const {
    deptId, name, accreditedBy,
    validFrom, validUntil,
    grade, certificateUrl, status
  } = input.input

  const accreditation_id = generateId()

  const created = await accreditationRepo.create(ctx, {
    accreditation_id,
    deptId,
    name,
    accreditedBy,
    validFrom:      validFrom      ?? '',
    validUntil:     validUntil     ?? '',
    grade:          grade          ?? '',
    certificateUrl: certificateUrl ?? '',
    status:         status         ?? 'active',
    created_by:     ctx.user_id
  })

  return toAccreditationResponse(created)
}


/* ─────────────────────────────
   Update Accreditation
─────────────────────────────*/

async function updateAccreditation(ctx, args) {
  const input = validate(updateAccreditationSchema, args || {})
  const { accreditationId, ...fields } = input.input

  const existing = await accreditationRepo.findById(ctx, accreditationId)
  if (!existing) throw new NotFoundError('Accreditation not found')

  const updates = {}
  if (fields.name           !== undefined) updates.name           = fields.name
  if (fields.accreditedBy   !== undefined) updates.accreditedBy   = fields.accreditedBy
  if (fields.validFrom      !== undefined) updates.validFrom      = fields.validFrom
  if (fields.validUntil     !== undefined) updates.validUntil     = fields.validUntil
  if (fields.grade          !== undefined) updates.grade          = fields.grade
  if (fields.certificateUrl !== undefined) updates.certificateUrl = fields.certificateUrl
  if (fields.status         !== undefined) updates.status         = fields.status

  const updated = await accreditationRepo.updateById(ctx, accreditationId, updates)

  return toAccreditationResponse(updated)
}


/* ─────────────────────────────
   Delete Accreditation
─────────────────────────────*/

async function deleteAccreditation(ctx, args) {
  const { accreditationId } = validate(deleteAccreditationSchema, args || {})

  const existing = await accreditationRepo.findById(ctx, accreditationId)
  if (!existing) throw new NotFoundError('Accreditation not found')

  await accreditationRepo.deleteById(ctx, accreditationId)

  return toAccreditationResponse(existing)
}
