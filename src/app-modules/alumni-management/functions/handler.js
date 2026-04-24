const { resolveTenant }       = require('/opt/nodejs/middleware/tenant-resolver')
const { requirePermission }   = require('/opt/nodejs/middleware/auth-guard')
const { validate }            = require('/opt/nodejs/middleware/input-validator')
const { withConnection }      = require('/opt/nodejs/middleware/with-connection')
const { log }                 = require('/opt/nodejs/middleware/request-logger')
const { generateId }          = require('/opt/nodejs/utils/id-generator')
const { MongoRepository }     = require('/opt/nodejs/db/mongo-repository')
const { NotFoundError }       = require('/opt/nodejs/middleware/error-handler')
const { normalizePagination } = require('/opt/nodejs/utils/pagination')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')

const {
  getAlumniSchema,
  listAlumniSchema,
  createAlumniSchema,
  updateAlumniSchema,
  deleteAlumniSchema,
  getAlumniEventSchema,
  listAlumniEventsSchema,
  createAlumniEventSchema,
  updateAlumniEventSchema,
  deleteAlumniEventSchema,
  listTimelineEntriesSchema,
  createTimelineEntrySchema,
  updateTimelineEntrySchema,
  deleteTimelineEntrySchema,
  upsertVisionMissionSchema,
  listCommitteeMembersSchema,
  createCommitteeMemberSchema,
  updateCommitteeMemberSchema,
  deleteCommitteeMemberSchema,
  upsertDeanMessageSchema,
  listCoordinatorsSchema,
  createCoordinatorSchema,
  updateCoordinatorSchema,
  deleteCoordinatorSchema,
  listDistinguishedAlumniSchema,
  createDistinguishedAlumnusSchema,
  updateDistinguishedAlumnusSchema,
  deleteDistinguishedAlumnusSchema,
  upsertRegistrationSettingsSchema,
  listAlumniContactsSchema,
  createAlumniContactSchema,
  updateAlumniContactSchema,
  deleteAlumniContactSchema,
} = require('../schemas/validation')

const {
  Alumni,
  AlumniEvent,
  TimelineEntry,
  VisionMission,
  CommitteeMember,
  DeanMessage,
  Coordinator,
  DistinguishedAlumnus,
  RegistrationSettings,
  AlumniContact,
} = require('../schemas/alumni.model')

/* ─── Repositories ───────────────────────────────────────────────────────── */

const alumniRepo              = new MongoRepository({ model: Alumni,              primaryKey: 'alumni_id' })
const alumniEventRepo         = new MongoRepository({ model: AlumniEvent,         primaryKey: 'event_id' })
const timelineEntryRepo       = new MongoRepository({ model: TimelineEntry,       primaryKey: 'entry_id' })
const visionMissionRepo       = new MongoRepository({ model: VisionMission,       primaryKey: 'document_id' })
const committeeMemberRepo     = new MongoRepository({ model: CommitteeMember,     primaryKey: 'member_id' })
const deanMessageRepo         = new MongoRepository({ model: DeanMessage,         primaryKey: 'message_id' })
const coordinatorRepo         = new MongoRepository({ model: Coordinator,         primaryKey: 'coordinator_id' })
const distinguishedAlumnusRepo = new MongoRepository({ model: DistinguishedAlumnus, primaryKey: 'distinguished_alumnus_id' })
const registrationSettingsRepo = new MongoRepository({ model: RegistrationSettings, primaryKey: 'settings_id' })
const alumniContactRepo       = new MongoRepository({ model: AlumniContact,       primaryKey: 'contact_id' })

/* ─── S3 / Presigned URLs ──────────────────────────────────────────────────── */

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

/* ─── Response Normalizers ───────────────────────────────────────────────── */

function toDoc(doc) {
  return doc && doc.toObject ? doc.toObject() : { ...doc }
}

async function toAlumniResponse(doc) {
  const d = toDoc(doc)
  return { ...d, alumniId: d.alumni_id || (d._id ? d._id.toString() : null), image: await getPresignedUrl(d.image) }
}

