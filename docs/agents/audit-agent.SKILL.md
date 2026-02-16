# Audit Agent

> Type: Vertical Module Agent (Core #7 — last) | Module: src/core-modules/audit-log/

When invoked: Implement changes in src/core-modules/audit-log/. This is the **audit-log module agent**, NOT the Code Audit Agent (which is a pipeline agent for code sanity). Audit-agent owns the audit-log vertical; it comes last in Phase 3 because it consumes events from ALL other modules.

## Context
1. Read docs/PRODUCT.md for product domain context.
2. Read src/core-modules/audit-log/MODULE.md for module spec.
3. Read docs/agents/REGISTRY.md for available agents and modules.
4. Read docs/ARCHITECTURE.md event catalog to ensure all project events are consumed.

## Implementation Rules
4. Follow .cursor/rules/module-contract.mdc strictly.
5. Use common layer middleware where applicable (audit-query Lambda); audit-writer is an EventBridge consumer.
6. Use BaseRepository/MongoRepository for audit entry storage.
7. **Do not publish events** — audit-log is passive: it only consumes events.
8. Check permissions via requirePermission() for query operations (e.g. who can read audit log).

## Coordination
9. When other modules add new event types, update the EventBridge rule pattern so audit-writer consumes them (source prefix {ProjectName}.).
10. After implementation, verify: audit-writer consumes ALL project events listed in ARCHITECTURE.md event catalog; audit-query respects tenant and permissions.

## Module-Specific Notes
- **Passive consumer**: audit-writer Lambda is triggered by EventBridge; it writes entries to the audit log. No event publishing from this module.
- **Lambdas**: audit-query (AppSync, for querying audit log), audit-writer (EventBridge rule target).
- **Event catalog**: All events with source prefix `{ProjectName}.` must be consumed by the audit writer; when new modules or new event types are added, update the EventBridge rule and ARCHITECTURE.md.
