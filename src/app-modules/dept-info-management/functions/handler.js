const { resolveTenant }       = require('/opt/nodejs/middleware/tenant-resolver')
const { requirePermission }   = require('/opt/nodejs/middleware/auth-guard')
const { validate }            = require('/opt/nodejs/middleware/input-validator')
const { withConnection }      = require('/opt/nodejs/middleware/with-connection')
const { log }                 = require('/opt/nodejs/middleware/request-logger')
const { publishEvent }        = require('/opt/nodejs/utils/event-publisher')
const { generateId }          = require('/opt/nodejs/utils/id-generator')
const { MongoRepository }     = require('/opt/nodejs/db/mongo-repository')
const { NotFoundError }       = require('/opt/nodejs/middleware/error-handler')
const { normalizePagination } = require('/opt/nodejs/utils/pagination')

const {
  getDeptIntroductionSchema,
  saveDeptIntroductionSchema,
  getDeptAboutSchema,
  saveDeptAboutSchema,
  getDeptSwotSchema,
  saveDeptSwotSchema,
  getHodProfileSchema,
  saveHodProfileSchema,
  listProgramOutcomesSchema,
  createProgramOutcomeSchema,
  updateProgramOutcomeSchema,
  deleteProgramOutcomeSchema,
  reorderProgramOutcomesSchema,
  listCommitteeMembersSchema,
  createCommitteeMemberSchema,
  updateCommitteeMemberSchema,
  deleteCommitteeMemberSchema,
  listDistinguishedAlumniSchema,
  createDistinguishedAlumnusSchema,
  updateDistinguishedAlumnusSchema,
  deleteDistinguishedAlumnusSchema
} = require('../schemas/validation')

const {
  DeptIntroduction,
  DeptAbout,
  DeptSwot,
  HodProfile,
  ProgramOutcome,
  CommitteeMember,
  DistinguishedAlumnus
} = require('../schemas/dept.info.model')

/* ─────────────────────────────
   Repositories
─────────────────────────────*/

const programOutcomeRepo = new MongoRepository({
  model:      ProgramOutcome,
  primaryKey: 'program_outcome_id'
})

const committeeMemberRepo = new MongoRepository({
  model:      CommitteeMember,
  primaryKey: 'committee_member_id'
})

const distinguishedAlumnusRepo = new MongoRepository({
  model:      DistinguishedAlumnus,
  primaryKey: 'distinguished_alumnus_id'
})

/* ─────────────────────────────
   Response Normalizers
─────────────────────────────*/

function toIntroductionResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptId: plain.deptId }
}

function toAboutResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptId: plain.deptId }
}

function toSwotResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptId: plain.deptId }
}

function toHodProfileResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, deptId: plain.deptId }
}

function toProgramOutcomeResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    programOutcomeId: plain.program_outcome_id || (plain._id ? plain._id.toString() : null)
  }
}

function toCommitteeMemberResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    committeeMemberId: plain.committee_member_id || (plain._id ? plain._id.toString() : null)
  }
}

function toDistinguishedAlumnusResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    distinguishedAlumnusId: plain.distinguished_alumnus_id || (plain._id ? plain._id.toString() : null)
  }
}

/* ─────────────────────────────
   Upsert Helper
─────────────────────────────*/

