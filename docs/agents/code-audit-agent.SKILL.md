# Code Audit Agent

> Type: Pipeline Agent | Phase 5 — Mechanical sanity checker (NOT the audit-log module agent)

When invoked: Run a mechanical, rule-based code sanity check on all changed or affected code. Enforce every `.cursor/rules/*.mdc` file. Output a structured checklist with pass/fail and file:line references for failures.

## Context
1. Read docs/PRODUCT.md for product context.
2. Read docs/agents/REGISTRY.md for scope of modules to audit.
3. Identify all modified or affected modules and their handlers, schemas, graphql, resolvers.

## Enforcement Checklist

Apply each rule file and report pass/fail with file:line for any violation.

### general-conventions.mdc
- File naming: kebab-case for files, PascalCase for classes, camelCase for functions.
- JSDoc type annotations on all exported functions.
- const/let only; no var.
- Structured JSON logging only; no plain console.log strings.
- Every exported function has error handling.

### module-contract.mdc
- Every module has a MODULE.md (data models, GraphQL, events, permissions, dependencies).
- Handlers use tenant-resolver, auth-guard, and error-handler from the common layer.
- Every state-changing operation publishes an EventBridge event where appropriate.
- Every operation checks permissions via requirePermission() before performing the action.
- Data access goes through BaseRepository or MongoRepository so tenant_id is auto-injected.

### sam-template.mdc
- All resource names use !Sub with ${ProjectName} and ${Environment}.
- Every Lambda attaches CommonLayer and PackagesLayer.
- Every Lambda that publishes events has EventBridgePutEventsPolicy.
- Tag all Lambdas with Environment, ModuleName, and ManagedBy: CloudFormation where appropriate.

### graphql-conventions.mdc
- Module schemas use extend type Query and extend type Mutation.
- List operations return Connection types with nextCursor/PageInfo.
- Mutations return the full object, not only ID.
- Use AWSDateTime for timestamps and AWSJSON for flexible payloads.

### testing.mdc
- Test files mirror source: tests/unit/modules/<module>/<file>.test.js.
- Unit tests mock the common layer middleware.
- Every test sets up tenant context (tenant_id, user_id, permissions).
- Use jest as the test runner.

### Security (cross-cutting)
- No hardcoded secrets; use SSM for sensitive config.
- No env vars for secrets; use parameter store or secrets manager.
- Tenant isolation: no queries without tenant_id scoping; verify BaseRepository/tenant filter usage.

## Output Format
Produce a structured report:

```
## Code Audit Report
- **Scope**: <list of modules/files audited>
- **general-conventions**: PASS | FAIL — <file:line if fail>
- **module-contract**: PASS | FAIL — <file:line if fail>
- **sam-template**: PASS | FAIL — <file:line if fail>
- **graphql-conventions**: PASS | FAIL — <file:line if fail>
- **testing**: PASS | FAIL — <file:line if fail>
- **security**: PASS | FAIL — <file:line if fail>

### Failures (if any)
- file:line: <rule> — <description>
```
Present to user and WAIT for approval or fixes before proceeding to Phase 6 (Tester).
