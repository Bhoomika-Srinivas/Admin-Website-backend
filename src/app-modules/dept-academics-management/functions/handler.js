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
  getDeptCourseSchema,
  listDeptCoursesSchema,
  createDeptCourseSchema,
  updateDeptCourseSchema,
  deleteDeptCourseSchema,
  listDeptTimetablesSchema,
  createDeptTimetableSchema,
  updateDeptTimetableSchema,
  deleteDeptTimetableSchema,
  listLearningMaterialsSchema,
  createLearningMaterialSchema,
  updateLearningMaterialSchema,
  deleteLearningMaterialSchema,
  listInnovativeTeachingSchema,
  createInnovativeTeachingSchema,
  updateInnovativeTeachingSchema,
  deleteInnovativeTeachingSchema,
  listResultAnalysesSchema,
  createResultAnalysisSchema,
  updateResultAnalysisSchema,
  deleteResultAnalysisSchema
} = require('../schemas/validation')

const {
  DeptCourse,
  DeptTimetable,
  LearningMaterial,
  InnovativeTeaching,
  ResultAnalysis
} = require('../schemas/dept.academics.model')

/* ─────────────────────────────
   Repositories
─────────────────────────────*/

const deptCourseRepo         = new MongoRepository({ model: DeptCourse,         primaryKey: 'dept_course_id' })
const deptTimetableRepo      = new MongoRepository({ model: DeptTimetable,      primaryKey: 'dept_timetable_id' })
const learningMaterialRepo   = new MongoRepository({ model: LearningMaterial,   primaryKey: 'learning_material_id' })
const innovativeTeachingRepo = new MongoRepository({ model: InnovativeTeaching, primaryKey: 'innovative_teaching_id' })
const resultAnalysisRepo     = new MongoRepository({ model: ResultAnalysis,     primaryKey: 'result_analysis_id' })

/* ─────────────────────────────
   Response Normalizers
─────────────────────────────*/

function toDeptCourseResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptCourseId: plain.dept_course_id || (plain._id ? plain._id.toString() : null) }
}

function toDeptTimetableResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptTimetableId: plain.dept_timetable_id || (plain._id ? plain._id.toString() : null) }
}

function toLearningMaterialResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, learningMaterialId: plain.learning_material_id || (plain._id ? plain._id.toString() : null) }
}

function toInnovativeTeachingResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, innovativeTeachingId: plain.innovative_teaching_id || (plain._id ? plain._id.toString() : null) }
}

function toResultAnalysisResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, resultAnalysisId: plain.result_analysis_id || (plain._id ? plain._id.toString() : null) }
}

/* ─────────────────────────────
   Query Builders
   All filtering/searching/sorting
   happens in MongoDB — not frontend
─────────────────────────────*/

function buildCourseQuery(args) {
  const query = {}
  if (args.deptId)   query.deptId   = args.deptId
  if (args.semester) query.semester = args.semester
  if (args.type)     query.type     = args.type
  if (args.scheme)   query.scheme   = args.scheme

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { code: { $regex: args.search.trim(), $options: 'i' } },
      { name: { $regex: args.search.trim(), $options: 'i' } }
    ]
  }

  return query
}

function buildTimetableQuery(args) {
  const query = {}
  if (args.deptId)       query.deptId       = args.deptId
  if (args.semester)     query.semester     = args.semester
  if (args.academicYear) query.academicYear = args.academicYear
  return query
}

function buildMaterialQuery(args) {
  const query = {}
  if (args.deptId)     query.deptId     = args.deptId
  if (args.courseCode) query.courseCode = args.courseCode
  if (args.type)       query.type       = args.type

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { title:      { $regex: args.search.trim(), $options: 'i' } },
      { courseCode: { $regex: args.search.trim(), $options: 'i' } },
      { courseName: { $regex: args.search.trim(), $options: 'i' } }
    ]
  }

  return query
}

function buildInnovativeTeachingQuery(args) {
  const query = {}
  if (args.deptId) query.deptId = args.deptId
  if (args.year)   query.year   = args.year

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { facultyName:   { $regex: args.search.trim(), $options: 'i' } },
      { method:        { $regex: args.search.trim(), $options: 'i' } },
      { courseApplied: { $regex: args.search.trim(), $options: 'i' } },
      { description:   { $regex: args.search.trim(), $options: 'i' } }
    ]
  }

  return query
}

