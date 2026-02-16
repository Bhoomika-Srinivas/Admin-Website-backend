# Dependency Agent

> Type: Cross-cutting (invoked during Phase 4 — Verify) — Validate cross-module dependencies and enforce dependency order

When invoked: Validate that cross-module dependencies are declared, there are no circular dependencies, and the documented dependency order in ARCHITECTURE.md is respected. Run as part of Phase 4 (Verify) or standalone.

## Context (read in order)
1. Read every **src/core-modules/*/MODULE.md and src/app-modules/*/MODULE.md** — "Dependencies" section (e.g. "Tenant", "User", "None").
2. Read **docs/ARCHITECTURE.md** — "Module Dependency Order" list.
3. Search all handler and trigger files under **src/core-modules/** and **src/app-modules/** for `require()` statements that reference paths outside the current module (e.g. `../../other-module/` or `src/core-modules/other-module or src/app-modules/other-module`).
4. Read **template.yaml** (or **template.<app>.yaml** for a specific app) — EventBridge rules to see which modules consume events from which sources.

## Validation Checks

| Check | Pass condition |
|-------|----------------|
| **No cross-module code imports** | No handler or schema file under src/core-modules/<module>/ or src/app-modules/<module>/ requires a path that points to another module's functions/ or schemas/. All cross-module communication is via EventBridge or shared common layer (/opt/nodejs/*). |
| **Declared vs actual** | If a module's code somehow referenced another module (e.g. by name in a require), that module would appear in MODULE.md Dependencies. Since we enforce no cross-module requires, the only dependencies are logical (e.g. "depends on Tenant for tenant_id"); MODULE.md Dependencies should list those. |
| **Circular dependencies** | Build a directed graph from MODULE.md Dependencies (A depends on B → edge A → B). There must be no cycle (no path from A back to A). |
| **Order consistency** | The order in ARCHITECTURE.md "Module Dependency Order" should be a valid topological order: if module X depends on Y, then Y appears before X in the list. |
| **Event consumers** | If a module "Events Consumed" lists events from another module, that other module should be a dependency or the consumption is cross-cutting (e.g. audit consumes all; workflow may consume from any). No strict code dependency required for event consumption. |

## Output Format

```
## Dependency Validation Report

### Dependency Graph (text)
<module> -> <dep1>, <dep2>
...

### Results

| Check | Result |
|-------|--------|
| Cross-module code imports | PASS / FAIL — (file:line if any) |
| Circular dependencies | PASS / FAIL — (cycle if any) |
| ARCHITECTURE order | PASS / FAIL |

### Violations (if any)
- **Cross-module require**: file:line — <description>
- **Cycle**: <module1> -> ... -> <module1>
- **Order**: <module> depends on <dep> but <dep> appears after <module> in ARCHITECTURE.md

### Summary
- **Overall**: PASS / FAIL
```

Run **scripts/check-dependencies.sh** for a quick dependency graph and cycle check from MODULE.md.
