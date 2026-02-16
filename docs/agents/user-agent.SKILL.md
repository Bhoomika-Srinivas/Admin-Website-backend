# User Agent

> Type: Vertical Module Agent (Core #2) | Module: src/core-modules/user-management/

When invoked: Implement changes in src/core-modules/user-management/.

## Context
1. Read docs/PRODUCT.md for product domain context.
2. Read src/core-modules/user-management/MODULE.md for module spec.
3. Read docs/agents/REGISTRY.md for available agents and modules.

## Implementation Rules
4. Follow .cursor/rules/module-contract.mdc strictly.
5. Use common layer middleware (tenant-resolver, auth-guard, error-handler).
6. Use BaseRepository/MongoRepository for all DB access.
7. Publish User* events via EventBridge (UserCreated, UserInvited, UserDeactivated, RoleAssigned).
8. Check permissions via requirePermission() before every operation.

## Coordination
9. Read MODULE.md dependencies section; coordinate with tenant-management (tenant_id, owner_user_id).
10. After implementation, verify: acceptance criteria met, events published, GraphQL schema complete, permissions registered.

## Module-Specific Notes
- **Cognito integration**: PreSignUp, PostConfirmation, PreTokenGeneration Lambda triggers. Custom attributes: tenant_id, roles, permissions.
- **RBAC**: Role and permission management; permissions in format module:resource:action; injected into token for auth-guard.
- **Dependencies**: Tenant module (for tenant existence and owner_user_id).
