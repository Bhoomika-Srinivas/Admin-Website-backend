const mongoose = require("mongoose")

/* ─── PlacementOverview ─── */
const PlacementOverviewSchema = new mongoose.Schema({
  placement_overview_id: { type: String, index: true },
  tenant_id:             { type: String, required: true, index: true },
  created_by:            { type: String },
  deptId:                { type: String, required: true, index: true },
  academicYear:      { type: String, required: true },
  companiesVisited:  { type: Number, default: 0 },
  studentsInCampus:  { type: Number, default: 0 },
  studentsOffCampus: { type: Number, default: 0 },
  highestPackage:    { type: String },
}, { timestamps: true })

PlacementOverviewSchema.index({ tenant_id: 1, deptId: 1, academicYear: 1 }, { unique: true })

/* ─── StudentPlacement ─── */
const StudentPlacementSchema = new mongoose.Schema({
  student_placement_id: { type: String, index: true },
  tenant_id:            { type: String, required: true, index: true },
  created_by:           { type: String },
  deptId:               { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  usn:         { type: String },
  batch:       { type: String },
  company:     { type: String },
  role:        { type: String },
  package:     { type: Number },
  imageUrl:    { type: String },
}, { timestamps: true })

/* ─── Achievement ─── */
const AchievementSchema = new mongoose.Schema({
  achievement_id: { type: String, index: true },
  tenant_id:      { type: String, required: true, index: true },
  created_by:     { type: String },
  deptId:         { type: String, required: true, index: true },
  type:       { type: String, enum: ["student", "staff"] },
  text:       { type: String, required: true },
}, { timestamps: true })

/* ─── DeptActivity ─── */
const DeptActivitySchema = new mongoose.Schema({
  dept_activity_id: { type: String, index: true },
  tenant_id:        { type: String, required: true, index: true },
  created_by:       { type: String },
  deptId:           { type: String, required: true, index: true },
  type:         { type: String, enum: ["forum", "department"] },
  name:         { type: String, required: true },
  description:  { type: String },
  date:         { type: String },
  venue:        { type: String },
  organizer:    { type: String },
  participants: { type: Number },
}, { timestamps: true })

/* ─── ForumSection ─── */
const ForumSectionSchema = new mongoose.Schema({
  forum_section_id: { type: String, index: true },
  tenant_id:        { type: String, required: true, index: true },
  created_by:       { type: String },
  deptId:           { type: String, required: true, index: true },
  title:       { type: String, required: true },
  description: { type: String },
}, { timestamps: true })

/* ─── ForumEvent ─── */
const ForumEventSchema = new mongoose.Schema({
  forum_event_id: { type: String, index: true },
  tenant_id:      { type: String, required: true, index: true },
  created_by:     { type: String },
  deptId:         { type: String, required: true, index: true },
  title:         { type: String, required: true },
  description:   { type: String },
  attachmentUrl: { type: String },
}, { timestamps: true })

/* ─── DepartmentActivityLog (append-only) ─── */
const DepartmentActivityLogSchema = new mongoose.Schema({
  tenant_id:             { type: String, required: true, index: true },
  created_by:            { type: String },
  deptId:                { type: String, required: true, index: true },
  dept_activity_log_id:  { type: String, index: true },
  text:                  { type: String, required: true },
}, { timestamps: true })

/* ─── DeptNewsletter ─── */
const DeptNewsletterSchema = new mongoose.Schema({
  newsletter_id: { type: String, index: true },
  tenant_id:     { type: String, required: true, index: true },
  created_by:    { type: String },
  deptId:        { type: String, required: true, index: true },
  year:          { type: String, required: true },
  fileUrl:       { type: String },
}, { timestamps: true })

/* ─── DeptGalleryPhoto ─── */
const DeptGalleryPhotoSchema = new mongoose.Schema({
  tenant_id:        { type: String, required: true, index: true },
  created_by:       { type: String },
  deptId:           { type: String, required: true, index: true },
  gallery_photo_id: { type: String, index: true },
  title:            { type: String },
  category:         { type: String },
  imageUrl:         { type: String, required: true },
  capturedAt:       { type: String },
}, { timestamps: true })

const DepartmentActivity = mongoose.model("DepartmentActivityLog", DepartmentActivityLogSchema)
const Newsletter         = mongoose.model("DeptNewsletter",        DeptNewsletterSchema)
const GalleryPhoto       = mongoose.model("DeptGalleryPhoto",      DeptGalleryPhotoSchema)

module.exports = {
  PlacementOverview:     mongoose.model("PlacementOverview",     PlacementOverviewSchema),
  StudentPlacement:      mongoose.model("StudentPlacement",      StudentPlacementSchema),
  Achievement:           mongoose.model("Achievement",           AchievementSchema),
  DeptActivity:          mongoose.model("DeptActivity",          DeptActivitySchema),
  ForumSection:          mongoose.model("ForumSection",          ForumSectionSchema),
  ForumEvent:            mongoose.model("ForumEvent",            ForumEventSchema),
  DepartmentActivityLog: DepartmentActivity,
  DepartmentActivity,
  DeptNewsletter:        Newsletter,
  Newsletter,
  DeptGalleryPhoto:      GalleryPhoto,
  GalleryPhoto,
}
