# Module: user-management

## Data Models

- **User**: user_id, tenant_id, cognito_sub, email, name, status (active|invited|suspended|deactivated), roles (array of role_id), profile (mixed).
- **Role**: role_id, tenant_id, name, description, permissions (array of "module:resource:action"), is_system. System roles: tenant-admin, member, viewer (seeded per tenant).

## GraphQL Schema

- Queries: getUser(user_id), listUsers(pagination), listRoles(pagination)
- Mutations: updateUser, inviteUser, deactivateUser, createRole, updateRole, assignRole, removeRole

## Events Published

- UserCreated, UserInvited, UserDeactivated, RoleAssigned

## Events Consumed

- TenantCreated (optional: auto-create admin user for new tenant via EventBridge rule)

## Permissions

- user:user:read, user:user:list, user:user:update, user:user:invite, user:user:deactivate
- user:role:read, user:role:create, user:role:update, user:role:assign, user:role:remove

## Dependencies

- Tenant (tenant_id; minimal tenant-ref for PreSignUp limit check).

## Database Choice

MongoDB (Mongoose). User and Role are tenant-scoped with tenant_id.