async function upsertDoc(Model, ctx, deptId, data) {
  const doc = await Model.findOneAndUpdate(
    { tenant_id: ctx.tenant_id, deptId },
    { $set: { ...data, tenant_id: ctx.tenant_id, deptId, created_by: ctx.user_id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  return doc
}

/* ─────────────────────────────
   Sort Builder
─────────────────────────────*/

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
  log(ctx, 'dept-info', event.field)

  switch (event.field) {

    // ── Introduction ──────────────────────────────
    case 'getDeptIntroduction':
      return await getDeptIntroduction(ctx, event.arguments)

    case 'saveDeptIntroduction':
      await requirePermission(ctx, 'dept-info:introduction:write')
      return await saveDeptIntroduction(ctx, event.arguments)

    // ── About ─────────────────────────────────────
    case 'getDeptAbout':
      return await getDeptAbout(ctx, event.arguments)

    case 'saveDeptAbout':
      await requirePermission(ctx, 'dept-info:about:write')
      return await saveDeptAbout(ctx, event.arguments)

    // ── SWOT ──────────────────────────────────────
    case 'getDeptSwot':
      return await getDeptSwot(ctx, event.arguments)

    case 'saveDeptSwot':
      await requirePermission(ctx, 'dept-info:swot:write')
      return await saveDeptSwot(ctx, event.arguments)

    // ── HOD Profile ───────────────────────────────
    case 'getHodProfile':
      return await getHodProfile(ctx, event.arguments)

    case 'saveHodProfile':
      await requirePermission(ctx, 'dept-info:hod:write')
      return await saveHodProfile(ctx, event.arguments)

    // ── Program Outcomes ──────────────────────────
    case 'listProgramOutcomes':
      return await listProgramOutcomes(ctx, event.arguments)

    case 'createProgramOutcome':
      await requirePermission(ctx, 'dept-info:program-outcomes:create')
      return await createProgramOutcome(ctx, event.arguments)

    case 'updateProgramOutcome':
      await requirePermission(ctx, 'dept-info:program-outcomes:update')
      return await updateProgramOutcome(ctx, event.arguments)

    case 'deleteProgramOutcome':
      await requirePermission(ctx, 'dept-info:program-outcomes:delete')
      return await deleteProgramOutcome(ctx, event.arguments)

    case 'reorderProgramOutcomes':
      await requirePermission(ctx, 'dept-info:program-outcomes:update')
      return await reorderProgramOutcomes(ctx, event.arguments)

    // ── Committee Members ─────────────────────────
    case 'listCommitteeMembers':
      return await listCommitteeMembers(ctx, event.arguments)

    case 'createCommitteeMember':
      await requirePermission(ctx, 'dept-info:committee:create')
      return await createCommitteeMember(ctx, event.arguments)

    case 'updateCommitteeMember':
      await requirePermission(ctx, 'dept-info:committee:update')
      return await updateCommitteeMember(ctx, event.arguments)

    case 'deleteCommitteeMember':
      await requirePermission(ctx, 'dept-info:committee:delete')
      return await deleteCommitteeMember(ctx, event.arguments)

    // ── Distinguished Alumni ───────────────────────
    case 'listDistinguishedAlumni':
      return await listDistinguishedAlumni(ctx, event.arguments)

    case 'createDistinguishedAlumnus':
      await requirePermission(ctx, 'dept-info:alumni:create')
      return await createDistinguishedAlumnus(ctx, event.arguments)

    case 'updateDistinguishedAlumnus':
      await requirePermission(ctx, 'dept-info:alumni:update')
      return await updateDistinguishedAlumnus(ctx, event.arguments)

    case 'deleteDistinguishedAlumnus':
      await requirePermission(ctx, 'dept-info:alumni:delete')
      return await deleteDistinguishedAlumnus(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)


/* ─────────────────────────────
   Introduction
─────────────────────────────*/

async function getDeptIntroduction(ctx, args) {
  const { deptId, tenantId } = validate(getDeptIntroductionSchema, args || {})
  const tenant_id = tenantId ?? ctx.tenant_id
  const doc = await DeptIntroduction.findOne({ tenant_id, deptId })
  if (!doc) return { deptId, departmentName: '', logoUrl: '', imageUrl: '', description: '' }
  return toIntroductionResponse(doc)
}

async function saveDeptIntroduction(ctx, args) {
  const { deptId, input } = validate(saveDeptIntroductionSchema, args || {})

  const doc = await upsertDoc(DeptIntroduction, ctx, deptId, {
    departmentName: input.departmentName ?? '',
    logoUrl:        input.logoUrl        ?? '',
    imageUrl:       input.imageUrl       ?? '',
    description:    input.description    ?? ''
  })

  await publishEvent('dept-info', 'DeptIntroductionSaved', {
    deptId,
    tenant_id:  ctx.tenant_id,
    updated_by: ctx.user_id,
    timestamp:  new Date().toISOString()
  })

  const res = toIntroductionResponse(doc)
  return { ...res, deptId: res.deptId ?? deptId }
}


/* ─────────────────────────────
   About (Vision & Mission)
─────────────────────────────*/

async function getDeptAbout(ctx, args) {
  const { deptId, tenantId } = validate(getDeptAboutSchema, args || {})
  const tenant_id = tenantId ?? ctx.tenant_id
  const doc = await DeptAbout.findOne({ tenant_id, deptId })
  if (!doc) return { deptId, vision: '', mission: '' }
  return toAboutResponse(doc)
}

async function saveDeptAbout(ctx, args) {
  const { deptId, input } = validate(saveDeptAboutSchema, args || {})

  const doc = await upsertDoc(DeptAbout, ctx, deptId, {
    vision:  input.vision  ?? '',
    mission: input.mission ?? ''
  })

  await publishEvent('dept-info', 'DeptAboutSaved', {
    deptId,
    tenant_id:  ctx.tenant_id,
    updated_by: ctx.user_id,
    timestamp:  new Date().toISOString()
  })

  const res = toAboutResponse(doc)
  return { ...res, deptId: res.deptId ?? deptId }
}


/* ─────────────────────────────
   SWOT Analysis
─────────────────────────────*/

async function getDeptSwot(ctx, args) {
  const { deptId, tenantId } = validate(getDeptSwotSchema, args || {})
  const tenant_id = tenantId ?? ctx.tenant_id
  const doc = await DeptSwot.findOne({ tenant_id, deptId })
  if (!doc) return { deptId, strengths: [], weaknesses: [], opportunities: [], threats: [] }
  return toSwotResponse(doc)
}

async function saveDeptSwot(ctx, args) {
  const { deptId, input } = validate(saveDeptSwotSchema, args || {})

  const doc = await upsertDoc(DeptSwot, ctx, deptId, {
    strengths:     input.strengths     ?? [],
    weaknesses:    input.weaknesses    ?? [],
    opportunities: input.opportunities ?? [],
    threats:       input.threats       ?? []
  })

  await publishEvent('dept-info', 'DeptSwotSaved', {
    deptId,
    tenant_id:  ctx.tenant_id,
    updated_by: ctx.user_id,
    timestamp:  new Date().toISOString()
  })

  const res = toSwotResponse(doc)
  return { ...res, deptId: res.deptId ?? deptId }
}


/* ─────────────────────────────
   HOD Profile
─────────────────────────────*/

async function getHodProfile(ctx, args) {
  const { deptId, tenantId } = validate(getHodProfileSchema, args || {})
  const tenant_id = tenantId ?? ctx.tenant_id
  const doc = await HodProfile.findOne({ tenant_id, deptId })
  if (!doc) return {
    deptId, name: '', title: '', designation: 'Head of Department',
    qualification: '', experience: '', specialization: '',
    message: '', profileSummary: '', email: '', phone: '',
    imageUrl: '', cvUrl: ''
  }
  return toHodProfileResponse(doc)
}

async function saveHodProfile(ctx, args) {
  const { deptId, input } = validate(saveHodProfileSchema, args || {})

  const doc = await upsertDoc(HodProfile, ctx, deptId, {
    name:           input.name           ?? '',
    title:          input.title          ?? '',
    designation:    input.designation    ?? 'Head of Department',
    qualification:  input.qualification  ?? '',
    experience:     input.experience     ?? '',
    specialization: input.specialization ?? '',
    message:        input.message        ?? '',
    profileSummary: input.profileSummary ?? '',
    email:          input.email          ?? '',
    phone:          input.phone          ?? '',
    imageUrl:       input.imageUrl       ?? '',
    cvUrl:          input.cvUrl          ?? ''
  })

  await publishEvent('dept-info', 'HodProfileSaved', {
    deptId,
    tenant_id:  ctx.tenant_id,
    updated_by: ctx.user_id,
    timestamp:  new Date().toISOString()
  })

  const res = toHodProfileResponse(doc)
  return { ...res, deptId: res.deptId ?? deptId }
}


/* ─────────────────────────────
   Program Outcomes
─────────────────────────────*/

async function listProgramOutcomes(ctx, args) {
  const validated  = validate(listProgramOutcomesSchema, args || {})
  const pagination = normalizePagination(validated)
  const resolvedCtx = validated.tenantId ? { ...ctx, tenant_id: validated.tenantId } : ctx

  const query = { deptId: validated.deptId }
  if (validated.type) query.type = validated.type

  const sort = { order: 1 }

  const result = await programOutcomeRepo.findMany(resolvedCtx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toProgramOutcomeResponse),
    nextToken: result.nextCursor
  }
}

async function createProgramOutcome(ctx, args) {
  const input = validate(createProgramOutcomeSchema, args || {})
  const { deptId, type, statement, order } = input.input

  const program_outcome_id = generateId()

  const created = await programOutcomeRepo.create(ctx, {
    program_outcome_id,
    deptId,
    type,
    statement,
    order,
    created_by: ctx.user_id
  })

  return toProgramOutcomeResponse(created)
}

async function updateProgramOutcome(ctx, args) {
  const input = validate(updateProgramOutcomeSchema, args || {})
  const { programOutcomeId, statement, order } = input.input

  const existing = await programOutcomeRepo.findById(ctx, programOutcomeId)
  if (!existing) throw new NotFoundError('Program outcome not found')

  const updates = {}
  if (statement !== undefined) updates.statement = statement
  if (order     !== undefined) updates.order     = order

  const updated = await programOutcomeRepo.updateById(ctx, programOutcomeId, updates)

  return toProgramOutcomeResponse(updated)
}

async function deleteProgramOutcome(ctx, args) {
  const { programOutcomeId } = validate(deleteProgramOutcomeSchema, args || {})

  const existing = await programOutcomeRepo.findById(ctx, programOutcomeId)
  if (!existing) throw new NotFoundError('Program outcome not found')

  await programOutcomeRepo.deleteById(ctx, programOutcomeId)

  return toProgramOutcomeResponse(existing)
}

async function reorderProgramOutcomes(ctx, args) {
  const input = validate(reorderProgramOutcomesSchema, args || {})
  const { deptId, type, orderedIds } = input.input

  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, tenant_id: ctx.tenant_id, deptId, type },
      update: { $set: { order: index + 1 } }
    }
  }))

  await ProgramOutcome.bulkWrite(bulkOps)

  return true
}


