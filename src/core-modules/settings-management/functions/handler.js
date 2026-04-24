const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver');
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard');
const { validate } = require('/opt/nodejs/middleware/input-validator');
const { withConnection } = require('/opt/nodejs/middleware/with-connection');
const { log } = require('/opt/nodejs/middleware/request-logger');
const { publishEvent } = require('/opt/nodejs/utils/event-publisher');
const { ValidationError, NotFoundError } = require('/opt/nodejs/middleware/error-handler');
const {
  listSettingsSchema,
  getSettingSchema,
  createSettingSchema,
  updateSettingSchema,
  deleteSettingSchema,
} = require('../schemas/validation');

const Setting = require('../schemas/setting.model');

async function handleEvent(event) {
  const ctx = resolveTenant(event);
  log(ctx, 'settings-management', event.field);

  switch (event.field) {
    case 'listSettings':
      await requirePermission(ctx, 'settings:setting:read');
      return await listSettings(ctx, event.arguments);
    case 'getSetting':
      await requirePermission(ctx, 'settings:setting:read');
      return await getSetting(ctx, event.arguments);
    case 'createSetting':
      await requirePermission(ctx, 'settings:setting:create');
      return await createSetting(ctx, event.arguments);
    case 'updateSetting':
      await requirePermission(ctx, 'settings:setting:update');
      return await updateSetting(ctx, event.arguments);
    case 'deleteSetting':
      await requirePermission(ctx, 'settings:setting:delete');
      return await deleteSetting(ctx, event.arguments);
    default:
      throw new Error(`Unknown field: ${event.field}`);
  }
}

exports.handler = withConnection(handleEvent);

function toShape(doc) {
  return {
    key: doc.key,
    value: doc.value,
    category: doc.category,
    sensitivity: doc.sensitivity,
    updated_by: doc.updated_by || null,
    updated_at: doc.updated_at || null,
  };
}

async function listSettings(ctx, args) {
  const validated = validate(listSettingsSchema, args || {});
  const filter = { tenant_id: ctx.tenant_id };
  if (validated.category) filter.category = validated.category;
  const docs = await Setting.find(filter).lean();
  return docs.map(toShape);
}

async function getSetting(ctx, args) {
  const validated = validate(getSettingSchema, args || {});
  const doc = await Setting.findOne({ tenant_id: ctx.tenant_id, key: validated.key }).lean();
  if (!doc) throw new NotFoundError(`Setting '${validated.key}' not found`);
  return toShape(doc);
}

async function createSetting(ctx, args) {
  const validated = validate(createSettingSchema, args || {});
  const { key, value, category, sensitivity } = validated.input;

  const existing = await Setting.findOne({ tenant_id: ctx.tenant_id, key }).lean();
  if (existing) throw new ValidationError(`Setting '${key}' already exists`);

  const doc = await Setting.create({
    tenant_id: ctx.tenant_id,
    key,
    value,
    category: category || 'operational',
    sensitivity: sensitivity || 'low',
    updated_by: ctx.user_id,
    updated_at: new Date(),
  });

  await publishEvent('settings-management', 'SettingCreated', {
    tenant_id: ctx.tenant_id,
    key,
    updated_by: ctx.user_id,
  });

  return toShape(doc);
}

async function updateSetting(ctx, args) {
  const validated = validate(updateSettingSchema, args || {});
  const { key, input } = validated;

  const update = { value: input.value, updated_by: ctx.user_id, updated_at: new Date() };
  if (input.category !== undefined) update.category = input.category;
  if (input.sensitivity !== undefined) update.sensitivity = input.sensitivity;

  const doc = await Setting.findOneAndUpdate(
    { tenant_id: ctx.tenant_id, key },
    { $set: update },
    { new: true }
  ).lean();
  if (!doc) throw new NotFoundError(`Setting '${key}' not found`);

  await publishEvent('settings-management', 'SettingUpdated', {
    tenant_id: ctx.tenant_id,
    key,
    updated_by: ctx.user_id,
  });

  return toShape(doc);
}

async function deleteSetting(ctx, args) {
  const validated = validate(deleteSettingSchema, args || {});
  const doc = await Setting.findOneAndDelete({ tenant_id: ctx.tenant_id, key: validated.key }).lean();
  if (!doc) throw new NotFoundError(`Setting '${validated.key}' not found`);

  await publishEvent('settings-management', 'SettingDeleted', {
    tenant_id: ctx.tenant_id,
    key: validated.key,
    deleted_by: ctx.user_id,
  });

  return { success: true, message: 'Setting deleted' };
}
