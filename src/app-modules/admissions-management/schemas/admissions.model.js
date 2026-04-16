const mongoose = require('mongoose')
const { Schema } = mongoose

/* ─────────────────────────────
   AdmissionsOverview  (singleton per tenant)
─────────────────────────────*/
const admissionsOverviewSchema = new Schema({
  tenant_id:   { type: String, required: true, unique: true },
  headline:    String,
  subheadline: String,
  description: String,
  highlights:  [String],
  image_url:   String,
  banner_url:  String,
}, { timestamps: true, collection: 'admissions_overview' })

/* ─────────────────────────────
   AdmissionsProgram
─────────────────────────────*/
const admissionsProgramSchema = new Schema({
  tenant_id:   { type: String, required: true },
  program_id:  { type: String, required: true },
  level:       { type: String, required: true },
  name:        { type: String, required: true },
  duration:    String,
  seats:       Number,
  description: String,
  eligibility: String,
  order:       Number,
}, { timestamps: true, collection: 'admissions_programs' })
admissionsProgramSchema.index({ tenant_id: 1, program_id: 1 }, { unique: true })
admissionsProgramSchema.index({ tenant_id: 1, level: 1, order: 1 }) // List with filtering
admissionsProgramSchema.index({ tenant_id: 1, createdAt: -1 }) // Pagination

/* ─────────────────────────────
   UGCourse
─────────────────────────────*/
const ugCourseSchema = new Schema({
  tenant_id:   { type: String, required: true },
  course_id:   { type: String, required: true },
  name:        { type: String, required: true },
  code:        String,
  duration:    String,
  seats:       Number,
  description: String,
  order:       Number,
}, { timestamps: true, collection: 'admissions_ug_courses' })
ugCourseSchema.index({ tenant_id: 1, course_id: 1 }, { unique: true })
ugCourseSchema.index({ tenant_id: 1, order: 1 })
ugCourseSchema.index({ tenant_id: 1, createdAt: -1 })

/* ─────────────────────────────
   PGCourse
─────────────────────────────*/
const pgCourseSchema = new Schema({
  tenant_id:   { type: String, required: true },
  course_id:   { type: String, required: true },
  name:        { type: String, required: true },
  code:        String,
  duration:    String,
  seats:       Number,
  description: String,
  order:       Number,
}, { timestamps: true, collection: 'admissions_pg_courses' })
pgCourseSchema.index({ tenant_id: 1, course_id: 1 }, { unique: true })
pgCourseSchema.index({ tenant_id: 1, order: 1 })
pgCourseSchema.index({ tenant_id: 1, createdAt: -1 })

/* ─────────────────────────────
   EligibilityEntry  (replaces singleton eligibility)
─────────────────────────────*/
const eligibilityEntrySchema = new Schema({
  tenant_id:   { type: String, required: true },
  entry_id:    { type: String, required: true },
  title:       { type: String, required: true },
  description: String,
  order:       Number,
}, { timestamps: true, collection: 'admissions_eligibility_entries' })
eligibilityEntrySchema.index({ tenant_id: 1, entry_id: 1 }, { unique: true })
eligibilityEntrySchema.index({ tenant_id: 1, order: 1 })

/* ─────────────────────────────
   AdmissionStep
─────────────────────────────*/
const admissionStepSchema = new Schema({
  tenant_id:   { type: String, required: true },
  step_id:     { type: String, required: true },
  title:       { type: String, required: true },
  description: String,
  icon_name:   String,
  order:       { type: Number, required: true },
}, { timestamps: true, collection: 'admission_steps' })
admissionStepSchema.index({ tenant_id: 1, step_id: 1 }, { unique: true })
admissionStepSchema.index({ tenant_id: 1, order: 1 })

/* ─────────────────────────────
   ImportantDate
─────────────────────────────*/
const importantDateSchema = new Schema({
  tenant_id:   { type: String, required: true },
  date_id:     { type: String, required: true },
  event:       { type: String, required: true },
  date:        { type: String, required: true },
  description: String,
  category:    String,
}, { timestamps: true, collection: 'admissions_important_dates' })
importantDateSchema.index({ tenant_id: 1, date_id: 1 }, { unique: true })

/* ─────────────────────────────
   Prospectus  (singleton per tenant)
─────────────────────────────*/
const prospectusSchema = new Schema({
  tenant_id:   { type: String, required: true, unique: true },
  title:       String,
  description: String,
  file_url:    { type: String, required: true },
  file_key:    String, // S3 object key for management operations
  file_name:   String,
  uploaded_at: Date,
}, { timestamps: true, collection: 'admissions_prospectus' })

/* ─────────────────────────────
   FeeDocument  (plain list — no category/label)
─────────────────────────────*/
const feeDocumentSchema = new Schema({
  tenant_id:   { type: String, required: true },
  fee_doc_id:  { type: String, required: true },
  title:       { type: String, required: true },
  file_url:    { type: String, required: true },
  file_key:    String, // S3 object key for management operations
  file_name:   String,
  uploaded_at: Date,
}, { timestamps: true, collection: 'admissions_fee_documents' })
feeDocumentSchema.index({ tenant_id: 1, fee_doc_id: 1 }, { unique: true })
feeDocumentSchema.index({ tenant_id: 1, uploaded_at: -1 })

/* ─────────────────────────────
   Scholarship
─────────────────────────────*/
const SCHOLARSHIP_TYPES = ['STATE', 'GOVERNMENT_OF_INDIA', 'INSTITUTIONAL', 'OTHERS']

