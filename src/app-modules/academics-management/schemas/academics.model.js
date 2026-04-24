const mongoose = require('mongoose')

/* ─── Scheme Syllabus ────────────────────────────────────────────────────── */
const SchemeSyllabusSchema = new mongoose.Schema({
  syllabus_id:  { type: String, index: true },
  tenant_id:    { type: String, index: true },
  created_by:   { type: String },

  year:         { type: String, required: true },
  category:     { type: String, required: true },
  title:        { type: String, required: true },
  subtitle:     { type: String },
  fileUrl:      { type: String },
  order:        { type: Number, default: 0 }

}, { timestamps: true })

/* ─── Academic Calendar ──────────────────────────────────────────────────── */
const AcademicCalendarSchema = new mongoose.Schema({
  calendar_id:  { type: String, index: true },
  tenant_id:    { type: String, index: true },
  created_by:   { type: String },

  title:        { type: String, required: true },
  description:  { type: String },
  type:         { type: String, enum: ['CURRENT', 'HISTORIC'], required: true },
  authority:    { type: String, enum: ['INSTITUTE', 'VTU'], required: true },
  program:      { type: String, enum: ['UG', 'PG'], required: true },
  semester:     { type: String },
  year:         { type: String, required: true },
  date:         { type: Date },
  fileUrl:      { type: String }

}, { timestamps: true })

/* ─── Rules & Regulations (Singleton) ───────────────────────────────────── */
const RulesRegulationsSchema = new mongoose.Schema({
  document_id:      { type: String, index: true },
  tenant_id:        { type: String, index: true, unique: true },
  created_by:       { type: String },

  serviceRulesFile: { type: String },
  serviceRulesText: { type: String },
  attendanceFile:   { type: String },
  attendanceText:   { type: String },
  disciplineFile:   { type: String },
  disciplineText:   { type: String }

}, { timestamps: true })

/* ─── Rank Holders ───────────────────────────────────────────────────────── */
const RankHolderSchema = new mongoose.Schema({
  rank_id:      { type: String, index: true },
  tenant_id:    { type: String, index: true },
  created_by:   { type: String },

  year:         { type: String, required: true },
  program:      { type: String, enum: ['UG', 'PG'], required: true },
  usn:          { type: String, required: true },
  studentName:  { type: String, required: true },
  branch:       { type: String, required: true },
  rank:         { type: String, required: true },
  rankOrder:    { type: Number, default: 0 }

}, { timestamps: true })

module.exports = {
  SchemeSyllabus:     mongoose.model('SchemeSyllabus',     SchemeSyllabusSchema),
  AcademicCalendar:   mongoose.model('AcademicCalendar',   AcademicCalendarSchema),
  RulesRegulations:   mongoose.model('RulesRegulations',   RulesRegulationsSchema),
  RankHolder:         mongoose.model('RankHolder',         RankHolderSchema),
}
