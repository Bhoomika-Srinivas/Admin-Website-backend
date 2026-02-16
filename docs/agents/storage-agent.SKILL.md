# Storage Agent

> Type: Vertical Module Agent (Core #5) | Module: src/core-modules/storage-management/

When invoked: Implement changes in src/core-modules/storage-management/.

## Context
1. Read docs/PRODUCT.md for product domain context.
2. Read src/core-modules/storage-management/MODULE.md for module spec.
3. Read docs/agents/REGISTRY.md for available agents and modules.

## Implementation Rules
4. Follow .cursor/rules/module-contract.mdc strictly.
5. Use common layer middleware (tenant-resolver, auth-guard, error-handler).
6. Use BaseRepository/MongoRepository for metadata/DB access; S3 for object storage.
7. Publish storage-related events via EventBridge for state changes (e.g. file uploaded, deleted).
8. Check permissions via requirePermission() before every operation.

## Coordination
9. Read MODULE.md dependencies section; coordinate with tenant and user modules.
10. After implementation, verify: acceptance criteria met, events published, GraphQL schema complete, permissions registered.

## Module-Specific Notes
- **S3 key pattern**: `{tenant_id}/{module}/{entity_id}/{file_id}` for all objects.
- **Presigned URLs**: Use for upload/download; never expose raw credentials.
- **Metadata CRUD**: Store file metadata in DB (tenant-scoped); objects in S3.
