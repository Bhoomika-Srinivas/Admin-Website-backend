const Joi = require('joi')

const SCHOLARSHIP_TYPES = ['STATE', 'GOVERNMENT_OF_INDIA', 'INSTITUTIONAL', 'OTHERS']
const INFO_BLOCK_TYPES  = ['PHONE', 'OFFICE_HOURS', 'EMAIL']
const ENQUIRY_STATUSES  = ['NEW', 'CONTACTED', 'CLOSED']

/* ─── Query helpers (optional tenantId override) ───────────────────────────── */

const tenantIdQuerySchema = Joi.object({
  tenantId: Joi.string().allow(null),
})

/* ─── Overview ─────────────────────────────────────────────────────────────── */

const saveAdmissionsOverviewSchema = Joi.object({
  input: Joi.object({
    headline:    Joi.string().allow('', null),
    subheadline: Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    highlights:  Joi.array().items(Joi.string()).allow(null),
    imageUrl:    Joi.string().allow('', null),
    bannerUrl:   Joi.string().allow('', null),
  }).required(),
})

/* ─── Programs ──────────────────────────────────────────────────────────────── */

const listAdmissionsProgramsSchema = Joi.object({
  level: Joi.string().allow('', null),
  tenantId: Joi.string().allow(null),
})

const createAdmissionsProgramSchema = Joi.object({
  input: Joi.object({
    level:       Joi.string().required(),
    name:        Joi.string().required(),
    duration:    Joi.string().allow('', null),
    seats:       Joi.number().integer().min(0).allow(null),
    description: Joi.string().allow('', null),
    eligibility: Joi.string().allow('', null),
    order:       Joi.number().integer().allow(null),
  }).required(),
})

const updateAdmissionsProgramSchema = Joi.object({
  input: Joi.object({
    programId:   Joi.string().required(),
    level:       Joi.string().allow('', null),
    name:        Joi.string().allow('', null),
    duration:    Joi.string().allow('', null),
    seats:       Joi.number().integer().min(0).allow(null),
    description: Joi.string().allow('', null),
    eligibility: Joi.string().allow('', null),
    order:       Joi.number().integer().allow(null),
  }).required(),
})

const deleteAdmissionsProgramSchema = Joi.object({
  programId: Joi.string().required(),
})

/* ─── UG Courses ────────────────────────────────────────────────────────────── */

const createUGCourseSchema = Joi.object({
  input: Joi.object({
    name:        Joi.string().required(),
    code:        Joi.string().allow('', null),
    duration:    Joi.string().allow('', null),
    seats:       Joi.number().integer().min(0).allow(null),
    description: Joi.string().allow('', null),
    order:       Joi.number().integer().allow(null),
  }).required(),
})

const updateUGCourseSchema = Joi.object({
  input: Joi.object({
    courseId:    Joi.string().required(),
    name:        Joi.string().allow('', null),
    code:        Joi.string().allow('', null),
    duration:    Joi.string().allow('', null),
    seats:       Joi.number().integer().min(0).allow(null),
    description: Joi.string().allow('', null),
    order:       Joi.number().integer().allow(null),
  }).required(),
})

const deleteUGCourseSchema = Joi.object({
  courseId: Joi.string().required(),
})

/* ─── PG Courses ────────────────────────────────────────────────────────────── */

const createPGCourseSchema = createUGCourseSchema
const updatePGCourseSchema = updateUGCourseSchema
const deletePGCourseSchema = deleteUGCourseSchema

/* ─── Eligibility Entries ───────────────────────────────────────────────────── */

const createEligibilityEntrySchema = Joi.object({
  input: Joi.object({
    title:       Joi.string().required(),
    description: Joi.string().allow('', null),
    order:       Joi.number().integer().allow(null),
  }).required(),
})

const updateEligibilityEntrySchema = Joi.object({
  input: Joi.object({
    entryId:     Joi.string().required(),
    title:       Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    order:       Joi.number().integer().allow(null),
  }).required(),
})

const deleteEligibilityEntrySchema = Joi.object({
  entryId: Joi.string().required(),
})

/* ─── Steps ─────────────────────────────────────────────────────────────────── */

const createAdmissionStepSchema = Joi.object({
  input: Joi.object({
    title:       Joi.string().required(),
    description: Joi.string().allow('', null),
    iconName:    Joi.string().allow('', null),
    order:       Joi.number().integer().allow(null),
  }).required(),
})

const updateAdmissionStepSchema = Joi.object({
  input: Joi.object({
    stepId:      Joi.string().required(),
    title:       Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    iconName:    Joi.string().allow('', null),
    order:       Joi.number().integer().allow(null),
  }).required(),
})

const deleteAdmissionStepSchema = Joi.object({
  stepId: Joi.string().required(),
})

const reorderAdmissionStepsSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).required(),
})

/* ─── Important Dates ───────────────────────────────────────────────────────── */

const createImportantDateSchema = Joi.object({
  input: Joi.object({
    event:       Joi.string().required(),
    date:        Joi.string().required(),
    description: Joi.string().allow('', null),
    category:    Joi.string().allow('', null),
  }).required(),
})

const updateImportantDateSchema = Joi.object({
  input: Joi.object({
    dateId:      Joi.string().required(),
    event:       Joi.string().allow('', null),
    date:        Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    category:    Joi.string().allow('', null),
  }).required(),
})

