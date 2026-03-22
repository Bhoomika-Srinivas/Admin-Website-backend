const mongoose = require("mongoose")

/* ─── Event ─── */
const EventSchema = new mongoose.Schema({
  event_id:       { type: String, index: true },
  tenant_id:      { type: String, required: true, index: true },
  created_by:     { type: String },
  deptId:         { type: String, index: true },
  title:          { type: String, required: true },
  date:           { type: String },
  time:           { type: String },
  venue:          { type: String },
  description:    { type: String },
  images:         [{ type: String }],
  pinned:         { type: Boolean, default: false },
  level:          { type: String, enum: ['institutional', 'department'], required: true },
  department:     { type: String },
  status:         { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true })

/* ─── PlacementOverview ─── */
const PlacementOverviewSchema = new mongoose.Schema({
  tenant_id:         { type: String, required: true, index: true },
  created_by:        { type: String },
  deptId:            { type: String, required: true, index: true },
  title:             { type: String },
  academicYear:      { type: String },
  companiesVisited:  { type: Number, default: 0 },
  studentsInCampus:  { type: Number, default: 0 },
  studentsOffCampus: { type: Number, default: 0 },
  highestPackage:    { type: String },
}, { timestamps: true })

/* ─── StudentPlacement ─── */
const StudentPlacementSchema = new mongoose.Schema({
  tenant_id:   { type: String, required: true, index: true },
  created_by:  { type: String },
  deptId:      { type: String, required: true, index: true },
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
  tenant_id:  { type: String, required: true, index: true },
  created_by: { type: String },
  deptId:     { type: String, required: true, index: true },
  type:       { type: String, enum: ["student", "staff"] },
  text:       { type: String, required: true },
}, { timestamps: true })

/* ─── DeptActivity ─── */
const DeptActivitySchema = new mongoose.Schema({
  tenant_id:    { type: String, required: true, index: true },
  created_by:   { type: String },
  deptId:       { type: String, required: true, index: true },
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
  tenant_id:   { type: String, required: true, index: true },
  created_by:  { type: String },
  deptId:      { type: String, required: true, index: true },
  title:       { type: String, required: true },
  description: { type: String },
}, { timestamps: true })

/* ─── ForumEvent ─── */
const ForumEventSchema = new mongoose.Schema({
  tenant_id:   { type: String, required: true, index: true },
  created_by:  { type: String },
  deptId:      { type: String, required: true, index: true },
  title:       { type: String, required: true },
  description: { type: String },
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
  tenant_id:     { type: String, required: true, index: true },
  created_by:    { type: String },
  deptId:        { type: String, required: true, index: true },
  newsletter_id: { type: String, index: true },
  title:         { type: String, required: true },
  volume:        { type: String },
  issue:         { type: String },
  publishedDate: { type: String },
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
  Event:                 mongoose.model("Event",                 EventSchema),
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
