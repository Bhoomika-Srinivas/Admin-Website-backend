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
  listEventsSchema,
  getEventSchema,
  createEventSchema,
  updateEventSchema,
  deleteEventSchema,
  approveEventSchema,
  rejectEventSchema,
  cancelEventSchema,
  togglePinEventSchema,
} = require('../schemas/validation')

const { Event } = require('../schemas/events.model')

const eventRepo = new MongoRepository({ model: Event, primaryKey: 'event_id' })

/* ─────────────────────────────
   Response Normalizer
─────────────────────────────*/

async function toEventResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    eventId: plain.event_id || (plain._id ? plain._id.toString() : null),
    images:  await Promise.all((plain.images || []).map(getPresignedUrl)),
  }
}

/* ─────────────────────────────
   Query Builder
─────────────────────────────*/

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

/* ─────────────────────────────
   Router
─────────────────────────────*/

async function handleEvent(event) {
  const ctx = resolveTenant(event)
  log(ctx, 'events-management', event.field)

  switch (event.field) {

    case 'listEvents':
      return await listEvents(ctx, event.arguments)

    case 'getEvent':
      return await getEvent(ctx, event.arguments)

    case 'createEvent':
      await requirePermission(ctx, 'events:event:create')
      return await createEvent(ctx, event.arguments)

    case 'updateEvent':
      await requirePermission(ctx, 'events:event:update')
      return await updateEvent(ctx, event.arguments)

    case 'deleteEvent':
      await requirePermission(ctx, 'events:event:delete')
      return await deleteEvent(ctx, event.arguments)

    case 'approveEvent':
      await requirePermission(ctx, 'events:event:approve')
      return await approveEvent(ctx, event.arguments)

    case 'rejectEvent':
      await requirePermission(ctx, 'events:event:reject')
      return await rejectEvent(ctx, event.arguments)

    case 'cancelEvent':
      await requirePermission(ctx, 'events:event:cancel')
      return await cancelEvent(ctx, event.arguments)

    case 'togglePinEvent':
      await requirePermission(ctx, 'events:event:pin')
      return await togglePinEvent(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)

/* ─────────────────────────────
   Handlers
─────────────────────────────*/

async function listEvents(ctx, args) {
  const validated = validate(listEventsSchema, args || {})
  const { tenantId, ...rest } = validated
  const resolvedCtx = resolveSecureTenantContext(ctx, tenantId)

  const query      = buildEventQuery(rest)
  const pagination = normalizePagination(validated)
  const sort       = { createdAt: -1 }

  // Non-admins only see approved events
  const isAdmin = (ctx.permissions || []).some(p => p === '*:*:*' || p === 'events:*:*')
  if (!isAdmin && !query.approvalStatus) query.approvalStatus = 'approved'

  const result = await eventRepo.findMany(resolvedCtx, query, { ...pagination, sort })

  return {
    items:     await Promise.all(result.items.map(toEventResponse)),
    nextToken: result.nextCursor, pageInfo: result.pageInfo,
  }
}

async function getEvent(ctx, args) {
  const { eventId } = validate(getEventSchema, args || {})

  const isAdmin = (ctx.permissions || []).some(p => p === '*:*:*' || p === 'events:*:*')
  const filter  = { event_id: eventId, tenant_id: ctx.tenant_id }
  if (!isAdmin) filter.approvalStatus = 'approved'

  const doc = await Event.findOne(filter).lean()
  if (!doc) throw new NotFoundError('Event not found')

  return await toEventResponse(doc)
}

async function createEvent(ctx, args) {
  const input = validate(createEventSchema, args || {})
  const { deptId, title, isMultiDay, date, time, startDate, startTime, endDate, endTime, venue, description, images, pinned, level, department } = input.input

  const event_id = generateId()
  const isAdmin  = (ctx.permissions || []).includes('*:*:*')

  const created = await eventRepo.create(ctx, {
    event_id,
    deptId:         deptId      ?? null,
    title,
    isMultiDay:     isMultiDay  ?? false,
    date:           date        ?? null,
    time:           time        ?? null,
    startDate:      startDate   ?? null,
    startTime:      startTime   ?? null,
    endDate:        endDate     ?? null,
    endTime:        endTime     ?? null,
    venue:          venue       ?? null,
    description:    description ?? null,
    images:         images      ?? [],
    pinned:         pinned      ?? false,
    level,
    department:     department  ?? null,
    status:         'upcoming',
    approvalStatus: isAdmin ? 'approved' : 'pending',
    created_by:     ctx.user_id,
  })

  return await toEventResponse(created)
}

async function updateEvent(ctx, args) {
  const input = validate(updateEventSchema, args || {})
  const { eventId, ...fields } = input.input

  const existing = await eventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Event not found')

  const updates = {}
  if (fields.title          !== undefined) updates.title          = fields.title
  if (fields.isMultiDay     !== undefined) updates.isMultiDay     = fields.isMultiDay
  if (fields.date           !== undefined) updates.date           = fields.date
  if (fields.time           !== undefined) updates.time           = fields.time
  if (fields.startDate      !== undefined) updates.startDate      = fields.startDate
  if (fields.startTime      !== undefined) updates.startTime      = fields.startTime
  if (fields.endDate        !== undefined) updates.endDate        = fields.endDate
  if (fields.endTime        !== undefined) updates.endTime        = fields.endTime
  if (fields.venue          !== undefined) updates.venue          = fields.venue
  if (fields.description    !== undefined) updates.description    = fields.description
  if (fields.images         !== undefined) updates.images         = fields.images
  if (fields.pinned         !== undefined) updates.pinned         = fields.pinned
  if (fields.level          !== undefined) updates.level          = fields.level
  if (fields.department     !== undefined) updates.department     = fields.department
  if (fields.status     !== undefined) updates.status = fields.status
  // approvalStatus is intentionally excluded — use approveEvent/rejectEvent

  const updated = await eventRepo.updateById(ctx, eventId, updates)

  return await toEventResponse(updated)
}

async function deleteEvent(ctx, args) {
  const { eventId } = validate(deleteEventSchema, args || {})

  const existing = await eventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Event not found')

  await eventRepo.deleteById(ctx, eventId)

  return await toEventResponse(existing)
}

async function approveEvent(ctx, args) {
  const { eventId } = validate(approveEventSchema, args || {})

  const existing = await eventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Event not found')

  const updated = await eventRepo.updateById(ctx, eventId, { approvalStatus: 'approved' })
  return await toEventResponse(updated)
}

async function rejectEvent(ctx, args) {
  const { eventId } = validate(rejectEventSchema, args || {})

  const existing = await eventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Event not found')

  const updated = await eventRepo.updateById(ctx, eventId, { approvalStatus: 'rejected' })
  return await toEventResponse(updated)
}

async function cancelEvent(ctx, args) {
  const { eventId } = validate(cancelEventSchema, args || {})

  const existing = await eventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Event not found')

  const updated = await eventRepo.updateById(ctx, eventId, { status: 'cancelled' })
  return await toEventResponse(updated)
}

async function togglePinEvent(ctx, args) {
  const { eventId } = validate(togglePinEventSchema, args || {})

  const existing = await eventRepo.findById(ctx, eventId)
  if (!existing) throw new NotFoundError('Event not found')

  const plain   = existing.toObject ? existing.toObject() : existing
  const updated = await eventRepo.updateById(ctx, eventId, { pinned: !plain.pinned })
  return await toEventResponse(updated)
}