const deleteImportantDateSchema = Joi.object({
  dateId: Joi.string().required(),
})

/* ─── Prospectus ────────────────────────────────────────────────────────────── */

const saveProspectusSchema = Joi.object({
  input: Joi.object({
    title:       Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    fileBase64:  Joi.string().required(),
    fileName:    Joi.string().required(),
  }).required(),
})

/* ─── Fee Documents ─────────────────────────────────────────────────────────── */

const createFeeDocumentSchema = Joi.object({
  input: Joi.object({
    title:      Joi.string().required(),
    fileBase64: Joi.string().required(),
    fileName:   Joi.string().required(),
  }).required(),
})

const updateFeeDocumentSchema = Joi.object({
  input: Joi.object({
    feeDocId:   Joi.string().required(),
    title:      Joi.string().allow('', null),
    fileBase64: Joi.string().allow('', null),
    fileName:   Joi.string().allow('', null),
  }).required(),
})

const deleteFeeDocumentSchema = Joi.object({
  feeDocId: Joi.string().required(),
})

/* ─── Scholarships ──────────────────────────────────────────────────────────── */

const createScholarshipSchema = Joi.object({
  input: Joi.object({
    type:        Joi.string().valid(...SCHOLARSHIP_TYPES).required(),
    name:        Joi.string().required(),
    description: Joi.string().allow('', null),
    amount:      Joi.string().allow('', null),
    eligibility: Joi.string().allow('', null),
    order:       Joi.number().integer().allow(null),
  }).required(),
})

const updateScholarshipSchema = Joi.object({
  input: Joi.object({
    scholarshipId: Joi.string().required(),
    type:          Joi.string().valid(...SCHOLARSHIP_TYPES).allow(null),
    name:          Joi.string().allow('', null),
    description:   Joi.string().allow('', null),
    amount:        Joi.string().allow('', null),
    eligibility:   Joi.string().allow('', null),
    order:         Joi.number().integer().allow(null),
  }).required(),
})

const deleteScholarshipSchema = Joi.object({
  scholarshipId: Joi.string().required(),
})

/* ─── Audit Statements ──────────────────────────────────────────────────────── */

const createAuditStatementSchema = Joi.object({
  input: Joi.object({
    year:       Joi.string().required(),
    title:      Joi.string().required(),
    fileBase64: Joi.string().required(),
    fileName:   Joi.string().required(),
  }).required(),
})

const deleteAuditStatementSchema = Joi.object({
  auditId: Joi.string().required(),
})

/* ─── Enquiries ─────────────────────────────────────────────────────────────── */

const submitAdmissionsEnquirySchema = Joi.object({
  input: Joi.object({
    tenantId: Joi.string().required(),
    name:     Joi.string().required(),
    email:    Joi.string().email({ tlds: { allow: false } }).required(),
    phone:    Joi.string().allow('', null),
    program:  Joi.string().allow('', null),
    message:  Joi.string().allow('', null),
  }).required(),
})

const listAdmissionsEnquiriesSchema = Joi.object({
  status: Joi.string().valid(...ENQUIRY_STATUSES).allow(null),
  tenantId: Joi.string().allow(null),
})

const updateEnquiryStatusSchema = Joi.object({
  enquiryId: Joi.string().required(),
  status:    Joi.string().valid(...ENQUIRY_STATUSES).required(),
})

/* ─── Contacts ──────────────────────────────────────────────────────────────── */

const updateAdmissionsContactSchema = Joi.object({
  contactId: Joi.string().required(),
  input: Joi.object({
    name:           Joi.string().allow('', null),
    phone:          Joi.string().allow('', null),
    email:          Joi.string().email({ tlds: { allow: false } }).allow('', null),
    officeLocation: Joi.string().allow('', null),
  }).required(),
})

/* ─── WhyEnquire ────────────────────────────────────────────────────────────── */

const saveWhyEnquireSchema = Joi.object({
  input: Joi.object({
    title:  Joi.string().allow('', null),
    points: Joi.array().items(Joi.string()).allow(null),
  }).required(),
})

/* ─── EnquiryCategory ───────────────────────────────────────────────────────── */

const createEnquiryCategorySchema = Joi.object({
  input: Joi.object({
    title:       Joi.string().required(),
    description: Joi.string().allow('', null),
  }).required(),
})

const updateEnquiryCategorySchema = Joi.object({
  input: Joi.object({
    categoryId:  Joi.string().required(),
    title:       Joi.string().allow('', null),
    description: Joi.string().allow('', null),
  }).required(),
})

const deleteEnquiryCategorySchema = Joi.object({
  categoryId: Joi.string().required(),
})

/* ─── InfoBlock ─────────────────────────────────────────────────────────────── */

const createInfoBlockSchema = Joi.object({
  input: Joi.object({
    type:        Joi.string().valid(...INFO_BLOCK_TYPES).required(),
    description: Joi.string().required(),
  }).required(),
})

const updateInfoBlockSchema = Joi.object({
  input: Joi.object({
    blockId:     Joi.string().required(),
    type:        Joi.string().valid(...INFO_BLOCK_TYPES).allow(null),
    description: Joi.string().allow('', null),
  }).required(),
})

const deleteInfoBlockSchema = Joi.object({
  blockId: Joi.string().required(),
})

/* ─── Exports ───────────────────────────────────────────────────────────────── */

module.exports = {
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
}
