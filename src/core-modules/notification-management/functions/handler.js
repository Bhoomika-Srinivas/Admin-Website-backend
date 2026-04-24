const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver');
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard');
const { validate } = require('/opt/nodejs/middleware/input-validator');
const { withConnection } = require('/opt/nodejs/middleware/with-connection');
const { log } = require('/opt/nodejs/middleware/request-logger');
const { generateId } = require('/opt/nodejs/utils/id-generator');
const { MongoRepository } = require('/opt/nodejs/db/mongo-repository');
const { NotFoundError, ValidationError } = require('/opt/nodejs/middleware/error-handler');
const { normalizePagination } = require('/opt/nodejs/utils/pagination');
const {
  createTemplateSchema,
  getTemplateSchema,
  listTemplatesSchema,
  listNotificationsSchema,
  updatePreferenceSchema,
} = require('../schemas/validation');

const NotificationTemplate = require('../schemas/template.model');
const Notification = require('../schemas/notification.model');
const NotificationPreference = require('../schemas/preference.model');

const templateRepo = new MongoRepository({ model: NotificationTemplate, primaryKey: 'template_id' });
const notificationRepo = new MongoRepository({ model: Notification, primaryKey: 'notification_id' });

async function handleEvent(event) {
  const ctx = resolveTenant(event);
  log(ctx, 'notification-management', event.field);

  switch (event.field) {
    case 'createTemplate':
      await requirePermission(ctx, 'notification:template:create');
      return await createTemplate(ctx, event.arguments);
    case 'getTemplate':
      await requirePermission(ctx, 'notification:template:read');
      return await getTemplate(ctx, event.arguments);
    case 'listTemplates':
      await requirePermission(ctx, 'notification:template:read');
      return await listTemplates(ctx, event.arguments);
    case 'listNotifications':
      await requirePermission(ctx, 'notification:notification:read');
      return await listNotifications(ctx, event.arguments);
    case 'updatePreference':
      await requirePermission(ctx, 'notification:preference:update');
      return await updatePreference(ctx, event.arguments);
    default:
      throw new Error(`Unknown field: ${event.field}`);
  }
}

exports.handler = withConnection(handleEvent);

async function createTemplate(ctx, args) {
  const input = validate(createTemplateSchema, args?.input || args || {});
  const data = {
    template_id: generateId(),
    name: input.name,
    channel: input.channel || 'email',
    subject: input.subject,
    body_html: input.body_html,
    body_text: input.body_text,
    variables: input.variables || [],
  };
  return await templateRepo.create(ctx, data);
}

async function getTemplate(ctx, args) {
  const { template_id } = validate(getTemplateSchema, args || {});
  const doc = await templateRepo.findById(ctx, template_id);
  if (!doc) throw new NotFoundError('Template not found');
  return doc;
}

async function listTemplates(ctx, args) {
  const validated = validate(listTemplatesSchema, args || {});
  const pagination = normalizePagination(validated.pagination);
  return await templateRepo.findMany(ctx, {}, pagination);
}

async function listNotifications(ctx, args) {
  const validated = validate(listNotificationsSchema, args || {});
  const pagination = normalizePagination(validated.pagination);
  const result = await notificationRepo.findMany(ctx, {}, pagination);
  return { items: result.items, nextCursor: result.nextCursor, pageInfo: result.pageInfo };
}

async function updatePreference(ctx, args) {
  const input = validate(updatePreferenceSchema, args?.input || args || {});
  const user_id = input.user_id || ctx.user_id;
  if (!user_id) throw new ValidationError('user_id required for preference');
  await NotificationPreference.findOneAndUpdate(
    { user_id, tenant_id: ctx.tenant_id },
    { $set: { channels: input.channels || {}, quiet_hours: input.quiet_hours || {} } },
    { upsert: true, new: true }
  );
  return await NotificationPreference.findOne({ user_id, tenant_id: ctx.tenant_id }).lean();
}
