const mongoose = require("mongoose")

/* ─── DeptSlot ─── */
const DeptSlotSchema = new mongoose.Schema({
  dept_slot_id: { type: String, index: true },
  tenant_id:    { type: String, required: true, index: true },
  created_by:   { type: String },
  deptId:       { type: String, required: true, index: true },
  sectionId:    { type: String, required: true },
  day:          { type: String, required: true, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  period:       { type: Number, required: true, min: 1, max: 7 },
  courseCode:   { type: String, required: true },
  courseName:   { type: String, required: true },
  type:         { type: String, required: true, enum: ['theory', 'lab', 'elective'] },
  facultyId:    { type: String },
}, { timestamps: true })

DeptSlotSchema.index({ tenant_id: 1, sectionId: 1, day: 1, period: 1 }, { unique: true })

/* ─── DeptSection ─── */
const DeptSectionSchema = new mongoose.Schema({
  dept_section_id: { type: String, index: true },
  tenant_id:       { type: String, required: true, index: true },
  created_by:      { type: String },
  deptId:          { type: String, required: true, index: true },
  programId:       { type: String },
  batchName:       { type: String, required: true },
  semester:        { type: Number, required: true },
  name:            { type: String, required: true },
}, { timestamps: true })

/* ─── DeptBatch ─── */
const DeptBatchSchema = new mongoose.Schema({
  dept_batch_id: { type: String, index: true },
  tenant_id:     { type: String, required: true, index: true },
  created_by:    { type: String },
  deptId:        { type: String, required: true, index: true },
  programId:     { type: String },
  name:          { type: String, required: true },
  startYear:     { type: Number },
  endYear:       { type: Number },
}, { timestamps: true })

/* ─── DeptCourse ─── */
const DeptCourseSchema = new mongoose.Schema({
  dept_course_id: { type: String, index: true },
  tenant_id:  { type: String, required: true, index: true },
  created_by: { type: String },
  deptId:     { type: String, required: true, index: true },
  code:       { type: String, required: true },
  name:       { type: String, required: true },
  semester:   { type: Number },
  credits:    { type: Number },
  type:       { type: String, enum: ["theory", "lab", "elective"] },
  scheme:     { type: String },
}, { timestamps: true })

/* ─── DeptTimetable ─── */
const DeptTimetableSchema = new mongoose.Schema({
  dept_timetable_id: { type: String, index: true },
  tenant_id:    { type: String, required: true, index: true },
  created_by:   { type: String },
  deptId:       { type: String, required: true, index: true },
  section:      { type: String },
  semester:     { type: Number },
  academicYear: { type: String },
  fileUrl:      { type: String },
  uploadedAt:   { type: String },
}, { timestamps: true })

/* ─── LearningMaterial ─── */
const LearningMaterialSchema = new mongoose.Schema({
  learning_material_id: { type: String, index: true },
  tenant_id:  { type: String, required: true, index: true },
  created_by: { type: String },
  deptId:     { type: String, required: true, index: true },
  courseCode: { type: String },
  courseName: { type: String },
  title:      { type: String, required: true },
  type:       { type: String, enum: ["notes", "assignment", "question_paper", "reference"] },
  fileUrl:    { type: String },
  uploadedBy: { type: String },
}, { timestamps: true })

/* ─── InnovativeTeaching ─── */
const InnovativeTeachingSchema = new mongoose.Schema({
  innovative_teaching_id: { type: String, index: true },
  tenant_id:     { type: String, required: true, index: true },
  created_by:    { type: String },
  deptId:        { type: String, required: true, index: true },
  facultyName:   { type: String },
  method:        { type: String },
  description:   { type: String },
  courseApplied: { type: String },
  year:          { type: String },
  outcome:       { type: String },
}, { timestamps: true })

/* ─── ResultAnalysis ─── */
const ResultAnalysisSchema = new mongoose.Schema({
  result_analysis_id: { type: String, index: true },
  tenant_id:     { type: String, required: true, index: true },
  created_by:    { type: String },
  deptId:        { type: String, required: true, index: true },
  title:         { type: String, required: true },
  semester:      { type: Number },
  batch:         { type: String },
  pdfUrl:        { type: String },
  graphImageUrl: { type: String },
}, { timestamps: true })

module.exports = {
  DeptSlot:           mongoose.model("DeptSlot",           DeptSlotSchema),
  DeptSection:        mongoose.model("DeptSection",        DeptSectionSchema),
  DeptBatch:          mongoose.model("DeptBatch",          DeptBatchSchema),
  DeptCourse:         mongoose.model("DeptCourse",         DeptCourseSchema),
  DeptTimetable:      mongoose.model("DeptTimetable",      DeptTimetableSchema),
  LearningMaterial:   mongoose.model("LearningMaterial",   LearningMaterialSchema),
  InnovativeTeaching: mongoose.model("InnovativeTeaching", InnovativeTeachingSchema),
  ResultAnalysis:     mongoose.model("ResultAnalysis",     ResultAnalysisSchema),
}
