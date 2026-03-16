const mongoose = require("mongoose")

/* ─── DeptStaff ─── */
const DeptStaffSchema = new mongoose.Schema({
  tenant_id:     { type: String, required: true, index: true },
  created_by:    { type: String },
  deptId:        { type: String, required: true, index: true },
  name:          { type: String, required: true },
  designation:   { type: String, required: true },
  qualification: { type: String },
  experience:    { type: Number },
  email:         { type: String },
  phone:         { type: String },
  status:        { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true })

/* ─── Accreditation ─── */
const AccreditationSchema = new mongoose.Schema({
  tenant_id:      { type: String, required: true, index: true },
  created_by:     { type: String },
  deptId:         { type: String, required: true, index: true },
  name:           { type: String, required: true },
  accreditedBy:   { type: String, required: true },
  validFrom:      { type: String },
  validUntil:     { type: String },
  grade:          { type: String },
  certificateUrl: { type: String },
  status:         { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true })

module.exports = {
  DeptStaff:     mongoose.model("DeptStaff",     DeptStaffSchema),
  Accreditation: mongoose.model("Accreditation", AccreditationSchema),
}
