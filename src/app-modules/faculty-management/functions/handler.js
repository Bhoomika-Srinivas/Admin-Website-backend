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

// Normalize a Mongoose doc to a plain object with facultyId mapped
function toFacultyResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    facultyId: plain.faculty_id || (plain._id ? plain._id.toString() : null)
  }
}

const Faculty = require('../schemas/faculty.model')

const facultyRepo = new MongoRepository({
  model: Faculty,
  primaryKey: 'faculty_id'
})


async function handleEvent(event) {

  const ctx = resolveTenant(event)

  log(ctx, 'faculty-management', event.field)

  switch (event.field) {

    case 'getFaculty':
      await requirePermission(ctx, 'faculty:faculty:read')
      return await getFaculty(ctx, event.arguments)

    case 'listFaculty':
      await requirePermission(ctx, 'faculty:faculty:list')
      return await listFaculty(ctx, event.arguments)

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

  const { facultyId } = validate(getFacultySchema, args || {})

  const doc = await facultyRepo.findById(ctx, facultyId)

  if (!doc) throw new NotFoundError('Faculty not found')

  return toFacultyResponse(doc)

}


/* ─────────────────────────────
   List Faculty
─────────────────────────────*/

async function listFaculty(ctx, args) {

  const validated = validate(listFacultySchema, args || {})

  const pagination = normalizePagination(validated.pagination)

  const result = await facultyRepo.findMany(ctx, {}, pagination)

  return {
    items: result.items.map(toFacultyResponse),
    nextCursor: result.nextCursor
  }

}


/* ─────────────────────────────
   Create Faculty
─────────────────────────────*/

async function createFaculty(ctx, args) {

  const input = validate(createFacultySchema, args?.input || args || {})

  const faculty_id = generateId()

  const data = {
    faculty_id,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    title: input.title,
    department: input.department,
    designation: input.designation,
    bio: input.bio,
    profileImage: input.profileImage,
    phone: input.phone,
    officeLocation: input.officeLocation,
    website: input.website,
    publications: [],
    education: [],
    workExperience: [],
    researchProjects: [],
    coursesTeaching: [],
    honors: [],
    created_by: ctx.user_id
  }

  const created = await facultyRepo.create(ctx, data)
  const response = toFacultyResponse(created)

  await publishEvent('faculty-management', 'FacultyCreated', {
    faculty_id: response.facultyId,
    tenant_id: ctx.tenant_id,
    created_by: ctx.user_id,
    timestamp: new Date().toISOString()
  })

  return response

}


/* ─────────────────────────────
   Update Faculty
─────────────────────────────*/

async function updateFaculty(ctx, args) {

  const input = validate(updateFacultySchema, args?.input || args || {})

  const existing = await facultyRepo.findById(ctx, input.facultyId)

  if (!existing) throw new NotFoundError('Faculty not found')

  const updates = {}
  if (input.firstName !== undefined) updates.firstName = input.firstName
  if (input.lastName !== undefined) updates.lastName = input.lastName
  if (input.email !== undefined) updates.email = input.email
  if (input.title !== undefined) updates.title = input.title
  if (input.department !== undefined) updates.department = input.department
  if (input.designation !== undefined) updates.designation = input.designation
  if (input.bio !== undefined) updates.bio = input.bio
  if (input.profileImage !== undefined) updates.profileImage = input.profileImage
  if (input.phone !== undefined) updates.phone = input.phone
  if (input.officeLocation !== undefined) updates.officeLocation = input.officeLocation
  if (input.website !== undefined) updates.website = input.website

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

  await publishEvent('faculty-management', 'FacultyDeleted', {
    faculty_id: facultyId,
    tenant_id: ctx.tenant_id,
    deleted_by: ctx.user_id,
    timestamp: new Date().toISOString()
  })

  return toFacultyResponse(existing)

}