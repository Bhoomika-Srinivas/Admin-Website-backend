const mongoose = require("mongoose")

const DepartmentSchema = new mongoose.Schema({
  department_id: { type: String, index: true },
  tenant_id:     { type: String, required: true, index: true },
  created_by:    { type: String },

  name:          { type: String, required: true },
  shortName:     { type: String, required: true },
  hod:           { type: String },
  established:   { type: Number },
  totalFaculty:  { type: Number, default: 0 },
  totalStudents: { type: Number, default: 0 },
  status:        { type: String, enum: ["active", "inactive"], default: "active" },
  description:   { type: String },
  imageUrl:      { type: String },
}, { timestamps: true })

DepartmentSchema.index({ tenant_id: 1, shortName: 1 }, { unique: true })

module.exports = mongoose.model("Department", DepartmentSchema)
