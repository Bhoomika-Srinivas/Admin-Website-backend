const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema({
  field_id: String,
  type: { type: String, enum: ['text', 'number', 'email', 'select', 'checkbox', 'date', 'file', 'section'] },
  label: String,
  placeholder: String,
  validations: { required: Boolean, min: Number, max: Number, pattern: String, custom_message: String },
  options: [{ label: String, value: String }],
  conditional_logic: { depends_on: String, operator: String, value: mongoose.Schema.Types.Mixed },
}, { _id: false });

const formDefinitionSchema = new mongoose.Schema(
  {
    form_id: { type: String, required: true },
    tenant_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: String,
    version: { type: Number, default: 1 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    fields: [formFieldSchema],
    settings: { allow_anonymous: Boolean, require_auth: Boolean, max_submissions: Number },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.models.FormDefinition || mongoose.model('FormDefinition', formDefinitionSchema);