async function toAlumniEventResponse(doc) {
  const d = toDoc(doc)
  return { ...d, eventId: d.event_id || (d._id ? d._id.toString() : null), image: await getPresignedUrl(d.image) }
}

function toTimelineEntryResponse(doc) {
  const d = toDoc(doc)
  return { ...d, entryId: d.entry_id || (d._id ? d._id.toString() : null) }
}

function toVisionMissionResponse(doc) {
  if (!doc) return null
  const d = toDoc(doc)
  return { ...d, documentId: d.document_id || (d._id ? d._id.toString() : null) }
}

async function toCommitteeMemberResponse(doc) {
  const d = toDoc(doc)
  return { ...d, memberId: d.member_id || (d._id ? d._id.toString() : null), profileImage: await getPresignedUrl(d.profileImage) }
}

async function toDeanMessageResponse(doc) {
  if (!doc) return null
  const d = toDoc(doc)
  return { ...d, messageId: d.message_id || (d._id ? d._id.toString() : null), image: await getPresignedUrl(d.image) }
}

function toCoordinatorResponse(doc) {
  const d = toDoc(doc)
  return { ...d, coordinatorId: d.coordinator_id || (d._id ? d._id.toString() : null) }
}

async function toDistinguishedAlumnusResponse(doc) {
  const d = toDoc(doc)
  return { ...d, distinguishedAlumnusId: d.distinguished_alumnus_id || (d._id ? d._id.toString() : null), profileImage: await getPresignedUrl(d.profileImage) }
}

function toRegistrationSettingsResponse(doc) {
  if (!doc) return null
  const d = toDoc(doc)
  return { ...d, settingsId: d.settings_id || (d._id ? d._id.toString() : null) }
}

function toAlumniContactResponse(doc) {
  const d = toDoc(doc)
  return { ...d, contactId: d.contact_id || (d._id ? d._id.toString() : null) }
}

/* ─── Router ─────────────────────────────────────────────────────────────── */

