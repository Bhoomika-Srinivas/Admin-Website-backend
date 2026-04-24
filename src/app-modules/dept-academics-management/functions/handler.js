const { resolveTenant, resolveSecureTenantContext } = require('/opt/nodejs/middleware/tenant-resolver')
const { requirePermission }   = require('/opt/nodejs/middleware/auth-guard')
const { validate }            = require('/opt/nodejs/middleware/input-validator')
const { withConnection }      = require('/opt/nodejs/middleware/with-connection')
const { log }                 = require('/opt/nodejs/middleware/request-logger')
const { generateId }          = require('/opt/nodejs/utils/id-generator')
const { MongoRepository }     = require('/opt/nodejs/db/mongo-repository')
const { NotFoundError }       = require('/opt/nodejs/middleware/error-handler')
const { normalizePagination } = require('/opt/nodejs/utils/pagination')
const { getSignedUrl }               = require('@aws-sdk/s3-request-presigner')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')

const s3     = new S3Client({ region: process.env.AWS_REGION })
const BUCKET = process.env.BUCKET_NAME

async function getPresignedUrl(key) {
  if (!key) return null
  if (key.startsWith('http://') || key.startsWith('https://')) {
    try {
      const url = new URL(key)
      if (url.hostname.endsWith('amazonaws.com')) {
        const s3Key = url.hostname.startsWith(BUCKET + '.')
          ? url.pathname.slice(1)
          : url.pathname.slice(BUCKET.length + 2)
        if (s3Key) {
          const command = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key })
          return await getSignedUrl(s3, command, { expiresIn: 3600 })
        }
      }
    } catch {}
    return key
  }
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    return await getSignedUrl(s3, command, { expiresIn: 3600 })
  } catch (err) {
    console.error('Failed to generate presigned URL for key:', key, err.message)
    return null
  }
}

const {
  listDeptSlotsSchema,
  createDeptSlotSchema,
  updateDeptSlotSchema,
  deleteDeptSlotSchema,
  listDeptSectionsSchema,
  createDeptSectionSchema,
  deleteDeptSectionSchema,
  listDeptBatchesSchema,
  createDeptBatchSchema,
  deleteDeptBatchSchema,
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
  DeptSlot,
  DeptSection,
  DeptBatch,
  DeptCourse,
  DeptTimetable,
  LearningMaterial,
  InnovativeTeaching,
  ResultAnalysis
} = require('../schemas/dept.academics.model')

/* ─────────────────────────────
   Repositories
─────────────────────────────*/

const deptSlotRepo           = new MongoRepository({ model: DeptSlot,           primaryKey: 'dept_slot_id' })
const deptSectionRepo        = new MongoRepository({ model: DeptSection,        primaryKey: 'dept_section_id' })
const deptBatchRepo          = new MongoRepository({ model: DeptBatch,          primaryKey: 'dept_batch_id' })
const deptCourseRepo         = new MongoRepository({ model: DeptCourse,         primaryKey: 'dept_course_id' })
const deptTimetableRepo      = new MongoRepository({ model: DeptTimetable,      primaryKey: 'dept_timetable_id' })
const learningMaterialRepo   = new MongoRepository({ model: LearningMaterial,   primaryKey: 'learning_material_id' })
const innovativeTeachingRepo = new MongoRepository({ model: InnovativeTeaching, primaryKey: 'innovative_teaching_id' })
const resultAnalysisRepo     = new MongoRepository({ model: ResultAnalysis,     primaryKey: 'result_analysis_id' })

/* ─────────────────────────────
   Response Normalizers
─────────────────────────────*/

function toDeptSlotResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptSlotId: plain.dept_slot_id || (plain._id ? plain._id.toString() : null) }
}

function toDeptSectionResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptSectionId: plain.dept_section_id || (plain._id ? plain._id.toString() : null) }
}

function toDeptBatchResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptBatchId: plain.dept_batch_id || (plain._id ? plain._id.toString() : null) }
}

function toDeptCourseResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptCourseId: plain.dept_course_id || (plain._id ? plain._id.toString() : null) }
}

async function toDeptTimetableResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    deptTimetableId: plain.dept_timetable_id || (plain._id ? plain._id.toString() : null),
    fileUrl: await getPresignedUrl(plain.fileUrl),
  }
}