function buildResultAnalysisQuery(args) {
  const query = {}
  if (args.deptId)   query.deptId   = args.deptId
  if (args.semester) query.semester = args.semester
  if (args.batch)    query.batch    = args.batch

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { title: { $regex: args.search.trim(), $options: 'i' } },
      { batch: { $regex: args.search.trim(), $options: 'i' } }
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
  log(ctx, 'dept-academics', event.field)

  switch (event.field) {

    // ── DeptCourse ────────────────────────────────
    case 'getDeptCourse':
      await requirePermission(ctx, 'dept-academics:course:read')
      return await getDeptCourse(ctx, event.arguments)

    case 'listDeptCourses':
      await requirePermission(ctx, 'dept-academics:course:list')
      return await listDeptCourses(ctx, event.arguments)

    case 'createDeptCourse':
      await requirePermission(ctx, 'dept-academics:course:create')
      return await createDeptCourse(ctx, event.arguments)

    case 'updateDeptCourse':
      await requirePermission(ctx, 'dept-academics:course:update')
      return await updateDeptCourse(ctx, event.arguments)

    case 'deleteDeptCourse':
      await requirePermission(ctx, 'dept-academics:course:delete')
      return await deleteDeptCourse(ctx, event.arguments)

    // ── DeptTimetable ─────────────────────────────
    case 'listDeptTimetables':
      await requirePermission(ctx, 'dept-academics:timetable:list')
      return await listDeptTimetables(ctx, event.arguments)

    case 'createDeptTimetable':
      await requirePermission(ctx, 'dept-academics:timetable:create')
      return await createDeptTimetable(ctx, event.arguments)

    case 'updateDeptTimetable':
      await requirePermission(ctx, 'dept-academics:timetable:update')
      return await updateDeptTimetable(ctx, event.arguments)

    case 'deleteDeptTimetable':
      await requirePermission(ctx, 'dept-academics:timetable:delete')
      return await deleteDeptTimetable(ctx, event.arguments)

    // ── LearningMaterial ──────────────────────────
    case 'listLearningMaterials':
      await requirePermission(ctx, 'dept-academics:material:list')
      return await listLearningMaterials(ctx, event.arguments)

    case 'createLearningMaterial':
      await requirePermission(ctx, 'dept-academics:material:create')
      return await createLearningMaterial(ctx, event.arguments)

    case 'updateLearningMaterial':
      await requirePermission(ctx, 'dept-academics:material:update')
      return await updateLearningMaterial(ctx, event.arguments)

    case 'deleteLearningMaterial':
      await requirePermission(ctx, 'dept-academics:material:delete')
      return await deleteLearningMaterial(ctx, event.arguments)

    // ── InnovativeTeaching ────────────────────────
    case 'listInnovativeTeaching':
      await requirePermission(ctx, 'dept-academics:innovative-teaching:list')
      return await listInnovativeTeaching(ctx, event.arguments)

    case 'createInnovativeTeaching':
      await requirePermission(ctx, 'dept-academics:innovative-teaching:create')
      return await createInnovativeTeaching(ctx, event.arguments)

    case 'updateInnovativeTeaching':
      await requirePermission(ctx, 'dept-academics:innovative-teaching:update')
      return await updateInnovativeTeaching(ctx, event.arguments)

    case 'deleteInnovativeTeaching':
      await requirePermission(ctx, 'dept-academics:innovative-teaching:delete')
      return await deleteInnovativeTeaching(ctx, event.arguments)

    // ── ResultAnalysis ────────────────────────────
    case 'listResultAnalyses':
      await requirePermission(ctx, 'dept-academics:result-analysis:list')
      return await listResultAnalyses(ctx, event.arguments)

    case 'createResultAnalysis':
      await requirePermission(ctx, 'dept-academics:result-analysis:create')
      return await createResultAnalysis(ctx, event.arguments)

    case 'updateResultAnalysis':
      await requirePermission(ctx, 'dept-academics:result-analysis:update')
      return await updateResultAnalysis(ctx, event.arguments)

    case 'deleteResultAnalysis':
      await requirePermission(ctx, 'dept-academics:result-analysis:delete')
      return await deleteResultAnalysis(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)


/* ─────────────────────────────
   DeptCourse
─────────────────────────────*/

async function getDeptCourse(ctx, args) {
  const { deptCourseId } = validate(getDeptCourseSchema, args || {})
  const doc = await deptCourseRepo.findById(ctx, deptCourseId)
  if (!doc) throw new NotFoundError('Course not found')
  return toDeptCourseResponse(doc)
}

async function listDeptCourses(ctx, args) {
  const validated  = validate(listDeptCoursesSchema, args || {})
  const query      = buildCourseQuery(validated)
  const sort       = buildSort(validated.sortBy, validated.sortOrder)
  const pagination = normalizePagination(validated)

  const result = await deptCourseRepo.findMany(ctx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toDeptCourseResponse),
    nextToken: result.nextCursor
  }
}

async function createDeptCourse(ctx, args) {
  const input = validate(createDeptCourseSchema, args || {})
  const { deptId, code, name, semester, credits, type, scheme } = input.input

  const dept_course_id = generateId()

  const created = await deptCourseRepo.create(ctx, {
    dept_course_id,
    deptId,
    code,
    name,
    semester:   semester   ?? null,
    credits:    credits    ?? 0,
    type:       type       ?? 'theory',
    scheme:     scheme     ?? '',
    created_by: ctx.user_id
  })

  return toDeptCourseResponse(created)
}

async function updateDeptCourse(ctx, args) {
  const input = validate(updateDeptCourseSchema, args || {})
  const { deptCourseId, ...fields } = input.input

  const existing = await deptCourseRepo.findById(ctx, deptCourseId)
  if (!existing) throw new NotFoundError('Course not found')

  const updates = {}
  if (fields.code     !== undefined) updates.code     = fields.code
  if (fields.name     !== undefined) updates.name     = fields.name
  if (fields.semester !== undefined) updates.semester = fields.semester
  if (fields.credits  !== undefined) updates.credits  = fields.credits
  if (fields.type     !== undefined) updates.type     = fields.type
  if (fields.scheme   !== undefined) updates.scheme   = fields.scheme

  const updated = await deptCourseRepo.updateById(ctx, deptCourseId, updates)

  return toDeptCourseResponse(updated)
}

async function deleteDeptCourse(ctx, args) {
  const { deptCourseId } = validate(deleteDeptCourseSchema, args || {})

  const existing = await deptCourseRepo.findById(ctx, deptCourseId)
  if (!existing) throw new NotFoundError('Course not found')

  await deptCourseRepo.deleteById(ctx, deptCourseId)

  return toDeptCourseResponse(existing)
}


/* ─────────────────────────────
   DeptTimetable
─────────────────────────────*/

async function listDeptTimetables(ctx, args) {
  const validated = validate(listDeptTimetablesSchema, args || {})
  const query     = buildTimetableQuery(validated)
  const sort      = buildSort(validated.sortBy, validated.sortOrder)

  const result = await deptTimetableRepo.findMany(ctx, query, { sort })

  return {
    items:     result.items.map(toDeptTimetableResponse),
    nextToken: result.nextCursor
  }
}

async function createDeptTimetable(ctx, args) {
  const input = validate(createDeptTimetableSchema, args || {})
  const { deptId, section, semester, academicYear, fileUrl } = input.input

  const dept_timetable_id = generateId()

  const created = await deptTimetableRepo.create(ctx, {
    dept_timetable_id,
    deptId,
    section:      section      ?? '',
    semester:     semester     ?? null,
    academicYear: academicYear ?? '',
    fileUrl:      fileUrl      ?? '',
    uploadedAt:   new Date().toISOString(),
    created_by:   ctx.user_id
  })

  return toDeptTimetableResponse(created)
}

async function updateDeptTimetable(ctx, args) {
  const input = validate(updateDeptTimetableSchema, args || {})
  const { deptTimetableId, ...fields } = input.input

  const existing = await deptTimetableRepo.findById(ctx, deptTimetableId)
  if (!existing) throw new NotFoundError('Timetable not found')

  const updates = {}
  if (fields.section      !== undefined) updates.section      = fields.section
  if (fields.semester     !== undefined) updates.semester     = fields.semester
  if (fields.academicYear !== undefined) updates.academicYear = fields.academicYear
  if (fields.fileUrl      !== undefined) updates.fileUrl      = fields.fileUrl

  const updated = await deptTimetableRepo.updateById(ctx, deptTimetableId, updates)

  return toDeptTimetableResponse(updated)
}

async function deleteDeptTimetable(ctx, args) {
  const { deptTimetableId } = validate(deleteDeptTimetableSchema, args || {})

  const existing = await deptTimetableRepo.findById(ctx, deptTimetableId)
  if (!existing) throw new NotFoundError('Timetable not found')

  await deptTimetableRepo.deleteById(ctx, deptTimetableId)

  return toDeptTimetableResponse(existing)
}


/* ─────────────────────────────
   LearningMaterial
─────────────────────────────*/

async function listLearningMaterials(ctx, args) {
  const validated  = validate(listLearningMaterialsSchema, args || {})
  const query      = buildMaterialQuery(validated)
  const sort       = buildSort(validated.sortBy, validated.sortOrder)
  const pagination = normalizePagination(validated)

  const result = await learningMaterialRepo.findMany(ctx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toLearningMaterialResponse),
    nextToken: result.nextCursor
  }
}

