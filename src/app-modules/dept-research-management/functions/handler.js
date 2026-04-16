const { resolveTenant }       = require('/opt/nodejs/middleware/tenant-resolver')
const { requirePermission }   = require('/opt/nodejs/middleware/auth-guard')
const { validate }            = require('/opt/nodejs/middleware/input-validator')
const { withConnection }      = require('/opt/nodejs/middleware/with-connection')
const { log }                 = require('/opt/nodejs/middleware/request-logger')
const { generateId }          = require('/opt/nodejs/utils/id-generator')
const { MongoRepository }     = require('/opt/nodejs/db/mongo-repository')
const { NotFoundError }       = require('/opt/nodejs/middleware/error-handler')

const {
  listPublicationProfilesSchema,
  savePublicationProfileSchema,
  deletePublicationProfileSchema,
  listResearchGrantsSchema,
  createResearchGrantSchema,
  updateResearchGrantSchema,
  deleteResearchGrantSchema,
  listPatentsSchema,
  createPatentSchema,
  updatePatentSchema,
  deletePatentSchema,
  listFacultyResearchSummariesSchema,
  createFacultyResearchSummarySchema,
  updateFacultyResearchSummarySchema,
  deleteFacultyResearchSummarySchema,
  listPhdGuidesSchema,
  createPhdGuideSchema,
  updatePhdGuideSchema,
  deletePhdGuideSchema,
  listPhdScholarsSchema,
  createPhdScholarSchema,
  updatePhdScholarSchema,
  deletePhdScholarSchema
} = require('../schemas/validation')

const {
  PublicationProfile,
  ResearchGrant,
  Patent,
  FacultyResearchSummary,
  PhdGuide,
  PhdScholar
} = require('../schemas/dept.research.model')

/* ─────────────────────────────
   Repositories
─────────────────────────────*/

const publicationProfileRepo     = new MongoRepository({ model: PublicationProfile,     primaryKey: 'publication_profile_id' })
const researchGrantRepo          = new MongoRepository({ model: ResearchGrant,          primaryKey: 'research_grant_id' })
const patentRepo                 = new MongoRepository({ model: Patent,                 primaryKey: 'patent_id' })
const facultyResearchSummaryRepo = new MongoRepository({ model: FacultyResearchSummary, primaryKey: 'faculty_research_summary_id' })
const phdGuideRepo               = new MongoRepository({ model: PhdGuide,               primaryKey: 'phd_guide_id' })
const phdScholarRepo             = new MongoRepository({ model: PhdScholar,             primaryKey: 'phd_scholar_id' })

/* ─────────────────────────────
   Response Normalizers
─────────────────────────────*/

function toPublicationProfileResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, publicationProfileId: plain.publication_profile_id || (plain._id ? plain._id.toString() : null) }
}

function toResearchGrantResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, researchGrantId: plain.research_grant_id || (plain._id ? plain._id.toString() : null) }
}

function toPatentResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, patentId: plain.patent_id || (plain._id ? plain._id.toString() : null) }
}

function toFacultyResearchSummaryResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, facultyResearchSummaryId: plain.faculty_research_summary_id || (plain._id ? plain._id.toString() : null) }
}

function toPhdGuideResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, phdGuideId: plain.phd_guide_id || (plain._id ? plain._id.toString() : null) }
}

function toPhdScholarResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return { ...plain, phdScholarId: plain.phd_scholar_id || (plain._id ? plain._id.toString() : null) }
}

/* ─────────────────────────────
   Query Builders
─────────────────────────────*/

function buildResearchSummaryQuery(args) {
  const query = {}
  if (args.deptId)    query.deptId    = args.deptId
  if (args.guideType) query.guideType = args.guideType

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { researchArea: { $regex: args.search.trim(), $options: 'i' } },
      { guideName:    { $regex: args.search.trim(), $options: 'i' } },
      { thesisTitle:  { $regex: args.search.trim(), $options: 'i' } },
      { university:   { $regex: args.search.trim(), $options: 'i' } }
    ]
  }

  return query
}

