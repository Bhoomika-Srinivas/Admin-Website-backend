const mongoose = require('mongoose')

/* ─── Alumni ─────────────────────────────────────────────────────────────── */
const AlumniSchema = new mongoose.Schema({
  alumni_id:   { type: String, index: true },
  tenant_id:   { type: String, index: true },
  created_by:  { type: String },
  name:        { type: String, required: true },
  batch:       { type: String, required: true },
  department:  { type: String, index: true },
  company:     { type: String },
  designation: { type: String },
  location:    { type: String },
  email:       { type: String },
  linkedin:    { type: String },
  image:       { type: String },
}, { timestamps: true })

/* ─── AlumniEvent ────────────────────────────────────────────────────────── */
const AlumniEventSchema = new mongoose.Schema({
  event_id:    { type: String, index: true },
  tenant_id:   { type: String, index: true },
  created_by:  { type: String },
  title:       { type: String, required: true },
  date:        { type: String },
  time:        { type: String },
  department:  { type: String, index: true },
  location:    { type: String },
  description: { type: String },
  image:       { type: String },
  status:      { type: String, default: 'upcoming', index: true },
}, { timestamps: true })

/* ─── TimelineEntry ──────────────────────────────────────────────────────── */
const TimelineEntrySchema = new mongoose.Schema({
  entry_id:    { type: String, index: true },
  tenant_id:   { type: String, index: true },
  year:        { type: String, required: true },
  title:       { type: String, required: true },
  description: { type: String },
  order:       { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true })

/* ─── VisionMission (singleton per tenant) ───────────────────────────────── */
const VisionMissionSchema = new mongoose.Schema({
  document_id: { type: String, index: true },
  tenant_id:   { type: String, index: true, unique: true },
  vision:      { type: String },
  mission:     { type: String },
  objectives:  { type: String },
}, { timestamps: true })

/* ─── CommitteeMember ────────────────────────────────────────────────────── */
const CommitteeMemberSchema = new mongoose.Schema({
  member_id:    { type: String, index: true },
  tenant_id:    { type: String, index: true },
  name:         { type: String, required: true },
  roleType:     { type: String },
  designation:  { type: String },
  department:   { type: String },
  organization: { type: String },
  profileImage: { type: String },
  order:        { type: Number, default: 0 },
}, { timestamps: true })

/* ─── DeanMessage (singleton per tenant) ─────────────────────────────────── */
const DeanMessageSchema = new mongoose.Schema({
  message_id:  { type: String, index: true },
  tenant_id:   { type: String, index: true, unique: true },
  name:        { type: String },
  role:        { type: String },
  department:  { type: String },
  designation: { type: String },
  message:     { type: String },
  image:       { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true })

/* ─── Coordinator ────────────────────────────────────────────────────────── */
const CoordinatorSchema = new mongoose.Schema({
  coordinator_id: { type: String, index: true },
  tenant_id:      { type: String, index: true },
  name:           { type: String, required: true },
  roleType:       { type: String, index: true },
  department:     { type: String, index: true },
  email:          { type: String },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true })

/* ─── DistinguishedAlumnus ───────────────────────────────────────────────── */
const DistinguishedAlumnusSchema = new mongoose.Schema({
  distinguished_alumnus_id: { type: String, index: true },
  tenant_id:    { type: String, index: true },
  name:         { type: String, required: true },
  department:   { type: String, index: true },
  batchYear:    { type: String },
  currentRole:  { type: String },
  company:      { type: String },
  linkedinUrl:  { type: String },
  profileImage: { type: String },
  isFeatured:   { type: Boolean, default: false, index: true },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true })

/* ─── RegistrationSettings (singleton per tenant) ────────────────────────── */
const RegistrationSettingsSchema = new mongoose.Schema({
  settings_id:      { type: String, index: true },
  tenant_id:        { type: String, index: true, unique: true },
  title:            { type: String },
  description:      { type: String },
  registrationLink: { type: String },
}, { timestamps: true })

/* ─── AlumniContact ──────────────────────────────────────────────────────── */
const AlumniContactSchema = new mongoose.Schema({
  contact_id:  { type: String, index: true },
  tenant_id:   { type: String, index: true },
  name:        { type: String, required: true },
  roleType:    { type: String },
  department:  { type: String },
  designation: { type: String },
  email:       { type: String },
}, { timestamps: true })

module.exports = {
  Alumni:               mongoose.model('Alumni',                      AlumniSchema),
  AlumniEvent:          mongoose.model('AlumniEvent',                  AlumniEventSchema),
  TimelineEntry:        mongoose.model('AlumniTimelineEntry',          TimelineEntrySchema),
  VisionMission:        mongoose.model('AlumniVisionMission',          VisionMissionSchema),
  CommitteeMember:      mongoose.model('AlumniCommitteeMember',        CommitteeMemberSchema),
  DeanMessage:          mongoose.model('AlumniDeanMessage',            DeanMessageSchema),
  Coordinator:          mongoose.model('AlumniCoordinator',            CoordinatorSchema),
  DistinguishedAlumnus: mongoose.model('AlumniDistinguishedAlumnus',   DistinguishedAlumnusSchema),
  RegistrationSettings: mongoose.model('AlumniRegistrationSettings',   RegistrationSettingsSchema),
  AlumniContact:        mongoose.model('AlumniContact',                AlumniContactSchema),
}
