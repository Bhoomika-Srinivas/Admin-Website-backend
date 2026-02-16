# Workflow Agent

> Type: Vertical Module Agent (Core #6) | Module: src/core-modules/workflow-management/

When invoked: Implement changes in src/core-modules/workflow-management/.

## Context
1. Read docs/PRODUCT.md for product domain context.
2. Read src/core-modules/workflow-management/MODULE.md for module spec.
3. Read docs/agents/REGISTRY.md for available agents and modules.

## Implementation Rules
4. Follow .cursor/rules/module-contract.mdc strictly.
5. Use common layer middleware (tenant-resolver, auth-guard, error-handler).
6. Use BaseRepository/MongoRepository for workflow definitions and instances.
7. Publish workflow events via EventBridge (e.g. workflow started, step completed, approved).
8. Check permissions via requirePermission() before every operation.

## Coordination
9. Read MODULE.md dependencies section; workflow can depend on events from any module (tenant, user, form, etc.).
10. After implementation, verify: acceptance criteria met, events published, GraphQL schema complete, permissions registered.

## Module-Specific Notes
- **Components**: Workflow definitions, workflow instances, EventBridge-triggered engine, approval actions.
- **Event-driven**: Subscribe to other modules' events (e.g. FormSubmitted, UserCreated) to start or advance workflows.
- **Order**: Implement after form, notification, storage (6th in core order); audit (7th) consumes workflow events too.
