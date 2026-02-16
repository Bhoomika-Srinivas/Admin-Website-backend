# Form Agent

> Type: Vertical Module Agent (Core #3) | Module: src/core-modules/form-management/

When invoked: Implement changes in src/core-modules/form-management/.

## Context
1. Read docs/PRODUCT.md for product domain context.
2. Read src/core-modules/form-management/MODULE.md for module spec.
3. Read docs/agents/REGISTRY.md for available agents and modules.

## Implementation Rules
4. Follow .cursor/rules/module-contract.mdc strictly.
5. Use common layer middleware (tenant-resolver, auth-guard, error-handler).
6. Use BaseRepository/MongoRepository for all DB access.
7. Publish Form* events via EventBridge (FormPublished, FormSubmitted).
8. Check permissions via requirePermission() before every operation.

## Coordination
9. Read MODULE.md dependencies section; coordinate with tenant and user modules for permissions.
10. After implementation, verify: acceptance criteria met, events published, GraphQL schema complete, permissions registered.

## Module-Specific Notes
- **Handlers**: builder-handler (form definitions CRUD, publish) and submission-handler (submit form, list submissions).
- **Events**: FormPublished (after publishForm), FormSubmitted (after submitForm).
- **Models**: form-definition, form-submission (see MODULE.md for schema).
