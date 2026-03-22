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
  listEventsSchema,
  getEventSchema,
  createEventSchema,
  updateEventSchema,
  deleteEventSchema,
  approveEventSchema,
  rejectEventSchema,
  cancelEventSchema,
  togglePinEventSchema,
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
  Event,
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

const eventRepo              = new MongoRepository({ model: Event,              primaryKey: 'event_id' })
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

function toEventResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, eventId: plain.event_id || (plain._id ? plain._id.toString() : null) }
}

function toPlacementOverviewResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, placementOverviewId: plain.placement_overview_id || (plain._id ? plain._id.toString() : null) }
}

function toStudentPlacementResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, studentPlacementId: plain.student_placement_id || (plain._id ? plain._id.toString() : null) }
}

function toAchievementResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, achievementId: plain.achievement_id || (plain._id ? plain._id.toString() : null) }
}

function toDeptActivityResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptActivityId: plain.dept_activity_id || (plain._id ? plain._id.toString() : null) }
}

function toNewsletterResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, newsletterId: plain.newsletter_id || (plain._id ? plain._id.toString() : null) }
}

function toGalleryPhotoResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, galleryPhotoId: plain.gallery_photo_id || (plain._id ? plain._id.toString() : null) }
}

function toForumSectionResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, forumSectionId: plain.forum_section_id || (plain._id ? plain._id.toString() : null) }
}

function toForumEventResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, forumEventId: plain.forum_event_id || (plain._id ? plain._id.toString() : null) }
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

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { title:  { $regex: args.search.trim(), $options: 'i' } },
      { volume: { $regex: args.search.trim(), $options: 'i' } },
      { issue:  { $regex: args.search.trim(), $options: 'i' } },
    ]
  }

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

function buildEventQuery(args) {
  const query = {}
  if (args.deptId)         query.deptId         = args.deptId
  if (args.level)          query.level          = args.level
  if (args.department)     query.department     = args.department
  if (args.status)         query.status         = args.status
  if (args.approvalStatus) query.approvalStatus = args.approvalStatus
  if (args.pinned != null) query.pinned         = args.pinned
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
      await requirePermission(ctx, 'dept-activities:placement-overview:list')
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
      await requirePermission(ctx, 'dept-activities:student-placement:list')
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
      await requirePermission(ctx, 'dept-activities:achievement:list')
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
      await requirePermission(ctx, 'dept-activities:activity:list')
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
      await requirePermission(ctx, 'dept-activities:newsletter:list')
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
      await requirePermission(ctx, 'dept-activities:gallery:list')
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
      await requirePermission(ctx, 'dept-activities:forum:read')
      return await getForumSection(ctx, event.arguments)

    case 'saveForumSection':
      await requirePermission(ctx, 'dept-activities:forum:write')
      return await saveForumSection(ctx, event.arguments)

    // ── ForumEvent ────────────────────────────────
    case 'listForumEvents':
      await requirePermission(ctx, 'dept-activities:forum:list')
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
      await requirePermission(ctx, 'dept-activities:dept-activity-log:list')
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

    // ── Event ─────────────────────────────────────
    case 'listEvents':
      return await listEvents(ctx, event.arguments)

    case 'getEvent':
      return await getEvent(ctx, event.arguments)

    case 'createEvent':
      await requirePermission(ctx, 'dept-activities:event:create')
      return await createEvent(ctx, event.arguments)

    case 'updateEvent':
      await requirePermission(ctx, 'dept-activities:event:update')
      return await updateEvent(ctx, event.arguments)

    case 'deleteEvent':
      await requirePermission(ctx, 'dept-activities:event:delete')
      return await deleteEvent(ctx, event.arguments)

    case 'approveEvent':
      await requirePermission(ctx, 'dept-activities:event:update')
      return await approveEvent(ctx, event.arguments)

    case 'rejectEvent':
      await requirePermission(ctx, 'dept-activities:event:update')
      return await rejectEvent(ctx, event.arguments)

    case 'cancelEvent':
      await requirePermission(ctx, 'dept-activities:event:update')
      return await cancelEvent(ctx, event.arguments)

    case 'togglePinEvent':
      await requirePermission(ctx, 'dept-activities:event:update')
      return await togglePinEvent(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)


/* ─────────────────────────────
   PlacementOverview
─────────────────────────────*/

async function listPlacementOverviews(ctx, args) {
  const validated  = validate(listPlacementOverviewsSchema, args || {})
  const query      = buildPlacementOverviewQuery(validated)
  const sort       = buildSort(validated.sortBy, validated.sortOrder)
  const pagination = normalizePagination(validated)

  const result = await placementOverviewRepo.findMany(ctx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toPlacementOverviewResponse),
    nextToken: result.nextCursor,
  }
}

