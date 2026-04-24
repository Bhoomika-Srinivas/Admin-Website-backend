const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver');
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard');
const { withConnection } = require('/opt/nodejs/middleware/with-connection');
const { log } = require('/opt/nodejs/middleware/request-logger');
const { NotFoundError, ValidationError } = require('/opt/nodejs/middleware/error-handler');
const { normalizePagination } = require('/opt/nodejs/utils/pagination');

async function handleEvent(event) {
  const ctx = resolveTenant(event);
  log(ctx, 'audit-log', event.field);

  if (event.field === 'getAuditEntry') {
    await requirePermission(ctx, 'audit:log:read');
    return await getAuditEntry(ctx, event.arguments);
  }
  if (event.field === 'listAuditEntries') {
    await requirePermission(ctx, 'audit:log:read');
    return await listAuditEntries(ctx, event.arguments);
  }

  throw new Error(`Unknown field: ${event.field}`);
}

exports.handler = withConnection(handleEvent);

function mapEntry(doc) {
  const after = doc.after;
  const details = after ? JSON.stringify(after) : null;
  return {
    ...doc,
    id: doc.entry_id,
    userId: doc.actor_id || '',
    userName: doc.actor_email || '',
    actor_email: doc.actor_email || '',
    resourceType: doc.resource_type || null,
    resourceId: doc.resource_id || null,
    ipAddress: doc.metadata?.ip || null,
    severity: doc.severity || 'info',
    createdAt: doc.timestamp,
    metadata: doc.metadata
      ? { ...doc.metadata, details }
      : { details },
  };
}

async function getAuditEntry(ctx, args) {
  const AuditEntry = require('../schemas/audit-entry.model');
  const entry_id = args?.entry_id;
  if (!entry_id) throw new ValidationError('entry_id is required');
  const doc = await AuditEntry.findOne({ entry_id, tenant_id: ctx.tenant_id }).lean();
  if (!doc) throw new NotFoundError('Audit entry not found');
  return mapEntry(doc);
}

async function listAuditEntries(ctx, args) {
  const AuditEntry = require('../schemas/audit-entry.model');
  const filter = args?.filter || {};
  const pagination = normalizePagination(args?.pagination);

  const query = { tenant_id: ctx.tenant_id };
  if (filter.action) query.action = filter.action;
  if (filter.resource_type) query.resource_type = filter.resource_type;
  if (filter.actor_id) query.actor_id = filter.actor_id;
  if (filter.from) query.timestamp = { ...query.timestamp, $gte: new Date(filter.from) };
  if (filter.to) query.timestamp = { ...query.timestamp, $lte: new Date(filter.to) };

  const limit = Math.min(pagination.limit || 100, 500);
  const page = Math.max(pagination.page || 1, 1);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AuditEntry.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    AuditEntry.countDocuments(query),
  ]);

  return {
    items: items.map(mapEntry),
    nextCursor: null,
    pageInfo: { total, page, limit, hasNextPage: skip + items.length < total, endCursor: null },
  };
}