const scholarshipSchema = new Schema({
  tenant_id:      { type: String, required: true },
  scholarship_id: { type: String, required: true },
  type:           { type: String, required: true, enum: SCHOLARSHIP_TYPES },
  name:           { type: String, required: true },
  description:    String,
  amount:         String,
  eligibility:    String,
  order:          Number,
}, { timestamps: true, collection: 'admissions_scholarships' })
scholarshipSchema.index({ tenant_id: 1, scholarship_id: 1 }, { unique: true })
scholarshipSchema.index({ tenant_id: 1, type: 1, order: 1 })

/* ─────────────────────────────
   AuditStatement
─────────────────────────────*/
const auditStatementSchema = new Schema({
  tenant_id: { type: String, required: true },
  audit_id:  { type: String, required: true },
  year:      { type: String, required: true },
  title:     { type: String, required: true },
  file_url:  { type: String, required: true },
  file_name: String,
}, { timestamps: true, collection: 'admissions_audit_statements' })
auditStatementSchema.index({ tenant_id: 1, audit_id: 1 }, { unique: true })

/* ─────────────────────────────
   AdmissionsEnquiry
─────────────────────────────*/
const admissionsEnquirySchema = new Schema({
  tenant_id:    { type: String, required: true },
  enquiry_id:   { type: String, required: true },
  name:         { type: String, required: true },
  email:        { type: String, required: true },
  phone:        String,
  program:      String,
  message:      String,
  status:       { type: String, enum: ['NEW', 'CONTACTED', 'CLOSED'], default: 'NEW' },
  source_ip:    String,        // For rate limiting and abuse detection
  submitted_at: Date,          // Exact submission time (may differ from createdAt)
}, { timestamps: true, collection: 'admissions_enquiries' })
admissionsEnquirySchema.index({ tenant_id: 1, enquiry_id: 1 }, { unique: true })
admissionsEnquirySchema.index({ tenant_id: 1, status: 1, createdAt: -1 }) // List with status filter
admissionsEnquirySchema.index({ tenant_id: 1, email: 1 }) // Check for duplicate submissions
admissionsEnquirySchema.index({ tenant_id: 1, createdAt: -1 }) // Pagination
admissionsEnquirySchema.index({ email: 1 }) // Rate limiting lookups

/* ─────────────────────────────
   AdmissionsContact
─────────────────────────────*/
const admissionsContactSchema = new Schema({
  tenant_id:       { type: String, required: true },
  contact_id:      { type: String, required: true },
  role:            { type: String, required: true },
  name:            String,
  phone:           String,
  email:           String,
  office_location: String,
}, { timestamps: true, collection: 'admissions_contacts' })
admissionsContactSchema.index({ tenant_id: 1, contact_id: 1 }, { unique: true })

/* ─────────────────────────────
   WhyEnquire  (singleton per tenant)
─────────────────────────────*/
const whyEnquireSchema = new Schema({
  tenant_id: { type: String, required: true, unique: true },
  title:     String,
  points:    [String],
}, { timestamps: true, collection: 'admissions_why_enquire' })

/* ─────────────────────────────
   EnquiryCategory
─────────────────────────────*/
const enquiryCategorySchema = new Schema({
  tenant_id:   { type: String, required: true },
  category_id: { type: String, required: true },
  title:       { type: String, required: true },
  description: String,
}, { timestamps: true, collection: 'admissions_enquiry_categories' })
enquiryCategorySchema.index({ tenant_id: 1, category_id: 1 }, { unique: true })

/* ─────────────────────────────
   InfoBlock
─────────────────────────────*/
const INFO_BLOCK_TYPES = ['PHONE', 'OFFICE_HOURS', 'EMAIL']

const infoBlockSchema = new Schema({
  tenant_id:   { type: String, required: true },
  block_id:    { type: String, required: true },
  type:        { type: String, required: true, enum: INFO_BLOCK_TYPES },
  description: { type: String, required: true },
}, { timestamps: true, collection: 'admissions_info_blocks' })
infoBlockSchema.index({ tenant_id: 1, block_id: 1 }, { unique: true })

/* ─────────────────────────────
   Exports
─────────────────────────────*/
module.exports = {
  AdmissionsOverview:  mongoose.model('AdmissionsOverview',  admissionsOverviewSchema),
  AdmissionsProgram:   mongoose.model('AdmissionsProgram',   admissionsProgramSchema),
  UGCourse:            mongoose.model('UGCourse',            ugCourseSchema),
  PGCourse:            mongoose.model('PGCourse',            pgCourseSchema),
  EligibilityEntry:    mongoose.model('EligibilityEntry',    eligibilityEntrySchema),
  AdmissionStep:       mongoose.model('AdmissionStep',       admissionStepSchema),
  ImportantDate:       mongoose.model('ImportantDate',       importantDateSchema),
  Prospectus:          mongoose.model('Prospectus',          prospectusSchema),
  FeeDocument:         mongoose.model('FeeDocument',         feeDocumentSchema),
  Scholarship:         mongoose.model('Scholarship',         scholarshipSchema),
  AuditStatement:      mongoose.model('AuditStatement',      auditStatementSchema),
  AdmissionsEnquiry:   mongoose.model('AdmissionsEnquiry',   admissionsEnquirySchema),
  AdmissionsContact:   mongoose.model('AdmissionsContact',   admissionsContactSchema),
  WhyEnquire:          mongoose.model('WhyEnquire',          whyEnquireSchema),
  EnquiryCategory:     mongoose.model('EnquiryCategory',     enquiryCategorySchema),
  InfoBlock:           mongoose.model('InfoBlock',           infoBlockSchema),
  SCHOLARSHIP_TYPES,
  INFO_BLOCK_TYPES,
}