async function createLearningMaterial(ctx, args) {
  const input = validate(createLearningMaterialSchema, args || {})
  const { deptId, courseCode, courseName, title, type, fileUrl } = input.input

  const learning_material_id = generateId()

  const created = await learningMaterialRepo.create(ctx, {
    learning_material_id,
    deptId,
    courseCode:  courseCode  ?? '',
    courseName:  courseName  ?? '',
    title,
    type:        type        ?? 'notes',
    fileUrl:     fileUrl     ?? '',
    uploadedBy:  ctx.user_id,
    created_by:  ctx.user_id
  })

  return toLearningMaterialResponse(created)
}

async function updateLearningMaterial(ctx, args) {
  const input = validate(updateLearningMaterialSchema, args || {})
  const { learningMaterialId, ...fields } = input.input

  const existing = await learningMaterialRepo.findById(ctx, learningMaterialId)
  if (!existing) throw new NotFoundError('Learning material not found')

  const updates = {}
  if (fields.courseCode  !== undefined) updates.courseCode  = fields.courseCode
  if (fields.courseName  !== undefined) updates.courseName  = fields.courseName
  if (fields.title       !== undefined) updates.title       = fields.title
  if (fields.type        !== undefined) updates.type        = fields.type
  if (fields.fileUrl     !== undefined) updates.fileUrl     = fields.fileUrl

  const updated = await learningMaterialRepo.updateById(ctx, learningMaterialId, updates)

  return toLearningMaterialResponse(updated)
}

