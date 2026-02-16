# General Backend SAM

General-purpose AWS SAM backend starter for building multi-tenant products. **Core modules** (tenant, user, form, notification, storage, workflow, audit) live in `src/core-modules/`; **app modules** (product-specific, e.g. admission, fee-billing) live in `src/app-modules/`. Each module has its own Lambda(s), AppSync data source, and GraphQL surface. Modules communicate via EventBridge. The SAM template is **composed** from `app-config.yaml` and `stacks/*.yaml` fragments.

## Getting Started (New Product)

1. Clone this repo.
2. Run `./scripts/init-project.sh <project-name>` (optionally `--remove module1,module2` to drop unneeded core modules, or `--include-app mod1,mod2` to scaffold app modules).
3. Fill out `docs/PRODUCT.md` with your domain, key entities, business rules, and which core modules you use.
4. Run `npm run build` (composes template, merges GraphQL, validates, runs `sam build`).
5. Start building — use the agent pipeline for new features (see **Agent Workflow** below).

## Project Structure

```
├── src/
│   ├── layers/
│   │   ├── common/          # Shared middleware, db, utils (tenant-resolver, auth-guard, base-repository)
│   │   └── packages/        # npm deps (mongoose, AWS SDK)
│   ├── core-modules/        # Reusable modules (tenant, user, form, notification, storage, workflow, audit)
│   │   ├── _template/        # Blueprint for core modules
│   │   ├── tenant-management/
│   │   ├── user-management/
│   │   └── ...
│   ├── app-modules/         # Product-specific modules (e.g. admission, fee-billing)
│   │   └── _template/       # Blueprint for app modules
│   └── appsync/
│       └── schema/          # common.graphql, schema.graphql (root, merged from modules)
├── stacks/                  # SAM template fragments (source of truth; template.yaml is composed from these)
│   ├── infrastructure.yaml  # Layers, EventBus, SQS, S3, Cognito, AppSync API + schema
│   ├── core/                # One .yaml per core module (Lambda, DataSource, Resolvers)
│   │   ├── tenant-management.yaml
│   │   ├── user-management.yaml
│   │   └── ...
│   └── app/                 # One .yaml per app module (created by generate-module.sh)
├── app-config.yaml          # Default app: which modules are included; used when no --app is given
├── app-configs/             # Per-app configs for multi-app setup (e.g. campus-erp.yaml, school-mgmt.yaml)
├── template.yaml            # Default composed output (from app-config.yaml)
├── template.<app>.yaml      # Per-app composed output (from app-configs/<app>.yaml when using --app)
├── tests/
│   ├── helpers/             # mock-layer.js, test-context.js
│   ├── _template/           # handler.test.js skeleton for new modules
│   ├── unit/
│   │   └── modules/         # handler.test.js + fixtures per module
│   └── integration/
├── scripts/
│   ├── compose-template.sh # Compose template.yaml (or template.<app>.yaml with --app <app>)
│   ├── merge-graphql.sh    # Merge GraphQL into schema.graphql (or schema.<app>.graphql with --app)
│   ├── build-app.sh        # Per-app build: compose + merge + validate + sam build (use with APP=<app> npm run build:app)
│   ├── init-app.sh         # Bootstrap new app: app-configs/<app>.yaml, samconfig profile, optional app modules
│   ├── generate-module.sh  # Scaffold module (--type core|app, --app <app> to add to app-configs/<app>.yaml)
│   ├── generate-sam-resources.sh # Emit YAML snippet for Lambda + DataSource + Resolvers
│   ├── init-project.sh     # Initialize project (--remove, --include-app)
│   ├── remove-module.sh    # Remove module (--app <app> to remove from one app config only)
│   ├── validate-events.sh  # Check publishEvent calls vs MODULE.md
│   ├── check-dependencies.sh # Dependency graph and cycle check
│   └── deploy-check.sh     # Pre-deploy checks (--app <app> to check per-app template)
├── docs/
│   ├── ARCHITECTURE.md     # Core vs app, template composition, event catalog, agent pipeline
│   ├── CHANGELOG.md
│   ├── MODULE-SPEC.md      # Module contract (MODULE.md, handlers, GraphQL, events)
│   ├── PRODUCT.md          # Product context (domain, entities, modules used)
│   └── agents/             # Agent SKILL.md files + REGISTRY.md (see Agent Workflow)
├── .cursor/rules/           # Cursor AI rules (see Cursor Rules below)
├── samconfig.toml           # Dev/Prod deployment configs
└── package.json
```

## Template Composition

The SAM template is **generated**, not hand-edited:

