const mongoose = require("mongoose")

const AlumniSchema = new mongoose.Schema({
  alumni_id:   { type: String, index: true },
  tenant_id:   { type: String, index: true },
  created_by:  { type: String },
  deptId:      { type: String, index: true },
  name:        { type: String, required: true },
  batch:       { type: String, required: true },
  department:  { type: String },
  company:     { type: String, required: true },
  designation: { type: String, required: true },
  location:    { type: String },
  achievement: { type: String },
  email:       { type: String },
  linkedin:    { type: String },
  image:       { type: String },
}, { timestamps: true })

module.exports = mongoose.model("Alumni", AlumniSchema)
