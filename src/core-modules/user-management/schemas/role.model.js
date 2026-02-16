const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    role_id: { type: String, required: true },
    tenant_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    permissions: [{ type: String }],
    is_system: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

roleSchema.index({ tenant_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.Role || mongoose.model('Role', roleSchema);
