const mongoose = require("mongoose")

/* ─── Event ─── */
const EventSchema = new mongoose.Schema({
  event_id:       { type: String, index: true },
  tenant_id:      { type: String, required: true, index: true },
  created_by:     { type: String },
  deptId:         { type: String, index: true },
  title:          { type: String, required: true },
  isMultiDay:     { type: Boolean, default: false },
  date:           { type: String },
  time:           { type: String },
  startDate:      { type: String },
  startTime:      { type: String },
  endDate:        { type: String },
  endTime:        { type: String },
  venue:          { type: String },
  description:    { type: String },
  images:         [{ type: String }],
  pinned:         { type: Boolean, default: false },
  level:          { type: String, enum: ['institutional', 'department'], required: true },
  department:     { type: String },
  status:         { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true })

module.exports = {
  Event: mongoose.model("Event", EventSchema),
}