async function createPlacementOverview(ctx, args) {
  const input = validate(createPlacementOverviewSchema, args || {})
  const { deptId, title, academicYear, companiesVisited, studentsInCampus, studentsOffCampus, highestPackage } = input.input

  const placement_overview_id = generateId()

  const created = await placementOverviewRepo.create(ctx, {
    placement_overview_id,
    deptId,
    title,
    academicYear:      academicYear      ?? '',
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
  if (fields.title             !== undefined) updates.title             = fields.title
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
  const validated  = validate(listStudentPlacementsSchema, args || {})
  const query      = buildStudentPlacementQuery(validated)
  const sort       = buildSort(validated.sortBy, validated.sortOrder)
  const pagination = normalizePagination(validated)

  const result = await studentPlacementRepo.findMany(ctx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toStudentPlacementResponse),
    nextToken: result.nextCursor,
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

  return toStudentPlacementResponse(created)
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

  return toStudentPlacementResponse(updated)
}

async function deleteStudentPlacement(ctx, args) {
  const { studentPlacementId } = validate(deleteStudentPlacementSchema, args || {})

  const existing = await studentPlacementRepo.findById(ctx, studentPlacementId)
  if (!existing) throw new NotFoundError('Student placement not found')

  await studentPlacementRepo.deleteById(ctx, studentPlacementId)

  return toStudentPlacementResponse(existing)
}


/* ─────────────────────────────
   Achievement
─────────────────────────────*/

async function listAchievements(ctx, args) {
  const validated  = validate(listAchievementsSchema, args || {})
  const query      = buildAchievementQuery(validated)
  const sort       = buildSort(validated.sortBy, validated.sortOrder)
  const pagination = normalizePagination(validated)

  const result = await achievementRepo.findMany(ctx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toAchievementResponse),
    nextToken: result.nextCursor,
  }
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
  const validated  = validate(listDeptActivitiesSchema, args || {})
  const query      = buildDeptActivityQuery(validated)
  const sort       = buildSort(validated.sortBy, validated.sortOrder)
  const pagination = normalizePagination(validated)

  const result = await deptActivityRepo.findMany(ctx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toDeptActivityResponse),
    nextToken: result.nextCursor,
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
  const validated  = validate(listNewslettersSchema, args || {})
  const query      = buildNewsletterQuery(validated)
  const sort       = buildSort(validated.sortBy, validated.sortOrder)
  const pagination = normalizePagination(validated)

  const result = await newsletterRepo.findMany(ctx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toNewsletterResponse),
    nextToken: result.nextCursor,
  }
}

async function createNewsletter(ctx, args) {
  const input = validate(createNewsletterSchema, args || {})
  const { deptId, title, volume, issue, publishedDate, fileUrl } = input.input

  const newsletter_id = generateId()

  const created = await newsletterRepo.create(ctx, {
    newsletter_id,
    deptId,
    title,
    volume:        volume        ?? '',
    issue:         issue         ?? '',
    publishedDate: publishedDate ?? '',
    fileUrl:       fileUrl       ?? '',
    created_by:    ctx.user_id,
  })

  return toNewsletterResponse(created)
}

async function updateNewsletter(ctx, args) {
  const input = validate(updateNewsletterSchema, args || {})
  const { newsletterId, ...fields } = input.input

  const existing = await newsletterRepo.findById(ctx, newsletterId)
  if (!existing) throw new NotFoundError('Newsletter not found')

  const updates = {}
  if (fields.title         !== undefined) updates.title         = fields.title
  if (fields.volume        !== undefined) updates.volume        = fields.volume
  if (fields.issue         !== undefined) updates.issue         = fields.issue
  if (fields.publishedDate !== undefined) updates.publishedDate = fields.publishedDate
  if (fields.fileUrl       !== undefined) updates.fileUrl       = fields.fileUrl

  const updated = await newsletterRepo.updateById(ctx, newsletterId, updates)

  return toNewsletterResponse(updated)
}

