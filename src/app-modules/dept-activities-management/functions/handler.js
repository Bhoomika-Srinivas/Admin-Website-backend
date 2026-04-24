const { resolveTenant, resolveSecureTenantContext } = require('/opt/nodejs/middleware/tenant-resolver')
const { requirePermission }   = require('/opt/nodejs/middleware/auth-guard')
const { validate }            = require('/opt/nodejs/middleware/input-validator')
const { withConnection }      = require('/opt/nodejs/middleware/with-connection')
const { log }                 = require('/opt/nodejs/middleware/request-logger')
const { generateId }          = require('/opt/nodejs/utils/id-generator')
const { MongoRepository }     = require('/opt/nodejs/db/mongo-repository')
const { NotFoundError }       = require('/opt/nodejs/middleware/error-handler')
const { normalizePagination } = require('/opt/nodejs/utils/pagination')
const { getSignedUrl }        = require('@aws-sdk/s3-request-presigner')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')

const s3 = new S3Client({ region: process.env.AWS_REGION })
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
  listPlacementOverviewsSchema,
  createPlacementOverviewSchema,
  updatePlacementOverviewSchema,
  deletePlacementOverviewSchema,
  listStudentPlacementsSchema,
  createStudentPlacementSchema,
  updateStudentPlacementSchema,
  deleteStudentPlacementSchema,
  listAchievementsSchema,
  createAchievementSchema,
  updateAchievementSchema,
  deleteAchievementSchema,
  listDeptActivitiesSchema,
  createDeptActivitySchema,
  updateDeptActivitySchema,
  deleteDeptActivitySchema,
  listNewslettersSchema,
  createNewsletterSchema,
  updateNewsletterSchema,
  deleteNewsletterSchema,
  listGalleryPhotosSchema,
  createGalleryPhotoSchema,
  updateGalleryPhotoSchema,
  deleteGalleryPhotoSchema,
  saveForumSectionSchema,
  listForumEventsSchema,
  createForumEventSchema,
  updateForumEventSchema,
  deleteForumEventSchema,
  listDepartmentActivitiesSchema,
  createDepartmentActivitySchema,
  updateDepartmentActivitySchema,
  deleteDepartmentActivitySchema,
} = require('../schemas/validation')

const {
  PlacementOverview,
  StudentPlacement,
  Achievement,
  DeptActivity,
  Newsletter,
  GalleryPhoto,
  ForumSection,
  ForumEvent,
  DepartmentActivity,
} = require('../schemas/dept.activities.model')

/* ─────────────────────────────
   Repositories
─────────────────────────────*/

const placementOverviewRepo  = new MongoRepository({ model: PlacementOverview,  primaryKey: 'placement_overview_id' })
const studentPlacementRepo   = new MongoRepository({ model: StudentPlacement,   primaryKey: 'student_placement_id' })
const achievementRepo        = new MongoRepository({ model: Achievement,        primaryKey: 'achievement_id' })
const deptActivityRepo       = new MongoRepository({ model: DeptActivity,       primaryKey: 'dept_activity_id' })
const newsletterRepo         = new MongoRepository({ model: Newsletter,         primaryKey: 'newsletter_id' })
const galleryPhotoRepo       = new MongoRepository({ model: GalleryPhoto,       primaryKey: 'gallery_photo_id' })
const forumEventRepo         = new MongoRepository({ model: ForumEvent,         primaryKey: 'forum_event_id' })
const departmentActivityRepo = new MongoRepository({ model: DepartmentActivity, primaryKey: 'dept_activity_log_id' })

/* ─────────────────────────────
   Response Normalizers
─────────────────────────────*/

function toPlacementOverviewResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, placementOverviewId: plain.placement_overview_id || (plain._id ? plain._id.toString() : null) }
}

async function toStudentPlacementResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, studentPlacementId: plain.student_placement_id || (plain._id ? plain._id.toString() : null), imageUrl: await getPresignedUrl(plain.imageUrl) }
}

function toAchievementResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, achievementId: plain.achievement_id || (plain._id ? plain._id.toString() : null) }
}

function toDeptActivityResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptActivityId: plain.dept_activity_id || (plain._id ? plain._id.toString() : null) }
}