/* ─────────────────────────────
   Committee Members
─────────────────────────────*/

async function listCommitteeMembers(ctx, args) {
  const validated   = validate(listCommitteeMembersSchema, args || {})
  const resolvedCtx = validated.tenantId ? { ...ctx, tenant_id: validated.tenantId } : ctx

  const query = { deptId: validated.deptId }
  if (validated.committee) query.committee = validated.committee

  const sort = { order: 1 }

  const result = await committeeMemberRepo.findMany(resolvedCtx, query, { sort })

  return {
    items:     result.items.map(toCommitteeMemberResponse),
    nextToken: result.nextCursor
  }
}

async function createCommitteeMember(ctx, args) {
  const input = validate(createCommitteeMemberSchema, args || {})
  const { deptId, committee, name, designation, order } = input.input

  const committee_member_id = generateId()

  const created = await committeeMemberRepo.create(ctx, {
    committee_member_id,
    deptId,
    committee,
    name,
    designation: designation ?? '',
    order:       order       ?? 0,
    created_by:  ctx.user_id
  })

  return toCommitteeMemberResponse(created)
}

async function updateCommitteeMember(ctx, args) {
  const input = validate(updateCommitteeMemberSchema, args || {})
  const { committeeMemberId, name, designation, order } = input.input

  const existing = await committeeMemberRepo.findById(ctx, committeeMemberId)
  if (!existing) throw new NotFoundError('Committee member not found')

  const updates = {}
  if (name        !== undefined) updates.name        = name
  if (designation !== undefined) updates.designation = designation
  if (order       !== undefined) updates.order       = order

  const updated = await committeeMemberRepo.updateById(ctx, committeeMemberId, updates)

  return toCommitteeMemberResponse(updated)
}