async function deleteNewsletter(ctx, args) {
  const { newsletterId } = validate(deleteNewsletterSchema, args || {})

  const existing = await newsletterRepo.findById(ctx, newsletterId)
  if (!existing) throw new NotFoundError('Newsletter not found')

  await newsletterRepo.deleteById(ctx, newsletterId)

  return toNewsletterResponse(existing)
}


/* ─────────────────────────────
   GalleryPhoto
─────────────────────────────*/

async function listGalleryPhotos(ctx, args) {
  const validated  = validate(listGalleryPhotosSchema, args || {})
  const query      = buildGalleryPhotoQuery(validated)
  const sort       = buildSort(validated.sortBy, validated.sortOrder)
  const pagination = normalizePagination(validated)

  const result = await galleryPhotoRepo.findMany(ctx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toGalleryPhotoResponse),
    nextToken: result.nextCursor,
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

  return toGalleryPhotoResponse(created)
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

  return toGalleryPhotoResponse(updated)
}

async function deleteGalleryPhoto(ctx, args) {
  const { galleryPhotoId } = validate(deleteGalleryPhotoSchema, args || {})

  const existing = await galleryPhotoRepo.findById(ctx, galleryPhotoId)
  if (!existing) throw new NotFoundError('Gallery photo not found')

  await galleryPhotoRepo.deleteById(ctx, galleryPhotoId)

  return toGalleryPhotoResponse(existing)
}


/* ─────────────────────────────
   ForumSection (upsert — 1:1 per dept)
─────────────────────────────*/

async function getForumSection(ctx, args) {
  const { deptId } = args

  const doc = await ForumSection.findOne({ tenant_id: ctx.tenant_id, deptId }).lean()

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
  const validated  = validate(listForumEventsSchema, args || {})
  const query      = buildForumEventQuery(validated)
  const sort       = buildSort(validated.sortBy, validated.sortOrder)
  const pagination = normalizePagination(validated)

  const result = await forumEventRepo.findMany(ctx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toForumEventResponse),
    nextToken: result.nextCursor,
  }
}

async function createForumEvent(ctx, args) {
  const input = validate(createForumEventSchema, args || {})
  const { deptId, title, description } = input.input

  const forum_event_id = generateId()

  const created = await forumEventRepo.create(ctx, {
    forum_event_id,
    deptId,
    title,
    description: description ?? '',
    created_by:  ctx.user_id,
  })

  return toForumEventResponse(created)
}

async function updateForumEvent(ctx, args) {
  const input = validate(updateForumEventSchema, args || {})
  const { forumEventId, ...fields } = input.input

  const existing = await forumEventRepo.findById(ctx, forumEventId)
  if (!existing) throw new NotFoundError('Forum event not found')

  const updates = {}
  if (fields.title       !== undefined) updates.title       = fields.title
  if (fields.description !== undefined) updates.description = fields.description

  const updated = await forumEventRepo.updateById(ctx, forumEventId, updates)

  return toForumEventResponse(updated)
}

async function deleteForumEvent(ctx, args) {
  const { forumEventId } = validate(deleteForumEventSchema, args || {})

  const existing = await forumEventRepo.findById(ctx, forumEventId)
  if (!existing) throw new NotFoundError('Forum event not found')

  await forumEventRepo.deleteById(ctx, forumEventId)

  return toForumEventResponse(existing)
}


/* ─────────────────────────────
   DepartmentActivity (log)
─────────────────────────────*/

async function listDepartmentActivities(ctx, args) {
  const validated  = validate(listDepartmentActivitiesSchema, args || {})
  const query      = buildDepartmentActivityQuery(validated)
  const sort       = buildSort(validated.sortBy || 'createdAt', validated.sortOrder || 'desc')
  const pagination = normalizePagination(validated)

  const result = await departmentActivityRepo.findMany(ctx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toDepartmentActivityResponse),
    nextToken: result.nextCursor,
  }
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


