const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver');
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard');
const { validate } = require('/opt/nodejs/middleware/input-validator');
const { withConnection } = require('/opt/nodejs/middleware/with-connection');
const { log } = require('/opt/nodejs/middleware/request-logger');
const { publishEvent } = require('/opt/nodejs/utils/event-publisher');
const { generateId } = require('/opt/nodejs/utils/id-generator');
const { MongoRepository } = require('/opt/nodejs/db/mongo-repository');
const { NotFoundError, ConflictError } = require('/opt/nodejs/middleware/error-handler');
const { normalizePagination } = require('/opt/nodejs/utils/pagination');
const {
  getTenantSchema,
  listTenantsSchema,
  createTenantSchema,
  updateTenantSchema,
  suspendTenantSchema,
} = require('../schemas/validation');

const Tenant = require('../schemas/tenant.model');

const tenantRepo = new MongoRepository({ model: Tenant, primaryKey: 'tenant_id' });

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

async function handleEvent(event) {
  const ctx = resolveTenant(event);
  log(ctx, 'tenant-management', event.field);

  switch (event.field) {
    case 'getTenant':
      await requirePermission(ctx, 'tenant:tenant:read');
      return await getTenant(ctx, event.arguments);
    case 'listTenants':
      await requirePermission(ctx, 'tenant:tenant:list');
      return await listTenants(ctx, event.arguments);
    case 'createTenant':
      await requirePermission(ctx, 'tenant:tenant:create');
      return await createTenant(ctx, event.arguments);
    case 'updateTenant':
      await requirePermission(ctx, 'tenant:tenant:update');
      return await updateTenant(ctx, event.arguments);
    case 'suspendTenant':
      await requirePermission(ctx, 'tenant:tenant:suspend');
      return await suspendTenant(ctx, event.arguments);
    default:
      throw new Error(`Unknown field: ${event.field}`);
  }
}

exports.handler = withConnection(handleEvent);

async function getTenant(ctx, args) {
  const { tenant_id } = validate(getTenantSchema, args || {});
  const doc = await tenantRepo.findById(ctx, tenant_id);
  if (!doc) throw new NotFoundError('Tenant not found');
  return doc;
}

async function listTenants(ctx, args) {
  const validated = validate(listTenantsSchema, args || {});
  const pagination = normalizePagination(validated.pagination);
  const result = await tenantRepo.findMany(ctx, {}, pagination);
  return {
    items: result.items,
    nextCursor: result.nextCursor,
  };
}

async function createTenant(ctx, args) {
  const input = validate(createTenantSchema, args?.input || args || {});
  const name = input.name;
  const slug = input.slug || slugify(name);
  const plan = input.plan || 'free';
  const owner_user_id = input.owner_user_id || ctx.user_id;

  const existing = await tenantRepo.findOneGlobal({ slug });
  if (existing) throw new ConflictError('Tenant slug already exists');

  const tenant_id = generateId();
  const data = {
    tenant_id,
    name,
    slug,
    plan,
    status: 'active',
    config: input.config || { features_enabled: [], max_users: 5 },
    owner_user_id,
    created_by: ctx.user_id,
  };
  const created = await tenantRepo.create(ctx, data);
  await publishEvent('tenant-management', 'TenantCreated', {
    tenant_id: created.tenant_id,
    name: created.name,
    slug: created.slug,
    plan: created.plan,
    owner_user_id: created.owner_user_id,
    created_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });
  return created;
}

async function updateTenant(ctx, args) {
  const validated = validate(updateTenantSchema, { ...args, input: args?.input || args });
  const tenant_id = validated.tenant_id || validated.id;
  const input = validated.input || {};

  const existing = await tenantRepo.findById(ctx, tenant_id);
  if (!existing) throw new NotFoundError('Tenant not found');

  const updates = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.slug !== undefined) updates.slug = input.slug;
  if (input.plan !== undefined) updates.plan = input.plan;
  if (input.config !== undefined) updates.config = input.config;

  const updated = await tenantRepo.updateById(ctx, tenant_id, updates);
  await publishEvent('tenant-management', 'TenantUpdated', {
    tenant_id,
    updated_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });
  return updated;
}

async function suspendTenant(ctx, args) {
  const { tenant_id } = validate(suspendTenantSchema, { tenant_id: args?.tenant_id || args?.id });

  const existing = await tenantRepo.findById(ctx, tenant_id);
  if (!existing) throw new NotFoundError('Tenant not found');

  const updated = await tenantRepo.updateById(ctx, tenant_id, { status: 'suspended' });
  await publishEvent('tenant-management', 'TenantSuspended', {
    tenant_id,
    suspended_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });
  return updated;
}
