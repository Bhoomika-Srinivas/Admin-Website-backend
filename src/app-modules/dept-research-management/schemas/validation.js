const Joi = require("joi")
const currentYear = new Date().getFullYear()

/* ─────────────────────────────
   PublicationProfile Schemas
─────────────────────────────*/

const listPublicationProfilesSchema = Joi.object({
  deptId:   Joi.string().required(),
  tenantId: Joi.string().optional()
})

const deletePublicationProfileSchema = Joi.object({
  publicationProfileId: Joi.string().required()
})

const savePublicationProfileSchema = Joi.object({
  input: Joi.object({
    deptId:            Joi.string().required(),
    facultyId:         Joi.string().required(),
    googleScholarLink: Joi.string().optional().allow(""),
    irinsLink:         Joi.string().optional().allow("")
  }).required()
})


/* ─────────────────────────────
   ResearchGrant Schemas
─────────────────────────────*/

const listResearchGrantsSchema = Joi.object({
  deptId:    Joi.string().required(),
  tenantId:  Joi.string().optional(),
  search:    Joi.string().optional().allow(""),
  sortBy:    Joi.string().valid("createdAt").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
})

const createResearchGrantSchema = Joi.object({
  deptId: Joi.string().required(),
  text:   Joi.string().min(5).required()
})

const updateResearchGrantSchema = Joi.object({
  researchGrantId: Joi.string().required(),
  text:            Joi.string().min(5).required()
})

const deleteResearchGrantSchema = Joi.object({
  researchGrantId: Joi.string().required()
})


/* ─────────────────────────────
   Patent Schemas
─────────────────────────────*/

const listPatentsSchema = Joi.object({
  deptId:    Joi.string().required(),
  tenantId:  Joi.string().optional(),
  search:    Joi.string().optional().allow(""),
  sortBy:    Joi.string().valid("createdAt").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
})

const createPatentSchema = Joi.object({
  deptId: Joi.string().required(),
  text:   Joi.string().min(5).required()
})

const updatePatentSchema = Joi.object({
  patentId: Joi.string().required(),
  text:     Joi.string().min(5).required()
})

const deletePatentSchema = Joi.object({
  patentId: Joi.string().required()
})


/* ─────────────────────────────
   FacultyResearchSummary Schemas
─────────────────────────────*/

const listFacultyResearchSummariesSchema = Joi.object({
  deptId:     Joi.string().required(),
  tenantId:   Joi.string().optional(),
  search:     Joi.string().optional().allow(""),
  guideType:  Joi.string().valid("internal", "external").optional(),
  sortBy:     Joi.string().valid("yearOfRegistration", "yearOfDegreeAwarded", "createdAt").optional(),
  sortOrder:  Joi.string().valid("asc", "desc").optional(),
  limit:      Joi.number().integer().min(1).max(100).optional(),
  nextToken:  Joi.string().optional(),
  pagination: Joi.object().optional()
})

const createFacultyResearchSummarySchema = Joi.object({
  input: Joi.object({
    deptId:               Joi.string().required(),
    facultyId:            Joi.string().required(),
    researchArea:         Joi.string().optional(),
    guideName:            Joi.string().optional(),
    guideDesignation:     Joi.string().optional(),
    guideInstitution:     Joi.string().optional(),
    guideType:            Joi.string().valid("internal", "external").optional(),
    thesisTitle:          Joi.string().optional(),
    university:           Joi.string().optional(),
    yearOfRegistration:   Joi.number().integer().min(1950).max(currentYear).optional(),
    courseWorkCompleted:  Joi.boolean().optional(),
    prePhDVivaVoce:       Joi.boolean().optional(),
    finalThesisSubmitted: Joi.boolean().optional(),
    researchStatus:       Joi.string().optional(),
    thesisDocumentUrl:    Joi.string().optional().allow(""),
    remarks:              Joi.string().optional().allow("")
  }).required()
})

const updateFacultyResearchSummarySchema = Joi.object({
  input: Joi.object({
    facultyResearchSummaryId: Joi.string().required(),
    researchArea:         Joi.string().optional().allow(null, ""),
    guideName:            Joi.string().optional().allow(null, ""),
    guideDesignation:     Joi.string().optional().allow(null, ""),
    guideInstitution:     Joi.string().optional().allow(null, ""),
    guideType:            Joi.string().valid("internal", "external").optional().allow(null),
    thesisTitle:          Joi.string().optional().allow(null, ""),
    university:           Joi.string().optional().allow(null, ""),
    yearOfRegistration:   Joi.number().integer().min(1950).max(currentYear).optional().allow(null),
    yearOfDegreeAwarded:  Joi.number().integer().min(1950).max(currentYear).optional().allow(null),
    courseWorkCompleted:  Joi.boolean().optional().allow(null),
    prePhDVivaVoce:       Joi.boolean().optional().allow(null),
    finalThesisSubmitted: Joi.boolean().optional().allow(null),
    researchStatus:       Joi.string().optional().allow(null, ""),
    thesisDocumentUrl:    Joi.string().optional().allow(null, ""),
    remarks:              Joi.string().optional().allow(null, "")
  }).required()
})

