# Module: tenant-management

## Data Models

- **Tenant**: tenant_id (ULID), name, slug, plan (free|starter|pro|enterprise), status (active|suspended|archived), config (features_enabled, max_users, branding), owner_user_id, created_by, timestamps.

## GraphQL Schema

- Queries: getTenant(tenant_id), listTenants(pagination)
- Mutations: createTenant(input), updateTenant(tenant_id, input), suspendTenant(tenant_id)
- Types: Tenant, TenantConnection, TenantConfig, TenantBranding, enums TenantPlan, TenantStatus

## Events Published

- **TenantCreated**: tenant_id, name, slug, plan, owner_user_id, created_by, timestamp
- **TenantUpdated**: tenant_id, updated_by, timestamp
- **TenantSuspended**: tenant_id, suspended_by, timestamp

## Events Consumed

None.

## Permissions

- tenant:tenant:create
- tenant:tenant:read
- tenant:tenant:update
- tenant:tenant:suspend
- tenant:tenant:list

## Dependencies

None (foundation module).

## Database Choice

MongoDB (Mongoose). Tenant is the root of multi-tenancy; shared DB with tenant_id on all documents.
