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
  listAccreditationsSchema,
  getAccreditationSchema,
  createAccreditationSchema,
  updateAccreditationSchema,
  deleteAccreditationSchema,
} = require('../schemas/validation')

const { Accreditation } = require('../schemas/accreditation.model')

const accreditationRepo = new MongoRepository({ model: Accreditation, primaryKey: 'accreditation_id' })

/* ─────────────────────────────
   Response Normalizer
─────────────────────────────*/

function toAccreditationResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, accreditationId: plain.accreditation_id || (plain._id ? plain._id.toString() : null) }
}

/* ─────────────────────────────
   Query Builder
─────────────────────────────*/

function buildAccreditationQuery(args) {
  const query = { type: args.type }
  if (args.section)         query.section         = args.section
  if (args.sub_section)     query.sub_section     = args.sub_section
  if (args.sub_sub_section) query.sub_sub_section = args.sub_sub_section
  if (args.department)      query.department      = args.department
  return query
}

/* ─────────────────────────────
   Router
─────────────────────────────*/

async function handleEvent(event) {
  const ctx = resolveTenant(event)
  log(ctx, 'accreditations-management', event.field)

  switch (event.field) {

    case 'listAccreditationRecords':
      return await listAccreditations(ctx, event.arguments)

    case 'getAccreditationRecord':
      return await getAccreditation(ctx, event.arguments)

    case 'createAccreditationRecord':
      await requirePermission(ctx, 'accreditations:record:create')
      return await createAccreditation(ctx, event.arguments)

    case 'updateAccreditationRecord':
      await requirePermission(ctx, 'accreditations:record:update')
      return await updateAccreditation(ctx, event.arguments)

    case 'deleteAccreditationRecord':
      await requirePermission(ctx, 'accreditations:record:delete')
      return await deleteAccreditation(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)

/* ─────────────────────────────
   Handlers
─────────────────────────────*/

async function listAccreditations(ctx, args) {
  const validated  = validate(listAccreditationsSchema, args || {})
  const { tenantId, ...rest } = validated
  const resolvedCtx = tenantId ? { ...ctx, tenant_id: tenantId } : ctx

  const query      = buildAccreditationQuery(rest)
  const pagination = normalizePagination(validated)
  const sort       = { order: 1, year: -1 }

  const result = await accreditationRepo.findMany(resolvedCtx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toAccreditationResponse),
    nextToken: result.nextCursor,
  }
}

async function getAccreditation(ctx, args) {
  const { accreditationId } = validate(getAccreditationSchema, args || {})

  const doc = await Accreditation.findOne({ accreditation_id: accreditationId }).lean()
  if (!doc) throw new NotFoundError('Accreditation not found')

  return toAccreditationResponse(doc)
}

async function createAccreditation(ctx, args) {
  const input = validate(createAccreditationSchema, args || {})
  const { type, section, sub_section, sub_sub_section, department, title, description, year, program, cycle, file_url } = input.input

  // Conditional validation
  if (type === 'AICTE' && section === 'EOA' && !program) {
    throw new Error('program is required for AICTE EOA records')
  }
  if (type === 'NAAC' && section === 'Accreditation Certificates' && !cycle) {
    throw new Error('cycle is required for NAAC Accreditation Certificate records')
  }
  if (type === 'NBA' && section === 'Department Level' && !department) {
    throw new Error('department is required for NBA Department Level records')
  }

  const accreditation_id = generateId()
  const order            = input.input.order ?? Date.now()

  const created = await accreditationRepo.create(ctx, {
    accreditation_id,
    type,
    section:         section         ?? null,
    sub_section:     sub_section     ?? null,
    sub_sub_section: sub_sub_section ?? null,
    department:      department      ?? null,
    title,
    description:     description     ?? null,
    year:            year            ?? null,
    program:         program         ?? null,
    cycle:           cycle           ?? null,
    file_url,
    order,
    created_by:      ctx.user_id,
  })

  return toAccreditationResponse(created)
}

async function updateAccreditation(ctx, args) {
  const input = validate(updateAccreditationSchema, args || {})
  const { accreditationId, ...fields } = input.input

  const existing = await accreditationRepo.findById(ctx, accreditationId)
  if (!existing) throw new NotFoundError('Accreditation not found')

  const updates = {}
  if (fields.section         !== undefined) updates.section         = fields.section
  if (fields.sub_section     !== undefined) updates.sub_section     = fields.sub_section
  if (fields.sub_sub_section !== undefined) updates.sub_sub_section = fields.sub_sub_section
  if (fields.department      !== undefined) updates.department      = fields.department
  if (fields.title           !== undefined) updates.title           = fields.title
  if (fields.description     !== undefined) updates.description     = fields.description
  if (fields.year            !== undefined) updates.year            = fields.year
  if (fields.program         !== undefined) updates.program         = fields.program
  if (fields.cycle           !== undefined) updates.cycle           = fields.cycle
  if (fields.file_url        !== undefined) updates.file_url        = fields.file_url
  if (fields.order           !== undefined) updates.order           = fields.order

  const updated = await accreditationRepo.updateById(ctx, accreditationId, updates)

  return toAccreditationResponse(updated)
}

async function deleteAccreditation(ctx, args) {
  const { accreditationId } = validate(deleteAccreditationSchema, args || {})

  const existing = await accreditationRepo.findById(ctx, accreditationId)
  if (!existing) throw new NotFoundError('Accreditation not found')

  await accreditationRepo.deleteById(ctx, accreditationId)

  return toAccreditationResponse(existing)
}
