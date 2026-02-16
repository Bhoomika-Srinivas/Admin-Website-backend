# Agent Registry

Single source of truth for all agents. All pipeline and vertical agents read this to discover available modules and agents.

| Agent | Type | Category | Scope | SKILL.md |
|-------|------|----------|-------|----------|
| Planner | Pipeline | — | All modules | docs/agents/planner-agent.SKILL.md |
| Architect | Pipeline | — | All modules | docs/agents/architect-agent.SKILL.md |
| Verify | Pipeline | — | All modules | docs/agents/verify-agent.SKILL.md |
| Code Audit | Pipeline | — | All modules | docs/agents/code-audit-agent.SKILL.md |
| Tester | Pipeline | — | All modules | docs/agents/tester-agent.SKILL.md |
| Reviewer | Pipeline | — | All modules | docs/agents/reviewer-agent.SKILL.md |
| Tenant | Vertical | Core (1st) | src/core-modules/tenant-management/ | docs/agents/tenant-agent.SKILL.md |
| User | Vertical | Core (2nd) | src/core-modules/user-management/ | docs/agents/user-agent.SKILL.md |
| Form | Vertical | Core (3rd) | src/core-modules/form-management/ | docs/agents/form-agent.SKILL.md |
| Notification | Vertical | Core (4th) | src/core-modules/notification-management/ | docs/agents/notification-agent.SKILL.md |
| Storage | Vertical | Core (5th) | src/core-modules/storage-management/ | docs/agents/storage-agent.SKILL.md |
| Workflow | Vertical | Core (6th) | src/core-modules/workflow-management/ | docs/agents/workflow-agent.SKILL.md |
| Audit | Vertical | Core (7th) | src/core-modules/audit-log/ | docs/agents/audit-agent.SKILL.md |
| Changelog | Utility | — | docs/ | docs/agents/changelog-agent.SKILL.md |
| Event Contract | Cross-cutting | — | All modules | docs/agents/event-contract-agent.SKILL.md |
| Dependency | Cross-cutting | — | All modules | docs/agents/dependency-agent.SKILL.md |
| SAM Template | Cross-cutting | — | stacks/, app-config; composed template.yaml / template.<app>.yaml | docs/agents/sam-template-agent.SKILL.md |
| GraphQL Schema | Cross-cutting | — | schema.graphql / schema.<app>.graphql | docs/agents/graphql-schema-agent.SKILL.md |
| Security | Pipeline (5b) | — | All modules | docs/agents/security-agent.SKILL.md |
| Deploy Readiness | Utility | — | All modules | docs/agents/deploy-readiness-agent.SKILL.md |

**Type**: Pipeline (developer workflow) / Vertical (module owner) / Utility (cross-cutting).

**Category**: Core (ships with starter, dependency order 1–7) / Custom (product-specific, appended when new modules are created).

New modules: run `./scripts/generate-module.sh <module-name> [--type app] [--app <app-name>]` or let the new-module-pipeline rule create the agent; a row is appended with Type=Vertical, Category=Custom.

**Multi-app**: Use `./scripts/init-app.sh <app-name> [--core ...] [--app ...]` to create app-configs/<app>.yaml and a samconfig deploy profile. Use `generate-module.sh --app <app-name>` to add new app modules to that app only. Build with `APP=<app> npm run build:app`; deploy with `sam deploy --config-env <app>` or `APP=<app> npm run deploy:app`.
