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

  const { faculty_id } = validate(getFacultySchema, args || {})

  const doc = await facultyRepo.findById(ctx, faculty_id)

  if (!doc) throw new NotFoundError('Faculty not found')

  return doc

}


/* ─────────────────────────────
   List Faculty
─────────────────────────────*/

async function listFaculty(ctx, args) {

  const validated = validate(listFacultySchema, args || {})

  const pagination = normalizePagination(validated.pagination)

  const result = await facultyRepo.findMany(ctx, {}, pagination)

  return {
    items: result.items,
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
    tenant_id: ctx.tenant_id,

    name: input.name,
    designation: input.designation,
    departmentId: input.departmentId,

    qualification: input.qualification,
    experience: input.experience,

    email: input.email,
    phone: input.phone,

    specialization: input.specialization,
    officeLocation: input.officeLocation,
    profilePicture: input.profilePicture,

    publications: input.publications || [],
    education: input.education || [],
    workExperience: input.workExperience || [],
    researchProjects: input.researchProjects || [],
    coursesTeaching: input.coursesTeaching || [],
    honors: input.honors || [],

    created_by: ctx.user_id

  }

  const created = await facultyRepo.create(ctx, data)

  await publishEvent('faculty-management', 'FacultyCreated', {
    faculty_id: created.faculty_id,
    tenant_id: ctx.tenant_id,
    created_by: ctx.user_id,
    timestamp: new Date().toISOString()
  })

  return created

}


/* ─────────────────────────────
   Update Faculty
─────────────────────────────*/

async function updateFaculty(ctx, args) {

  const validated = validate(updateFacultySchema, { ...args, input: args?.input || args })

  const faculty_id = validated.faculty_id || validated.id

  const input = validated.input || {}

  const existing = await facultyRepo.findById(ctx, faculty_id)

  if (!existing) throw new NotFoundError('Faculty not found')

  const updates = {}

  if (input.name !== undefined) updates.name = input.name
  if (input.designation !== undefined) updates.designation = input.designation
  if (input.departmentId !== undefined) updates.department_id = input.departmentId
  if (input.qualification !== undefined) updates.qualification = input.qualification
  if (input.experience !== undefined) updates.experience = input.experience
  if (input.email !== undefined) updates.email = input.email
  if (input.phone !== undefined) updates.phone = input.phone
  if (input.specialization !== undefined) updates.specialization = input.specialization
  if (input.officeLocation !== undefined) updates.officeLocation = input.officeLocation
  if (input.profilePicture !== undefined) updates.profilePicture = input.profilePicture

  if (input.publications !== undefined) updates.publications = input.publications
  if (input.education !== undefined) updates.education = input.education
  if (input.workExperience !== undefined) updates.workExperience = input.workExperience
  if (input.researchProjects !== undefined) updates.researchProjects = input.researchProjects
  if (input.coursesTeaching !== undefined) updates.coursesTeaching = input.coursesTeaching
  if (input.honors !== undefined) updates.honors = input.honors

  const updated = await facultyRepo.updateById(ctx, faculty_id, updates)

  return updated

}


/* ─────────────────────────────
   Delete Faculty
─────────────────────────────*/

async function deleteFaculty(ctx, args) {

  const { faculty_id } = validate(deleteFacultySchema, { faculty_id: args?.faculty_id || args?.id })

  const existing = await facultyRepo.findById(ctx, faculty_id)

  if (!existing) throw new NotFoundError('Faculty not found')

  await facultyRepo.deleteById(ctx, faculty_id)

  await publishEvent('faculty-management', 'FacultyDeleted', {
    faculty_id,
    tenant_id: ctx.tenant_id,
    deleted_by: ctx.user_id,
    timestamp: new Date().toISOString()
  })

  return true

}