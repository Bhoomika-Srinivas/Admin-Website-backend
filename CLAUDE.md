# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build (merges GraphQL, composes template, runs sam build)
npm run build

# Build for a specific app
APP=<app-name> npm run build:app

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run a single test file
npx jest tests/unit/modules/<module-name>/<test-file>.test.js

# Deploy (dev)
sam deploy --config-env default

# Deploy (prod)
sam deploy --config-env prod

# Deploy a specific app
APP=<app-name> npm run deploy:app

# Scaffold a new module
bash scripts/generate-module.sh --type app --name <module-name>
```

## Architecture

This is an AWS SAM-based multi-tenant SaaS backend using AppSync (GraphQL) + Lambda + MongoDB.

### Module Types

- **Core modules** (`src/core-modules/`): tenant-management, user-management, audit-log, notification-management, storage-management, form-management, workflow-management
- **App modules** (`src/app-modules/`): product-specific modules (team-management, news-management, development-management, faculty-management)

### Request Flow

AppSync invokes Lambda handlers with:
```js
{ field: "getUser", token: { custom:tenant_id, sub, email, custom:roles, ... }, arguments: { ... } }
```

Each handler follows this pattern:
1. `resolveTenant(event)` — extracts `ctx` with `tenant_id`, `user_id`, `roles`, `permissions`
2. `requirePermission(ctx, 'module:resource:action')` — RBAC check
3. `validate(schema, args)` — Joi validation
4. Repository operations via `MongoRepository`
5. `publishEvent(source, eventType, payload)` — EventBridge for cross-module events

### Key Infrastructure (stacks/infrastructure.yaml)

- **CommonLayer**: Lambda layer at `/opt/nodejs/` containing middleware, utils, and DB helpers
- **PackagesLayer**: Lambda layer with npm dependencies (mongoose, AWS SDK v3)
- **AppSync**: GraphQL API (Cognito auth), one Lambda data source per module
- **EventBridge**: Custom bus for inter-module events
- **Cognito**: User Pool with PreSignUp, PostConfirmation, PreTokenGeneration triggers
- MongoDB connection URI stored in SSM Parameter Store

### Template Composition

`template.yaml` is **generated** — do not edit it directly. The source of truth is:
- `app-config.yaml` — which modules are included
- `stacks/infrastructure.yaml` — shared resources
- `stacks/core/<module>.yaml` and `stacks/app/<module>.yaml` — per-module fragments

Run `npm run compose-template` to regenerate.

### Layers (src/layers/common/)

Middleware imported from `/opt/nodejs/`:
- `middleware/tenant-resolver` — `resolveTenant(event)` → ctx
- `middleware/auth-guard` — `requirePermission(ctx, 'module:resource:action')`
- `middleware/input-validator` — `validate(joiSchema, data)`
- `middleware/with-connection` — `withConnection(handler)` wraps handler with MongoDB connection
- `utils/event-publisher` — `publishEvent(source, eventType, payload)`
- `db/mongo-repository` — `MongoRepository({ model, primaryKey })`

### Permission Format

`module:resource:action` (e.g., `user:user:create`, `form:definition:read`). Supports wildcards: `user:*:*`.

### Testing Pattern

All unit tests mock the Lambda layer using `require('../../../helpers/mock-layer')` (must be first require). Use `createAppSyncEvent(field, args)` from `tests/helpers/test-context.js` to build test events.

```js
require('../../../helpers/mock-layer');
const { createAppSyncEvent } = require('../../../helpers/test-context');
const { getMocks } = require('../../../helpers/mock-layer');
const { handler } = require('../../../../src/app-modules/<module>/functions/handler');
```

### Environment Variables

| Variable | Description |
|---|---|
| `STAGE` | `dev` / `staging` / `prod` |
| `PROJECT_NAME` | Project identifier (e.g., `myapp`) |
| `EVENT_BUS_NAME` | EventBridge custom bus name |
| `MONGODB_SSM_PARAM_NAME` | SSM path for MongoDB URI |
| `AWS_SAM_LOCAL` | Set to `TRUE` for local dev; uses `MONGODB_URI` directly |