async function toLearningMaterialResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    learningMaterialId: plain.learning_material_id || (plain._id ? plain._id.toString() : null),
    fileUrl: await getPresignedUrl(plain.fileUrl),
  }
}

async function toInnovativeTeachingResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    innovativeTeachingId: plain.innovative_teaching_id || (plain._id ? plain._id.toString() : null),
    imageUrls: await Promise.all((plain.imageUrls || []).map(getPresignedUrl)),
    pdfUrl:    await getPresignedUrl(plain.pdfUrl),
  }
}

async function toResultAnalysisResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    resultAnalysisId: plain.result_analysis_id || (plain._id ? plain._id.toString() : null),
    pdfUrl:        await getPresignedUrl(plain.pdfUrl),
    graphImageUrl: await getPresignedUrl(plain.graphImageUrl),
  }
}

/* ─────────────────────────────
   Query Builders
   All filtering/searching/sorting
   happens in MongoDB — not frontend
─────────────────────────────*/

function buildCourseQuery(args) {
  const query = {}
  if (args.deptId)      query.deptId      = args.deptId
  if (args.programType) query.programType = args.programType
  if (args.program)     query.program     = args.program
  if (args.batch)       query.batch       = args.batch
  if (args.semester)    query.semester    = args.semester
  if (args.type)        query.type        = args.type
  if (args.scheme)      query.scheme      = args.scheme

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

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { 'faculties.facultyName': { $regex: args.search.trim(), $options: 'i' } },
      { description:             { $regex: args.search.trim(), $options: 'i' } }
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

    // ── DeptSlot ──────────────────────────────────
    case 'listDeptSlots':
      return await listDeptSlots(ctx, event.arguments)

    case 'createDeptSlot':
      await requirePermission(ctx, 'dept-academics:slot:create')
      return await createDeptSlot(ctx, event.arguments)

    case 'updateDeptSlot':
      await requirePermission(ctx, 'dept-academics:slot:update')
      return await updateDeptSlot(ctx, event.arguments)

    case 'deleteDeptSlot':
      await requirePermission(ctx, 'dept-academics:slot:delete')
      return await deleteDeptSlot(ctx, event.arguments)

    // ── DeptSection ───────────────────────────────
    case 'listDeptSections':
      return await listDeptSections(ctx, event.arguments)

    case 'createDeptSection':
      await requirePermission(ctx, 'dept-academics:section:create')
      return await createDeptSection(ctx, event.arguments)

    case 'deleteDeptSection':
      await requirePermission(ctx, 'dept-academics:section:delete')
      return await deleteDeptSection(ctx, event.arguments)

    // ── DeptBatch ─────────────────────────────────
    case 'listDeptBatches':
      return await listDeptBatches(ctx, event.arguments)

    case 'createDeptBatch':
      await requirePermission(ctx, 'dept-academics:batch:create')
      return await createDeptBatch(ctx, event.arguments)

    case 'deleteDeptBatch':
      await requirePermission(ctx, 'dept-academics:batch:delete')
      return await deleteDeptBatch(ctx, event.arguments)

    // ── DeptCourse ────────────────────────────────
    case 'getDeptCourse':
      return await getDeptCourse(ctx, event.arguments)

    case 'listDeptCourses':
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
   DeptSlot
─────────────────────────────*/

async function listDeptSlots(ctx, args) {
  const validated   = validate(listDeptSlotsSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, validated.tenantId)

  const slotQuery = { deptId: validated.deptId, sectionId: validated.sectionId }
  if (validated.programType) slotQuery.programType = validated.programType
  if (validated.program)     slotQuery.program     = validated.program
  if (validated.batch)       slotQuery.batch       = validated.batch

  const result = await deptSlotRepo.findMany(resolvedCtx, slotQuery, { sort: { day: 1, period: 1 } })

  return {
    items:     result.items.map(toDeptSlotResponse),
    nextToken: result.nextCursor
  }
}

async function createDeptSlot(ctx, args) {
  const input = validate(createDeptSlotSchema, args || {})
  const { deptId, programType, program, batch, sectionId, day, period, courseCode, courseName, type, facultyId } = input.input

  // Validate Saturday period limit
  if (day === 'Sat' && period > 4) {
    throw new Error('Saturday slots are limited to periods 1–4')
  }

  // Check for duplicate slot (same section, day, period)
  const existing = await DeptSlot.findOne({ tenant_id: ctx.tenant_id, sectionId, day, period })
  if (existing) {
    throw new Error(`A slot already exists for ${day} period ${period} in this section`)
  }

  const dept_slot_id = generateId()

  const created = await deptSlotRepo.create(ctx, {
    dept_slot_id,
    deptId,
    programType: programType ?? null,
    program:     program     ?? null,
    batch:       batch       ?? null,
    sectionId,
    day,
    period,
    courseCode,
    courseName,
    type,
    facultyId:  facultyId ?? null,
    created_by: ctx.user_id
  })

  return toDeptSlotResponse(created)
}

async function updateDeptSlot(ctx, args) {
  const input = validate(updateDeptSlotSchema, args || {})
  const { deptSlotId, ...fields } = input.input

  const existing = await deptSlotRepo.findById(ctx, deptSlotId)
  if (!existing) throw new NotFoundError('Slot not found')

  const updates = {}
  if (fields.courseCode !== undefined) updates.courseCode = fields.courseCode
  if (fields.courseName !== undefined) updates.courseName = fields.courseName
  if (fields.type       !== undefined) updates.type       = fields.type
  if (fields.facultyId  !== undefined) updates.facultyId  = fields.facultyId

  const updated = await deptSlotRepo.updateById(ctx, deptSlotId, updates)

  return toDeptSlotResponse(updated)
}

async function deleteDeptSlot(ctx, args) {
  const { deptSlotId } = validate(deleteDeptSlotSchema, args || {})

  const existing = await deptSlotRepo.findById(ctx, deptSlotId)
  if (!existing) throw new NotFoundError('Slot not found')

  await deptSlotRepo.deleteById(ctx, deptSlotId)

  return toDeptSlotResponse(existing)
}


/* ─────────────────────────────
   DeptSection
─────────────────────────────*/

async function listDeptSections(ctx, args) {
  const validated   = validate(listDeptSectionsSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, validated.tenantId)

  const query = { deptId: validated.deptId }
  if (validated.programId) query.programId = validated.programId
  if (validated.semester)  query.semester  = validated.semester
  if (validated.batchName) query.batchName = validated.batchName

  const result = await deptSectionRepo.findMany(resolvedCtx, query, { sort: { semester: 1, name: 1 } })

  return {
    items:     result.items.map(toDeptSectionResponse),
    nextToken: result.nextCursor
  }
}

async function createDeptSection(ctx, args) {
  const input = validate(createDeptSectionSchema, args || {})
  const { deptId, programId, batchName, semester, name } = input.input

  const dept_section_id = generateId()

  const created = await deptSectionRepo.create(ctx, {
    dept_section_id,
    deptId,
    programId:  programId ?? null,
    batchName,
    semester,
    name,
    created_by: ctx.user_id
  })

  return toDeptSectionResponse(created)
}

async function deleteDeptSection(ctx, args) {
  const { deptSectionId } = validate(deleteDeptSectionSchema, args || {})

  const existing = await deptSectionRepo.findById(ctx, deptSectionId)
  if (!existing) throw new NotFoundError('Section not found')

  await deptSectionRepo.deleteById(ctx, deptSectionId)

  return toDeptSectionResponse(existing)
}


/* ─────────────────────────────
   DeptBatch
─────────────────────────────*/

async function listDeptBatches(ctx, args) {
  const validated   = validate(listDeptBatchesSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, validated.tenantId)

  const query = { deptId: validated.deptId }
  if (validated.programType) query.programType = validated.programType
  if (validated.program)     query.program     = validated.program

  const result = await deptBatchRepo.findMany(resolvedCtx, query, { sort: { startYear: 1 } })

  return {
    items:     result.items.map(toDeptBatchResponse),
    nextToken: result.nextCursor
  }
}

async function createDeptBatch(ctx, args) {
  const input = validate(createDeptBatchSchema, args || {})
  const { deptId, programType, program, name, startYear, endYear } = input.input

  const dept_batch_id = generateId()

  const created = await deptBatchRepo.create(ctx, {
    dept_batch_id,
    deptId,
    programType: programType ?? null,
    program:     program     ?? null,
    name,
    startYear:   startYear   ?? null,
    endYear:     endYear     ?? null,
    created_by:  ctx.user_id
  })

  return toDeptBatchResponse(created)
}

async function deleteDeptBatch(ctx, args) {
  const { deptBatchId } = validate(deleteDeptBatchSchema, args || {})

  const existing = await deptBatchRepo.findById(ctx, deptBatchId)
  if (!existing) throw new NotFoundError('Batch not found')

  await deptBatchRepo.deleteById(ctx, deptBatchId)

  return toDeptBatchResponse(existing)
}


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
  const validated   = validate(listDeptCoursesSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, validated.tenantId)
  const query       = buildCourseQuery(validated)
  const sort        = buildSort(validated.sortBy, validated.sortOrder)
  const pagination  = normalizePagination(validated)

  const result = await deptCourseRepo.findMany(resolvedCtx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toDeptCourseResponse),
    nextToken: result.nextCursor
  }
}

