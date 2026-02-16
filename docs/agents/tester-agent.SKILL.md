# Tester Agent

> Type: Pipeline Agent | Phase 6 — Generate or extend unit tests (runs AFTER Code Audit)

When invoked: For each modified or affected module, generate or update unit tests. Verify tests pass. Output a test summary. This is Phase 6 of the full pipeline.

## When to add or update handler tests

- **New module added** (e.g. via scripts/generate-module.sh): The script creates tests/unit/modules/<module>/handler.test.js and fixtures/ from the template. In Phase 6, add full test cases for every GraphQL operation in that module’s MODULE.md (describe blocks, fixture data, happy path + validation + not-found + business rules + event assertions). Add or extend fixtures in tests/unit/modules/<module>/fixtures/*.json as needed.
- **New resolver/operation in an existing module**: When a new GraphQL operation is added (new case in the handler switch, new resolver file, and MODULE.md updated), add a new describe block in that module’s handler.test.js with test cases (happy path, validation errors, not-found where relevant, event assertions for mutations). Add or extend entity fixtures if the new operation needs new or updated fixture data.
- **Existing resolver or handler logic changed**: When handler code, arguments, validation, or events for an operation are updated, update the corresponding describe block and tests in handler.test.js and any affected fixtures so that tests reflect the new behavior and npm test passes.

## Context (read in order)
1. Read docs/agents/REGISTRY.md for all modules (to know which modules were modified).
2. For each modified module: read its handler(s) and MODULE.md (list of GraphQL operations, events, permissions).

## Test Structure
- Test path: tests/unit/modules/<module-name>/handler.test.js (one test file per module for handler/resolver coverage).
- Mirror source structure: e.g. handler.js → handler.test.js.
- Use tests/helpers/test-context.js for createContext, createAppSyncEvent (tenant_id, user_id, permissions).
- Use jest as the test runner.

## Handler test conventions (primary way to verify each resolver)
- **Always** require tests/helpers/mock-layer.js first in the test file (before requiring the handler). It auto-mocks all /opt/nodejs/* modules (tenant-resolver, auth-guard, error-handler, mongo-client, mongo-repository, event-publisher, id-generator, pagination).
- Use getMocks() to access mock functions (publishEvent, generateId, resolveTenant, requirePermission) and getMocks().repos for the mock repository instances in constructor order (e.g. repos[0] = first MongoRepository, repos[1] = second).
- Use createMockRepo() from mock-layer only if a module needs an additional repo beyond what the handler constructs.
- Load entity fixtures from tests/unit/modules/<module>/fixtures/*.json (e.g. users.json, roles.json). Fixtures should match Mongoose schema shape. Stub repo methods (findById, findMany, create, updateById) per test with fixture data.
- For each GraphQL operation in MODULE.md, write a describe block with: **happy path** (repo returns fixture, assert response), **validation errors** (missing required args, assert error response), **not-found** where relevant (repo returns null), **business rule guards** (e.g. system role cannot be updated), and **event publishing assertions** for state-changing mutations (verify publishEvent called with correct source, detailType, detail; verify not called on error paths).
- When running Phase 6, run **npm test** (full test suite, all modules) so handler tests run for every module as regression.

## What to Test
- Every GraphQL operation listed in MODULE.md: invoke handler with appropriate event, assert response shape and status.
- Event publishing: mock publishEvent, verify it is called with correct source, detailType, and detail payload for state-changing operations.
- Permission checks: verify requirePermission is called with the correct permission string before each operation.
- Tenant isolation: verify queries/filters include tenant_id (e.g. via repository or context).

## Output Format
```
## Phase 6 — Test

### Test Files
- tests/unit/modules/<module>/handler.test.js

### Results
- **<module-name>**: <pass count> passed, <fail count> failed
- ...

### Summary
- Total: <pass> passed, <fail> failed
```
- Run **npm test** (full suite) so all module handler tests run as regression.
- Present to user and WAIT for approval before proceeding to Phase 7 (Reviewer). If any tests fail, list failures with file:line and fix before continuing.

Note: AppSync resolver JS files (resolvers/*.js) are thin passthroughs and are not unit-tested; only the Lambda handler is tested via handler.test.js.
