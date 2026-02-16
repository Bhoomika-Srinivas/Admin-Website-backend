# Tenant Agent

> Type: Vertical Module Agent (Core #1) | Module: src/core-modules/tenant-management/

When invoked: Implement changes in src/core-modules/tenant-management/.

## Context
1. Read docs/PRODUCT.md for product domain context.
2. Read src/core-modules/tenant-management/MODULE.md for module spec.
3. Read docs/agents/REGISTRY.md for available agents and modules.

## Implementation Rules
4. Follow .cursor/rules/module-contract.mdc strictly.
5. Use common layer middleware (tenant-resolver, auth-guard, error-handler).
6. Use BaseRepository/MongoRepository for all DB access.
7. Publish Tenant* events via EventBridge for state changes (TenantCreated, TenantUpdated, TenantSuspended).
8. Check permissions via requirePermission() before every operation.

## Coordination
9. Read MODULE.md dependencies section; coordinate with those module agents.
10. After implementation, verify: acceptance criteria met, events published, GraphQL schema complete, permissions registered.

## Module-Specific Notes
- **Foundation module**: All other modules depend on tenant_id; this module is first in dependency order.
- **Events**: TenantCreated (after createTenant), TenantUpdated (after updateTenant), TenantSuspended (after suspendTenant).
- No dependency on other product modules; may be used by user-management for owner_user_id references.
