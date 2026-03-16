const mongoose = require("mongoose")

/* ─── DeptCourse ─── */
const DeptCourseSchema = new mongoose.Schema({
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
  DeptCourse:         mongoose.model("DeptCourse",         DeptCourseSchema),
  DeptTimetable:      mongoose.model("DeptTimetable",      DeptTimetableSchema),
  LearningMaterial:   mongoose.model("LearningMaterial",   LearningMaterialSchema),
  InnovativeTeaching: mongoose.model("InnovativeTeaching", InnovativeTeachingSchema),
  ResultAnalysis:     mongoose.model("ResultAnalysis",     ResultAnalysisSchema),
}
