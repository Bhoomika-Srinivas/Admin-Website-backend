const mongoose = require('mongoose')

const collegeProfileSchema = new mongoose.Schema(
  {
    tenant_id:            { type: String, required: true, unique: true, index: true },
    created_by:           { type: String },
    logo_url:             { type: String },
    name:                 { type: String },
    shortName:            { type: String },
    established:          { type: Number },
    affiliatedUniversity: { type: String },
    collegeType:          {
      type: String,
      enum: [
        'private_aided',
        'private_unaided',
        'government',
        'government_aided',
        'autonomous',
        'deemed_university',
        'central_university',
      ],
    },
    address:  { type: String },
    city:     { type: String },
    state:    { type: String },
    pincode:  { type: String },
    phone:    { type: String },
    email:    { type: String },
    website:  { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

module.exports = mongoose.models.CollegeProfile || mongoose.model('CollegeProfile', collegeProfileSchema)
