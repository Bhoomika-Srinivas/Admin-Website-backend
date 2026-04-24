const { resolveTenant, resolveSecureTenantContext } = require('/opt/nodejs/middleware/tenant-resolver')
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard')
const { validate } = require('/opt/nodejs/middleware/input-validator')
const { withConnection } = require('/opt/nodejs/middleware/with-connection')
const { log } = require('/opt/nodejs/middleware/request-logger')
const { publishEvent } = require('/opt/nodejs/utils/event-publisher')
const { generateId } = require('/opt/nodejs/utils/id-generator')
const { MongoRepository } = require('/opt/nodejs/db/mongo-repository')
const { NotFoundError } = require('/opt/nodejs/middleware/error-handler')
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
  listSchemeSyllabusSchema,
  createSchemeSyllabusSchema,
  updateSchemeSyllabusSchema,
  deleteSchemeSyllabusSchema,
  listAcademicCalendarSchema,
  createAcademicCalendarSchema,
  updateAcademicCalendarSchema,
  deleteAcademicCalendarSchema,
  updateRulesRegulationsSchema,
  listRankHoldersSchema,
  createRankHolderSchema,
  updateRankHolderSchema,
  deleteRankHolderSchema
} = require('../schemas/validation')

const {
  SchemeSyllabus,
  AcademicCalendar,
  RulesRegulations,
  RankHolder
} = require('../schemas/academics.model')

const schemeSyllabusRepo = new MongoRepository({ model: SchemeSyllabus, primaryKey: 'syllabus_id' })
const academicCalendarRepo = new MongoRepository({ model: AcademicCalendar, primaryKey: 'calendar_id' })
const rulesRegulationsRepo = new MongoRepository({ model: RulesRegulations, primaryKey: 'document_id' })
const rankHolderRepo = new MongoRepository({ model: RankHolder, primaryKey: 'rank_id' })

/* ─── Response Helpers ───────────────────────────────────────────────────── */

async function toSchemeSyllabusResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    syllabusId:   plain.syllabus_id,
    year:         plain.year,
    category:     plain.category,
    title:        plain.title,
    subtitle:     plain.subtitle || null,
    fileUrl:      await getPresignedUrl(plain.fileUrl),
    order:        plain.order ?? 0,
    createdAt:    plain.createdAt,
    updatedAt:    plain.updatedAt
  }
}

async function toAcademicCalendarResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    calendarId:   plain.calendar_id,
    title:        plain.title,
    description:  plain.description || null,
    type:         plain.type,
    authority:    plain.authority,
    program:      plain.program,
    semester:     plain.semester || null,
    year:         plain.year,
    date:         plain.date ? plain.date.toISOString() : null,
    fileUrl:      await getPresignedUrl(plain.fileUrl),
    createdAt:    plain.createdAt,
    updatedAt:    plain.updatedAt
  }
}

async function toRulesRegulationsResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    documentId:       plain.document_id,
    serviceRulesFile: await getPresignedUrl(plain.serviceRulesFile),
    serviceRulesText: plain.serviceRulesText || null,
    attendanceFile:   await getPresignedUrl(plain.attendanceFile),
    attendanceText:   plain.attendanceText || null,
    disciplineFile:   await getPresignedUrl(plain.disciplineFile),
    disciplineText:   plain.disciplineText || null,
    updatedAt:        plain.updatedAt
  }
}

function toRankHolderResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    rankId:      plain.rank_id,
    year:        plain.year,
    program:     plain.program,
    usn:         plain.usn,
    studentName: plain.studentName,
    branch:      plain.branch,
    rank:        plain.rank,
    rankOrder:   plain.rankOrder ?? 0,
    createdAt:   plain.createdAt,
    updatedAt:   plain.updatedAt
  }
}

/* ─── Main Handler ───────────────────────────────────────────────────────── */

