# Security Agent

> Type: Pipeline Agent | Phase 5b — Deep security scan (runs after Code Audit, before Test)

When invoked: Perform a focused security review beyond the Code Audit's security bullets. Check tenant isolation, IAM least privilege, secret management, input validation, auth enforcement, and error information leakage. Output a security report with severity (critical/high/medium/low), file:line, description, and remediation. This is Phase 5b of the full pipeline.

## Context (read in order)
1. Read all **src/core-modules/*/functions and src/app-modules/*/functions/*.js** handler and trigger files.
2. Read **template.yaml** (or **template.<app>.yaml** for a specific app) — every Lambda's Policies section (IAM policies).
3. Read **src/core-modules/*/schemas and src/app-modules/*/schemas/*.js** model files (for any raw query usage).
4. Read **src/layers/common/nodejs/middleware/** — auth-guard, error-handler, tenant-resolver (to understand enforcement).

## Security Checks

| Check | What to verify | Severity | Remediation |
|-------|----------------|----------|-------------|
| **Tenant isolation** | Every DB access goes through BaseRepository or MongoRepository (which injects tenant_id). Flag any direct Mongoose model calls (e.g. `Model.find()`, `Model.findOne()`, `Model.findById()`) in handlers that bypass the repository or do not pass a tenant filter. | Critical | Use MongoRepository/BaseRepository for all DB access; never call Model directly in handlers for tenant-scoped data. |
| **IAM least privilege** | Each Lambda's Policies in the composed template (template.yaml or template.<app>.yaml) grant only the actions and resources needed. Flag policies with `Resource: '*'` or overly broad actions (e.g. `s3:*` on `*`) unless justified. | High | Restrict Resource to specific ARNs (e.g. bucket, parameter path); use minimal action set. |
| **Secret management** | No hardcoded API keys, connection strings, or passwords in source or template. Sensitive config comes from SSM Parameter Store (or Secrets Manager); env vars in template only for non-sensitive values (e.g. STAGE, BUCKET_NAME). | Critical | Remove hardcoded secrets; reference SSM parameters in template Environment (in stacks/ or composed template) or use MONGODB_SSM_PARAM_NAME pattern. |
| **Input validation** | Handlers validate required arguments (e.g. tenant_id, id, input fields) before processing. No unsanitized user input passed directly into DB queries or event payloads in a way that could cause injection or corruption. | High | Add explicit checks for required args; use ValidationError for missing/invalid input; sanitize or whitelist where needed. |
| **Auth enforcement** | Every handler operation calls `requirePermission(ctx, 'module:resource:action')` before performing the action. No operation branch skips the permission check. | Critical | Add requirePermission at the start of every operation branch. |
| **Error information leakage** | Error responses (e.g. from handleError) do not expose stack traces, internal paths, or sensitive details to the client. Production error messages are generic where appropriate. | Medium | Ensure handleError does not return stack or internal details; log details server-side only. |

## Output Format

```
## Security Report (Phase 5b)

### Scope
- **Modules**: <list>
- **Lambdas audited**: <count>

### Findings

| Severity | File:line | Check | Description | Remediation |
|----------|-----------|-------|-------------|-------------|
| Critical | path:NN | Tenant isolation | Direct Model.find() without tenant_id | Use MongoRepository |
| High | ... | ... | ... | ... |

### Summary
- **Critical**: <count> — must fix before Phase 6
- **High**: <count> — must fix before Phase 6
- **Medium**: <count>
- **Low**: <count>

### Gate
- If any **Critical** or **High** finding exists: do not proceed to Phase 6 until remediated; re-run Security Agent.
- **Medium/Low**: document and optionally fix before deploy.
```

Explicitly state: **This is Phase 5b. Present the security report to the user. Fix all Critical and High findings before proceeding to Phase 6 (Test).**
