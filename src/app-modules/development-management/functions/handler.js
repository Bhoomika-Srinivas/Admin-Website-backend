const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver');
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard');
const { validate } = require('/opt/nodejs/middleware/input-validator');
const { withConnection } = require('/opt/nodejs/middleware/with-connection');
const { log } = require('/opt/nodejs/middleware/request-logger');
const { publishEvent } = require('/opt/nodejs/utils/event-publisher');
const { generateId } = require('/opt/nodejs/utils/id-generator');
const { MongoRepository } = require('/opt/nodejs/db/mongo-repository');
const { NotFoundError } = require('/opt/nodejs/middleware/error-handler');
const { normalizePagination } = require('/opt/nodejs/utils/pagination');

const {
  getDevelopmentSchema,
  listDevelopmentSchema,
  createDevelopmentSchema,
  updateDevelopmentSchema,
  deleteDevelopmentSchema,
} = require('../schemas/validation');

const Development = require('../schemas/development.model');

const developmentRepo = new MongoRepository({
  model: Development,
  primaryKey: 'development_id'
});

async function handleEvent(event) {
  const ctx = resolveTenant(event);
   // Disable tenant scoping for this module
  ctx.tenant_id = undefined;
  log(ctx, 'development-management', event.field);

  switch (event.field) {
    case 'getDevelopment':
      await requirePermission(ctx, 'development:development:read');
      return await getDevelopment(ctx, event.arguments);

    case 'listDevelopments':
      await requirePermission(ctx, 'development:development:list');
      return await listDevelopments(ctx, event.arguments);

    case 'createDevelopment':
      await requirePermission(ctx, 'development:development:create');
      return await createDevelopment(ctx, event.arguments);

    case 'updateDevelopment':
      await requirePermission(ctx, 'development:development:update');
      return await updateDevelopment(ctx, event.arguments);

    case 'deleteDevelopment':
      await requirePermission(ctx, 'development:development:delete');
      return await deleteDevelopment(ctx, event.arguments);

    default:
      throw new Error(`Unknown field: ${event.field}`);
  }
}

exports.handler = withConnection(handleEvent);

/* ============================= */

async function getDevelopment(ctx, args) {
  const { development_id } = validate(getDevelopmentSchema, args || {});
  const doc = await developmentRepo.findById(ctx, development_id);
  if (!doc) throw new NotFoundError('Development work not found');
  return doc;
}

async function listDevelopments(ctx, args) {
  const validated = validate(listDevelopmentSchema, args || {});
  const pagination = normalizePagination(validated.pagination);

  const filters = {};

  if (validated.constituency) filters.constituency = validated.constituency;
  if (validated.ward) filters.ward = validated.ward;
  if (validated.ward_no) filters.ward_no = validated.ward_no;
  if (validated.year) filters.year = validated.year;
  if (validated.status) filters.status = validated.status;
  if (validated.type) filters.type = validated.type;
  if (validated.view_on_tracker !== undefined)
    filters.view_on_tracker = validated.view_on_tracker;

  const result = await developmentRepo.findMany(ctx, filters, pagination);

  return {
    items: result.items,
    nextCursor: result.nextCursor
  };
}

async function createDevelopment(ctx, args) {
  const input = validate(createDevelopmentSchema, args?.input || args || {});
  const development_id = input.development_id || generateId();

  const data = {
    ...input,
    development_id,
    createdBy: ctx.user_id
  };

  const created = await developmentRepo.create(ctx, data);

  await publishEvent('development-management', 'DevelopmentCreated', {
    development_id,
    tenant_id: ctx.tenant_id,
    created_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });

  return created;
}

async function updateDevelopment(ctx, args) {
  const validated = validate(updateDevelopmentSchema, {
    ...args,
    input: args?.input || args
  });

  const development_id = validated.development_id || validated.id;
  const input = validated.input || {};

  const existing = await developmentRepo.findById(ctx, development_id);
  if (!existing) throw new NotFoundError('Development work not found');

  const updated = await developmentRepo.updateById(ctx, development_id, input);

  await publishEvent('development-management', 'DevelopmentUpdated', {
    development_id,
    tenant_id: ctx.tenant_id,
    updated_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });

  return updated;
}

async function deleteDevelopment(ctx, args) {
  const { development_id } = validate(deleteDevelopmentSchema, args || {});

  const existing = await developmentRepo.findById(ctx, development_id);
  if (!existing) throw new NotFoundError('Development work not found');

  await developmentRepo.deleteById(ctx, development_id);

  await publishEvent('development-management', 'DevelopmentDeleted', {
    development_id,
    tenant_id: ctx.tenant_id,
    deleted_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });

  return { success: true };
}