async function toNewsletterResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, newsletterId: plain.newsletter_id || (plain._id ? plain._id.toString() : null), fileUrl: await getPresignedUrl(plain.fileUrl) }
}

async function toGalleryPhotoResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, galleryPhotoId: plain.gallery_photo_id || (plain._id ? plain._id.toString() : null), imageUrl: await getPresignedUrl(plain.imageUrl) }
}

function toForumSectionResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, forumSectionId: plain.forum_section_id || (plain._id ? plain._id.toString() : null) }
}

async function toForumEventResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, forumEventId: plain.forum_event_id || (plain._id ? plain._id.toString() : null), attachmentUrl: await getPresignedUrl(plain.attachmentUrl) }
}

function toDepartmentActivityResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptActivityLogId: plain.dept_activity_log_id || (plain._id ? plain._id.toString() : null) }
}

/* ─────────────────────────────
   Query Builders
   All filtering/searching/sorting
   happens in MongoDB — not frontend
─────────────────────────────*/

function currentAcademicYear() {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= 6
    ? `${year}-${String(year + 1).slice(2)}`
    : `${year - 1}-${String(year).slice(2)}`
}

function buildPlacementOverviewQuery(args) {
  const query = {}
  if (args.deptId)       query.deptId       = args.deptId
  if (args.academicYear) query.academicYear = args.academicYear

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { title:        { $regex: args.search.trim(), $options: 'i' } },
      { academicYear: { $regex: args.search.trim(), $options: 'i' } },
    ]
  }

  return query
}

function buildStudentPlacementQuery(args) {
  const query = {}
  if (args.deptId)  query.deptId  = args.deptId
  if (args.batch)   query.batch   = args.batch
  if (args.company) query.company = args.company

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { studentName: { $regex: args.search.trim(), $options: 'i' } },
      { usn:         { $regex: args.search.trim(), $options: 'i' } },
      { company:     { $regex: args.search.trim(), $options: 'i' } },
      { role:        { $regex: args.search.trim(), $options: 'i' } },
    ]
  }

  return query
}

function buildAchievementQuery(args) {
  const query = {}
  if (args.deptId) query.deptId = args.deptId
  if (args.type)   query.type   = args.type

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { text: { $regex: args.search.trim(), $options: 'i' } },
    ]
  }

  return query
}

function buildDeptActivityQuery(args) {
  const query = {}
  if (args.deptId) query.deptId = args.deptId
  if (args.type)   query.type   = args.type

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { name:        { $regex: args.search.trim(), $options: 'i' } },
      { description: { $regex: args.search.trim(), $options: 'i' } },
      { organizer:   { $regex: args.search.trim(), $options: 'i' } },
      { venue:       { $regex: args.search.trim(), $options: 'i' } },
    ]
  }

  return query
}

function buildNewsletterQuery(args) {
  const query = {}
  if (args.deptId) query.deptId = args.deptId
  if (args.year)   query.year   = args.year
  return query
}

function buildGalleryPhotoQuery(args) {
  const query = {}
  if (args.deptId)   query.deptId   = args.deptId
  if (args.category) query.category = args.category

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { title:    { $regex: args.search.trim(), $options: 'i' } },
      { category: { $regex: args.search.trim(), $options: 'i' } },
    ]
  }

  return query
}

function buildForumEventQuery(args) {
  const query = {}
  if (args.deptId) query.deptId = args.deptId

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { title:       { $regex: args.search.trim(), $options: 'i' } },
      { description: { $regex: args.search.trim(), $options: 'i' } },
    ]
  }

  return query
}

