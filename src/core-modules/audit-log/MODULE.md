# Module: audit-log

## Data Models

- **AuditEntry**: entry_id, tenant_id, actor_id, actor_email, action, resource_type, resource_id, before (snapshot), after (snapshot), metadata (ip, user_agent, source, detail_type), timestamp.

## GraphQL Schema

- Queries: getAuditEntry(entry_id), listAuditEntries(filter, pagination)
- No mutations (passive write-only from events).

## Events Published

None. Audit module is passive.

## Events Consumed

All events on the project EventBus (source prefix: ProjectName.). AuditWriterFunction is triggered by EventBridge rule and writes each event to the audit log.

## Permissions

- audit:log:read, audit:log:export

## Dependencies

None. Consumes events from all modules.

## Database Choice

MongoDB. High-write, document-oriented; variable before/after shapes.
