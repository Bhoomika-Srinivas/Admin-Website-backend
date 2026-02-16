const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    tenant_id: { type: String, required: true, index: true },
    channels: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      in_app: { type: Boolean, default: true },
    },
    quiet_hours: { start: String, end: String },
  },
  { timestamps: true }
);

preferenceSchema.index({ user_id: 1, tenant_id: 1 }, { unique: true });
module.exports = mongoose.models.NotificationPreference || mongoose.model('NotificationPreference', preferenceSchema);