function buildPhdGuideQuery(args) {
  const query = {}
  if (args.deptId) query.deptId = args.deptId

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { facultyName: { $regex: args.search.trim(), $options: 'i' } },
      { university:  { $regex: args.search.trim(), $options: 'i' } }
    ]
  }

  return query
}

function buildPhdScholarQuery(args) {
  const query = {}
  if (args.deptId)         query.deptId        = args.deptId
  if (args.guideFacultyId) query.guideFacultyId = args.guideFacultyId
  if (args.status)         query.status         = args.status

  if (args.search && args.search.trim() !== '') {
    query.$or = [
      { scholarName: { $regex: args.search.trim(), $options: 'i' } },
      { thesisTitle: { $regex: args.search.trim(), $options: 'i' } },
      { institution: { $regex: args.search.trim(), $options: 'i' } }
    ]
  }

  return query
}

function buildTextQuery(args) {
  const query = {}
  if (args.deptId) query.deptId = args.deptId

  if (args.search && args.search.trim() !== '') {
    query.text = { $regex: args.search.trim(), $options: 'i' }
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
  log(ctx, 'dept-research', event.field)

  switch (event.field) {

    // ── PublicationProfile ────────────────────────
    case 'listPublicationProfiles':
      await requirePermission(ctx, 'dept-research:pub-profile:read')
      return await listPublicationProfiles(ctx, event.arguments)

    case 'savePublicationProfile':
      await requirePermission(ctx, 'dept-research:pub-profile:write')
      return await savePublicationProfile(ctx, event.arguments)

    case 'deletePublicationProfile':
      await requirePermission(ctx, 'dept-research:pub-profile:delete')
      return await deletePublicationProfile(ctx, event.arguments)

    // ── ResearchGrant ─────────────────────────────
    case 'listResearchGrants':
      await requirePermission(ctx, 'dept-research:grant:read')
      return await listResearchGrants(ctx, event.arguments)

    case 'createResearchGrant':
      await requirePermission(ctx, 'dept-research:grant:create')
      return await createResearchGrant(ctx, event.arguments)

    case 'updateResearchGrant':
      await requirePermission(ctx, 'dept-research:grant:update')
      return await updateResearchGrant(ctx, event.arguments)

    case 'deleteResearchGrant':
      await requirePermission(ctx, 'dept-research:grant:delete')
      return await deleteResearchGrant(ctx, event.arguments)

    // ── Patent ────────────────────────────────────
    case 'listPatents':
      return await listPatents(ctx, event.arguments)

    case 'createPatent':
      await requirePermission(ctx, 'dept-research:patent:create')
      return await createPatent(ctx, event.arguments)

    case 'updatePatent':
      await requirePermission(ctx, 'dept-research:patent:update')
      return await updatePatent(ctx, event.arguments)

    case 'deletePatent':
      await requirePermission(ctx, 'dept-research:patent:delete')
      return await deletePatent(ctx, event.arguments)

    // ── FacultyResearchSummary ────────────────────
    case 'listFacultyResearchSummaries':
      return await listFacultyResearchSummaries(ctx, event.arguments)

    case 'createFacultyResearchSummary':
      await requirePermission(ctx, 'dept-research:research-summary:create')
      return await createFacultyResearchSummary(ctx, event.arguments)

    case 'updateFacultyResearchSummary':
      await requirePermission(ctx, 'dept-research:research-summary:update')
      return await updateFacultyResearchSummary(ctx, event.arguments)

    case 'deleteFacultyResearchSummary':
      await requirePermission(ctx, 'dept-research:research-summary:delete')
      return await deleteFacultyResearchSummary(ctx, event.arguments)

    // ── PhdGuide ──────────────────────────────────
    case 'listPhdGuides':
      return await listPhdGuides(ctx, event.arguments)

    case 'createPhdGuide':
      await requirePermission(ctx, 'dept-research:phd-guide:create')
      return await createPhdGuide(ctx, event.arguments)

    case 'updatePhdGuide':
      await requirePermission(ctx, 'dept-research:phd-guide:update')
      return await updatePhdGuide(ctx, event.arguments)

    case 'deletePhdGuide':
      await requirePermission(ctx, 'dept-research:phd-guide:delete')
      return await deletePhdGuide(ctx, event.arguments)

    // ── PhdScholar ────────────────────────────────
    case 'listPhdScholars':
      return await listPhdScholars(ctx, event.arguments)

    case 'createPhdScholar':
      await requirePermission(ctx, 'dept-research:phd-scholar:create')
      return await createPhdScholar(ctx, event.arguments)

    case 'updatePhdScholar':
      await requirePermission(ctx, 'dept-research:phd-scholar:update')
      return await updatePhdScholar(ctx, event.arguments)

    case 'deletePhdScholar':
      await requirePermission(ctx, 'dept-research:phd-scholar:delete')
      return await deletePhdScholar(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)


/* ─────────────────────────────
   PublicationProfile
─────────────────────────────*/

async function listPublicationProfiles(ctx, args) {
  const validated   = validate(listPublicationProfilesSchema, args || {})
  const resolvedCtx = validated.tenantId ? { ...ctx, tenant_id: validated.tenantId } : ctx

  const query = { deptId: validated.deptId }
  const sort  = buildSort('createdAt', 'asc')

  const result = await publicationProfileRepo.findMany(resolvedCtx, query, { sort })

  return {
    items:     result.items.map(toPublicationProfileResponse),
    nextToken: result.nextCursor
  }
}

async function deletePublicationProfile(ctx, args) {
  const { publicationProfileId } = validate(deletePublicationProfileSchema, args || {})
  const existing = await publicationProfileRepo.findById(ctx, publicationProfileId)
  if (!existing) throw new NotFoundError('Publication profile not found')
  await publicationProfileRepo.deleteById(ctx, publicationProfileId)
  return toPublicationProfileResponse(existing)
}

async function savePublicationProfile(ctx, args) {
  const input = validate(savePublicationProfileSchema, args || {})
  const { deptId, facultyId, googleScholarLink, irinsLink } = input.input

  const doc = await PublicationProfile.findOneAndUpdate(
    { tenant_id: ctx.tenant_id, deptId, facultyId },
    {
      $set: {
        tenant_id:         ctx.tenant_id,
        deptId,
        facultyId,
        googleScholarLink: googleScholarLink ?? '',
        irinsLink:         irinsLink         ?? '',
        created_by:        ctx.user_id
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return toPublicationProfileResponse(doc)
}


/* ─────────────────────────────
   ResearchGrant
─────────────────────────────*/

async function listResearchGrants(ctx, args) {
  const validated   = validate(listResearchGrantsSchema, args || {})
  const resolvedCtx = validated.tenantId ? { ...ctx, tenant_id: validated.tenantId } : ctx
  const query       = buildTextQuery(validated)
  const sort        = buildSort(validated.sortBy, validated.sortOrder)

  const result = await researchGrantRepo.findMany(resolvedCtx, query, { sort })

  return {
    items:     result.items.map(toResearchGrantResponse),
    nextToken: result.nextCursor
  }
}

async function createResearchGrant(ctx, args) {
  const { deptId, text } = validate(createResearchGrantSchema, args?.input || {})

  const research_grant_id = generateId()

  const created = await researchGrantRepo.create(ctx, {
    research_grant_id,
    deptId,
    text,
    created_by: ctx.user_id
  })

  return toResearchGrantResponse(created)
}

async function updateResearchGrant(ctx, args) {
  const { researchGrantId, text } = validate(updateResearchGrantSchema, args?.input || {})

  const existing = await researchGrantRepo.findById(ctx, researchGrantId)
  if (!existing) throw new NotFoundError('Research grant not found')

  const updated = await researchGrantRepo.updateById(ctx, researchGrantId, { text })

  return toResearchGrantResponse(updated)
}

async function deleteResearchGrant(ctx, args) {
  const { researchGrantId } = validate(deleteResearchGrantSchema, args || {})

  const existing = await researchGrantRepo.findById(ctx, researchGrantId)
  if (!existing) throw new NotFoundError('Research grant not found')

  await researchGrantRepo.deleteById(ctx, researchGrantId)

  return toResearchGrantResponse(existing)
}


/* ─────────────────────────────
   Patent
─────────────────────────────*/

async function listPatents(ctx, args) {
  const validated   = validate(listPatentsSchema, args || {})
  const resolvedCtx = validated.tenantId ? { ...ctx, tenant_id: validated.tenantId } : ctx
  const query       = buildTextQuery(validated)
  const sort        = buildSort(validated.sortBy, validated.sortOrder)

  const result = await patentRepo.findMany(resolvedCtx, query, { sort })

  return {
    items:     result.items.map(toPatentResponse),
    nextToken: result.nextCursor
  }
}

async function createPatent(ctx, args) {
  const { deptId, text } = validate(createPatentSchema, args?.input || {})

  const patent_id = generateId()

  const created = await patentRepo.create(ctx, {
    patent_id,
    deptId,
    text,
    created_by: ctx.user_id
  })

  return toPatentResponse(created)
}

async function updatePatent(ctx, args) {
  const { patentId, text } = validate(updatePatentSchema, args?.input || {})

  const existing = await patentRepo.findById(ctx, patentId)
  if (!existing) throw new NotFoundError('Patent not found')

  const updated = await patentRepo.updateById(ctx, patentId, { text })

  return toPatentResponse(updated)
}

async function deletePatent(ctx, args) {
  const { patentId } = validate(deletePatentSchema, args || {})

  const existing = await patentRepo.findById(ctx, patentId)
  if (!existing) throw new NotFoundError('Patent not found')

  await patentRepo.deleteById(ctx, patentId)

  return toPatentResponse(existing)
}


/* ─────────────────────────────
   FacultyResearchSummary
─────────────────────────────*/

async function listFacultyResearchSummaries(ctx, args) {
  const validated   = validate(listFacultyResearchSummariesSchema, args || {})
  const resolvedCtx = validated.tenantId ? { ...ctx, tenant_id: validated.tenantId } : ctx
  const query       = buildResearchSummaryQuery(validated)
  const sort        = buildSort(validated.sortBy, validated.sortOrder)
  const limit       = Math.min(validated.limit || 100, 100)
  const fullFilter  = { ...query, tenant_id: resolvedCtx.tenant_id }

  const items = await FacultyResearchSummary.find(fullFilter).sort(sort).limit(limit).lean()

  return {
    items:     items.map(toFacultyResearchSummaryResponse),
    nextToken: null
  }
}

async function createFacultyResearchSummary(ctx, args) {
  const input = validate(createFacultyResearchSummarySchema, args || {})
  const data  = input.input

  const faculty_research_summary_id = generateId()

  const created = await facultyResearchSummaryRepo.create(ctx, {
    faculty_research_summary_id,
    deptId:               data.deptId,
    facultyId:            data.facultyId,
    researchArea:         data.researchArea         ?? '',
    guideName:            data.guideName            ?? '',
    guideDesignation:     data.guideDesignation     ?? '',
    guideInstitution:     data.guideInstitution     ?? '',
    guideType:            data.guideType            ?? 'internal',
    thesisTitle:          data.thesisTitle          ?? '',
    university:           data.university           ?? '',
    yearOfRegistration:   data.yearOfRegistration   ?? null,
    courseWorkCompleted:  data.courseWorkCompleted   ?? false,
    prePhDVivaVoce:       data.prePhDVivaVoce        ?? false,
    finalThesisSubmitted: data.finalThesisSubmitted  ?? false,
    researchStatus:       data.researchStatus        ?? '',
    thesisDocumentUrl:    data.thesisDocumentUrl     ?? '',
    remarks:              data.remarks               ?? '',
    created_by:           ctx.user_id
  })

  return toFacultyResearchSummaryResponse(created)
}

async function updateFacultyResearchSummary(ctx, args) {
  const input = validate(updateFacultyResearchSummarySchema, args || {})
  const { facultyResearchSummaryId, ...fields } = input.input

  const existing = await facultyResearchSummaryRepo.findById(ctx, facultyResearchSummaryId)
  if (!existing) throw new NotFoundError('Faculty research summary not found')

  const updates = {}
  if (fields.researchArea         !== undefined) updates.researchArea         = fields.researchArea
  if (fields.guideName            !== undefined) updates.guideName            = fields.guideName
  if (fields.guideDesignation     !== undefined) updates.guideDesignation     = fields.guideDesignation
  if (fields.guideInstitution     !== undefined) updates.guideInstitution     = fields.guideInstitution
  if (fields.guideType            !== undefined) updates.guideType            = fields.guideType
  if (fields.thesisTitle          !== undefined) updates.thesisTitle          = fields.thesisTitle
  if (fields.university           !== undefined) updates.university           = fields.university
  if (fields.yearOfRegistration   !== undefined) updates.yearOfRegistration   = fields.yearOfRegistration
  if (fields.yearOfDegreeAwarded  !== undefined) updates.yearOfDegreeAwarded  = fields.yearOfDegreeAwarded
  if (fields.courseWorkCompleted  !== undefined) updates.courseWorkCompleted  = fields.courseWorkCompleted
  if (fields.prePhDVivaVoce       !== undefined) updates.prePhDVivaVoce       = fields.prePhDVivaVoce
  if (fields.finalThesisSubmitted !== undefined) updates.finalThesisSubmitted = fields.finalThesisSubmitted
  if (fields.researchStatus       !== undefined) updates.researchStatus       = fields.researchStatus
  if (fields.thesisDocumentUrl    !== undefined) updates.thesisDocumentUrl    = fields.thesisDocumentUrl
  if (fields.remarks              !== undefined) updates.remarks              = fields.remarks

  const updated = await facultyResearchSummaryRepo.updateById(ctx, facultyResearchSummaryId, updates)

  return toFacultyResearchSummaryResponse(updated)
}

async function deleteFacultyResearchSummary(ctx, args) {
  const { facultyResearchSummaryId } = validate(deleteFacultyResearchSummarySchema, args || {})

  const existing = await facultyResearchSummaryRepo.findById(ctx, facultyResearchSummaryId)
  if (!existing) throw new NotFoundError('Faculty research summary not found')

  await facultyResearchSummaryRepo.deleteById(ctx, facultyResearchSummaryId)

  return toFacultyResearchSummaryResponse(existing)
}


/* ─────────────────────────────
   PhdGuide
─────────────────────────────*/

async function listPhdGuides(ctx, args) {
  const validated   = validate(listPhdGuidesSchema, args || {})
  const resolvedCtx = validated.tenantId ? { ...ctx, tenant_id: validated.tenantId } : ctx
  const query       = buildPhdGuideQuery(validated)
  const sort        = buildSort(validated.sortBy, validated.sortOrder)

  const result = await phdGuideRepo.findMany(resolvedCtx, query, { sort })

  return {
    items:     result.items.map(toPhdGuideResponse),
    nextToken: result.nextCursor
  }
}

async function createPhdGuide(ctx, args) {
  const input = validate(createPhdGuideSchema, args || {})
  const { deptId, facultyName, university, recognizedYear, scholarsGuided, ongoingScholars } = input.input

  const phd_guide_id = generateId()

  const created = await phdGuideRepo.create(ctx, {
    phd_guide_id,
    deptId,
    facultyName,
    university:      university      ?? '',
    recognizedYear:  recognizedYear  ?? null,
    scholarsGuided:  scholarsGuided  ?? 0,
    ongoingScholars: ongoingScholars ?? 0,
    created_by:      ctx.user_id
  })

  return toPhdGuideResponse(created)
}

async function updatePhdGuide(ctx, args) {
  const input = validate(updatePhdGuideSchema, args || {})
  const { phdGuideId, ...fields } = input.input

  const existing = await phdGuideRepo.findById(ctx, phdGuideId)
  if (!existing) throw new NotFoundError('PhD guide not found')

  const updates = {}
  if (fields.facultyName     !== undefined) updates.facultyName     = fields.facultyName
  if (fields.university      !== undefined) updates.university      = fields.university
  if (fields.recognizedYear  !== undefined) updates.recognizedYear  = fields.recognizedYear
  if (fields.scholarsGuided  !== undefined) updates.scholarsGuided  = fields.scholarsGuided
  if (fields.ongoingScholars !== undefined) updates.ongoingScholars = fields.ongoingScholars

  const updated = await phdGuideRepo.updateById(ctx, phdGuideId, updates)

  return toPhdGuideResponse(updated)
}

async function deletePhdGuide(ctx, args) {
  const { phdGuideId } = validate(deletePhdGuideSchema, args || {})

  const existing = await phdGuideRepo.findById(ctx, phdGuideId)
  if (!existing) throw new NotFoundError('PhD guide not found')

  await phdGuideRepo.deleteById(ctx, phdGuideId)

  return toPhdGuideResponse(existing)
}


/* ─────────────────────────────
   PhdScholar
─────────────────────────────*/

async function listPhdScholars(ctx, args) {
  const validated   = validate(listPhdScholarsSchema, args || {})
  const resolvedCtx = validated.tenantId ? { ...ctx, tenant_id: validated.tenantId } : ctx
  const query       = buildPhdScholarQuery(validated)
  const sort        = buildSort(validated.sortBy, validated.sortOrder)

  const result = await phdScholarRepo.findMany(resolvedCtx, query, { sort })

  return {
    items:     result.items.map(toPhdScholarResponse),
    nextToken: result.nextCursor
  }
}

async function createPhdScholar(ctx, args) {
  const input = validate(createPhdScholarSchema, args || {})
  const data  = input.input

  const phd_scholar_id = generateId()

  const created = await phdScholarRepo.create(ctx, {
    phd_scholar_id,
    deptId:               data.deptId,
    guideFacultyId:       data.guideFacultyId,
    scholarName:          data.scholarName,
    institution:          data.institution          ?? '',
    department:           data.department           ?? '',
    yearOfRegistration:   data.yearOfRegistration   ?? null,
    thesisTitle:          data.thesisTitle          ?? '',
    courseWorkCompleted:  data.courseWorkCompleted   ?? false,
    prePhdViva:           data.prePhdViva            ?? false,
    finalThesisSubmitted: data.finalThesisSubmitted  ?? false,
    status:               data.status               ?? 'guiding',
    created_by:           ctx.user_id
  })

  return toPhdScholarResponse(created)
}

async function updatePhdScholar(ctx, args) {
  const input = validate(updatePhdScholarSchema, args || {})
  const { phdScholarId, ...fields } = input.input

  const existing = await phdScholarRepo.findById(ctx, phdScholarId)
  if (!existing) throw new NotFoundError('PhD scholar not found')

  const updates = {}
  if (fields.scholarName          !== undefined) updates.scholarName          = fields.scholarName
  if (fields.institution          !== undefined) updates.institution          = fields.institution
  if (fields.department           !== undefined) updates.department           = fields.department
  if (fields.yearOfRegistration   !== undefined) updates.yearOfRegistration   = fields.yearOfRegistration
  if (fields.thesisTitle          !== undefined) updates.thesisTitle          = fields.thesisTitle
  if (fields.yearOfDegreeAwarded  !== undefined) updates.yearOfDegreeAwarded  = fields.yearOfDegreeAwarded
  if (fields.courseWorkCompleted  !== undefined) updates.courseWorkCompleted  = fields.courseWorkCompleted
  if (fields.prePhdViva           !== undefined) updates.prePhdViva           = fields.prePhdViva
  if (fields.finalThesisSubmitted !== undefined) updates.finalThesisSubmitted = fields.finalThesisSubmitted
  if (fields.status               !== undefined) updates.status               = fields.status

  const updated = await phdScholarRepo.updateById(ctx, phdScholarId, updates)

  return toPhdScholarResponse(updated)
}

async function deletePhdScholar(ctx, args) {
  const { phdScholarId } = validate(deletePhdScholarSchema, args || {})

  const existing = await phdScholarRepo.findById(ctx, phdScholarId)
  if (!existing) throw new NotFoundError('PhD scholar not found')

  await phdScholarRepo.deleteById(ctx, phdScholarId)

  return toPhdScholarResponse(existing)
}