async function handleEvent(event) {
  const ctx = resolveTenant(event)
  log(ctx, 'academics-management', event.field)

  switch (event.field) {
    /* ── Scheme Syllabus ── */
    case 'listSchemeSyllabus':
      return await listSchemeSyllabus(ctx, event.arguments)
    case 'createSchemeSyllabus':
      await requirePermission(ctx, 'academics:scheme-syllabus:create')
      return await createSchemeSyllabus(ctx, event.arguments)
    case 'updateSchemeSyllabus':
      await requirePermission(ctx, 'academics:scheme-syllabus:update')
      return await updateSchemeSyllabus(ctx, event.arguments)
    case 'deleteSchemeSyllabus':
      await requirePermission(ctx, 'academics:scheme-syllabus:delete')
      return await deleteSchemeSyllabus(ctx, event.arguments)

    /* ── Academic Calendar ── */
    case 'listAcademicCalendar':
      return await listAcademicCalendar(ctx, event.arguments)
    case 'createAcademicCalendar':
      await requirePermission(ctx, 'academics:academic-calendar:create')
      return await createAcademicCalendar(ctx, event.arguments)
    case 'updateAcademicCalendar':
      await requirePermission(ctx, 'academics:academic-calendar:update')
      return await updateAcademicCalendar(ctx, event.arguments)
    case 'deleteAcademicCalendar':
      await requirePermission(ctx, 'academics:academic-calendar:delete')
      return await deleteAcademicCalendar(ctx, event.arguments)

    /* ── Rules & Regulations ── */
    case 'getRulesRegulations':
      return await getRulesRegulations(ctx, event.arguments)
    case 'updateRulesRegulations':
      await requirePermission(ctx, 'academics:rules-regulations:update')
      return await updateRulesRegulations(ctx, event.arguments)

    /* ── Rank Holders ── */
    case 'listRankHolders':
      return await listRankHolders(ctx, event.arguments)
    case 'createRankHolder':
      await requirePermission(ctx, 'academics:rank-holder:create')
      return await createRankHolder(ctx, event.arguments)
    case 'updateRankHolder':
      await requirePermission(ctx, 'academics:rank-holder:update')
      return await updateRankHolder(ctx, event.arguments)
    case 'deleteRankHolder':
      await requirePermission(ctx, 'academics:rank-holder:delete')
      return await deleteRankHolder(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)

/* ─── Scheme Syllabus Operations ─────────────────────────────────────────── */

async function listSchemeSyllabus(ctx, args) {
  const validated = validate(listSchemeSyllabusSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, validated.tenantId)

  const limit = Math.min(validated.limit || 50, 100)
  const query = { tenant_id: resolvedCtx.tenant_id }

  const items = await SchemeSyllabus.find(query).sort({ order: 1, createdAt: -1 }).limit(limit + 1).lean()
  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items
  const nextToken = hasMore && page.length > 0
    ? Buffer.from(JSON.stringify({ order: page[page.length - 1].order, _id: page[page.length - 1]._id })).toString('base64')
    : null

  return { items: await Promise.all(page.map(toSchemeSyllabusResponse)), nextToken }
}

async function createSchemeSyllabus(ctx, args) {
  const input = validate(createSchemeSyllabusSchema, args?.input || args || {})
  const syllabus_id = generateId()

  let order = input.order ?? null
  if (order === null) {
    const count = await SchemeSyllabus.countDocuments({ tenant_id: ctx.tenant_id })
    order = count + 1
  }

  const created = await schemeSyllabusRepo.create(ctx, {
    syllabus_id,
    year:     input.year,
    category: input.category,
    title:    input.title,
    subtitle: input.subtitle ?? null,
    fileUrl:  input.fileUrl ?? null,
    order,
    created_by: ctx.user_id
  })

  await publishEvent('academics-management', 'SchemeSyllabusCreated', {
    syllabus_id,
    tenant_id: ctx.tenant_id,
    created_by: ctx.user_id,
    timestamp: new Date().toISOString()
  })

  return await toSchemeSyllabusResponse(created)
}

async function updateSchemeSyllabus(ctx, args) {
  const input = validate(updateSchemeSyllabusSchema, args?.input || args || {})
  const existing = await schemeSyllabusRepo.findById(ctx, input.syllabusId)
  if (!existing) throw new NotFoundError('Scheme Syllabus not found')

  const updates = {}
  if (input.year !== undefined)     updates.year = input.year
  if (input.category !== undefined) updates.category = input.category
  if (input.title !== undefined)    updates.title = input.title
  if (input.subtitle !== undefined) updates.subtitle = input.subtitle
  if (input.fileUrl !== undefined)  updates.fileUrl = input.fileUrl

  if (input.order !== undefined && input.order !== existing.order) {
    const newOrder = input.order
    const oldOrder = existing.order
    const scope = { tenant_id: ctx.tenant_id, syllabus_id: { $ne: existing.syllabus_id } }

    if (newOrder > oldOrder) {
      await SchemeSyllabus.updateMany({ ...scope, order: { $gt: oldOrder, $lte: newOrder } }, { $inc: { order: -1 } })
    } else {
      await SchemeSyllabus.updateMany({ ...scope, order: { $gte: newOrder, $lt: oldOrder } }, { $inc: { order: 1 } })
    }
    updates.order = newOrder
  }

  const updated = await schemeSyllabusRepo.updateById(ctx, input.syllabusId, updates)
  return await toSchemeSyllabusResponse(updated)
}

async function deleteSchemeSyllabus(ctx, args) {
  const { syllabusId } = validate(deleteSchemeSyllabusSchema, args || {})
  const existing = await schemeSyllabusRepo.findById(ctx, syllabusId)
  if (!existing) throw new NotFoundError('Scheme Syllabus not found')

  await schemeSyllabusRepo.deleteById(ctx, syllabusId)

  await publishEvent('academics-management', 'SchemeSyllabusDeleted', {
    syllabus_id: syllabusId,
    tenant_id: ctx.tenant_id,
    deleted_by: ctx.user_id,
    timestamp: new Date().toISOString()
  })

  return await toSchemeSyllabusResponse(existing)
}

/* ─── Academic Calendar Operations ───────────────────────────────────────── */

async function listAcademicCalendar(ctx, args) {
  const validated = validate(listAcademicCalendarSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, validated.tenantId)

  const limit = Math.min(validated.limit || 50, 100)
  const query = { tenant_id: resolvedCtx.tenant_id }

  if (validated.type)      query.type = validated.type
  if (validated.authority) query.authority = validated.authority
  if (validated.program)   query.program = validated.program
  if (validated.year)      query.year = validated.year

  const items = await AcademicCalendar.find(query).sort({ createdAt: -1 }).limit(limit + 1).lean()
  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items
  const nextToken = hasMore && page.length > 0
    ? Buffer.from(JSON.stringify({ _id: page[page.length - 1]._id })).toString('base64')
    : null

  return { items: await Promise.all(page.map(toAcademicCalendarResponse)), nextToken }
}

async function createAcademicCalendar(ctx, args) {
  const input = validate(createAcademicCalendarSchema, args?.input || args || {})
  const calendar_id = generateId()

  const created = await academicCalendarRepo.create(ctx, {
    calendar_id,
    title:       input.title,
    description: input.description ?? null,
    type:        input.type,
    authority:   input.authority,
    program:     input.program,
    semester:    input.semester ?? null,
    year:        input.year,
    date:        input.date ?? null,
    fileUrl:     input.fileUrl ?? null,
    created_by:  ctx.user_id
  })

  await publishEvent('academics-management', 'AcademicCalendarCreated', {
    calendar_id,
    tenant_id: ctx.tenant_id,
    created_by: ctx.user_id,
    timestamp: new Date().toISOString()
  })

  return await toAcademicCalendarResponse(created)
}

async function updateAcademicCalendar(ctx, args) {
  const input = validate(updateAcademicCalendarSchema, args?.input || args || {})
  const existing = await academicCalendarRepo.findById(ctx, input.calendarId)
  if (!existing) throw new NotFoundError('Academic Calendar not found')

  const updates = {}
  if (input.title !== undefined)       updates.title = input.title
  if (input.description !== undefined) updates.description = input.description
  if (input.type !== undefined)        updates.type = input.type
  if (input.authority !== undefined)   updates.authority = input.authority
  if (input.program !== undefined)     updates.program = input.program
  if (input.semester !== undefined)    updates.semester = input.semester
  if (input.year !== undefined)        updates.year = input.year
  if (input.date !== undefined)        updates.date = input.date
  if (input.fileUrl !== undefined)     updates.fileUrl = input.fileUrl

  const updated = await academicCalendarRepo.updateById(ctx, input.calendarId, updates)
  return await toAcademicCalendarResponse(updated)
}

async function deleteAcademicCalendar(ctx, args) {
  const { calendarId } = validate(deleteAcademicCalendarSchema, args || {})
  const existing = await academicCalendarRepo.findById(ctx, calendarId)
  if (!existing) throw new NotFoundError('Academic Calendar not found')

  await academicCalendarRepo.deleteById(ctx, calendarId)

  await publishEvent('academics-management', 'AcademicCalendarDeleted', {
    calendar_id: calendarId,
    tenant_id: ctx.tenant_id,
    deleted_by: ctx.user_id,
    timestamp: new Date().toISOString()
  })

  return await toAcademicCalendarResponse(existing)
}

/* ─── Rules & Regulations Operations (Singleton) ──────────────────────────── */

async function getRulesRegulations(ctx, args) {
  const doc = await RulesRegulations.findOne({ tenant_id: ctx.tenant_id }).lean()
  if (!doc) {
    return {
      documentId: 'singleton',
      serviceRulesFile: null,
      serviceRulesText: null,
      attendanceFile: null,
      attendanceText: null,
      disciplineFile: null,
      disciplineText: null,
      updatedAt: null
    }
  }
  return await toRulesRegulationsResponse(doc)
}

async function updateRulesRegulations(ctx, args) {
  const input = validate(updateRulesRegulationsSchema, args?.input || args || {})

  const existing = await RulesRegulations.findOne({ tenant_id: ctx.tenant_id })

  if (existing) {
    const updates = {}
    if (input.serviceRulesFile !== undefined) updates.serviceRulesFile = input.serviceRulesFile
    if (input.serviceRulesText !== undefined) updates.serviceRulesText = input.serviceRulesText
    if (input.attendanceFile !== undefined)   updates.attendanceFile = input.attendanceFile
    if (input.attendanceText !== undefined)   updates.attendanceText = input.attendanceText
    if (input.disciplineFile !== undefined)   updates.disciplineFile = input.disciplineFile
    if (input.disciplineText !== undefined)   updates.disciplineText = input.disciplineText

    const updated = await RulesRegulations.findOneAndUpdate(
      { tenant_id: ctx.tenant_id },
      { $set: updates },
      { new: true }
    )
    return await toRulesRegulationsResponse(updated)
  }

  const document_id = 'singleton-' + ctx.tenant_id
  const created = await rulesRegulationsRepo.create(ctx, {
    document_id,
    serviceRulesFile: input.serviceRulesFile ?? null,
    serviceRulesText: input.serviceRulesText ?? null,
    attendanceFile:   input.attendanceFile ?? null,
    attendanceText:   input.attendanceText ?? null,
    disciplineFile:   input.disciplineFile ?? null,
    disciplineText:   input.disciplineText ?? null,
    created_by: ctx.user_id
  })

  await publishEvent('academics-management', 'RulesRegulationsUpdated', {
    document_id,
    tenant_id: ctx.tenant_id,
    updated_by: ctx.user_id,
    timestamp: new Date().toISOString()
  })

  return await toRulesRegulationsResponse(created)
}

/* ─── Rank Holders Operations ─────────────────────────────────────────────── */

async function listRankHolders(ctx, args) {
  const validated = validate(listRankHoldersSchema, args || {})
  const resolvedCtx = resolveSecureTenantContext(ctx, validated.tenantId)

  const limit = Math.min(validated.limit || 50, 100)
  const query = { tenant_id: resolvedCtx.tenant_id }

  if (validated.year)    query.year = validated.year
  if (validated.program) query.program = validated.program

  const items = await RankHolder.find(query).sort({ rankOrder: 1, createdAt: -1 }).limit(limit + 1).lean()
  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items
  const nextToken = hasMore && page.length > 0
    ? Buffer.from(JSON.stringify({ rankOrder: page[page.length - 1].rankOrder, _id: page[page.length - 1]._id })).toString('base64')
    : null

  return { items: page.map(toRankHolderResponse), nextToken }
}

async function createRankHolder(ctx, args) {
  const input = validate(createRankHolderSchema, args?.input || args || {})
  const rank_id = generateId()

  let rankOrder = input.rankOrder ?? null
  if (rankOrder === null) {
    const count = await RankHolder.countDocuments({ tenant_id: ctx.tenant_id })
    rankOrder = count + 1
  }

  const created = await rankHolderRepo.create(ctx, {
    rank_id,
    year:        input.year,
    program:     input.program,
    usn:         input.usn,
    studentName: input.studentName,
    branch:      input.branch,
    rank:        input.rank,
    rankOrder,
    created_by:  ctx.user_id
  })

  await publishEvent('academics-management', 'RankHolderCreated', {
    rank_id,
    tenant_id: ctx.tenant_id,
    created_by: ctx.user_id,
    timestamp: new Date().toISOString()
  })

  return toRankHolderResponse(created)
}

async function updateRankHolder(ctx, args) {
  const input = validate(updateRankHolderSchema, args?.input || args || {})
  const existing = await rankHolderRepo.findById(ctx, input.rankId)
  if (!existing) throw new NotFoundError('Rank Holder not found')

  const updates = {}
  if (input.year !== undefined)        updates.year = input.year
  if (input.program !== undefined)     updates.program = input.program
  if (input.usn !== undefined)         updates.usn = input.usn
  if (input.studentName !== undefined) updates.studentName = input.studentName
  if (input.branch !== undefined)      updates.branch = input.branch
  if (input.rank !== undefined)        updates.rank = input.rank

  if (input.rankOrder !== undefined && input.rankOrder !== existing.rankOrder) {
    const newOrder = input.rankOrder
    const oldOrder = existing.rankOrder
    const scope = { tenant_id: ctx.tenant_id, rank_id: { $ne: existing.rank_id } }

    if (newOrder > oldOrder) {
      await RankHolder.updateMany({ ...scope, rankOrder: { $gt: oldOrder, $lte: newOrder } }, { $inc: { rankOrder: -1 } })
    } else {
      await RankHolder.updateMany({ ...scope, rankOrder: { $gte: newOrder, $lt: oldOrder } }, { $inc: { rankOrder: 1 } })
    }
    updates.rankOrder = newOrder
  }

  const updated = await rankHolderRepo.updateById(ctx, input.rankId, updates)
  return toRankHolderResponse(updated)
}

async function deleteRankHolder(ctx, args) {
  const { rankId } = validate(deleteRankHolderSchema, args || {})
  const existing = await rankHolderRepo.findById(ctx, rankId)
  if (!existing) throw new NotFoundError('Rank Holder not found')

  await rankHolderRepo.deleteById(ctx, rankId)

  await publishEvent('academics-management', 'RankHolderDeleted', {
    rank_id: rankId,
    tenant_id: ctx.tenant_id,
    deleted_by: ctx.user_id,
    timestamp: new Date().toISOString()
  })

  return toRankHolderResponse(existing)
}
