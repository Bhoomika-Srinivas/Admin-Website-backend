const mongoose = require("mongoose")

/* ─── DeptBranding (upsert by deptId) ─── */
const DeptBrandingSchema = new mongoose.Schema({
  tenant_id:         { type: String, required: true, index: true },
  created_by:        { type: String },
  deptId:            { type: String, required: true, index: true },
  // Header
  departmentTitle:   { type: String },
  departmentLogoUrl: { type: String },
  // Footer · Social
  twitterUrl:        { type: String },
  linkedinUrl:       { type: String },
  youtubeUrl:        { type: String },
  emailContact:      { type: String },
  mapLocationLink:   { type: String },
  // Footer · Address
  fullAddress:       { type: String },
  // Footer · Contact
  hodPhone:          { type: String },
  hodEmail:          { type: String },
  departmentPhone:   { type: String },
  departmentFax:     { type: String },
  departmentEmail:   { type: String },
  // Footer · Credits
  copyrightText:     { type: String },
  websiteCredits:    { type: String },
}, { timestamps: true })
DeptBrandingSchema.index({ tenant_id: 1, deptId: 1 }, { unique: true })

/* ─── InstituteSettings (singleton per tenant) ─── */
const InstituteSettingsSchema = new mongoose.Schema({
  tenant_id:             { type: String, required: true, index: true, unique: true },
  created_by:            { type: String },
  instituteName:         { type: String },
  instituteLogoUrl:      { type: String },
  defaultCopyrightText:  { type: String },
  defaultWebsiteCredits: { type: String },
}, { timestamps: true })

module.exports = {
  DeptBranding:      mongoose.model("DeptBranding",      DeptBrandingSchema),
  InstituteSettings: mongoose.model("InstituteSettings", InstituteSettingsSchema),
}