- **`app-config.yaml`** (default) or **`app-configs/<app>.yaml`** (multi-app) lists `core_modules` and `app_modules` to include.
- **`scripts/compose-template.sh`** reads the config (use `--app <app-name>` for per-app), concatenates `stacks/infrastructure.yaml` + enabled module fragments, injects **AppSyncServiceRole**, and writes **`template.yaml`** or **`template.<app>.yaml`**.
- Run **`npm run compose-template`** or **`npm run build`** before `sam build`. For a specific app: **`npm run compose-template -- --app campus-erp`** then **`sam build -t template.campus-erp.yaml`**, or use **`APP=campus-erp npm run build:app`**.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the core vs app boundary and composition flow.

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run compose-template` | Compose `template.yaml` from `app-config.yaml` and `stacks/`. Add `-- --app <app>` for per-app. |
| `npm run merge-graphql` | Merge module GraphQL into `schema.graphql`. Add `-- --app <app>` for per-app schema. |
| `npm run validate-schemas` | Validate GraphQL schema (default or `--app <app>`). |
| `npm run build` | Compose → merge GraphQL → validate → `sam build` (default app). |
| `npm run build:app` | Per-app build (set `APP=campus-erp` then run). Composes, merges, validates, and `sam build -t template.<app>.yaml`. |
| `npm run deploy:app` | Deploy one app (set `APP=campus-erp` then run). Uses `sam deploy --config-env <app>`. |
| `npm test` | Run Jest unit tests. |
| `npm run test:unit` | Unit tests only. |
| `npm run test:integration` | Integration tests only. |

## Cursor Rules (.cursor/rules/)

| Rule | Purpose |
|------|---------|
| **agent-pipeline.mdc** | Multi-agent pipeline: full (10 phases) vs lightweight (3 phases); when to run each. |
| **new-module-pipeline.mdc** | When a new module is scaffolded: generate vertical agent SKILL, update REGISTRY, ARCHITECTURE, PRODUCT, SAM/GraphQL. |
| **module-contract.mdc** | Module structure and contract (MODULE.md, handlers, permissions, events, BaseRepository). |
| **app-module-isolation.mdc** | App modules must not import each other; communicate via EventBridge only; core never depends on app. |
| **sam-template.mdc** | SAM template conventions (!Sub, layers, EventBridge policy, tags). |
| **sam-template-agent.mdc** | When editing template/stacks: follow SAM Template Agent SKILL. |
| **graphql-schema-agent.mdc** | When editing GraphQL: follow GraphQL Schema Agent; use extend type; run merge-graphql. |
| **graphql-conventions.mdc** | extend type Query/Mutation, Connection types, AWSDateTime/AWSJSON. |
| **security.mdc** | Tenant isolation, secrets (SSM), input validation, no stack traces in responses. |
| **testing.mdc** | Handler tests, mock-layer, fixtures, tenant context. |
| **changelog-trigger.mdc** | After code changes: update CHANGELOG, README, PRODUCT (unless full pipeline is running). |
| **general-conventions.mdc** | File naming, JSDoc, const/let, structured logging, error handling. |

## Agent Workflow

Two pipeline modes (see [.cursor/rules/agent-pipeline.mdc](.cursor/rules/agent-pipeline.mdc)):

- **Full pipeline** (10 phases): Plan → Architect → Implement (vertical agents in dependency order: core then app) → Verify (Event Contract + Dependency agents) → Code Audit → Security (5b) → Test → Review → Changelog → Deploy Readiness. Each phase is gated.
- **Lightweight** (fix, tweak, refactor): Code Audit → Test → Changelog.

**Agents** (see [docs/agents/REGISTRY.md](docs/agents/REGISTRY.md)):

- **Pipeline**: Planner, Architect, Verify, Code Audit, Tester, Reviewer, Security, Deploy Readiness, Changelog.
- **Vertical** (one per module): Tenant, User, Form, Notification, Storage, Workflow, Audit (core); plus Custom agents for app modules (created by `generate-module.sh`).
- **Cross-cutting**: Event Contract, Dependency, SAM Template, GraphQL Schema.

New modules get a vertical agent SKILL at `docs/agents/<module>-agent.SKILL.md` (from `_template.SKILL.md`) and a row in REGISTRY.md. Pipeline details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Resources (AWS)

- **Lambdas**: One or more per module (e.g. tenant handler, user handler + Cognito triggers, audit-writer EventBridge consumer).
- **AppSync**: GraphQL API with Cognito auth; one data source per module Lambda; JS resolvers.
- **Cognito**: User Pool with custom attribute `tenant_id`; PreSignUp, PostConfirmation, PreTokenGeneration triggers.
- **EventBridge**: Custom bus for inter-module events; audit writer subscribes to all project events.
- **S3, SQS**: Storage and queue for app use.

## Deployment

Set SSM parameters (e.g. MongoDB URI):

- `/{ProjectName}/{Environment}/mongodb/uri` (SecureString)

Dev:

```bash
npm run build
sam deploy --config-env default
```

Prod:

```bash
sam deploy --config-env prod
```

## Configuration

- **ProjectName / Environment**: In `samconfig.toml` or override. `app-config.yaml` can set `project_name` and `environment` for reference; deploy uses `samconfig.toml`.

## Testing

- **Unit tests**: Handler tests per module under `tests/unit/modules/<module>/handler.test.js` using `tests/helpers/mock-layer.js` and fixtures in `fixtures/*.json`. Jest.
- **Pre-deploy**: `./scripts/deploy-check.sh` runs SAM/resolver checks and `npm test`.

```bash
npm install
npm test
npm run test:unit
./scripts/deploy-check.sh   # optional pre-deploy
```

## Building a Multi-Domain Product (Scenario B)

For a product with many domain modules (e.g. campus ERP: admission, fee-billing, library):

1. Run `./scripts/init-project.sh <project-name> --include-app admission,fee-billing,library` to scaffold those app modules and add them to `app-config.yaml`.
2. Implement each app module (MODULE.md, handlers, resolvers, graphql). App modules communicate via EventBridge only (see [.cursor/rules/app-module-isolation.mdc](.cursor/rules/app-module-isolation.mdc)).
3. Run `npm run build` to compose the template, merge GraphQL, and run `sam build`.

To add another app module later: `./scripts/generate-module.sh library --type app` (then implement; template is re-composed automatically).

## Multi-App Setup (Multiple Independent Stacks)

When you have **multiple apps** (e.g. Campus ERP and School Management) that share the same codebase but deploy as **separate CloudFormation stacks** with different module sets:

1. **Bootstrap an app**:  
   `./scripts/init-app.sh <app-name> [--core mod1,mod2,...] [--app mod1,mod2,...]`  
   Example: `./scripts/init-app.sh campus-erp --core tenant-management,user-management,audit-log,form-management --app admission,fee-billing`  
   This creates `app-configs/campus-erp.yaml`, adds a `[campus-erp.deploy.parameters]` section to `samconfig.toml`, optionally scaffolds app modules, and runs compose + merge for that app.

2. **Build one app**:  
   `APP=campus-erp npm run build:app`  
   Or: `./scripts/build-app.sh campus-erp`  
   This composes `template.campus-erp.yaml`, merges `schema.campus-erp.graphql`, validates, and runs `sam build -t template.campus-erp.yaml`.

3. **Deploy one app**:  
   `APP=campus-erp npm run deploy:app`  
   Or: `sam deploy --config-env campus-erp`  
   Each app has its own stack name (e.g. `campus-erp-dev`), so you can deploy and roll back independently.

4. **Add a module to a specific app**:  
   `./scripts/generate-module.sh admission --type app --app campus-erp`  
   Adds the module to `app-configs/campus-erp.yaml` and re-composes that app’s template.

5. **Remove a module from one app only**:  
   `./scripts/remove-module.sh admission --app campus-erp`  
   Removes it from that app’s config and re-composes; does not delete the module code (shared across apps).

6. **Pre-deploy check for one app**:  
   `./scripts/deploy-check.sh --app campus-erp`  
   Validates `template.campus-erp.yaml` and module/resolver counts from that app’s config.

The default **single-app** flow (no `--app`) continues to use `app-config.yaml` and `template.yaml`.

## Adding a Module

1. **Scaffold**: `./scripts/generate-module.sh my-module [--type app]`  
   - Default `--type app` → `src/app-modules/my-module/`, creates `stacks/app/my-module.yaml`, adds to `app-config.yaml`, runs compose.  
   - `--type core` → `src/core-modules/my-module/` (you add `stacks/core/my-module.yaml` and update `app-config.yaml` manually if using composition).
2. **Implement**: Edit MODULE.md, `functions/handler.js`, schemas, graphql, resolvers in the module directory.
3. **Template**: App modules are already in the composed template. For core or manual edits, use [docs/agents/sam-template-agent.SKILL.md](docs/agents/sam-template-agent.SKILL.md) or `./scripts/generate-sam-resources.sh my-module` to get YAML; add to `stacks/core/my-module.yaml` or `stacks/app/my-module.yaml` and run `npm run compose-template`.
4. **GraphQL**: Add types to the module’s `graphql/*.graphql` (extend type Query/Mutation). Run `npm run merge-graphql` to update root schema.
5. **Docs**: Update `docs/ARCHITECTURE.md` and `docs/PRODUCT.md`; run `./scripts/validate-events.sh` and `./scripts/check-dependencies.sh`.
6. **Tests**: Phase 6 (Tester agent) fills in handler test cases; run `npm test`.

See [docs/MODULE-SPEC.md](docs/MODULE-SPEC.md), [.cursor/rules/new-module-pipeline.mdc](.cursor/rules/new-module-pipeline.mdc), and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Key Documentation

| Doc | Content |
|-----|---------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Core vs app modules, template composition, event catalog, agent pipeline, dependency order. |
| [docs/MODULE-SPEC.md](docs/MODULE-SPEC.md) | Module contract: directory layout, MODULE.md, handlers, GraphQL, events. |
| [docs/PRODUCT.md](docs/PRODUCT.md) | Product context: domain, entities, core modules used, custom modules. |
| [docs/agents/REGISTRY.md](docs/agents/REGISTRY.md) | All agents (Pipeline, Vertical, Cross-cutting) and their SKILL files. |

The **Changelog Agent** ([docs/agents/changelog-agent.SKILL.md](docs/agents/changelog-agent.SKILL.md)) keeps this README and CHANGELOG in sync after approved code changes.