const deleteFacultyResearchSummarySchema = Joi.object({
  facultyResearchSummaryId: Joi.string().required()
})


/* ─────────────────────────────
   PhdGuide Schemas
─────────────────────────────*/

const listPhdGuidesSchema = Joi.object({
  deptId:    Joi.string().required(),
  tenantId:  Joi.string().optional(),
  search:    Joi.string().optional().allow(""),
  sortBy:    Joi.string().valid("facultyName", "recognizedYear", "scholarsGuided").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
})

const createPhdGuideSchema = Joi.object({
  input: Joi.object({
    deptId:          Joi.string().required(),
    facultyName:     Joi.string().min(2).required(),
    university:      Joi.string().optional(),
    recognizedYear:  Joi.number().integer().min(1950).max(currentYear).optional(),
    scholarsGuided:  Joi.number().integer().min(0).optional(),
    ongoingScholars: Joi.number().integer().min(0).optional()
  }).required()
})

const updatePhdGuideSchema = Joi.object({
  input: Joi.object({
    phdGuideId:      Joi.string().required(),
    facultyName:     Joi.string().min(2).optional(),
    university:      Joi.string().optional(),
    recognizedYear:  Joi.number().integer().min(1950).max(currentYear).optional(),
    scholarsGuided:  Joi.number().integer().min(0).optional(),
    ongoingScholars: Joi.number().integer().min(0).optional()
  }).required()
})

const deletePhdGuideSchema = Joi.object({
  phdGuideId: Joi.string().required()
})


/* ─────────────────────────────
   PhdScholar Schemas
─────────────────────────────*/

const listPhdScholarsSchema = Joi.object({
  deptId:         Joi.string().required(),
  tenantId:       Joi.string().optional(),
  search:         Joi.string().optional().allow(""),
  guideFacultyId: Joi.string().optional(),
  status:         Joi.string().valid("guided", "guiding").optional(),
  sortBy:         Joi.string().valid("scholarName", "yearOfRegistration", "createdAt").optional(),
  sortOrder:      Joi.string().valid("asc", "desc").optional()
})

const createPhdScholarSchema = Joi.object({
  input: Joi.object({
    deptId:               Joi.string().required(),
    guideFacultyId:       Joi.string().required(),
    scholarName:          Joi.string().min(2).required(),
    institution:          Joi.string().optional(),
    department:           Joi.string().optional(),
    yearOfRegistration:   Joi.number().integer().min(1950).max(currentYear).optional(),
    thesisTitle:          Joi.string().optional(),
    courseWorkCompleted:  Joi.boolean().optional(),
    prePhdViva:           Joi.boolean().optional(),
    finalThesisSubmitted: Joi.boolean().optional(),
    status:               Joi.string().valid("guided", "guiding").optional()
  }).required()
})

const updatePhdScholarSchema = Joi.object({
  input: Joi.object({
    phdScholarId:         Joi.string().required(),
    scholarName:          Joi.string().min(2).optional(),
    institution:          Joi.string().optional(),
    department:           Joi.string().optional(),
    yearOfRegistration:   Joi.number().integer().min(1950).max(currentYear).optional(),
    thesisTitle:          Joi.string().optional(),
    yearOfDegreeAwarded:  Joi.number().integer().min(1950).max(currentYear).optional(),
    courseWorkCompleted:  Joi.boolean().optional(),
    prePhdViva:           Joi.boolean().optional(),
    finalThesisSubmitted: Joi.boolean().optional(),
    status:               Joi.string().valid("guided", "guiding").optional()
  }).required()
})

const deletePhdScholarSchema = Joi.object({
  phdScholarId: Joi.string().required()
})


module.exports = {
  // PublicationProfile
  listPublicationProfilesSchema,
  savePublicationProfileSchema,
  deletePublicationProfileSchema,

  // ResearchGrant
  listResearchGrantsSchema,
  createResearchGrantSchema,
  updateResearchGrantSchema,
  deleteResearchGrantSchema,

  // Patent
  listPatentsSchema,
  createPatentSchema,
  updatePatentSchema,
  deletePatentSchema,

  // FacultyResearchSummary
  listFacultyResearchSummariesSchema,
  createFacultyResearchSummarySchema,
  updateFacultyResearchSummarySchema,
  deleteFacultyResearchSummarySchema,

  // PhdGuide
  listPhdGuidesSchema,
  createPhdGuideSchema,
  updatePhdGuideSchema,
  deletePhdGuideSchema,

  // PhdScholar
  listPhdScholarsSchema,
  createPhdScholarSchema,
  updatePhdScholarSchema,
  deletePhdScholarSchema
}
