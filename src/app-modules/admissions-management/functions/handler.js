const { resolveTenant, resolveSecureTenantContext } = require('/opt/nodejs/middleware/tenant-resolver')
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard')
const { validate }          = require('/opt/nodejs/middleware/input-validator')
const { withConnection }    = require('/opt/nodejs/middleware/with-connection')
const { log }               = require('/opt/nodejs/middleware/request-logger')
const { generateId }        = require('/opt/nodejs/utils/id-generator')
const { MongoRepository }   = require('/opt/nodejs/db/mongo-repository')
const { NotFoundError, ValidationError } = require('/opt/nodejs/middleware/error-handler')
const { checkRateLimit }    = require('/opt/nodejs/middleware/rate-limiter')
const { validateBase64File } = require('/opt/nodejs/utils/file-validator')
const { normalizePagination } = require('/opt/nodejs/utils/pagination')
const { sanitizePlainText, sanitizeRichText } = require('/opt/nodejs/middleware/sanitizer')
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const crypto = require('crypto')
const path   = require('path')

const {
  AdmissionsOverview,
  AdmissionsProgram,
  UGCourse,
  PGCourse,
  EligibilityEntry,
  AdmissionStep,
  ImportantDate,
  Prospectus,
  FeeDocument,
  Scholarship,
  AuditStatement,
  AdmissionsEnquiry,
  AdmissionsContact,
  WhyEnquire,
  EnquiryCategory,
  InfoBlock,
} = require('../schemas/admissions.model')

const {
  tenantIdQuerySchema,
  saveAdmissionsOverviewSchema,
  listAdmissionsProgramsSchema,
  createAdmissionsProgramSchema,
  updateAdmissionsProgramSchema,
  deleteAdmissionsProgramSchema,
  createUGCourseSchema,
  updateUGCourseSchema,
  deleteUGCourseSchema,
  createPGCourseSchema,
  updatePGCourseSchema,
  deletePGCourseSchema,
  createEligibilityEntrySchema,
  updateEligibilityEntrySchema,
  deleteEligibilityEntrySchema,
  createAdmissionStepSchema,
  updateAdmissionStepSchema,
  deleteAdmissionStepSchema,
  reorderAdmissionStepsSchema,
  createImportantDateSchema,
  updateImportantDateSchema,
  deleteImportantDateSchema,
  saveProspectusSchema,
  createFeeDocumentSchema,
  updateFeeDocumentSchema,
  deleteFeeDocumentSchema,
  createScholarshipSchema,
  updateScholarshipSchema,
  deleteScholarshipSchema,
  createAuditStatementSchema,
  deleteAuditStatementSchema,
  submitAdmissionsEnquirySchema,
  listAdmissionsEnquiriesSchema,
  updateEnquiryStatusSchema,
  updateAdmissionsContactSchema,
  saveWhyEnquireSchema,
  createEnquiryCategorySchema,
  updateEnquiryCategorySchema,
  deleteEnquiryCategorySchema,
  createInfoBlockSchema,
  updateInfoBlockSchema,
  deleteInfoBlockSchema,
} = require('../schemas/validation')

/* ─────────────────────────────
   S3 - Secure File Upload
─────────────────────────────*/

const s3     = new S3Client({ region: process.env.AWS_REGION })
const BUCKET = process.env.BUCKET_NAME
const REGION = process.env.AWS_REGION

/**
 * Securely upload file to S3 with validation
 * @param {string} key - S3 key path
 * @param {string} fileBase64 - Base64 encoded file
 * @param {string} fileName - Original filename
 * @param {Object} options - Upload options
 * @returns {Promise<string>} - File URL
 * @throws {Error} - If validation fails
 */
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

