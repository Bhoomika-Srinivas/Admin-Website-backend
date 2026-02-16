# Deploy Readiness Agent

> Type: Utility Agent | Phase 9 — Final pre-deploy validation (runs after Changelog)

When invoked: Run a final checklist to ensure the project is consistent and ready for deployment. Verify SAM template coverage, GraphQL schema consistency, event catalog alignment, tests passing, dependencies, documentation, and environment config. Output a deploy readiness report with pass/fail per item and blocking issues vs warnings.

## Context (read in order)
1. Read **template.yaml** (default app) or **template.<app>.yaml** (when validating a specific app) — Lambda resources, DataSources, Resolvers, AppSyncServiceRole.
2. Read **src/appsync/schema/schema.graphql** (default) or **schema.<app>.graphql** (per-app) — root Query and Mutation fields.
3. Read every **src/core-modules/*/MODULE.md and src/app-modules/*/MODULE.md** — GraphQL operations and events.
4. Read **docs/ARCHITECTURE.md** — event catalog and module list.
5. Read **package.json** — scripts and devDependencies.
6. Read **docs/CHANGELOG.md** — latest entry.

## Pre-deploy Checklist

| Check | Pass condition |
|-------|----------------|
| **SAM template** | Every module under src/core-modules/ and src/app-modules/ (except _template) that has a handler has a corresponding Lambda resource. Every such Lambda has a DataSource and Resolvers for each resolver file. AppSyncServiceRole Policies.InvokeModuleLambdas.Resource includes every AppSync-backed Lambda ARN. Every Lambda has CommonLayer and PackagesLayer. |
| **GraphQL schema** | Root schema.graphql includes all Query and Mutation fields from all modules. No orphaned types (types defined but never referenced in Query/Mutation or other types). |
| **Event catalog** | docs/ARCHITECTURE.md event catalog table matches all publishEvent usages in code (run scripts/validate-events.sh). |
| **Tests** | `npm test` passes (run it). |
| **Dependencies** | package.json has required devDependencies (e.g. jest, mongoose). No missing layer dependencies. |
| **Documentation** | CHANGELOG.md has a recent entry. MODULE.md files are present and up to date for each module. |
| **Environment config** | No hardcoded env values in template; all use !Sub or !Ref. Sensitive config via SSM. |

## Output Format

```
## Deploy Readiness Report (Phase 9)

### Checklist

| Check | Result | Notes |
|-------|--------|-------|
| SAM template | PASS / FAIL | ... |
| GraphQL schema | PASS / FAIL | ... |
| Event catalog | PASS / FAIL | ... |
| Tests | PASS / FAIL | ... |
| Dependencies | PASS / FAIL | ... |
| Documentation | PASS / FAIL | ... |
| Environment config | PASS / FAIL | ... |

### Blocking issues (if any)
- <description>

### Warnings (if any)
- <description>

### Summary
- **Ready to deploy**: Yes / No
```

If all checks pass, output: **Ready to deploy.** Default app: **Run `npm run build && sam deploy --config-env default`.** Specific app: **Run `APP=<app> npm run build:app` then `APP=<app> npm run deploy:app`.**

Run **scripts/deploy-check.sh** for the default app, or **scripts/deploy-check.sh --app <app-name>** to validate a specific app's template (template.<app>.yaml and module list from app-configs/<app>.yaml). For multi-app deploy: **APP=<app> npm run build:app** then **APP=<app> npm run deploy:app** (or `sam deploy --config-env <app>`).
