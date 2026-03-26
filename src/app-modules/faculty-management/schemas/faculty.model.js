const mongoose = require("mongoose")

const FacultySchema = new mongoose.Schema({

  faculty_id:   { type: String, index: true },
  tenant_id:    { type: String, index: true },
  created_by:   { type: String },

  name:         { type: String, required: true },
  designation:  { type: String, required: true },
  deptId:       { type: String, required: true, index: true },
  department:   { type: String },
  profileImage: { type: String },
  cvUrl:        { type: String },
  status:       { type: String, enum: ['active', 'inactive'], default: 'active' },
  order:        { type: Number },

}, { timestamps: true })


module.exports = mongoose.model("Faculty", FacultySchema)
