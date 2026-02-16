# Event Contract Agent

> Type: Cross-cutting (invoked during Phase 4 — Verify) — Validate EventBridge event contracts across publishers and consumers

When invoked: Validate that EventBridge event contracts are consistent: every `publishEvent` call in code is documented in MODULE.md and in docs/ARCHITECTURE.md; audit-writer consumes all events; payload shapes are consistent. Run as part of Phase 4 (Verify) or standalone for event contract sanity checks.

## Context (read in order)
1. Read **docs/ARCHITECTURE.md** — Event Catalog table (Source, DetailType, When).
2. Read every **src/core-modules/*/MODULE.md and src/app-modules/*/MODULE.md** — "Events Published" and "Events Consumed" sections.
3. Search all handler and trigger files under **src/core-modules/** and **src/app-modules/** for `publishEvent(` calls (e.g. `publishEvent('module-name', 'DetailType', { ... })`).
4. Read **template.yaml** (or **template.<app>.yaml** for a specific app) — EventBridge rules (e.g. AuditWriterEventRule with `source: prefix: !Sub '${ProjectName}.'`); any workflow-specific rules.

## Validation Checks

| Check | Pass condition |
|-------|----------------|
| **Code → MODULE.md** | Every `publishEvent(source, detailType, detail)` call in handler/trigger code has a matching entry in that module's MODULE.md "Events Published" section (same DetailType and consistent payload description). |
| **MODULE.md → ARCHITECTURE** | Every "Events Published" entry in each MODULE.md has a matching row in docs/ARCHITECTURE.md Event Catalog (Source = {ProjectName}.<module-name>, DetailType, When). |
| **Audit consumption** | The audit-writer EventBridge rule uses a pattern that captures all published sources (e.g. `source: prefix: ${ProjectName}.`). All modules that publish events use source format that matches this prefix. |
| **Workflow consumers** | If workflow-management exists and subscribes to events, the composed template (template.yaml or template.<app>.yaml) has corresponding EventBridge rule(s) and MODULE.md "Events Consumed" lists those events. |
| **Payload consistency** | Event payloads consistently include tenant_id (or equivalent), and a timestamp or actor identifier where appropriate; document any deviation. |

## Actions on Failure

- List each mismatch with **file:line** (handler or MODULE.md).
- For code calls not in MODULE.md: suggest adding the event to the module's "Events Published" section.
- For MODULE.md events not in ARCHITECTURE.md: suggest adding a row to the Event Catalog table.
- For ARCHITECTURE.md entries with no matching code: flag as orphaned (possibly removed from code but not from docs).

## Output Format

```
## Event Contract Validation Report

### Scope
- **Modules with events**: <list>
- **Audit rule pattern**: <e.g. source prefix ${ProjectName}.>

### Results

| Module | Code → MODULE.md | MODULE.md → ARCHITECTURE | Audit rule | Payload consistency |
|--------|------------------|--------------------------|------------|---------------------|
| <module> | PASS / FAIL | PASS / FAIL | PASS / FAIL | PASS / FAIL |

### Failures (if any)
- **<module>** — <check>: <description> (file:line)
- **Missing in ARCHITECTURE.md**: <DetailType> from <module>
- **Orphaned in ARCHITECTURE.md**: <DetailType> (no publishEvent in code)

### Summary
- **Overall**: PASS / FAIL
```

Run **scripts/validate-events.sh** for a quick sanity check: it greps handlers for `publishEvent` and compares against MODULE.md entries.
