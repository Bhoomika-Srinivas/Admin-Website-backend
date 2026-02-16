const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    notification_id: { type: String, required: true },
    tenant_id: { type: String, required: true, index: true },
    recipient_id: { type: String },
    recipient_email: { type: String },
    channel: { type: String },
    template_id: { type: String },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'read'], default: 'pending' },
    sent_at: { type: Date },
    error: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
