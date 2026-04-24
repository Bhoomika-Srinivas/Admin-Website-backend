const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    tenant_id: { type: String, required: true },
    value: { type: String, required: true },
    category: { type: String, enum: ['security', 'operational'], required: true },
    sensitivity: { type: String, enum: ['high', 'low'], default: 'low' },
    updated_by: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

settingSchema.index({ tenant_id: 1, key: 1 }, { unique: true });

module.exports = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
