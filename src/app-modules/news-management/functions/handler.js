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
  getNewsSchema,
  listNewsSchema,
  createNewsSchema,
  updateNewsSchema,
  deleteNewsSchema
} = require('../schemas/validation');

const News = require('../schemas/news.model');

const newsRepo = new MongoRepository({
  model: News,
  primaryKey: 'news_id'
});

async function handleEvent(event) {
  const ctx = resolveTenant(event);

  // Individual deployment → disable tenant scoping
  ctx.tenant_id = undefined;

  log(ctx, 'newsmanagement', event.field);

  switch (event.field) {

    case 'getNews':
      await requirePermission(ctx, 'news:news:read');
      return await getNews(ctx, event.arguments);

    case 'listNews':
      await requirePermission(ctx, 'news:news:list');
      return await listNews(ctx, event.arguments);

    case 'createNews':
      await requirePermission(ctx, 'news:news:create');
      return await createNews(ctx, event.arguments);

    case 'updateNews':
      await requirePermission(ctx, 'news:news:update');
      return await updateNews(ctx, event.arguments);

    case 'deleteNews':
      await requirePermission(ctx, 'news:news:delete');
      return await deleteNews(ctx, event.arguments);

    default:
      throw new Error(`Unknown field: ${event.field}`);
  }
}

exports.handler = withConnection(handleEvent);

/* ============================== */

async function getNews(ctx, args) {
  const { news_id } = validate(getNewsSchema, args || {});
  const doc = await newsRepo.findById(ctx, news_id);
  if (!doc) throw new NotFoundError('News not found');
  return doc;
}

async function listNews(ctx, args) {
  const validated = validate(listNewsSchema, args || {});
  const pagination = normalizePagination(validated.pagination);

  const filters = {};

  if (validated.constituency) filters.constituency = validated.constituency;
  if (validated.ward) filters.ward = validated.ward;
  if (validated.incidentType) filters.incidentType = validated.incidentType;

  const result = await newsRepo.findMany(ctx, filters, pagination);

  return {
    items: result.items,
    nextCursor: result.nextCursor
  };
}

async function createNews(ctx, args) {
  const input = validate(createNewsSchema, args?.input || args || {});
  const news_id = input.news_id || generateId();

  const data = {
    ...input,
    news_id,
    createdBy: ctx.user_id
  };

  const created = await newsRepo.create(ctx, data);

  await publishEvent('newsmanagement', 'NewsCreated', {
    news_id,
    created_by: ctx.user_id,
    timestamp: new Date().toISOString()
  });

  return created;
}

async function updateNews(ctx, args) {
  const validated = validate(updateNewsSchema, {
    ...args,
    input: args?.input || args
  });

  const news_id = validated.news_id || validated.id;
  const input = validated.input || {};

  const existing = await newsRepo.findById(ctx, news_id);
  if (!existing) throw new NotFoundError('News not found');

  const updated = await newsRepo.updateById(ctx, news_id, input);

  await publishEvent('newsmanagement', 'NewsUpdated', {
    news_id,
    updated_by: ctx.user_id,
    timestamp: new Date().toISOString()
  });

  return updated;
}

async function deleteNews(ctx, args) {
  const { news_id } = validate(deleteNewsSchema, args || {});

  const existing = await newsRepo.findById(ctx, news_id);
  if (!existing) throw new NotFoundError('News not found');

  await newsRepo.deleteById(ctx, news_id);

  await publishEvent('newsmanagement', 'NewsDeleted', {
    news_id,
    deleted_by: ctx.user_id,
    timestamp: new Date().toISOString()
  });

  return { success: true };
}