async function deleteCommitteeMember(ctx, args) {
  const { committeeMemberId } = validate(deleteCommitteeMemberSchema, args || {})

  const existing = await committeeMemberRepo.findById(ctx, committeeMemberId)
  if (!existing) throw new NotFoundError('Committee member not found')

  await committeeMemberRepo.deleteById(ctx, committeeMemberId)

  return toCommitteeMemberResponse(existing)
}


/* ─────────────────────────────
   Distinguished Alumni
─────────────────────────────*/

async function listDistinguishedAlumni(ctx, args) {
  const validated   = validate(listDistinguishedAlumniSchema, args || {})
  const pagination  = normalizePagination(validated)
  const resolvedCtx = validated.tenantId ? { ...ctx, tenant_id: validated.tenantId } : ctx

  const query = { deptId: validated.deptId }
  const sort  = buildSort('createdAt', 'desc')

  const result = await distinguishedAlumnusRepo.findMany(resolvedCtx, query, { ...pagination, sort })

  return {
    items:     result.items.map(toDistinguishedAlumnusResponse),
    nextToken: result.nextCursor
  }
}

async function createDistinguishedAlumnus(ctx, args) {
  const input = validate(createDistinguishedAlumnusSchema, args || {})
  const { deptId, name, batch, currentRole, organization, achievement, imageUrl, linkedInUrl } = input.input

  const distinguished_alumnus_id = generateId()

  const created = await distinguishedAlumnusRepo.create(ctx, {
    distinguished_alumnus_id,
    deptId,
    name,
    batch:        batch        ?? '',
    currentRole:  currentRole  ?? '',
    organization: organization ?? '',
    achievement:  achievement  ?? '',
    imageUrl:     imageUrl     ?? '',
    linkedInUrl:  linkedInUrl  ?? '',
    created_by:   ctx.user_id
  })

  return toDistinguishedAlumnusResponse(created)
}