async function deleteLearningMaterial(ctx, args) {
  const { learningMaterialId } = validate(deleteLearningMaterialSchema, args || {})

  const existing = await learningMaterialRepo.findById(ctx, learningMaterialId)
  if (!existing) throw new NotFoundError('Learning material not found')

  await learningMaterialRepo.deleteById(ctx, learningMaterialId)

  return toLearningMaterialResponse(existing)
}


/* ─────────────────────────────
   InnovativeTeaching
─────────────────────────────*/

async function listInnovativeTeaching(ctx, args) {
  const validated = validate(listInnovativeTeachingSchema, args || {})
  const query     = buildInnovativeTeachingQuery(validated)
  const sort      = buildSort(validated.sortBy, validated.sortOrder)

  const result = await innovativeTeachingRepo.findMany(ctx, query, { sort })

  return {
    items:     result.items.map(toInnovativeTeachingResponse),
    nextToken: result.nextCursor
  }
}

async function createInnovativeTeaching(ctx, args) {
  const input = validate(createInnovativeTeachingSchema, args || {})
  const { deptId, facultyName, method, description, courseApplied, year, outcome } = input.input

  const innovative_teaching_id = generateId()

  const created = await innovativeTeachingRepo.create(ctx, {
    innovative_teaching_id,
    deptId,
    facultyName:   facultyName   ?? '',
    method:        method        ?? '',
    description:   description   ?? '',
    courseApplied: courseApplied ?? '',
    year:          year          ?? '',
    outcome:       outcome       ?? '',
    created_by:    ctx.user_id
  })

  return toInnovativeTeachingResponse(created)
}

