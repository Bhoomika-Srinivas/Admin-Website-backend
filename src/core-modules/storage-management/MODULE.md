# Module: storage-management
## Data Models
FileMetadata: file_id, tenant_id, key, original_name, mime_type, size_bytes, uploaded_by, module, entity_id
## Events Published
None
## Permissions
storage:file:upload, storage:file:download, storage:file:list, storage:file:delete
## S3 key pattern
{tenant_id}/{module}/{entity_id}/{file_id}.{ext}
