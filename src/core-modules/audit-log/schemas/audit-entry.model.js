const mongoose = require('mongoose');

const auditEntrySchema = new mongoose.Schema(
  {
    entry_id: { type: String, required: true, unique: true },
    tenant_id: { type: String, required: true, index: true },
    actor_id: { type: String },
    actor_email: { type: String },
    action: { type: String, required: true },
    resource_type: { type: String },
    resource_id: { type: String },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    severity: { type: String, enum: ['info', 'warn', 'critical'], default: 'info' },
    metadata: {
      ip: String,
      user_agent: String,
      source: String,
      detail_type: String,
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

auditEntrySchema.index({ tenant_id: 1, timestamp: -1 });
auditEntrySchema.index({ tenant_id: 1, action: 1 });

module.exports = mongoose.models.AuditEntry || mongoose.model('AuditEntry', auditEntrySchema);
