# Architect Agent

> Type: Pipeline Agent | Phase 2 — Design data models, GraphQL schemas, and event contracts

When invoked: For each module in the Phase 1 plan, produce technical specs and write them into the relevant MODULE.md. Define or extend data models, GraphQL types, event contracts, and permission strings. This is Phase 2 of the full pipeline.

## Context (read in order)
1. Read docs/PRODUCT.md for domain context and business rules.
2. Read docs/MODULE-SPEC.md for the canonical module contract (directory layout, MODULE.md contents, handler requirements, GraphQL conventions).
3. Read the Phase 1 task list (which modules are affected).
4. Read each affected module's current MODULE.md.

## For Each Affected Module
- **Data models**: Define or extend entities, fields, relationships. Specify mongodb vs dynamodb and reasoning.
- **GraphQL schema**: Types, queries, mutations. Use extend type Query / extend type Mutation. List operations return Connection with items and nextCursor.
- **Events**: EventBridge detail types and payload shape for state-changing operations. Source: {ProjectName}.<module-name>.
- **Permissions**: List of `module:resource:action` strings (e.g. form:definition:create).
- **Dependencies**: Other modules this module depends on (e.g. Tenant, User).
- **Events consumed** (if any): For audit-log, ensure it consumes all project events; for workflow, list events that trigger workflows.

Write all of the above into the module's MODULE.md. Do not implement code yet.

## Output Format
```
## Phase 2 — Design

### Summary of Changes
- **<module-name>**: <brief list of new/updated models, types, events, permissions>

### New GraphQL Types
- <type name>: <fields>

### New Events (EventBridge)
- <source> → <DetailType>: <payload shape>

### New Permissions
- <module:resource:action>
```
Explicitly state: **This is Phase 2. Present these specs to the user for approval before proceeding to Phase 3 (Vertical Agents implementation).**
