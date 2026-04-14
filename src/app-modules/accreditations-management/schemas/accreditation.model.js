const mongoose = require("mongoose")

const AccreditationSchema = new mongoose.Schema({
  accreditation_id: { type: String, index: true },
  tenant_id:        { type: String, required: true, index: true },
  created_by:       { type: String },
  type:             { type: String, required: true, enum: ['AICTE', 'VTU', 'NAAC', 'NIRF', 'NBA', 'AISHE'] },
  section:          { type: String },
  sub_section:      { type: String },
  sub_sub_section:  { type: String },
  department:       { type: String },
  title:            { type: String, required: true },
  description:      { type: String },
  year:             { type: String },
  program:          { type: String },
  cycle:            { type: String },
  file_url:         { type: String, required: true },
  order:            { type: Number },
}, { timestamps: true })

AccreditationSchema.index({ tenant_id: 1, type: 1 })
AccreditationSchema.index({ tenant_id: 1, type: 1, section: 1 })
AccreditationSchema.index({ tenant_id: 1, type: 1, section: 1, sub_section: 1, sub_sub_section: 1 })
AccreditationSchema.index({ tenant_id: 1, type: 1, department: 1 })
AccreditationSchema.index({ order: 1 })

module.exports = {
  Accreditation: mongoose.model("Accreditation", AccreditationSchema),
}
