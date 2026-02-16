const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    tenant_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'archived'],
      default: 'active',
    },
    config: {
      features_enabled: [String],
      max_users: { type: Number, default: 5 },
      branding: {
        logo_url: String,
        primary_color: String,
      },
    },
    owner_user_id: String,
    created_by: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