async function handleEvent(event) {
  const ctx = resolveTenant(event)
  log(ctx, 'alumni-management', event.field)

  switch (event.field) {

    /* ── Alumni ── */
    case 'getAlumni':
      await requirePermission(ctx, 'alumni:alumni:read')
      return getAlumni(ctx, event.arguments)

    case 'listAlumni':
      await requirePermission(ctx, 'alumni:alumni:list')
      return listAlumni(ctx, event.arguments)

    case 'createAlumni':
      await requirePermission(ctx, 'alumni:alumni:create')
      return createAlumni(ctx, event.arguments)

    case 'updateAlumni':
      await requirePermission(ctx, 'alumni:alumni:update')
      return updateAlumni(ctx, event.arguments)

    case 'deleteAlumni':
      await requirePermission(ctx, 'alumni:alumni:delete')
      return deleteAlumni(ctx, event.arguments)

    /* ── AlumniEvent ── */
    case 'getAlumniEvent':
      await requirePermission(ctx, 'alumni:event:read')
      return getAlumniEvent(ctx, event.arguments)

    case 'listAlumniEvents':
      await requirePermission(ctx, 'alumni:event:list')
      return listAlumniEvents(ctx, event.arguments)

    case 'createAlumniEvent':
      await requirePermission(ctx, 'alumni:event:create')
      return createAlumniEvent(ctx, event.arguments)

    case 'updateAlumniEvent':
      await requirePermission(ctx, 'alumni:event:update')
      return updateAlumniEvent(ctx, event.arguments)

    case 'deleteAlumniEvent':
      await requirePermission(ctx, 'alumni:event:delete')
      return deleteAlumniEvent(ctx, event.arguments)

    /* ── TimelineEntry ── */
    case 'listAlumniTimelineEntries':
      await requirePermission(ctx, 'alumni:timeline:list')
      return listTimelineEntries(ctx, event.arguments)

    case 'createAlumniTimelineEntry':
      await requirePermission(ctx, 'alumni:timeline:create')
      return createTimelineEntry(ctx, event.arguments)

    case 'updateAlumniTimelineEntry':
      await requirePermission(ctx, 'alumni:timeline:update')
      return updateTimelineEntry(ctx, event.arguments)

    case 'deleteAlumniTimelineEntry':
      await requirePermission(ctx, 'alumni:timeline:delete')
      return deleteTimelineEntry(ctx, event.arguments)

    /* ── VisionMission ── */
    case 'getAlumniVisionMission':
      await requirePermission(ctx, 'alumni:vision:read')
      return getVisionMission(ctx)

    case 'upsertAlumniVisionMission':
      await requirePermission(ctx, 'alumni:vision:update')
      return upsertVisionMission(ctx, event.arguments)

    /* ── CommitteeMember ── */
    case 'listAlumniCommitteeMembers':
      await requirePermission(ctx, 'alumni:committee:list')
      return listCommitteeMembers(ctx, event.arguments)

    case 'createAlumniCommitteeMember':
      await requirePermission(ctx, 'alumni:committee:create')
      return createCommitteeMember(ctx, event.arguments)

    case 'updateAlumniCommitteeMember':
      await requirePermission(ctx, 'alumni:committee:update')
      return updateCommitteeMember(ctx, event.arguments)

    case 'deleteAlumniCommitteeMember':
      await requirePermission(ctx, 'alumni:committee:delete')
      return deleteCommitteeMember(ctx, event.arguments)

    /* ── DeanMessage ── */
    case 'getAlumniDeanMessage':
      await requirePermission(ctx, 'alumni:dean:read')
      return getDeanMessage(ctx)

    case 'upsertAlumniDeanMessage':
      await requirePermission(ctx, 'alumni:dean:update')
      return upsertDeanMessage(ctx, event.arguments)

    /* ── Coordinator ── */
    case 'listAlumniCoordinators':
      await requirePermission(ctx, 'alumni:coordinator:list')
      return listCoordinators(ctx, event.arguments)

    case 'createAlumniCoordinator':
      await requirePermission(ctx, 'alumni:coordinator:create')
      return createCoordinator(ctx, event.arguments)

    case 'updateAlumniCoordinator':
      await requirePermission(ctx, 'alumni:coordinator:update')
      return updateCoordinator(ctx, event.arguments)

    case 'deleteAlumniCoordinator':
      await requirePermission(ctx, 'alumni:coordinator:delete')
      return deleteCoordinator(ctx, event.arguments)

    /* ── DistinguishedAlumnus ── */
    case 'listDistinguishedAlumni':
      await requirePermission(ctx, 'alumni:distinguished:list')
      return listDistinguishedAlumni(ctx, event.arguments)

    case 'createDistinguishedAlumnus':
      await requirePermission(ctx, 'alumni:distinguished:create')
      return createDistinguishedAlumnus(ctx, event.arguments)

    case 'updateDistinguishedAlumnus':
      await requirePermission(ctx, 'alumni:distinguished:update')
      return updateDistinguishedAlumnus(ctx, event.arguments)

    case 'deleteDistinguishedAlumnus':
      await requirePermission(ctx, 'alumni:distinguished:delete')
      return deleteDistinguishedAlumnus(ctx, event.arguments)

    /* ── RegistrationSettings ── */
    case 'getAlumniRegistrationSettings':
      await requirePermission(ctx, 'alumni:registration:read')
      return getRegistrationSettings(ctx)

    case 'upsertAlumniRegistrationSettings':
      await requirePermission(ctx, 'alumni:registration:update')
      return upsertRegistrationSettings(ctx, event.arguments)

    /* ── AlumniContact ── */
    case 'listAlumniContacts':
      await requirePermission(ctx, 'alumni:contact:list')
      return listAlumniContacts(ctx, event.arguments)

    case 'createAlumniContact':
      await requirePermission(ctx, 'alumni:contact:create')
      return createAlumniContact(ctx, event.arguments)

    case 'updateAlumniContact':
      await requirePermission(ctx, 'alumni:contact:update')
      return updateAlumniContact(ctx, event.arguments)

    case 'deleteAlumniContact':
      await requirePermission(ctx, 'alumni:contact:delete')
      return deleteAlumniContact(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)

/* ═══════════════════════════════════════════════════════════════════════════
   ALUMNI
═══════════════════════════════════════════════════════════════════════════ */

async function getAlumni(ctx, args) {
  const { alumniId } = validate(getAlumniSchema, args || {})
  const doc = await alumniRepo.findById(ctx, alumniId)
  if (!doc) throw new NotFoundError('Alumni not found')
  return await toAlumniResponse(doc)
}

async function listAlumni(ctx, args) {
  const v = validate(listAlumniSchema, args || {})
  const query = {}
  if (v.department) query.department = v.department
  if (v.batch)      query.batch      = v.batch
  if (v.search)     query.$or = [
    { name:        { $regex: v.search, $options: 'i' } },
    { company:     { $regex: v.search, $options: 'i' } },
    { designation: { $regex: v.search, $options: 'i' } },
    { batch:       { $regex: v.search, $options: 'i' } },
  ]
  const result = await alumniRepo.findMany(ctx, query, normalizePagination(v))
  return { items: await Promise.all(result.items.map(toAlumniResponse)), nextToken: result.nextCursor, pageInfo: result.pageInfo }
}

async function createAlumni(ctx, args) {
  const { input } = validate(createAlumniSchema, args || {})
  const alumni_id = generateId()
  const doc = await alumniRepo.create(ctx, {
    alumni_id,
    name:        input.name,
    batch:       input.batch,
    department:  input.department  ?? null,
    company:     input.company     ?? null,
    designation: input.designation ?? null,
    location:    input.location    ?? null,
    email:       input.email       ?? null,
    linkedin:    input.linkedin    ?? null,
    image:       input.image       ?? null,
    created_by:  ctx.user_id,
  })
  return await toAlumniResponse(doc)
}

async function updateAlumni(ctx, args) {
  const { input } = validate(updateAlumniSchema, args || {})
  const { alumniId, ...fields } = input
  const existing = await alumniRepo.findById(ctx, alumniId)
  if (!existing) throw new NotFoundError('Alumni not found')
  const updates = {}
  const keys = ['name','batch','department','company','designation','location','email','linkedin','image']
  for (const k of keys) if (fields[k] !== undefined) updates[k] = fields[k]
  const doc = await alumniRepo.updateById(ctx, alumniId, updates)
  return await toAlumniResponse(doc)
}

async function deleteAlumni(ctx, args) {
  const { alumniId } = validate(deleteAlumniSchema, args || {})
  const existing = await alumniRepo.findById(ctx, alumniId)
  if (!existing) throw new NotFoundError('Alumni not found')
  await alumniRepo.deleteById(ctx, alumniId)
  return await toAlumniResponse(existing)
}

/* ═══════════════════════════════════════════════════════════════════════════
   ALUMNI EVENT
═══════════════════════════════════════════════════════════════════════════ */

async function getAlumniEvent(ctx, args) {
  const { eventId } = validate(getAlumniEventSchema, args || {})
  const doc = await alumniEventRepo.findById(ctx, eventId)
  if (!doc) throw new NotFoundError('Alumni event not found')
  return await toAlumniEventResponse(doc)
}

async function listAlumniEvents(ctx, args) {
  const v = validate(listAlumniEventsSchema, args || {})
  const query = {}
  if (v.department) query.department = v.department
  if (v.status)     query.status     = v.status
  const result = await alumniEventRepo.findMany(ctx, query, normalizePagination(v))
  return { items: await Promise.all(result.items.map(toAlumniEventResponse)), nextToken: result.nextCursor, pageInfo: result.pageInfo }
}

async function createAlumniEvent(ctx, args) {
  const { input } = validate(createAlumniEventSchema, args || {})
  const event_id = generateId()
  const doc = await alumniEventRepo.create(ctx, {
    event_id,
    title:       input.title,
    date:        input.date        ?? null,
    time:        input.time        ?? null,
    department:  input.department  ?? null,
    location:    input.location    ?? null,
    description: input.description ?? null,
    image:       input.image       ?? null,
    status:      input.status      ?? 'upcoming',
    created_by:  ctx.user_id,
  })
  return await toAlumniEventResponse(doc)
}

async function updateAlumniEvent(ctx, args) {
  const { input } = validate(updateAlumniEventSchema, args || {})
  const { eventId, ...fields } = input
  const existing = await alumniEventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Alumni event not found')
  const updates = {}
  const keys = ['title','date','time','department','location','description','image','status']
  for (const k of keys) if (fields[k] !== undefined) updates[k] = fields[k]
  const doc = await alumniEventRepo.updateById(ctx, eventId, updates)
  return await toAlumniEventResponse(doc)
}

async function deleteAlumniEvent(ctx, args) {
  const { eventId } = validate(deleteAlumniEventSchema, args || {})
  const existing = await alumniEventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Alumni event not found')
  await alumniEventRepo.deleteById(ctx, eventId)
  return await toAlumniEventResponse(existing)
}

/* ═══════════════════════════════════════════════════════════════════════════
   TIMELINE ENTRY
═══════════════════════════════════════════════════════════════════════════ */

async function listTimelineEntries(ctx, args) {
  const v = validate(listTimelineEntriesSchema, args || {})
  const result = await timelineEntryRepo.findMany(ctx, {}, { ...normalizePagination(v), sort: { order: 1, year: 1 } })
  return { items: result.items.map(toTimelineEntryResponse), nextToken: result.nextCursor, pageInfo: result.pageInfo }
}

async function createTimelineEntry(ctx, args) {
  const { input } = validate(createTimelineEntrySchema, args || {})
  const entry_id = generateId()
  const doc = await timelineEntryRepo.create(ctx, {
    entry_id,
    year:        input.year,
    title:       input.title,
    description: input.description ?? null,
    order:       input.order       ?? 0,
    isActive:    input.isActive    ?? true,
  })
  return toTimelineEntryResponse(doc)
}

async function updateTimelineEntry(ctx, args) {
  const { input } = validate(updateTimelineEntrySchema, args || {})
  const { entryId, ...fields } = input
  const existing = await timelineEntryRepo.findById(ctx, entryId)
  if (!existing) throw new NotFoundError('Timeline entry not found')
  const updates = {}
  const keys = ['year','title','description','order','isActive']
  for (const k of keys) if (fields[k] !== undefined) updates[k] = fields[k]
  const doc = await timelineEntryRepo.updateById(ctx, entryId, updates)
  return toTimelineEntryResponse(doc)
}

async function deleteTimelineEntry(ctx, args) {
  const { entryId } = validate(deleteTimelineEntrySchema, args || {})
  const existing = await timelineEntryRepo.findById(ctx, entryId)
  if (!existing) throw new NotFoundError('Timeline entry not found')
  await timelineEntryRepo.deleteById(ctx, entryId)
  return toTimelineEntryResponse(existing)
}

/* ═══════════════════════════════════════════════════════════════════════════
   VISION / MISSION (singleton)
═══════════════════════════════════════════════════════════════════════════ */

async function getVisionMission(ctx) {
  const doc = await visionMissionRepo.findOneGlobal({ tenant_id: ctx.tenant_id })
  return toVisionMissionResponse(doc)
}

async function upsertVisionMission(ctx, args) {
  const { input } = validate(upsertVisionMissionSchema, args || {})
  const existing = await visionMissionRepo.findOneGlobal({ tenant_id: ctx.tenant_id })
  if (existing) {
    const updates = {}
    if (input.vision     !== undefined) updates.vision     = input.vision
    if (input.mission    !== undefined) updates.mission    = input.mission
    if (input.objectives !== undefined) updates.objectives = input.objectives
    const doc = await visionMissionRepo.updateById(ctx, existing.document_id, updates)
    return toVisionMissionResponse(doc)
  }
  const document_id = generateId()
  const doc = await visionMissionRepo.create(ctx, {
    document_id,
    vision:     input.vision     ?? null,
    mission:    input.mission    ?? null,
    objectives: input.objectives ?? null,
  })
  return toVisionMissionResponse(doc)
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMMITTEE MEMBER
═══════════════════════════════════════════════════════════════════════════ */

async function listCommitteeMembers(ctx, args) {
  const v = validate(listCommitteeMembersSchema, args || {})
  const query = {}
  if (v.roleType) query.roleType = v.roleType
  const result = await committeeMemberRepo.findMany(ctx, query, { ...normalizePagination(v), sort: { order: 1 } })
  return { items: await Promise.all(result.items.map(toCommitteeMemberResponse)), nextToken: result.nextCursor, pageInfo: result.pageInfo }
}

async function createCommitteeMember(ctx, args) {
  const { input } = validate(createCommitteeMemberSchema, args || {})
  const member_id = generateId()
  const doc = await committeeMemberRepo.create(ctx, {
    member_id,
    name:         input.name,
    roleType:     input.roleType     ?? null,
    designation:  input.designation  ?? null,
    department:   input.department   ?? null,
    organization: input.organization ?? null,
    profileImage: input.profileImage ?? null,
    order:        input.order        ?? 0,
  })
  return await toCommitteeMemberResponse(doc)
}

async function updateCommitteeMember(ctx, args) {
  const { input } = validate(updateCommitteeMemberSchema, args || {})
  const { memberId, ...fields } = input
  const existing = await committeeMemberRepo.findById(ctx, memberId)
  if (!existing) throw new NotFoundError('Committee member not found')
  const updates = {}
  const keys = ['name','roleType','designation','department','organization','profileImage','order']
  for (const k of keys) if (fields[k] !== undefined) updates[k] = fields[k]
  const doc = await committeeMemberRepo.updateById(ctx, memberId, updates)
  return await toCommitteeMemberResponse(doc)
}

async function deleteCommitteeMember(ctx, args) {
  const { memberId } = validate(deleteCommitteeMemberSchema, args || {})
  const existing = await committeeMemberRepo.findById(ctx, memberId)
  if (!existing) throw new NotFoundError('Committee member not found')
  await committeeMemberRepo.deleteById(ctx, memberId)
  return await toCommitteeMemberResponse(existing)
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEAN MESSAGE (singleton)
═══════════════════════════════════════════════════════════════════════════ */

async function getDeanMessage(ctx) {
  const doc = await deanMessageRepo.findOneGlobal({ tenant_id: ctx.tenant_id })
  return await toDeanMessageResponse(doc)
}

async function upsertDeanMessage(ctx, args) {
  const { input } = validate(upsertDeanMessageSchema, args || {})
  const existing = await deanMessageRepo.findOneGlobal({ tenant_id: ctx.tenant_id })
  if (existing) {
    const updates = {}
    const keys = ['name','role','department','designation','message','image','isActive']
    for (const k of keys) if (input[k] !== undefined) updates[k] = input[k]
    const doc = await deanMessageRepo.updateById(ctx, existing.message_id, updates)
    return await toDeanMessageResponse(doc)
  }
  const message_id = generateId()
  const doc = await deanMessageRepo.create(ctx, {
    message_id,
    name:        input.name        ?? null,
    role:        input.role        ?? null,
    department:  input.department  ?? null,
    designation: input.designation ?? null,
    message:     input.message     ?? null,
    image:       input.image       ?? null,
    isActive:    input.isActive    ?? true,
  })
  return await toDeanMessageResponse(doc)
}

/* ═══════════════════════════════════════════════════════════════════════════
   COORDINATOR
═══════════════════════════════════════════════════════════════════════════ */

async function listCoordinators(ctx, args) {
  const v = validate(listCoordinatorsSchema, args || {})
  const query = {}
  if (v.roleType)   query.roleType   = v.roleType
  if (v.department) query.department = v.department
  const result = await coordinatorRepo.findMany(ctx, query, normalizePagination(v))
  return { items: result.items.map(toCoordinatorResponse), nextToken: result.nextCursor, pageInfo: result.pageInfo }
}

async function createCoordinator(ctx, args) {
  const { input } = validate(createCoordinatorSchema, args || {})
  const coordinator_id = generateId()
  const doc = await coordinatorRepo.create(ctx, {
    coordinator_id,
    name:       input.name,
    roleType:   input.roleType   ?? null,
    department: input.department ?? null,
    email:      input.email      ?? null,
    isActive:   input.isActive   ?? true,
  })
  return toCoordinatorResponse(doc)
}

async function updateCoordinator(ctx, args) {
  const { input } = validate(updateCoordinatorSchema, args || {})
  const { coordinatorId, ...fields } = input
  const existing = await coordinatorRepo.findById(ctx, coordinatorId)
  if (!existing) throw new NotFoundError('Coordinator not found')
  const updates = {}
  const keys = ['name','roleType','department','email','isActive']
  for (const k of keys) if (fields[k] !== undefined) updates[k] = fields[k]
  const doc = await coordinatorRepo.updateById(ctx, coordinatorId, updates)
  return toCoordinatorResponse(doc)
}

async function deleteCoordinator(ctx, args) {
  const { coordinatorId } = validate(deleteCoordinatorSchema, args || {})
  const existing = await coordinatorRepo.findById(ctx, coordinatorId)
  if (!existing) throw new NotFoundError('Coordinator not found')
  await coordinatorRepo.deleteById(ctx, coordinatorId)
  return toCoordinatorResponse(existing)
}

/* ═══════════════════════════════════════════════════════════════════════════
   DISTINGUISHED ALUMNUS
═══════════════════════════════════════════════════════════════════════════ */

async function listDistinguishedAlumni(ctx, args) {
  const v = validate(listDistinguishedAlumniSchema, args || {})
  const query = {}
  if (v.department)             query.department = v.department
  if (v.isFeatured !== undefined && v.isFeatured !== null) query.isFeatured = v.isFeatured
  const result = await distinguishedAlumnusRepo.findMany(ctx, query, normalizePagination(v))
  return { items: await Promise.all(result.items.map(toDistinguishedAlumnusResponse)), nextToken: result.nextCursor, pageInfo: result.pageInfo }
}

async function createDistinguishedAlumnus(ctx, args) {
  const { input } = validate(createDistinguishedAlumnusSchema, args || {})
  const distinguished_alumnus_id = generateId()
  const doc = await distinguishedAlumnusRepo.create(ctx, {
    distinguished_alumnus_id,
    name:         input.name,
    department:   input.department   ?? null,
    batchYear:    input.batchYear    ?? null,
    currentRole:  input.currentRole  ?? null,
    company:      input.company      ?? null,
    linkedinUrl:  input.linkedinUrl  ?? null,
    profileImage: input.profileImage ?? null,
    isFeatured:   input.isFeatured   ?? false,
    isActive:     input.isActive     ?? true,
  })
  return await toDistinguishedAlumnusResponse(doc)
}

async function updateDistinguishedAlumnus(ctx, args) {
  const { input } = validate(updateDistinguishedAlumnusSchema, args || {})
  const { distinguishedAlumnusId, ...fields } = input
  const existing = await distinguishedAlumnusRepo.findById(ctx, distinguishedAlumnusId)
  if (!existing) throw new NotFoundError('Distinguished alumnus not found')
  const updates = {}
  const keys = ['name','department','batchYear','currentRole','company','linkedinUrl','profileImage','isFeatured','isActive']
  for (const k of keys) if (fields[k] !== undefined) updates[k] = fields[k]
  const doc = await distinguishedAlumnusRepo.updateById(ctx, distinguishedAlumnusId, updates)
  return await toDistinguishedAlumnusResponse(doc)
}

async function deleteDistinguishedAlumnus(ctx, args) {
  const { distinguishedAlumnusId } = validate(deleteDistinguishedAlumnusSchema, args || {})
  const existing = await distinguishedAlumnusRepo.findById(ctx, distinguishedAlumnusId)
  if (!existing) throw new NotFoundError('Distinguished alumnus not found')
  await distinguishedAlumnusRepo.deleteById(ctx, distinguishedAlumnusId)
  return await toDistinguishedAlumnusResponse(existing)
}

/* ═══════════════════════════════════════════════════════════════════════════
   REGISTRATION SETTINGS (singleton)
═══════════════════════════════════════════════════════════════════════════ */

async function getRegistrationSettings(ctx) {
  const doc = await registrationSettingsRepo.findOneGlobal({ tenant_id: ctx.tenant_id })
  return toRegistrationSettingsResponse(doc)
}

async function upsertRegistrationSettings(ctx, args) {
  const { input } = validate(upsertRegistrationSettingsSchema, args || {})
  const existing = await registrationSettingsRepo.findOneGlobal({ tenant_id: ctx.tenant_id })
  if (existing) {
    const updates = {}
    if (input.title            !== undefined) updates.title            = input.title
    if (input.description      !== undefined) updates.description      = input.description
    if (input.registrationLink !== undefined) updates.registrationLink = input.registrationLink
    const doc = await registrationSettingsRepo.updateById(ctx, existing.settings_id, updates)
    return toRegistrationSettingsResponse(doc)
  }
  const settings_id = generateId()
  const doc = await registrationSettingsRepo.create(ctx, {
    settings_id,
    title:            input.title            ?? null,
    description:      input.description      ?? null,
    registrationLink: input.registrationLink ?? null,
  })
  return toRegistrationSettingsResponse(doc)
}

/* ═══════════════════════════════════════════════════════════════════════════
   ALUMNI CONTACT
═══════════════════════════════════════════════════════════════════════════ */

async function listAlumniContacts(ctx, args) {
  const v = validate(listAlumniContactsSchema, args || {})
  const query = {}
  if (v.department) query.department = v.department
  const result = await alumniContactRepo.findMany(ctx, query, normalizePagination(v))
  return { items: result.items.map(toAlumniContactResponse), nextToken: result.nextCursor, pageInfo: result.pageInfo }
}

async function createAlumniContact(ctx, args) {
  const { input } = validate(createAlumniContactSchema, args || {})
  const contact_id = generateId()
  const doc = await alumniContactRepo.create(ctx, {
    contact_id,
    name:        input.name,
    roleType:    input.roleType    ?? null,
    department:  input.department  ?? null,
    designation: input.designation ?? null,
    email:       input.email       ?? null,
  })
  return toAlumniContactResponse(doc)
}

async function updateAlumniContact(ctx, args) {
  const { input } = validate(updateAlumniContactSchema, args || {})
  const { contactId, ...fields } = input
  const existing = await alumniContactRepo.findById(ctx, contactId)
  if (!existing) throw new NotFoundError('Alumni contact not found')
  const updates = {}
  const keys = ['name','roleType','department','designation','email']
  for (const k of keys) if (fields[k] !== undefined) updates[k] = fields[k]
  const doc = await alumniContactRepo.updateById(ctx, contactId, updates)
  return toAlumniContactResponse(doc)
}

async function deleteAlumniContact(ctx, args) {
  const { contactId } = validate(deleteAlumniContactSchema, args || {})
  const existing = await alumniContactRepo.findById(ctx, contactId)
  if (!existing) throw new NotFoundError('Alumni contact not found')
  await alumniContactRepo.deleteById(ctx, contactId)
  return toAlumniContactResponse(existing)
}