async function updateDistinguishedAlumnus(ctx, args) {
  const input = validate(updateDistinguishedAlumnusSchema, args || {})
  const { distinguishedAlumnusId, ...fields } = input.input

  const existing = await distinguishedAlumnusRepo.findById(ctx, distinguishedAlumnusId)
  if (!existing) throw new NotFoundError('Distinguished alumnus not found')

  const updates = {}
  if (fields.name         !== undefined) updates.name         = fields.name
  if (fields.batch        !== undefined) updates.batch        = fields.batch
  if (fields.currentRole  !== undefined) updates.currentRole  = fields.currentRole
  if (fields.organization !== undefined) updates.organization = fields.organization
  if (fields.achievement  !== undefined) updates.achievement  = fields.achievement
  if (fields.imageUrl     !== undefined) updates.imageUrl     = fields.imageUrl
  if (fields.linkedInUrl  !== undefined) updates.linkedInUrl  = fields.linkedInUrl

  const updated = await distinguishedAlumnusRepo.updateById(ctx, distinguishedAlumnusId, updates)

  return toDistinguishedAlumnusResponse(updated)
}

async function deleteDistinguishedAlumnus(ctx, args) {
  const { distinguishedAlumnusId } = validate(deleteDistinguishedAlumnusSchema, args || {})

  const existing = await distinguishedAlumnusRepo.findById(ctx, distinguishedAlumnusId)
  if (!existing) throw new NotFoundError('Distinguished alumnus not found')

  await distinguishedAlumnusRepo.deleteById(ctx, distinguishedAlumnusId)

  return toDistinguishedAlumnusResponse(existing)
}
