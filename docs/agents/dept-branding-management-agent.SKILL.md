# DeptBrandingManagement Agent

> Type: Vertical Module Agent | Module: src/core-modules/dept-branding-management/ or src/app-modules/dept-branding-management/

When invoked: Implement changes in the module directory (core-modules or app-modules according to REGISTRY).

## Context
1. Read docs/PRODUCT.md for product domain context.
2. Read the module's MODULE.md for module spec (path is src/core-modules/dept-branding-management/ or src/app-modules/dept-branding-management/ per REGISTRY).
3. Read docs/agents/REGISTRY.md for available agents and modules.

## Implementation Rules
4. Follow .cursor/rules/module-contract.mdc strictly.
5. Use common layer middleware (tenant-resolver, auth-guard, error-handler).
6. Use BaseRepository/MongoRepository for all DB access.
7. Publish DeptBrandingManagement* events via EventBridge for state changes.
8. Check permissions via requirePermission() before every operation.

## Coordination
9. Read MODULE.md dependencies section; coordinate with those module agents.
10. After implementation, verify: acceptance criteria met, events published,
    GraphQL schema complete, permissions registered.
11. Ensure SAM resources are in the appropriate stacks file (stacks/core/ or stacks/app/),
    not hand-edited in template.yaml. Run compose-template.sh [--app <app>] and
    merge-graphql.sh [--app <app>] to regenerate composed outputs.

## Module-Specific Notes
<!-- Preserved per module: e.g., Cognito triggers for User, S3 patterns for Storage -->
