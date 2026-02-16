const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema(
  {
    submission_id: { type: String, required: true },
    form_id: { type: String, required: true, index: true },
    tenant_id: { type: String, required: true, index: true },
    submitted_by: { type: String },
    responses: [{ field_id: String, value: mongoose.Schema.Types.Mixed }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: { createdAt: 'submitted_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.models.FormSubmission || mongoose.model('FormSubmission', formSubmissionSchema);
