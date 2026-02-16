const mongoose = require('mongoose');

const fileMetadataSchema = new mongoose.Schema(
  {
    file_id: { type: String, required: true, unique: true },
    tenant_id: { type: String, required: true, index: true },
    key: { type: String, required: true },
    original_name: { type: String },
    mime_type: { type: String },
    size_bytes: { type: Number },
    uploaded_by: { type: String },
    module: { type: String },
    entity_id: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.models.FileMetadata || mongoose.model('FileMetadata', fileMetadataSchema);
