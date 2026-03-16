const mongoose = require("mongoose")

/* ─── DeptIntroduction (upsert by deptId) ─── */
const DeptIntroductionSchema = new mongoose.Schema({
  tenant_id:      { type: String, required: true, index: true },
  created_by:     { type: String },
  deptId:         { type: String, required: true, index: true },
  departmentName: { type: String },
  logoUrl:        { type: String },
  imageUrl:       { type: String },
  description:    { type: String },
}, { timestamps: true })
DeptIntroductionSchema.index({ tenant_id: 1, deptId: 1 }, { unique: true })

/* ─── DeptAbout (upsert by deptId) ─── */
const DeptAboutSchema = new mongoose.Schema({
  tenant_id:  { type: String, required: true, index: true },
  created_by: { type: String },
  deptId:     { type: String, required: true, index: true },
  vision:     { type: String },
  mission:    { type: String },
}, { timestamps: true })
DeptAboutSchema.index({ tenant_id: 1, deptId: 1 }, { unique: true })

/* ─── DeptSwot (upsert by deptId) ─── */
const DeptSwotSchema = new mongoose.Schema({
  tenant_id:     { type: String, required: true, index: true },
  created_by:    { type: String },
  deptId:        { type: String, required: true, index: true },
  strengths:     [{ type: String }],
  weaknesses:    [{ type: String }],
  opportunities: [{ type: String }],
  threats:       [{ type: String }],
}, { timestamps: true })
DeptSwotSchema.index({ tenant_id: 1, deptId: 1 }, { unique: true })

/* ─── HodProfile (upsert by deptId) ─── */
const HodProfileSchema = new mongoose.Schema({
  tenant_id:      { type: String, required: true, index: true },
  created_by:     { type: String },
  deptId:         { type: String, required: true, index: true },
  name:           { type: String },
  title:          { type: String },
  designation:    { type: String },
  qualification:  { type: String },
  experience:     { type: String },
  specialization: { type: String },
  message:        { type: String },
  profileSummary: { type: String },
  email:          { type: String },
  phone:          { type: String },
  imageUrl:       { type: String },
  cvUrl:          { type: String },
}, { timestamps: true })
HodProfileSchema.index({ tenant_id: 1, deptId: 1 }, { unique: true })

/* ─── ProgramOutcome ─── */
const ProgramOutcomeSchema = new mongoose.Schema({
  tenant_id:  { type: String, required: true, index: true },
  created_by: { type: String },
  deptId:     { type: String, required: true, index: true },
  type:       { type: String, enum: ["PEO", "PSO"], required: true },
  statement:  { type: String, required: true },
  order:      { type: Number, required: true },
}, { timestamps: true })

/* ─── CommitteeMember ─── */
const CommitteeMemberSchema = new mongoose.Schema({
  tenant_id:   { type: String, required: true, index: true },
  created_by:  { type: String },
  deptId:      { type: String, required: true, index: true },
  committee:   { type: String, enum: ["DAB", "PAC"], required: true },
  name:        { type: String, required: true },
  designation: { type: String },
  order:       { type: Number, default: 0 },
}, { timestamps: true })

/* ─── DistinguishedAlumnus ─── */
const DistinguishedAlumnusSchema = new mongoose.Schema({
  tenant_id:    { type: String, required: true, index: true },
  created_by:   { type: String },
  deptId:       { type: String, required: true, index: true },
  name:         { type: String, required: true },
  batch:        { type: String },
  currentRole:  { type: String },
  organization: { type: String },
  achievement:  { type: String },
  imageUrl:     { type: String },
  linkedInUrl:  { type: String },
}, { timestamps: true })

module.exports = {
  DeptIntroduction:     mongoose.model("DeptIntroduction",     DeptIntroductionSchema),
  DeptAbout:            mongoose.model("DeptAbout",            DeptAboutSchema),
  DeptSwot:             mongoose.model("DeptSwot",             DeptSwotSchema),
  HodProfile:           mongoose.model("HodProfile",           HodProfileSchema),
  ProgramOutcome:       mongoose.model("ProgramOutcome",       ProgramOutcomeSchema),
  CommitteeMember:      mongoose.model("CommitteeMember",      CommitteeMemberSchema),
  DistinguishedAlumnus: mongoose.model("DistinguishedAlumnus", DistinguishedAlumnusSchema),
}