/* ─────────────────────────────
   Event
─────────────────────────────*/

async function listEvents(ctx, args) {
  const validated = validate(listEventsSchema, args || {})
  const { tenantId, ...rest } = validated
  const resolvedCtx = tenantId ? { ...ctx, tenant_id: tenantId } : ctx

  const query      = buildEventQuery(rest)
  const pagination = normalizePagination(validated)
  const sort       = { createdAt: -1 }

  const result = await eventRepo.findMany(resolvedCtx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toEventResponse),
    nextToken: result.nextCursor,
  }
}

async function getEvent(ctx, args) {
  const { eventId } = validate(getEventSchema, args || {})

  // Direct query (no tenant filter) — eventId is a globally unique UUID
  const doc = await Event.findOne({ event_id: eventId }).lean()
  if (!doc) throw new NotFoundError('Event not found')

  return toEventResponse(doc)
}

async function createEvent(ctx, args) {
  const input = validate(createEventSchema, args || {})
  const { deptId, title, date, time, venue, description, images, pinned, level, department } = input.input

  const event_id = generateId()

  const created = await eventRepo.create(ctx, {
    event_id,
    deptId:        deptId      ?? null,
    title,
    date:          date        ?? null,
    time:          time        ?? null,
    venue:         venue       ?? null,
    description:   description ?? null,
    images:        images      ?? [],
    pinned:        pinned      ?? false,
    level,
    department:    department  ?? null,
    status:        'upcoming',
    approvalStatus:'pending',
    created_by:    ctx.user_id,
  })

  return toEventResponse(created)
}

async function updateEvent(ctx, args) {
  const input = validate(updateEventSchema, args || {})
  const { eventId, ...fields } = input.input

  const existing = await eventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Event not found')

  const updates = {}
  if (fields.title          !== undefined) updates.title          = fields.title
  if (fields.date           !== undefined) updates.date           = fields.date
  if (fields.time           !== undefined) updates.time           = fields.time
  if (fields.venue          !== undefined) updates.venue          = fields.venue
  if (fields.description    !== undefined) updates.description    = fields.description
  if (fields.images         !== undefined) updates.images         = fields.images
  if (fields.pinned         !== undefined) updates.pinned         = fields.pinned
  if (fields.level          !== undefined) updates.level          = fields.level
  if (fields.department     !== undefined) updates.department     = fields.department
  if (fields.status         !== undefined) updates.status         = fields.status
  if (fields.approvalStatus !== undefined) updates.approvalStatus = fields.approvalStatus

  const updated = await eventRepo.updateById(ctx, eventId, updates)

  return toEventResponse(updated)
}

async function deleteEvent(ctx, args) {
  const { eventId } = validate(deleteEventSchema, args || {})

  const existing = await eventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Event not found')

  await eventRepo.deleteById(ctx, eventId)

  return toEventResponse(existing)
}

async function approveEvent(ctx, args) {
  const { eventId } = validate(approveEventSchema, args || {})

  const existing = await eventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Event not found')

  const updated = await eventRepo.updateById(ctx, eventId, { approvalStatus: 'approved' })
  return toEventResponse(updated)
}

async function rejectEvent(ctx, args) {
  const { eventId } = validate(rejectEventSchema, args || {})

  const existing = await eventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Event not found')

  const updated = await eventRepo.updateById(ctx, eventId, { approvalStatus: 'rejected' })
  return toEventResponse(updated)
}

async function cancelEvent(ctx, args) {
  const { eventId } = validate(cancelEventSchema, args || {})

  const existing = await eventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Event not found')

  const updated = await eventRepo.updateById(ctx, eventId, { status: 'cancelled' })
  return toEventResponse(updated)
}

async function togglePinEvent(ctx, args) {
  const { eventId } = validate(togglePinEventSchema, args || {})

  const existing = await eventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Event not found')

  const plain    = existing.toObject ? existing.toObject() : existing
  const updated  = await eventRepo.updateById(ctx, eventId, { pinned: !plain.pinned })
  return toEventResponse(updated)
}