async function uploadToS3(key, fileBase64, fileName, options = {}) {
  // Validate file before upload
  const validation = validateBase64File(fileBase64, fileName, {
    maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB default
    allowedTypes: options.allowedTypes || ['application/pdf', 'image/jpeg', 'image/png'],
  })

  if (!validation.valid) {
    throw new Error(`File validation failed: ${validation.error}`)
  }

  const { buffer, mimeType } = validation

  // Upload to S3 with security headers
  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mimeType,
    ContentDisposition: `attachment; filename="${validation.filename}"`,
    Metadata: {
      'uploaded-by': options.userId || 'unknown',
      'uploaded-at': new Date().toISOString(),
      'original-filename': validation.filename,
    },
  }))

  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`
}

/* ─────────────────────────────
   Tenant Context Resolver (mirrors events/dept-academics pattern)
─────────────────────────────*/

function resolveTenantContext(ctx, args) {
  const validated = validate(tenantIdQuerySchema, args || {})
  return resolveSecureTenantContext(ctx, validated.tenantId)
}

/* ─────────────────────────────
   Repositories
─────────────────────────────*/

const programRepo       = new MongoRepository({ model: AdmissionsProgram,  primaryKey: 'program_id' })
const ugCourseRepo      = new MongoRepository({ model: UGCourse,           primaryKey: 'course_id' })
const pgCourseRepo      = new MongoRepository({ model: PGCourse,           primaryKey: 'course_id' })
const eligibilityRepo   = new MongoRepository({ model: EligibilityEntry,   primaryKey: 'entry_id' })
const stepRepo          = new MongoRepository({ model: AdmissionStep,      primaryKey: 'step_id' })
const dateRepo          = new MongoRepository({ model: ImportantDate,      primaryKey: 'date_id' })
const feeDocRepo        = new MongoRepository({ model: FeeDocument,        primaryKey: 'fee_doc_id' })
const scholarshipRepo   = new MongoRepository({ model: Scholarship,        primaryKey: 'scholarship_id' })
const auditRepo         = new MongoRepository({ model: AuditStatement,     primaryKey: 'audit_id' })
const enquiryRepo       = new MongoRepository({ model: AdmissionsEnquiry,  primaryKey: 'enquiry_id' })
const contactRepo       = new MongoRepository({ model: AdmissionsContact,  primaryKey: 'contact_id' })
const categoryRepo      = new MongoRepository({ model: EnquiryCategory,    primaryKey: 'category_id' })
const infoBlockRepo     = new MongoRepository({ model: InfoBlock,          primaryKey: 'block_id' })

/* ─────────────────────────────
   Response normalizers
─────────────────────────────*/

function plain(doc) {
  return doc && doc.toObject ? doc.toObject() : { ...doc }
}

async function toOverviewResponse(doc) {
  const d = plain(doc)
  return {
    headline:    d.headline    ?? null,
    subheadline: d.subheadline ?? null,
    description: d.description ?? null,
    highlights:  d.highlights  ?? [],
    imageUrl:    await getPresignedUrl(d.image_url),
    bannerUrl:   await getPresignedUrl(d.banner_url),
    updatedAt:   d.updatedAt   ?? null,
  }
}

function toProgramResponse(doc) {
  const d = plain(doc)
  return { ...d, programId: d.program_id }
}

function toUGCourseResponse(doc) {
  const d = plain(doc)
  return { ...d, courseId: d.course_id }
}

function toPGCourseResponse(doc) {
  const d = plain(doc)
  return { ...d, courseId: d.course_id }
}

function toEligibilityEntryResponse(doc) {
  const d = plain(doc)
  return { ...d, entryId: d.entry_id }
}

function toStepResponse(doc) {
  const d = plain(doc)
  return { ...d, stepId: d.step_id, iconName: d.icon_name }
}

function toDateResponse(doc) {
  const d = plain(doc)
  return { ...d, dateId: d.date_id }
}

async function toProspectusResponse(doc) {
  const d = plain(doc)
  return {
    title:       d.title       ?? null,
    description: d.description ?? null,
    fileUrl:     await getPresignedUrl(d.file_url),
    fileName:    d.file_name   ?? null,
    uploadedAt:  d.uploaded_at ?? null,
    updatedAt:   d.updatedAt   ?? null,
  }
}

async function toFeeDocResponse(doc) {
  const d = plain(doc)
  return {
    ...d,
    feeDocId:   d.fee_doc_id,
    fileUrl:    await getPresignedUrl(d.file_url),
    fileName:   d.file_name,
    uploadedAt: d.uploaded_at,
  }
}

function toScholarshipResponse(doc) {
  const d = plain(doc)
  return { ...d, scholarshipId: d.scholarship_id }
}

async function toAuditResponse(doc) {
  const d = plain(doc)
  return { ...d, auditId: d.audit_id, fileUrl: await getPresignedUrl(d.file_url), fileName: d.file_name }
}

function toEnquiryResponse(doc) {
  const d = plain(doc)
  return { ...d, enquiryId: d.enquiry_id }
}

function toContactResponse(doc) {
  const d = plain(doc)
  return { ...d, contactId: d.contact_id, officeLocation: d.office_location }
}

function toWhyEnquireResponse(doc) {
  const d = plain(doc)
  return {
    title:     d.title     ?? null,
    points:    d.points    ?? [],
    updatedAt: d.updatedAt ?? null,
  }
}

function toCategoryResponse(doc) {
  const d = plain(doc)
  return { ...d, categoryId: d.category_id }
}

function toInfoBlockResponse(doc) {
  const d = plain(doc)
  return { ...d, blockId: d.block_id }
}

/* ─────────────────────────────
   Contact seed
─────────────────────────────*/

const CONTACT_ROLES = [
  'Principal',
  'Director',
  'Dean Admissions',
  'Hostel Warden (Girls)',
  'Hostel Warden (Boys)',
]

async function seedContacts(ctx) {
  const docs = CONTACT_ROLES.map(role => ({
    tenant_id:       ctx.tenant_id,
    contact_id:      generateId(),
    role,
    name:            null,
    phone:           null,
    email:           null,
    office_location: null,
  }))
  await AdmissionsContact.insertMany(docs)
}

/* ─────────────────────────────
   Router
─────────────────────────────*/

async function handleEvent(event) {
  const ctx = resolveTenant(event)
  log(ctx, 'admissions-management', event.field)

  switch (event.field) {

    /* ── Queries ── */
    case 'getAdmissionsOverview':    return await getAdmissionsOverview(ctx, event.arguments)
    case 'listAdmissionsPrograms':   return await listAdmissionsPrograms(ctx, event.arguments)
    case 'listUGCourses':            return await listCourses(ctx, event.arguments, ugCourseRepo, toUGCourseResponse)
    case 'listPGCourses':            return await listCourses(ctx, event.arguments, pgCourseRepo, toPGCourseResponse)
    case 'listEligibilityEntries':   return await listEligibilityEntries(ctx, event.arguments)
    case 'listAdmissionSteps':       return await listAdmissionSteps(ctx, event.arguments)
    case 'listImportantDates':       return await listImportantDates(ctx, event.arguments)
    case 'getProspectus':            return await getProspectus(ctx, event.arguments)
    case 'listFeeDocuments':         return await listFeeDocuments(ctx, event.arguments)
    case 'listScholarships':         return await listScholarships(ctx, event.arguments)
    case 'listAuditStatements':      return await listAuditStatements(ctx, event.arguments)
    case 'listAdmissionsContacts':   return await listAdmissionsContacts(ctx, event.arguments)
    case 'getWhyEnquire':            return await getWhyEnquire(ctx, event.arguments)
    case 'listEnquiryCategories':    return await listEnquiryCategories(ctx, event.arguments)
    case 'listInfoBlocks':           return await listInfoBlocks(ctx, event.arguments)

    case 'listAdmissionsEnquiries':
      await requirePermission(ctx, 'admissions:enquiry:list')
      return await listAdmissionsEnquiries(ctx, event.arguments)

    /* ── Singleton mutations ── */
    case 'saveAdmissionsOverview':
      await requirePermission(ctx, 'admissions:content:create')
      return await saveAdmissionsOverview(ctx, event.arguments)

    case 'saveProspectus':
      await requirePermission(ctx, 'admissions:content:create')
      return await saveProspectus(ctx, event.arguments)

    case 'deleteProspectus':
      await requirePermission(ctx, 'admissions:content:delete')
      return await deleteProspectus(ctx)

    case 'saveWhyEnquire':
      await requirePermission(ctx, 'admissions:content:create')
      return await saveWhyEnquire(ctx, event.arguments)

    /* ── Programs ── */
    case 'createAdmissionsProgram':
      await requirePermission(ctx, 'admissions:content:create')
      return await createAdmissionsProgram(ctx, event.arguments)

    case 'updateAdmissionsProgram':
      await requirePermission(ctx, 'admissions:content:update')
      return await updateAdmissionsProgram(ctx, event.arguments)

    case 'deleteAdmissionsProgram':
      await requirePermission(ctx, 'admissions:content:delete')
      return await deleteAdmissionsProgram(ctx, event.arguments)

    /* ── UG Courses ── */
    case 'createUGCourse':
      await requirePermission(ctx, 'admissions:content:create')
      return await createCourse(ctx, event.arguments, ugCourseRepo, createUGCourseSchema, toUGCourseResponse)

    case 'updateUGCourse':
      await requirePermission(ctx, 'admissions:content:update')
      return await updateCourse(ctx, event.arguments, ugCourseRepo, updateUGCourseSchema, toUGCourseResponse)

    case 'deleteUGCourse':
      await requirePermission(ctx, 'admissions:content:delete')
      return await deleteCourse(ctx, event.arguments, ugCourseRepo, deleteUGCourseSchema, toUGCourseResponse)

    /* ── PG Courses ── */
    case 'createPGCourse':
      await requirePermission(ctx, 'admissions:content:create')
      return await createCourse(ctx, event.arguments, pgCourseRepo, createPGCourseSchema, toPGCourseResponse)

    case 'updatePGCourse':
      await requirePermission(ctx, 'admissions:content:update')
      return await updateCourse(ctx, event.arguments, pgCourseRepo, updatePGCourseSchema, toPGCourseResponse)

    case 'deletePGCourse':
      await requirePermission(ctx, 'admissions:content:delete')
      return await deleteCourse(ctx, event.arguments, pgCourseRepo, deletePGCourseSchema, toPGCourseResponse)

    /* ── Eligibility Entries ── */
    case 'createEligibilityEntry':
      await requirePermission(ctx, 'admissions:content:create')
      return await createEligibilityEntry(ctx, event.arguments)

    case 'updateEligibilityEntry':
      await requirePermission(ctx, 'admissions:content:update')
      return await updateEligibilityEntry(ctx, event.arguments)

    case 'deleteEligibilityEntry':
      await requirePermission(ctx, 'admissions:content:delete')
      return await deleteEligibilityEntry(ctx, event.arguments)

    /* ── Steps ── */
    case 'createAdmissionStep':
      await requirePermission(ctx, 'admissions:content:create')
      return await createAdmissionStep(ctx, event.arguments)

    case 'updateAdmissionStep':
      await requirePermission(ctx, 'admissions:content:update')
      return await updateAdmissionStep(ctx, event.arguments)

    case 'deleteAdmissionStep':
      await requirePermission(ctx, 'admissions:content:delete')
      return await deleteAdmissionStep(ctx, event.arguments)

    case 'reorderAdmissionSteps':
      await requirePermission(ctx, 'admissions:content:update')
      return await reorderAdmissionSteps(ctx, event.arguments)

    /* ── Important Dates ── */
    case 'createImportantDate':
      await requirePermission(ctx, 'admissions:content:create')
      return await createImportantDate(ctx, event.arguments)

    case 'updateImportantDate':
      await requirePermission(ctx, 'admissions:content:update')
      return await updateImportantDate(ctx, event.arguments)

    case 'deleteImportantDate':
      await requirePermission(ctx, 'admissions:content:delete')
      return await deleteImportantDate(ctx, event.arguments)

    /* ── Fee Documents ── */
    case 'createFeeDocument':
      await requirePermission(ctx, 'admissions:content:create')
      return await createFeeDocument(ctx, event.arguments)

    case 'updateFeeDocument':
      await requirePermission(ctx, 'admissions:content:update')
      return await updateFeeDocument(ctx, event.arguments)

    case 'deleteFeeDocument':
      await requirePermission(ctx, 'admissions:content:delete')
      return await deleteFeeDocument(ctx, event.arguments)

    /* ── Scholarships ── */
    case 'createScholarship':
      await requirePermission(ctx, 'admissions:content:create')
      return await createScholarship(ctx, event.arguments)

    case 'updateScholarship':
      await requirePermission(ctx, 'admissions:content:update')
      return await updateScholarship(ctx, event.arguments)

    case 'deleteScholarship':
      await requirePermission(ctx, 'admissions:content:delete')
      return await deleteScholarship(ctx, event.arguments)

    /* ── Audit Statements ── */
    case 'createAuditStatement':
      await requirePermission(ctx, 'admissions:content:create')
      return await createAuditStatement(ctx, event.arguments)

    case 'deleteAuditStatement':
      await requirePermission(ctx, 'admissions:content:delete')
      return await deleteAuditStatement(ctx, event.arguments)

    /* ── Enquiry Categories ── */
    case 'createEnquiryCategory':
      await requirePermission(ctx, 'admissions:content:create')
      return await createEnquiryCategory(ctx, event.arguments)

    case 'updateEnquiryCategory':
      await requirePermission(ctx, 'admissions:content:update')
      return await updateEnquiryCategory(ctx, event.arguments)

    case 'deleteEnquiryCategory':
      await requirePermission(ctx, 'admissions:content:delete')
      return await deleteEnquiryCategory(ctx, event.arguments)

    /* ── Info Blocks ── */
    case 'createInfoBlock':
      await requirePermission(ctx, 'admissions:content:create')
      return await createInfoBlock(ctx, event.arguments)

    case 'updateInfoBlock':
      await requirePermission(ctx, 'admissions:content:update')
      return await updateInfoBlock(ctx, event.arguments)

    case 'deleteInfoBlock':
      await requirePermission(ctx, 'admissions:content:delete')
      return await deleteInfoBlock(ctx, event.arguments)

    /* ── Enquiries & Contacts ── */
    case 'updateEnquiryStatus':
      await requirePermission(ctx, 'admissions:enquiry:update')
      return await updateEnquiryStatus(ctx, event.arguments)

    case 'updateAdmissionsContact':
      await requirePermission(ctx, 'admissions:content:update')
      return await updateAdmissionsContact(ctx, event.arguments)

    /* ── Public ── */
    case 'submitAdmissionsEnquiry':
      return await submitAdmissionsEnquiry(event.arguments, event)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)

/* ═══════════════════════════════════════════════════════════
   Handler implementations
═══════════════════════════════════════════════════════════ */

/* ─── Overview ────────────────────────────────────────────────────────────── */

async function getAdmissionsOverview(ctx, args) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const doc = await AdmissionsOverview.findOne({ tenant_id: resolvedCtx.tenant_id }).lean()
  if (!doc) return null
  return await toOverviewResponse(doc)
}

async function saveAdmissionsOverview(ctx, args) {
  const { input } = validate(saveAdmissionsOverviewSchema, args || {})

  const update = {}
  if (input.headline    !== undefined) update.headline    = input.headline
  if (input.subheadline !== undefined) update.subheadline = input.subheadline
  if (input.description !== undefined) update.description = input.description
  if (input.highlights  !== undefined) update.highlights  = input.highlights
  if (input.imageUrl    !== undefined) update.image_url   = input.imageUrl
  if (input.bannerUrl   !== undefined) update.banner_url  = input.bannerUrl

  const doc = await AdmissionsOverview.findOneAndUpdate(
    { tenant_id: ctx.tenant_id },
    { $set: update },
    { upsert: true, new: true }
  )
  return await toOverviewResponse(doc)
}

/* ─── Programs ────────────────────────────────────────────────────────────── */

async function listAdmissionsPrograms(ctx, args) {
  const { level, tenantId } = validate(listAdmissionsProgramsSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, tenantId)
  const query = {}
  if (level) query.level = level
  const result = await programRepo.findMany(resolvedCtx, query, { ...normalizePagination(args), sort: { order: 1 } })
  return result.items.map(toProgramResponse)
}

async function createAdmissionsProgram(ctx, args) {
  const { input } = validate(createAdmissionsProgramSchema, args || {})
  const program_id = generateId()
  const created = await programRepo.create(ctx, {
    program_id,
    level:       input.level,
    name:        input.name,
    duration:    input.duration    ?? null,
    seats:       input.seats       ?? null,
    description: input.description ?? null,
    eligibility: input.eligibility ?? null,
    order:       input.order       ?? Date.now(),
  })
  return toProgramResponse(created)
}

async function updateAdmissionsProgram(ctx, args) {
  const { input } = validate(updateAdmissionsProgramSchema, args || {})
  const { programId, ...fields } = input

  const existing = await programRepo.findById(ctx, programId)
  if (!existing) throw new NotFoundError('Admissions program not found')

  const updates = {}
  if (fields.level       !== undefined) updates.level       = fields.level
  if (fields.name        !== undefined) updates.name        = fields.name
  if (fields.duration    !== undefined) updates.duration    = fields.duration
  if (fields.seats       !== undefined) updates.seats       = fields.seats
  if (fields.description !== undefined) updates.description = fields.description
  if (fields.eligibility !== undefined) updates.eligibility = fields.eligibility
  if (fields.order       !== undefined) updates.order       = fields.order

  const updated = await programRepo.updateById(ctx, programId, updates)
  return toProgramResponse(updated)
}

async function deleteAdmissionsProgram(ctx, args) {
  const { programId } = validate(deleteAdmissionsProgramSchema, args || {})
  const existing = await programRepo.findById(ctx, programId)
  if (!existing) throw new NotFoundError('Admissions program not found')
  await programRepo.deleteById(ctx, programId)
  return toProgramResponse(existing)
}

/* ─── Courses (UG/PG shared) ──────────────────────────────────────────────── */

async function listCourses(ctx, args, repo, toResponse) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const result = await repo.findMany(resolvedCtx, {}, { ...normalizePagination(args), sort: { order: 1 } })
  return result.items.map(toResponse)
}

async function createCourse(ctx, args, repo, schema, toResponse) {
  const { input } = validate(schema, args || {})
  const course_id = generateId()
  const created = await repo.create(ctx, {
    course_id,
    name:        input.name,
    code:        input.code        ?? null,
    duration:    input.duration    ?? null,
    seats:       input.seats       ?? null,
    description: input.description ?? null,
    order:       input.order       ?? Date.now(),
  })
  return toResponse(created)
}

async function updateCourse(ctx, args, repo, schema, toResponse) {
  const { input } = validate(schema, args || {})
  const { courseId, ...fields } = input

  const existing = await repo.findById(ctx, courseId)
  if (!existing) throw new NotFoundError('Course not found')

  const updates = {}
  if (fields.name        !== undefined) updates.name        = fields.name
  if (fields.code        !== undefined) updates.code        = fields.code
  if (fields.duration    !== undefined) updates.duration    = fields.duration
  if (fields.seats       !== undefined) updates.seats       = fields.seats
  if (fields.description !== undefined) updates.description = fields.description
  if (fields.order       !== undefined) updates.order       = fields.order

  const updated = await repo.updateById(ctx, courseId, updates)
  return toResponse(updated)
}

async function deleteCourse(ctx, args, repo, schema, toResponse) {
  const { courseId } = validate(schema, args || {})
  const existing = await repo.findById(ctx, courseId)
  if (!existing) throw new NotFoundError('Course not found')
  await repo.deleteById(ctx, courseId)
  return toResponse(existing)
}

/* ─── Eligibility Entries ─────────────────────────────────────────────────── */

async function listEligibilityEntries(ctx, args) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const result = await eligibilityRepo.findMany(resolvedCtx, {}, { ...normalizePagination(args), sort: { order: 1 } })
  return result.items.map(toEligibilityEntryResponse)
}

async function createEligibilityEntry(ctx, args) {
  const { input } = validate(createEligibilityEntrySchema, args || {})
  const entry_id = generateId()
  const created = await eligibilityRepo.create(ctx, {
    entry_id,
    title:       input.title,
    description: input.description ?? null,
    order:       input.order       ?? Date.now(),
  })
  return toEligibilityEntryResponse(created)
}

async function updateEligibilityEntry(ctx, args) {
  const { input } = validate(updateEligibilityEntrySchema, args || {})
  const { entryId, ...fields } = input

  const existing = await eligibilityRepo.findById(ctx, entryId)
  if (!existing) throw new NotFoundError('Eligibility entry not found')

  const updates = {}
  if (fields.title       !== undefined) updates.title       = fields.title
  if (fields.description !== undefined) updates.description = fields.description
  if (fields.order       !== undefined) updates.order       = fields.order

  const updated = await eligibilityRepo.updateById(ctx, entryId, updates)
  return toEligibilityEntryResponse(updated)
}

async function deleteEligibilityEntry(ctx, args) {
  const { entryId } = validate(deleteEligibilityEntrySchema, args || {})
  const existing = await eligibilityRepo.findById(ctx, entryId)
  if (!existing) throw new NotFoundError('Eligibility entry not found')
  await eligibilityRepo.deleteById(ctx, entryId)
  return toEligibilityEntryResponse(existing)
}

/* ─── Steps ───────────────────────────────────────────────────────────────── */

async function listAdmissionSteps(ctx, args) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const result = await stepRepo.findMany(resolvedCtx, {}, { ...normalizePagination(args), sort: { order: 1 } })
  return result.items.map(toStepResponse)
}

async function createAdmissionStep(ctx, args) {
  const { input } = validate(createAdmissionStepSchema, args || {})
  const step_id = generateId()
  const created = await stepRepo.create(ctx, {
    step_id,
    title:       input.title,
    description: input.description ?? null,
    icon_name:   input.iconName    ?? null,
    order:       input.order       ?? Date.now(),
  })
  return toStepResponse(created)
}

async function updateAdmissionStep(ctx, args) {
  const { input } = validate(updateAdmissionStepSchema, args || {})
  const { stepId, ...fields } = input

  const existing = await stepRepo.findById(ctx, stepId)
  if (!existing) throw new NotFoundError('Admission step not found')

  const updates = {}
  if (fields.title       !== undefined) updates.title       = fields.title
  if (fields.description !== undefined) updates.description = fields.description
  if (fields.iconName    !== undefined) updates.icon_name   = fields.iconName
  if (fields.order       !== undefined) updates.order       = fields.order

  const updated = await stepRepo.updateById(ctx, stepId, updates)
  return toStepResponse(updated)
}

async function deleteAdmissionStep(ctx, args) {
  const { stepId } = validate(deleteAdmissionStepSchema, args || {})
  const existing = await stepRepo.findById(ctx, stepId)
  if (!existing) throw new NotFoundError('Admission step not found')
  await stepRepo.deleteById(ctx, stepId)
  return toStepResponse(existing)
}

async function reorderAdmissionSteps(ctx, args) {
  const { ids } = validate(reorderAdmissionStepsSchema, args || {})

  const ops = ids.map((id, idx) => ({
    updateOne: {
      filter: { step_id: id, tenant_id: ctx.tenant_id },
      update: { $set: { order: idx + 1 } },
    },
  }))
  await AdmissionStep.bulkWrite(ops)

  const docs = await AdmissionStep.find({ tenant_id: ctx.tenant_id }).sort({ order: 1 }).lean()
  return docs.map(toStepResponse)
}

/* ─── Important Dates ─────────────────────────────────────────────────────── */

async function listImportantDates(ctx, args) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const result = await dateRepo.findMany(resolvedCtx, {}, { ...normalizePagination(args), sort: { date: 1 } })
  return result.items.map(toDateResponse)
}

async function createImportantDate(ctx, args) {
  const { input } = validate(createImportantDateSchema, args || {})
  const date_id = generateId()
  const created = await dateRepo.create(ctx, {
    date_id,
    event:       input.event,
    date:        input.date,
    description: input.description ?? null,
    category:    input.category    ?? null,
  })
  return toDateResponse(created)
}

async function updateImportantDate(ctx, args) {
  const { input } = validate(updateImportantDateSchema, args || {})
  const { dateId, ...fields } = input

  const existing = await dateRepo.findById(ctx, dateId)
  if (!existing) throw new NotFoundError('Important date not found')

  const updates = {}
  if (fields.event       !== undefined) updates.event       = fields.event
  if (fields.date        !== undefined) updates.date        = fields.date
  if (fields.description !== undefined) updates.description = fields.description
  if (fields.category    !== undefined) updates.category    = fields.category

  const updated = await dateRepo.updateById(ctx, dateId, updates)
  return toDateResponse(updated)
}

async function deleteImportantDate(ctx, args) {
  const { dateId } = validate(deleteImportantDateSchema, args || {})
  const existing = await dateRepo.findById(ctx, dateId)
  if (!existing) throw new NotFoundError('Important date not found')
  await dateRepo.deleteById(ctx, dateId)
  return toDateResponse(existing)
}

/* ─── Prospectus ──────────────────────────────────────────────────────────── */

async function getProspectus(ctx, args) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const doc = await Prospectus.findOne({ tenant_id: resolvedCtx.tenant_id }).lean()
  if (!doc) return null
  return await toProspectusResponse(doc)
}

/**
 * Save prospectus with secure file upload
 * Uses random filename to prevent enumeration attacks
 */
async function saveProspectus(ctx, args) {
  const { input } = validate(saveProspectusSchema, args || {})

  const randomName = crypto.randomBytes(16).toString('hex')
  const ext = path.extname(input.fileName).toLowerCase() || '.pdf'
  const key = `${ctx.tenant_id}/admissions/prospectus/${randomName}${ext}`

  const fileUrl = await uploadToS3(key, input.fileBase64, input.fileName, {
    maxSize: 50 * 1024 * 1024, // 50MB for prospectus
    allowedTypes: ['application/pdf'],
    userId: ctx.user_id,
  })

  const update = {
    file_url: fileUrl,
    file_name: input.fileName,
    file_key: key, // Store key for future deletion/management
    uploaded_at: new Date(),
  }
  if (input.title       !== undefined) update.title       = sanitizePlainText(input.title)
  if (input.description !== undefined) update.description = sanitizeRichText(input.description)

  const doc = await Prospectus.findOneAndUpdate(
    { tenant_id: ctx.tenant_id },
    { $set: update },
    { upsert: true, new: true }
  )
  return await toProspectusResponse(doc)
}

async function deleteProspectus(ctx) {
  await Prospectus.deleteOne({ tenant_id: ctx.tenant_id })
  return true
}

/* ─── Fee Documents ───────────────────────────────────────────────────────── */

async function listFeeDocuments(ctx, args) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const result = await feeDocRepo.findMany(resolvedCtx, {}, { ...normalizePagination(args), sort: { createdAt: 1 } })
  return await Promise.all(result.items.map(toFeeDocResponse))
}

/**
 * Create fee document with secure file upload
 */
async function createFeeDocument(ctx, args) {
  const { input } = validate(createFeeDocumentSchema, args || {})
  const fee_doc_id = generateId()
  const ext = path.extname(input.fileName).toLowerCase() || '.pdf'
  const key = `${ctx.tenant_id}/admissions/fee-documents/${fee_doc_id}${ext}`

  const fileUrl = await uploadToS3(key, input.fileBase64, input.fileName, {
    maxSize: 20 * 1024 * 1024, // 20MB for fee documents
    allowedTypes: ['application/pdf'],
    userId: ctx.user_id,
  })

  const created = await feeDocRepo.create(ctx, {
    fee_doc_id,
    title:       sanitizePlainText(input.title),
    file_url:    fileUrl,
    file_name:   input.fileName,
    file_key:    key,
    uploaded_at: new Date(),
  })
  return await toFeeDocResponse(created)
}

async function updateFeeDocument(ctx, args) {
  const { input } = validate(updateFeeDocumentSchema, args || {})
  const { feeDocId, ...fields } = input

  const existing = await feeDocRepo.findById(ctx, feeDocId)
  if (!existing) throw new NotFoundError('Fee document not found')

  const updates = {}
  if (fields.title !== undefined) updates.title = fields.title

  if (fields.fileBase64 && fields.fileName) {
    const ext = path.extname(fields.fileName).toLowerCase() || '.pdf'
    const key = `${ctx.tenant_id}/admissions/fee-documents/${feeDocId}${ext}`
    updates.file_url    = await uploadToS3(key, fields.fileBase64, fields.fileName)
    updates.file_name   = fields.fileName
    updates.uploaded_at = new Date()
  }

  const updated = await feeDocRepo.updateById(ctx, feeDocId, updates)
  return await toFeeDocResponse(updated)
}

async function deleteFeeDocument(ctx, args) {
  const { feeDocId } = validate(deleteFeeDocumentSchema, args || {})
  const existing = await feeDocRepo.findById(ctx, feeDocId)
  if (!existing) throw new NotFoundError('Fee document not found')
  await feeDocRepo.deleteById(ctx, feeDocId)
  return true
}

/* ─── Scholarships ────────────────────────────────────────────────────────── */

async function listScholarships(ctx, args) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const result = await scholarshipRepo.findMany(resolvedCtx, {}, { ...normalizePagination(args), sort: { order: 1 } })
  return result.items.map(toScholarshipResponse)
}

async function createScholarship(ctx, args) {
  const { input } = validate(createScholarshipSchema, args || {})
  const scholarship_id = generateId()
  const created = await scholarshipRepo.create(ctx, {
    scholarship_id,
    type:        input.type,
    name:        input.name,
    description: input.description ?? null,
    amount:      input.amount      ?? null,
    eligibility: input.eligibility ?? null,
    order:       input.order       ?? Date.now(),
  })
  return toScholarshipResponse(created)
}

async function updateScholarship(ctx, args) {
  const { input } = validate(updateScholarshipSchema, args || {})
  const { scholarshipId, ...fields } = input

  const existing = await scholarshipRepo.findById(ctx, scholarshipId)
  if (!existing) throw new NotFoundError('Scholarship not found')

  const updates = {}
  if (fields.type        !== undefined) updates.type        = fields.type
  if (fields.name        !== undefined) updates.name        = fields.name
  if (fields.description !== undefined) updates.description = fields.description
  if (fields.amount      !== undefined) updates.amount      = fields.amount
  if (fields.eligibility !== undefined) updates.eligibility = fields.eligibility
  if (fields.order       !== undefined) updates.order       = fields.order

  const updated = await scholarshipRepo.updateById(ctx, scholarshipId, updates)
  return toScholarshipResponse(updated)
}

async function deleteScholarship(ctx, args) {
  const { scholarshipId } = validate(deleteScholarshipSchema, args || {})
  const existing = await scholarshipRepo.findById(ctx, scholarshipId)
  if (!existing) throw new NotFoundError('Scholarship not found')
  await scholarshipRepo.deleteById(ctx, scholarshipId)
  return toScholarshipResponse(existing)
}

/* ─── Audit Statements ────────────────────────────────────────────────────── */

async function listAuditStatements(ctx, args) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const result = await auditRepo.findMany(resolvedCtx, {}, { ...normalizePagination(args), sort: { year: -1 } })
  return await Promise.all(result.items.map(toAuditResponse))
}

async function createAuditStatement(ctx, args) {
  const { input } = validate(createAuditStatementSchema, args || {})
  const audit_id = generateId()
  const ext = path.extname(input.fileName).toLowerCase() || '.pdf'
  const key = `${ctx.tenant_id}/admissions/audit-statements/${audit_id}${ext}`
  const fileUrl = await uploadToS3(key, input.fileBase64, input.fileName)

  const created = await auditRepo.create(ctx, {
    audit_id,
    year:      input.year,
    title:     input.title,
    file_url:  fileUrl,
    file_name: input.fileName,
  })
  return await toAuditResponse(created)
}

async function deleteAuditStatement(ctx, args) {
  const { auditId } = validate(deleteAuditStatementSchema, args || {})
  const existing = await auditRepo.findById(ctx, auditId)
  if (!existing) throw new NotFoundError('Audit statement not found')
  await auditRepo.deleteById(ctx, auditId)
  return true
}

/* ─── Enquiries ───────────────────────────────────────────────────────────── */

async function listAdmissionsEnquiries(ctx, args) {
  const { status, tenantId } = validate(listAdmissionsEnquiriesSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, tenantId)
  const query = {}
  if (status) query.status = status
  const result = await enquiryRepo.findMany(resolvedCtx, query, { ...normalizePagination(args), sort: { createdAt: -1 } })
  return result.items.map(toEnquiryResponse)
}

async function updateEnquiryStatus(ctx, args) {
  const { enquiryId, status } = validate(updateEnquiryStatusSchema, args || {})
  const existing = await enquiryRepo.findById(ctx, enquiryId)
  if (!existing) throw new NotFoundError('Enquiry not found')
  const updated = await enquiryRepo.updateById(ctx, enquiryId, { status })
  return toEnquiryResponse(updated)
}

/**
 * Submit admissions enquiry - PUBLIC ENDPOINT (no auth required)
 * Protected with rate limiting, tenant validation, and input sanitization
 */
async function submitAdmissionsEnquiry(args, event) {
  const { input } = validate(submitAdmissionsEnquirySchema, args || {})

  // Validate tenant exists - prevents cross-tenant data injection
  const Tenant = require('../../../core-modules/tenant-management/schemas/tenant.model')
  const tenant = await Tenant.findOne({ tenant_id: input.tenantId }).lean()
  if (!tenant) {
    throw new ValidationError('Invalid tenant ID')
  }

  // Rate limiting for public endpoint - use tenant + IP as identifier
  const rateLimitCtx = { user_id: null, ip: event.identity?.sourceIp || null, correlationId: `${input.tenantId}:enquiry` }
  await checkRateLimit(rateLimitCtx, `${input.tenantId}:${event.identity?.sourceIp || 'unknown'}`)

  const enquiry_id = generateId()

  // Sanitize inputs to prevent XSS
  await AdmissionsEnquiry.create({
    tenant_id:  input.tenantId,
    enquiry_id,
    name:       sanitizePlainText(input.name),
    email:      input.email.toLowerCase().trim(),
    phone:      input.phone   ? sanitizePlainText(input.phone)   : null,
    program:    input.program ? sanitizePlainText(input.program) : null,
    message:    input.message ? sanitizePlainText(input.message) : null,
    status:     'NEW',
    source_ip:  event.identity?.sourceIp || null,
    submitted_at: new Date(),
  })

  return true
}

/* ─── Contacts ────────────────────────────────────────────────────────────── */

async function listAdmissionsContacts(ctx, args) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const existing = await AdmissionsContact.find({ tenant_id: resolvedCtx.tenant_id }).lean()
  if (existing.length === 0) {
    await seedContacts(resolvedCtx)
    const seeded = await AdmissionsContact.find({ tenant_id: resolvedCtx.tenant_id }).lean()
    return seeded.map(toContactResponse)
  }
  return existing.map(toContactResponse)
}

async function updateAdmissionsContact(ctx, args) {
  const { contactId, input } = validate(updateAdmissionsContactSchema, args || {})
  const existing = await contactRepo.findById(ctx, contactId)
  if (!existing) throw new NotFoundError('Contact not found')

  const updates = {}
  if (input.name           !== undefined) updates.name            = input.name
  if (input.phone          !== undefined) updates.phone           = input.phone
  if (input.email          !== undefined) updates.email           = input.email
  if (input.officeLocation !== undefined) updates.office_location = input.officeLocation

  const updated = await contactRepo.updateById(ctx, contactId, updates)
  return toContactResponse(updated)
}

/* ─── WhyEnquire ──────────────────────────────────────────────────────────── */

async function getWhyEnquire(ctx, args) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const doc = await WhyEnquire.findOne({ tenant_id: resolvedCtx.tenant_id }).lean()
  if (!doc) return null
  return toWhyEnquireResponse(doc)
}

async function saveWhyEnquire(ctx, args) {
  const { input } = validate(saveWhyEnquireSchema, args || {})

  const update = {}
  if (input.title  !== undefined) update.title  = input.title
  if (input.points !== undefined) update.points = input.points

  const doc = await WhyEnquire.findOneAndUpdate(
    { tenant_id: ctx.tenant_id },
    { $set: update },
    { upsert: true, new: true }
  )
  return toWhyEnquireResponse(doc)
}

/* ─── EnquiryCategory ─────────────────────────────────────────────────────── */

async function listEnquiryCategories(ctx, args) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const result = await categoryRepo.findMany(resolvedCtx, {}, { ...normalizePagination(args), sort: { createdAt: 1 } })
  return result.items.map(toCategoryResponse)
}

async function createEnquiryCategory(ctx, args) {
  const { input } = validate(createEnquiryCategorySchema, args || {})
  const category_id = generateId()
  const created = await categoryRepo.create(ctx, {
    category_id,
    title:       input.title,
    description: input.description ?? null,
  })
  return toCategoryResponse(created)
}

async function updateEnquiryCategory(ctx, args) {
  const { input } = validate(updateEnquiryCategorySchema, args || {})
  const { categoryId, ...fields } = input

  const existing = await categoryRepo.findById(ctx, categoryId)
  if (!existing) throw new NotFoundError('Enquiry category not found')

  const updates = {}
  if (fields.title       !== undefined) updates.title       = fields.title
  if (fields.description !== undefined) updates.description = fields.description

  const updated = await categoryRepo.updateById(ctx, categoryId, updates)
  return toCategoryResponse(updated)
}

async function deleteEnquiryCategory(ctx, args) {
  const { categoryId } = validate(deleteEnquiryCategorySchema, args || {})
  const existing = await categoryRepo.findById(ctx, categoryId)
  if (!existing) throw new NotFoundError('Enquiry category not found')
  await categoryRepo.deleteById(ctx, categoryId)
  return toCategoryResponse(existing)
}

/* ─── InfoBlock ───────────────────────────────────────────────────────────── */

async function listInfoBlocks(ctx, args) {
  const resolvedCtx = resolveTenantContext(ctx, args)
  const result = await infoBlockRepo.findMany(resolvedCtx, {}, { ...normalizePagination(args), sort: { type: 1 } })
  return result.items.map(toInfoBlockResponse)
}

async function createInfoBlock(ctx, args) {
  const { input } = validate(createInfoBlockSchema, args || {})
  const block_id = generateId()
  const created = await infoBlockRepo.create(ctx, {
    block_id,
    type:        input.type,
    description: input.description,
  })
  return toInfoBlockResponse(created)
}

async function updateInfoBlock(ctx, args) {
  const { input } = validate(updateInfoBlockSchema, args || {})
  const { blockId, ...fields } = input

  const existing = await infoBlockRepo.findById(ctx, blockId)
  if (!existing) throw new NotFoundError('Info block not found')

  const updates = {}
  if (fields.type        !== undefined) updates.type        = fields.type
  if (fields.description !== undefined) updates.description = fields.description

  const updated = await infoBlockRepo.updateById(ctx, blockId, updates)
  return toInfoBlockResponse(updated)
}

async function deleteInfoBlock(ctx, args) {
  const { blockId } = validate(deleteInfoBlockSchema, args || {})
  const existing = await infoBlockRepo.findById(ctx, blockId)
  if (!existing) throw new NotFoundError('Info block not found')
  await infoBlockRepo.deleteById(ctx, blockId)
  return toInfoBlockResponse(existing)
}