function buildDepartmentActivityQuery(args) {
  const query = {}
  if (args.deptId) query.deptId = args.deptId

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { text: { $regex: args.search.trim(), $options: 'i' } },
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
  log(ctx, 'dept-activities', event.field)

  switch (event.field) {

    // ── PlacementOverview ─────────────────────────
    case 'listPlacementOverviews':
      return await listPlacementOverviews(ctx, event.arguments)

    case 'createPlacementOverview':
      await requirePermission(ctx, 'dept-activities:placement-overview:create')
      return await createPlacementOverview(ctx, event.arguments)

    case 'updatePlacementOverview':
      await requirePermission(ctx, 'dept-activities:placement-overview:update')
      return await updatePlacementOverview(ctx, event.arguments)

    case 'deletePlacementOverview':
      await requirePermission(ctx, 'dept-activities:placement-overview:delete')
      return await deletePlacementOverview(ctx, event.arguments)

    // ── StudentPlacement ──────────────────────────
    case 'listStudentPlacements':
      return await listStudentPlacements(ctx, event.arguments)

    case 'createStudentPlacement':
      await requirePermission(ctx, 'dept-activities:student-placement:create')
      return await createStudentPlacement(ctx, event.arguments)

    case 'updateStudentPlacement':
      await requirePermission(ctx, 'dept-activities:student-placement:update')
      return await updateStudentPlacement(ctx, event.arguments)

    case 'deleteStudentPlacement':
      await requirePermission(ctx, 'dept-activities:student-placement:delete')
      return await deleteStudentPlacement(ctx, event.arguments)

    // ── Achievement ───────────────────────────────
    case 'listAchievements':
      return await listAchievements(ctx, event.arguments)

    case 'createAchievement':
      await requirePermission(ctx, 'dept-activities:achievement:create')
      return await createAchievement(ctx, event.arguments)

    case 'updateAchievement':
      await requirePermission(ctx, 'dept-activities:achievement:update')
      return await updateAchievement(ctx, event.arguments)

    case 'deleteAchievement':
      await requirePermission(ctx, 'dept-activities:achievement:delete')
      return await deleteAchievement(ctx, event.arguments)

    // ── DeptActivity ──────────────────────────────
    case 'listDeptActivities':
      return await listDeptActivities(ctx, event.arguments)

    case 'createDeptActivity':
      await requirePermission(ctx, 'dept-activities:activity:create')
      return await createDeptActivity(ctx, event.arguments)

    case 'updateDeptActivity':
      await requirePermission(ctx, 'dept-activities:activity:update')
      return await updateDeptActivity(ctx, event.arguments)

    case 'deleteDeptActivity':
      await requirePermission(ctx, 'dept-activities:activity:delete')
      return await deleteDeptActivity(ctx, event.arguments)

    // ── Newsletter ────────────────────────────────
    case 'listNewsletters':
      return await listNewsletters(ctx, event.arguments)

    case 'createNewsletter':
      await requirePermission(ctx, 'dept-activities:newsletter:create')
      return await createNewsletter(ctx, event.arguments)

    case 'updateNewsletter':
      await requirePermission(ctx, 'dept-activities:newsletter:update')
      return await updateNewsletter(ctx, event.arguments)

    case 'deleteNewsletter':
      await requirePermission(ctx, 'dept-activities:newsletter:delete')
      return await deleteNewsletter(ctx, event.arguments)

    // ── GalleryPhoto ──────────────────────────────
    case 'listGalleryPhotos':
      return await listGalleryPhotos(ctx, event.arguments)

    case 'createGalleryPhoto':
      await requirePermission(ctx, 'dept-activities:gallery:create')
      return await createGalleryPhoto(ctx, event.arguments)

    case 'updateGalleryPhoto':
      await requirePermission(ctx, 'dept-activities:gallery:update')
      return await updateGalleryPhoto(ctx, event.arguments)

    case 'deleteGalleryPhoto':
      await requirePermission(ctx, 'dept-activities:gallery:delete')
      return await deleteGalleryPhoto(ctx, event.arguments)

    // ── ForumSection (upsert) ─────────────────────
    case 'getForumSection':
      return await getForumSection(ctx, event.arguments)

    case 'saveForumSection':
      await requirePermission(ctx, 'dept-activities:forum:write')
      return await saveForumSection(ctx, event.arguments)

    // ── ForumEvent ────────────────────────────────
    case 'listForumEvents':
      return await listForumEvents(ctx, event.arguments)

    case 'createForumEvent':
      await requirePermission(ctx, 'dept-activities:forum:create')
      return await createForumEvent(ctx, event.arguments)

    case 'updateForumEvent':
      await requirePermission(ctx, 'dept-activities:forum:update')
      return await updateForumEvent(ctx, event.arguments)

    case 'deleteForumEvent':
      await requirePermission(ctx, 'dept-activities:forum:delete')
      return await deleteForumEvent(ctx, event.arguments)

    // ── DepartmentActivity (log) ──────────────────
    case 'listDepartmentActivities':
      return await listDepartmentActivities(ctx, event.arguments)

    case 'createDepartmentActivity':
      await requirePermission(ctx, 'dept-activities:dept-activity-log:create')
      return await createDepartmentActivity(ctx, event.arguments)

    case 'updateDepartmentActivity':
      await requirePermission(ctx, 'dept-activities:dept-activity-log:update')
      return await updateDepartmentActivity(ctx, event.arguments)

    case 'deleteDepartmentActivity':
      await requirePermission(ctx, 'dept-activities:dept-activity-log:delete')
      return await deleteDepartmentActivity(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)


/* ─────────────────────────────
   PlacementOverview
─────────────────────────────*/

async function listPlacementOverviews(ctx, args) {
  const validated   = validate(listPlacementOverviewsSchema, args || {})
  const { tenantId, ...rest } = validated
  const resolvedCtx = resolveSecureTenantContext(ctx, tenantId)
  const query       = buildPlacementOverviewQuery(rest)
  const sort        = buildSort(rest.sortBy, rest.sortOrder)

  const docs = await PlacementOverview.find({ tenant_id: resolvedCtx.tenant_id, ...query }).sort(sort).lean()

  return { items: docs.map(toPlacementOverviewResponse), nextToken: null }
}

async function createPlacementOverview(ctx, args) {
  const input = validate(createPlacementOverviewSchema, args || {})
  const { deptId, academicYear, companiesVisited, studentsInCampus, studentsOffCampus, highestPackage } = input.input

  const placement_overview_id = generateId()

  const created = await placementOverviewRepo.create(ctx, {
    placement_overview_id,
    deptId,
    academicYear:      academicYear || currentAcademicYear(),
    companiesVisited:  companiesVisited  ?? 0,
    studentsInCampus:  studentsInCampus  ?? 0,
    studentsOffCampus: studentsOffCampus ?? 0,
    highestPackage:    highestPackage    ?? '',
    created_by:        ctx.user_id,
  })

  return toPlacementOverviewResponse(created)
}

async function updatePlacementOverview(ctx, args) {
  const input = validate(updatePlacementOverviewSchema, args || {})
  const { placementOverviewId, ...fields } = input.input

  const existing = await placementOverviewRepo.findById(ctx, placementOverviewId)
  if (!existing) throw new NotFoundError('Placement overview not found')

  const updates = {}
  if (fields.academicYear      !== undefined) updates.academicYear      = fields.academicYear
  if (fields.companiesVisited  !== undefined) updates.companiesVisited  = fields.companiesVisited
  if (fields.studentsInCampus  !== undefined) updates.studentsInCampus  = fields.studentsInCampus
  if (fields.studentsOffCampus !== undefined) updates.studentsOffCampus = fields.studentsOffCampus
  if (fields.highestPackage    !== undefined) updates.highestPackage    = fields.highestPackage

  const updated = await placementOverviewRepo.updateById(ctx, placementOverviewId, updates)

  return toPlacementOverviewResponse(updated)
}

async function deletePlacementOverview(ctx, args) {
  const { placementOverviewId } = validate(deletePlacementOverviewSchema, args || {})

  const existing = await placementOverviewRepo.findById(ctx, placementOverviewId)
  if (!existing) throw new NotFoundError('Placement overview not found')

  await placementOverviewRepo.deleteById(ctx, placementOverviewId)

  return toPlacementOverviewResponse(existing)
}


/* ─────────────────────────────
   StudentPlacement
─────────────────────────────*/

async function listStudentPlacements(ctx, args) {
  const validated          = validate(listStudentPlacementsSchema, args || {})
  const { tenantId, ...rest } = validated
  const resolvedCtx = resolveSecureTenantContext(ctx, tenantId)
  const query              = buildStudentPlacementQuery(rest)
  const sort               = buildSort(rest.sortBy, rest.sortOrder)
  const pagination         = normalizePagination(validated)

  const result = await studentPlacementRepo.findMany(resolvedCtx, query, { ...pagination, sort })

  return {
    items:     await Promise.all(result.items.map(toStudentPlacementResponse)),
    nextToken: result.nextCursor, pageInfo: result.pageInfo,
  }
}

async function createStudentPlacement(ctx, args) {
  const input = validate(createStudentPlacementSchema, args || {})
  const { deptId, studentName, usn, batch, company, role, package: pkg, imageUrl } = input.input

  const student_placement_id = generateId()

  const created = await studentPlacementRepo.create(ctx, {
    student_placement_id,
    deptId,
    studentName,
    usn:        usn      ?? '',
    batch:      batch    ?? '',
    company,
    role:       role     ?? '',
    package:    pkg      ?? 0,
    imageUrl:   imageUrl ?? '',
    created_by: ctx.user_id,
  })

  return await toStudentPlacementResponse(created)
}

async function updateStudentPlacement(ctx, args) {
  const input = validate(updateStudentPlacementSchema, args || {})
  const { studentPlacementId, ...fields } = input.input

  const existing = await studentPlacementRepo.findById(ctx, studentPlacementId)
  if (!existing) throw new NotFoundError('Student placement not found')

  const updates = {}
  if (fields.studentName !== undefined) updates.studentName = fields.studentName
  if (fields.usn         !== undefined) updates.usn         = fields.usn
  if (fields.batch       !== undefined) updates.batch       = fields.batch
  if (fields.company     !== undefined) updates.company     = fields.company
  if (fields.role        !== undefined) updates.role        = fields.role
  if (fields.package     !== undefined) updates.package     = fields.package
  if (fields.imageUrl    !== undefined) updates.imageUrl    = fields.imageUrl

  const updated = await studentPlacementRepo.updateById(ctx, studentPlacementId, updates)

  return await toStudentPlacementResponse(updated)
}

async function deleteStudentPlacement(ctx, args) {
  const { studentPlacementId } = validate(deleteStudentPlacementSchema, args || {})

  const existing = await studentPlacementRepo.findById(ctx, studentPlacementId)
  if (!existing) throw new NotFoundError('Student placement not found')

  await studentPlacementRepo.deleteById(ctx, studentPlacementId)

  return await toStudentPlacementResponse(existing)
}


/* ─────────────────────────────
   Achievement
─────────────────────────────*/

async function listAchievements(ctx, args) {
  const validated   = validate(listAchievementsSchema, args || {})
  const { tenantId, ...rest } = validated
  const resolvedCtx = resolveSecureTenantContext(ctx, tenantId)
  const query       = buildAchievementQuery(rest)
  const sort        = buildSort(rest.sortBy, rest.sortOrder)

  const docs = await Achievement.find({ tenant_id: resolvedCtx.tenant_id, ...query }).sort(sort).lean()

  return { items: docs.map(toAchievementResponse), nextToken: null }
}

async function createAchievement(ctx, args) {
  const input = validate(createAchievementSchema, args || {})
  const { deptId, type, text } = input.input

  const achievement_id = generateId()

  const created = await achievementRepo.create(ctx, {
    achievement_id,
    deptId,
    type:       type ?? 'student',
    text,
    created_by: ctx.user_id,
  })

  return toAchievementResponse(created)
}

async function updateAchievement(ctx, args) {
  const input = validate(updateAchievementSchema, args || {})
  const { achievementId, ...fields } = input.input

  const existing = await achievementRepo.findById(ctx, achievementId)
  if (!existing) throw new NotFoundError('Achievement not found')

  const updates = {}
  if (fields.type !== undefined) updates.type = fields.type
  if (fields.text !== undefined) updates.text = fields.text

  const updated = await achievementRepo.updateById(ctx, achievementId, updates)

  return toAchievementResponse(updated)
}

async function deleteAchievement(ctx, args) {
  const { achievementId } = validate(deleteAchievementSchema, args || {})

  const existing = await achievementRepo.findById(ctx, achievementId)
  if (!existing) throw new NotFoundError('Achievement not found')

  await achievementRepo.deleteById(ctx, achievementId)

  return toAchievementResponse(existing)
}


/* ─────────────────────────────
   DeptActivity
─────────────────────────────*/

async function listDeptActivities(ctx, args) {
  const validated          = validate(listDeptActivitiesSchema, args || {})
  const { tenantId, ...rest } = validated
  const resolvedCtx = resolveSecureTenantContext(ctx, tenantId)
  const query              = buildDeptActivityQuery(rest)
  const sort               = buildSort(rest.sortBy, rest.sortOrder)
  const pagination         = normalizePagination(validated)

  const result = await deptActivityRepo.findMany(resolvedCtx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toDeptActivityResponse),
    nextToken: result.nextCursor, pageInfo: result.pageInfo,
  }
}

async function createDeptActivity(ctx, args) {
  const input = validate(createDeptActivitySchema, args || {})
  const { deptId, type, name, description, date, venue, organizer, participants } = input.input

  const dept_activity_id = generateId()

  const created = await deptActivityRepo.create(ctx, {
    dept_activity_id,
    deptId,
    type:         type         ?? 'department',
    name,
    description:  description  ?? '',
    date:         date         ?? '',
    venue:        venue        ?? '',
    organizer:    organizer    ?? '',
    participants: participants ?? null,
    created_by:   ctx.user_id,
  })

  return toDeptActivityResponse(created)
}

async function updateDeptActivity(ctx, args) {
  const input = validate(updateDeptActivitySchema, args || {})
  const { deptActivityId, ...fields } = input.input

  const existing = await deptActivityRepo.findById(ctx, deptActivityId)
  if (!existing) throw new NotFoundError('Activity not found')

  const updates = {}
  if (fields.type         !== undefined) updates.type         = fields.type
  if (fields.name         !== undefined) updates.name         = fields.name
  if (fields.description  !== undefined) updates.description  = fields.description
  if (fields.date         !== undefined) updates.date         = fields.date
  if (fields.venue        !== undefined) updates.venue        = fields.venue
  if (fields.organizer    !== undefined) updates.organizer    = fields.organizer
  if (fields.participants !== undefined) updates.participants = fields.participants

  const updated = await deptActivityRepo.updateById(ctx, deptActivityId, updates)

  return toDeptActivityResponse(updated)
}

async function deleteDeptActivity(ctx, args) {
  const { deptActivityId } = validate(deleteDeptActivitySchema, args || {})

  const existing = await deptActivityRepo.findById(ctx, deptActivityId)
  if (!existing) throw new NotFoundError('Activity not found')

  await deptActivityRepo.deleteById(ctx, deptActivityId)

  return toDeptActivityResponse(existing)
}


/* ─────────────────────────────
   Newsletter
─────────────────────────────*/

async function listNewsletters(ctx, args) {
  const validated   = validate(listNewslettersSchema, args || {})
  const { tenantId, ...rest } = validated
  const resolvedCtx = resolveSecureTenantContext(ctx, tenantId)
  const query       = buildNewsletterQuery(rest)
  const sort        = buildSort(rest.sortBy, rest.sortOrder)

  const docs = await Newsletter.find({ tenant_id: resolvedCtx.tenant_id, ...query }).sort(sort).lean()

  return { items: await Promise.all(docs.map(toNewsletterResponse)), nextToken: null }
}

async function createNewsletter(ctx, args) {
  const input = validate(createNewsletterSchema, args || {})
  const { deptId, year, fileUrl } = input.input

  const newsletter_id = generateId()

  const created = await newsletterRepo.create(ctx, {
    newsletter_id,
    deptId,
    year,
    fileUrl:    fileUrl || '',
    created_by: ctx.user_id,
  })

  return await toNewsletterResponse(created)
}

async function updateNewsletter(ctx, args) {
  const input = validate(updateNewsletterSchema, args || {})
  const { newsletterId, ...fields } = input.input

  const existing = await newsletterRepo.findById(ctx, newsletterId)
  if (!existing) throw new NotFoundError('Newsletter not found')

  const updates = {}
  if (fields.year    !== undefined) updates.year    = fields.year
  if (fields.fileUrl !== undefined) updates.fileUrl = fields.fileUrl

  const updated = await newsletterRepo.updateById(ctx, newsletterId, updates)

  return await toNewsletterResponse(updated)
}

async function deleteNewsletter(ctx, args) {
  const { newsletterId } = validate(deleteNewsletterSchema, args || {})

  const existing = await newsletterRepo.findById(ctx, newsletterId)
  if (!existing) throw new NotFoundError('Newsletter not found')

  await newsletterRepo.deleteById(ctx, newsletterId)

  return await toNewsletterResponse(existing)
}


/* ─────────────────────────────
   GalleryPhoto
─────────────────────────────*/

async function listGalleryPhotos(ctx, args) {
  const validated          = validate(listGalleryPhotosSchema, args || {})
  const { tenantId, ...rest } = validated
  const resolvedCtx = resolveSecureTenantContext(ctx, tenantId)
  const query              = buildGalleryPhotoQuery(rest)
  const sort               = buildSort(rest.sortBy, rest.sortOrder)
  const pagination         = normalizePagination(validated)

  const result = await galleryPhotoRepo.findMany(resolvedCtx, query, { ...pagination, sort })

  return {
    items:     await Promise.all(result.items.map(toGalleryPhotoResponse)),
    nextToken: result.nextCursor, pageInfo: result.pageInfo,
  }
}

async function createGalleryPhoto(ctx, args) {
  const input = validate(createGalleryPhotoSchema, args || {})
  const { deptId, title, category, imageUrl, capturedAt } = input.input

  const gallery_photo_id = generateId()

  const created = await galleryPhotoRepo.create(ctx, {
    gallery_photo_id,
    deptId,
    title,
    category:   category   ?? '',
    imageUrl:   imageUrl   ?? '',
    capturedAt: capturedAt ?? '',
    created_by: ctx.user_id,
  })

  return await toGalleryPhotoResponse(created)
}

async function updateGalleryPhoto(ctx, args) {
  const input = validate(updateGalleryPhotoSchema, args || {})
  const { galleryPhotoId, ...fields } = input.input

  const existing = await galleryPhotoRepo.findById(ctx, galleryPhotoId)
  if (!existing) throw new NotFoundError('Gallery photo not found')

  const updates = {}
  if (fields.title      !== undefined) updates.title      = fields.title
  if (fields.category   !== undefined) updates.category   = fields.category
  if (fields.imageUrl   !== undefined) updates.imageUrl   = fields.imageUrl
  if (fields.capturedAt !== undefined) updates.capturedAt = fields.capturedAt

  const updated = await galleryPhotoRepo.updateById(ctx, galleryPhotoId, updates)

  return await toGalleryPhotoResponse(updated)
}

async function deleteGalleryPhoto(ctx, args) {
  const { galleryPhotoId } = validate(deleteGalleryPhotoSchema, args || {})

  const existing = await galleryPhotoRepo.findById(ctx, galleryPhotoId)
  if (!existing) throw new NotFoundError('Gallery photo not found')

  await galleryPhotoRepo.deleteById(ctx, galleryPhotoId)

  return await toGalleryPhotoResponse(existing)
}


/* ─────────────────────────────
   ForumSection (upsert — 1:1 per dept)
─────────────────────────────*/

async function getForumSection(ctx, args) {
  const { deptId, tenantId } = args
  const resolvedCtx = resolveSecureTenantContext(ctx, tenantId)

  const doc = await ForumSection.findOne({ tenant_id: resolvedCtx.tenant_id, deptId }).lean()

  if (!doc) {
    return { forumSectionId: null, deptId, title: '', description: '' }
  }

  return toForumSectionResponse(doc)
}

async function saveForumSection(ctx, args) {
  const input = validate(saveForumSectionSchema, args || {})
  const { deptId, title, description } = input.input

  const doc = await ForumSection.findOneAndUpdate(
    { tenant_id: ctx.tenant_id, deptId },
    { $set: { title, description, updated_by: ctx.user_id } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean()

  return toForumSectionResponse(doc)
}


/* ─────────────────────────────
   ForumEvent
─────────────────────────────*/

async function listForumEvents(ctx, args) {
  const validated   = validate(listForumEventsSchema, args || {})
  const { tenantId, ...rest } = validated
  const resolvedCtx = resolveSecureTenantContext(ctx, tenantId)
  const query       = buildForumEventQuery(rest)
  const sort        = buildSort(rest.sortBy, rest.sortOrder)

  const docs = await ForumEvent.find({ tenant_id: resolvedCtx.tenant_id, ...query }).sort(sort).lean()

  return { items: await Promise.all(docs.map(toForumEventResponse)), nextToken: null }
}

async function createForumEvent(ctx, args) {
  const input = validate(createForumEventSchema, args || {})
  const { deptId, title, description, attachmentUrl } = input.input

  const forum_event_id = generateId()

  const created = await forumEventRepo.create(ctx, {
    forum_event_id,
    deptId,
    title,
    description:   description   || '',
    attachmentUrl: attachmentUrl || '',
    created_by:    ctx.user_id,
  })

  return await toForumEventResponse(created)
}

async function updateForumEvent(ctx, args) {
  const input = validate(updateForumEventSchema, args || {})
  const { forumEventId, ...fields } = input.input

  const existing = await forumEventRepo.findById(ctx, forumEventId)
  if (!existing) throw new NotFoundError('Forum event not found')

  const updates = {}
  if (fields.title         !== undefined) updates.title         = fields.title
  if (fields.description   !== undefined) updates.description   = fields.description
  if (fields.attachmentUrl !== undefined) updates.attachmentUrl = fields.attachmentUrl

  const updated = await forumEventRepo.updateById(ctx, forumEventId, updates)

  return await toForumEventResponse(updated)
}

async function deleteForumEvent(ctx, args) {
  const { forumEventId } = validate(deleteForumEventSchema, args || {})

  const existing = await forumEventRepo.findById(ctx, forumEventId)
  if (!existing) throw new NotFoundError('Forum event not found')

  await forumEventRepo.deleteById(ctx, forumEventId)

  return await toForumEventResponse(existing)
}


/* ─────────────────────────────
   DepartmentActivity (log)
─────────────────────────────*/

async function listDepartmentActivities(ctx, args) {
  const validated   = validate(listDepartmentActivitiesSchema, args || {})
  const { tenantId, ...rest } = validated
  const resolvedCtx = resolveSecureTenantContext(ctx, tenantId)
  const query       = buildDepartmentActivityQuery(rest)
  const sort        = buildSort(rest.sortBy || 'createdAt', rest.sortOrder || 'desc')

  const docs = await DepartmentActivity.find({ tenant_id: resolvedCtx.tenant_id, ...query }).sort(sort).lean()

  return { items: docs.map(toDepartmentActivityResponse), nextToken: null }
}

async function createDepartmentActivity(ctx, args) {
  const input = validate(createDepartmentActivitySchema, args || {})
  const { deptId, text } = input.input

  const dept_activity_log_id = generateId()

  const created = await departmentActivityRepo.create(ctx, {
    dept_activity_log_id,
    deptId,
    text,
    created_by: ctx.user_id,
  })

  return toDepartmentActivityResponse(created)
}

async function updateDepartmentActivity(ctx, args) {
  const input = validate(updateDepartmentActivitySchema, args || {})
  const { deptActivityLogId, ...fields } = input.input

  const existing = await departmentActivityRepo.findById(ctx, deptActivityLogId)
  if (!existing) throw new NotFoundError('Department activity not found')

  const updates = {}
  if (fields.text !== undefined) updates.text = fields.text

  const updated = await departmentActivityRepo.updateById(ctx, deptActivityLogId, updates)

  return toDepartmentActivityResponse(updated)
}

async function deleteDepartmentActivity(ctx, args) {
  const { deptActivityLogId } = validate(deleteDepartmentActivitySchema, args || {})

  const existing = await departmentActivityRepo.findById(ctx, deptActivityLogId)
  if (!existing) throw new NotFoundError('Department activity not found')

  await departmentActivityRepo.deleteById(ctx, deptActivityLogId)

  return toDepartmentActivityResponse(existing)
}


