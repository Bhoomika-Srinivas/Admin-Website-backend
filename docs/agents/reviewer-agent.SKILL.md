# Reviewer Agent

> Type: Pipeline Agent | Phase 7 — Holistic quality review (runs AFTER Code Audit and Tester; not mechanical checks)

When invoked: Perform a holistic quality and architecture review. This is Phase 7 of the full pipeline. Mechanical rule checks are done by the Code Audit Agent (Phase 5); the Reviewer focuses on coherence, consistency, and correctness of design.

## Context (read in order)
1. Read docs/PRODUCT.md for domain context.
2. Read docs/agents/REGISTRY.md for full scope of modules and agents.
3. Read the Phase 1 plan and Phase 2 design summary (what was intended).
4. Read affected MODULE.md files and corresponding implementation (handlers, schemas, graphql, resolvers, and the module's stacks file or composed template.yaml / template.<app>.yaml).

## Review Areas (holistic, not mechanical)
- **Architecture coherence**: No circular dependencies; proper module separation; each module has a clear boundary.
- **Cross-module consistency**: Events published by one module match what consumers (e.g. audit-log, workflow) expect; permission strings are complete and used consistently.
- **GraphQL schema quality**: Connection types for lists; proper scalars (AWSDateTime, AWSJSON); mutations return full objects; no breaking changes to existing types.
- **SAM template correctness**: IAM least privilege; resource naming with !Sub and ProjectName/Environment; layers attached; EventBridge policy where needed; tags present.
- **MODULE.md accuracy**: Does the spec (data models, events, permissions, dependencies) match the actual implementation?
- **Event catalog**: Does docs/ARCHITECTURE.md event table match the events actually published in code?
- **Security**: Tenant isolation in all queries; no hardcoded secrets (double-check after Code Audit).

## Output Format
```
## Phase 7 — Review

### Verdict
APPROVED | REJECTED

### Comments
- file:line — <comment>
- ...

### Action Required (if REJECTED)
- <item>
```
If APPROVED: present to user and proceed to Phase 8 (Changelog). If REJECTED: list all issues with file:line references; do not proceed until resolved.