async function updateInnovativeTeaching(ctx, args) {
  const input = validate(updateInnovativeTeachingSchema, args || {})
  const { innovativeTeachingId, ...fields } = input.input

  const existing = await innovativeTeachingRepo.findById(ctx, innovativeTeachingId)
  if (!existing) throw new NotFoundError('Innovative teaching record not found')

  const updates = {}
  if (fields.facultyName   !== undefined) updates.facultyName   = fields.facultyName
  if (fields.method        !== undefined) updates.method        = fields.method
  if (fields.description   !== undefined) updates.description   = fields.description
  if (fields.courseApplied !== undefined) updates.courseApplied = fields.courseApplied
  if (fields.year          !== undefined) updates.year          = fields.year
  if (fields.outcome       !== undefined) updates.outcome       = fields.outcome

  const updated = await innovativeTeachingRepo.updateById(ctx, innovativeTeachingId, updates)

  return toInnovativeTeachingResponse(updated)
}

async function deleteInnovativeTeaching(ctx, args) {
  const { innovativeTeachingId } = validate(deleteInnovativeTeachingSchema, args || {})

  const existing = await innovativeTeachingRepo.findById(ctx, innovativeTeachingId)
  if (!existing) throw new NotFoundError('Innovative teaching record not found')

  await innovativeTeachingRepo.deleteById(ctx, innovativeTeachingId)

  return toInnovativeTeachingResponse(existing)
}


/* ─────────────────────────────
   ResultAnalysis
─────────────────────────────*/

async function listResultAnalyses(ctx, args) {
  const validated = validate(listResultAnalysesSchema, args || {})
  const query     = buildResultAnalysisQuery(validated)
  const sort      = buildSort(validated.sortBy, validated.sortOrder)

  const result = await resultAnalysisRepo.findMany(ctx, query, { sort })

  return {
    items:     result.items.map(toResultAnalysisResponse),
    nextToken: result.nextCursor
  }
}

async function createResultAnalysis(ctx, args) {
  const input = validate(createResultAnalysisSchema, args || {})
  const { deptId, title, semester, batch, pdfUrl, graphImageUrl } = input.input

  const result_analysis_id = generateId()

  const created = await resultAnalysisRepo.create(ctx, {
    result_analysis_id,
    deptId,
    title,
    semester:      semester      ?? null,
    batch:         batch         ?? '',
    pdfUrl:        pdfUrl        ?? '',
    graphImageUrl: graphImageUrl ?? '',
    created_by:    ctx.user_id
  })

  return toResultAnalysisResponse(created)
}

async function updateResultAnalysis(ctx, args) {
  const input = validate(updateResultAnalysisSchema, args || {})
  const { resultAnalysisId, ...fields } = input.input

  const existing = await resultAnalysisRepo.findById(ctx, resultAnalysisId)
  if (!existing) throw new NotFoundError('Result analysis not found')

  const updates = {}
  if (fields.title         !== undefined) updates.title         = fields.title
  if (fields.semester      !== undefined) updates.semester      = fields.semester
  if (fields.batch         !== undefined) updates.batch         = fields.batch
  if (fields.pdfUrl        !== undefined) updates.pdfUrl        = fields.pdfUrl
  if (fields.graphImageUrl !== undefined) updates.graphImageUrl = fields.graphImageUrl

  const updated = await resultAnalysisRepo.updateById(ctx, resultAnalysisId, updates)

  return toResultAnalysisResponse(updated)
}

async function deleteResultAnalysis(ctx, args) {
  const { resultAnalysisId } = validate(deleteResultAnalysisSchema, args || {})

  const existing = await resultAnalysisRepo.findById(ctx, resultAnalysisId)
  if (!existing) throw new NotFoundError('Result analysis not found')

  await resultAnalysisRepo.deleteById(ctx, resultAnalysisId)

  return toResultAnalysisResponse(existing)
}
