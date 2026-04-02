const mongoose = require("mongoose")

/* ─── PublicationProfile (upsert per faculty per dept) ─── */
const PublicationProfileSchema = new mongoose.Schema({
  publication_profile_id: { type: String, index: true },
  tenant_id:         { type: String, required: true, index: true },
  created_by:        { type: String },
  deptId:            { type: String, required: true, index: true },
  facultyId:         { type: String, required: true, index: true },
  googleScholarLink: { type: String },
  irinsLink:         { type: String },
}, { timestamps: true })
PublicationProfileSchema.index({ tenant_id: 1, deptId: 1, facultyId: 1 }, { unique: true })

/* ─── ResearchGrant ─── */
const ResearchGrantSchema = new mongoose.Schema({
  research_grant_id: { type: String, index: true },
  tenant_id:  { type: String, required: true, index: true },
  created_by: { type: String },
  deptId:     { type: String, required: true, index: true },
  text:       { type: String, required: true },
}, { timestamps: true })

/* ─── Patent ─── */
const PatentSchema = new mongoose.Schema({
  patent_id:  { type: String, index: true },
  tenant_id:  { type: String, required: true, index: true },
  created_by: { type: String },
  deptId:     { type: String, required: true, index: true },
  text:       { type: String, required: true },
}, { timestamps: true })

/* ─── FacultyResearchSummary ─── */
const FacultyResearchSummarySchema = new mongoose.Schema({
  faculty_research_summary_id: { type: String, index: true },
  tenant_id:            { type: String, required: true, index: true },
  created_by:           { type: String },
  deptId:               { type: String, required: true, index: true },
  facultyId:            { type: String, required: true },
  researchArea:         { type: String },
  guideName:            { type: String },
  guideDesignation:     { type: String },
  guideInstitution:     { type: String },
  guideType:            { type: String, enum: ["internal", "external"] },
  thesisTitle:          { type: String },
  university:           { type: String },
  yearOfRegistration:   { type: Number },
  yearOfDegreeAwarded:  { type: Number },
  courseWorkCompleted:  { type: Boolean, default: false },
  prePhDVivaVoce:       { type: Boolean, default: false },
  finalThesisSubmitted: { type: Boolean, default: false },
  researchStatus:       { type: String },
  thesisDocumentUrl:    { type: String },
  remarks:              { type: String },
}, { timestamps: true })

/* ─── PhdGuide ─── */
const PhdGuideSchema = new mongoose.Schema({
  phd_guide_id:    { type: String, index: true },
  tenant_id:       { type: String, required: true, index: true },
  created_by:      { type: String },
  deptId:          { type: String, required: true, index: true },
  facultyName:     { type: String, required: true },
  university:      { type: String },
  recognizedYear:  { type: Number },
  scholarsGuided:  { type: Number, default: 0 },
  ongoingScholars: { type: Number, default: 0 },
}, { timestamps: true })

/* ─── PhdScholar ─── */
const PhdScholarSchema = new mongoose.Schema({
  phd_scholar_id:       { type: String, index: true },
  tenant_id:            { type: String, required: true, index: true },
  created_by:           { type: String },
  deptId:               { type: String, required: true, index: true },
  guideFacultyId:       { type: String, required: true, index: true },
  scholarName:          { type: String, required: true },
  institution:          { type: String },
  department:           { type: String },
  yearOfRegistration:   { type: Number },
  thesisTitle:          { type: String },
  yearOfDegreeAwarded:  { type: Number },
  courseWorkCompleted:  { type: Boolean, default: false },
  prePhdViva:           { type: Boolean, default: false },
  finalThesisSubmitted: { type: Boolean, default: false },
  status:               { type: String, enum: ["guided", "guiding"], default: "guiding" },
}, { timestamps: true })

module.exports = {
  PublicationProfile:     mongoose.model("PublicationProfile",     PublicationProfileSchema),
  ResearchGrant:          mongoose.model("ResearchGrant",          ResearchGrantSchema),
  Patent:                 mongoose.model("Patent",                 PatentSchema),
  FacultyResearchSummary: mongoose.model("FacultyResearchSummary", FacultyResearchSummarySchema),
  PhdGuide:               mongoose.model("PhdGuide",               PhdGuideSchema),
  PhdScholar:             mongoose.model("PhdScholar",             PhdScholarSchema),
}