async function createDeptCourse(ctx, args) {
  const input = validate(createDeptCourseSchema, args || {})
  const { deptId, programType, program, batch, code, name, semester, credits, type, scheme } = input.input

  const dept_course_id = generateId()

  const created = await deptCourseRepo.create(ctx, {
    dept_course_id,
    deptId,
    programType: programType ?? null,
    program:     program     ?? null,
    batch:       batch       ?? null,
    code,
    name,
    semester:    semester    ?? null,
    credits:     credits     ?? 0,
    type:        type        ?? 'theory',
    scheme:      scheme      ?? '',
    created_by:  ctx.user_id
  })

  return toDeptCourseResponse(created)
}

async function updateDeptCourse(ctx, args) {
  const input = validate(updateDeptCourseSchema, args || {})
  const { deptCourseId, ...fields } = input.input

  const existing = await deptCourseRepo.findById(ctx, deptCourseId)
  if (!existing) throw new NotFoundError('Course not found')

  const updates = {}
  if (fields.programType !== undefined) updates.programType = fields.programType
  if (fields.program     !== undefined) updates.program     = fields.program
  if (fields.batch       !== undefined) updates.batch       = fields.batch
  if (fields.code        !== undefined) updates.code        = fields.code
  if (fields.name        !== undefined) updates.name        = fields.name
  if (fields.semester    !== undefined) updates.semester    = fields.semester
  if (fields.credits     !== undefined) updates.credits     = fields.credits
  if (fields.type        !== undefined) updates.type        = fields.type
  if (fields.scheme      !== undefined) updates.scheme      = fields.scheme

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
  const validated   = validate(listDeptTimetablesSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, validated.tenantId)
  const query       = buildTimetableQuery(validated)
  const sort        = buildSort(validated.sortBy, validated.sortOrder)

  const result = await deptTimetableRepo.findMany(resolvedCtx, query, { sort })

  return {
    items:     await Promise.all(result.items.map(toDeptTimetableResponse)),
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

  return await toDeptTimetableResponse(created)
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

  return await toDeptTimetableResponse(updated)
}

async function deleteDeptTimetable(ctx, args) {
  const { deptTimetableId } = validate(deleteDeptTimetableSchema, args || {})

  const existing = await deptTimetableRepo.findById(ctx, deptTimetableId)
  if (!existing) throw new NotFoundError('Timetable not found')

  await deptTimetableRepo.deleteById(ctx, deptTimetableId)

  return await toDeptTimetableResponse(existing)
}


/* ─────────────────────────────
   LearningMaterial
─────────────────────────────*/

async function listLearningMaterials(ctx, args) {
  const validated   = validate(listLearningMaterialsSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, validated.tenantId)
  const query       = buildMaterialQuery(validated)
  const sort        = buildSort(validated.sortBy, validated.sortOrder)
  const pagination  = normalizePagination(validated)

  const result = await learningMaterialRepo.findMany(resolvedCtx, query, { ...pagination, sort })

  return {
    items:     await Promise.all(result.items.map(toLearningMaterialResponse)),
    nextToken: result.nextCursor
  }
}

async function createLearningMaterial(ctx, args) {
  const input = validate(createLearningMaterialSchema, args || {})
  const { deptId, courseCode, courseName, title, type, fileUrl, uploadedBy } = input.input

  const learning_material_id = generateId()

  const created = await learningMaterialRepo.create(ctx, {
    learning_material_id,
    deptId,
    courseCode:  courseCode  ?? '',
    courseName:  courseName  ?? '',
    title,
    type:        type        ?? 'notes',
    fileUrl:     fileUrl     ?? '',
    uploadedBy:  uploadedBy  ?? ctx.user_id,
    created_by:  ctx.user_id
  })

  return await toLearningMaterialResponse(created)
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

  return await toLearningMaterialResponse(updated)
}

async function deleteLearningMaterial(ctx, args) {
  const { learningMaterialId } = validate(deleteLearningMaterialSchema, args || {})

  const existing = await learningMaterialRepo.findById(ctx, learningMaterialId)
  if (!existing) throw new NotFoundError('Learning material not found')

  await learningMaterialRepo.deleteById(ctx, learningMaterialId)

  return await toLearningMaterialResponse(existing)
}


/* ─────────────────────────────
   InnovativeTeaching
─────────────────────────────*/

async function listInnovativeTeaching(ctx, args) {
  const validated   = validate(listInnovativeTeachingSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, validated.tenantId)
  const query       = buildInnovativeTeachingQuery(validated)
  const sort        = buildSort(validated.sortBy, validated.sortOrder)

  const result = await innovativeTeachingRepo.findMany(resolvedCtx, query, { sort })

  return {
    items:     await Promise.all(result.items.map(toInnovativeTeachingResponse)),
    nextToken: result.nextCursor
  }
}

async function createInnovativeTeaching(ctx, args) {
  const input = validate(createInnovativeTeachingSchema, args || {})
  const { deptId, faculties, description, imageUrls, pdfUrl } = input.input

  const innovative_teaching_id = generateId()

  const created = await innovativeTeachingRepo.create(ctx, {
    innovative_teaching_id,
    deptId,
    faculties:   faculties   ?? [],
    description: description ?? '',
    imageUrls:   imageUrls   ?? [],
    pdfUrl:      pdfUrl      ?? null,
    created_by:  ctx.user_id
  })

  return await toInnovativeTeachingResponse(created)
}

async function updateInnovativeTeaching(ctx, args) {
  const input = validate(updateInnovativeTeachingSchema, args || {})
  const { innovativeTeachingId, ...fields } = input.input

  const existing = await innovativeTeachingRepo.findById(ctx, innovativeTeachingId)
  if (!existing) throw new NotFoundError('Innovative teaching record not found')

  const updates = {}
  if (fields.faculties   !== undefined) updates.faculties   = fields.faculties
  if (fields.description !== undefined) updates.description = fields.description
  if (fields.imageUrls   !== undefined) updates.imageUrls   = fields.imageUrls
  if (fields.pdfUrl      !== undefined) updates.pdfUrl      = fields.pdfUrl

  const updated = await innovativeTeachingRepo.updateById(ctx, innovativeTeachingId, updates)

  return await toInnovativeTeachingResponse(updated)
}

async function deleteInnovativeTeaching(ctx, args) {
  const { innovativeTeachingId } = validate(deleteInnovativeTeachingSchema, args || {})

  const existing = await innovativeTeachingRepo.findById(ctx, innovativeTeachingId)
  if (!existing) throw new NotFoundError('Innovative teaching record not found')

  await innovativeTeachingRepo.deleteById(ctx, innovativeTeachingId)

  return await toInnovativeTeachingResponse(existing)
}


/* ─────────────────────────────
   ResultAnalysis
─────────────────────────────*/

async function listResultAnalyses(ctx, args) {
  const validated   = validate(listResultAnalysesSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, validated.tenantId)
  const query       = buildResultAnalysisQuery(validated)
  const sort        = buildSort(validated.sortBy, validated.sortOrder)

  const result = await resultAnalysisRepo.findMany(resolvedCtx, query, { sort })

  return {
    items:     await Promise.all(result.items.map(toResultAnalysisResponse)),
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

  return await toResultAnalysisResponse(created)
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

  return await toResultAnalysisResponse(updated)
}

async function deleteResultAnalysis(ctx, args) {
  const { resultAnalysisId } = validate(deleteResultAnalysisSchema, args || {})

  const existing = await resultAnalysisRepo.findById(ctx, resultAnalysisId)
  if (!existing) throw new NotFoundError('Result analysis not found')

  await resultAnalysisRepo.deleteById(ctx, resultAnalysisId)

  return await toResultAnalysisResponse(existing)
}
