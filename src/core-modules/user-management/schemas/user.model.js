const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    tenant_id: { type: String, required: true, index: true },
    cognito_sub: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String },
    phone: { type: String },
    status: { type: String, enum: ['active', 'invited', 'suspended', 'deactivated'], default: 'active' },
    roles: [{ type: String }],
    department: { type: String },
    last_login_at: { type: Date },
    profile: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

userSchema.index({ tenant_id: 1, email: 1 }, { unique: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
