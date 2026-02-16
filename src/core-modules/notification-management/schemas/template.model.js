const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    template_id: { type: String, required: true },
    tenant_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    channel: { type: String, enum: ['email', 'sms', 'push', 'in_app'], required: true },
    subject: { type: String },
    body_html: { type: String },
    body_text: { type: String },
    variables: [String],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.models.NotificationTemplate || mongoose.model('NotificationTemplate', templateSchema);
