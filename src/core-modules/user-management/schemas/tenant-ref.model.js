/**
 * Minimal tenant reference for user-management (e.g. PreSignUp limit check).
 * Full Tenant model lives in tenant-management module.
 */
const mongoose = require('mongoose');

const tenantRefSchema = new mongoose.Schema(
  {
    tenant_id: { type: String, required: true, unique: true },
    config: { max_users: { type: Number, default: 5 } },
  },
  { strict: false }
);

module.exports = mongoose.models.TenantRef || mongoose.model('TenantRef', tenantRefSchema, 'tenants');
