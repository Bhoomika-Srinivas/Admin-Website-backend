const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver');
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard');
const { validate } = require('/opt/nodejs/middleware/input-validator');
const { withConnection } = require('/opt/nodejs/middleware/with-connection');
const { generateId } = require('/opt/nodejs/utils/id-generator');
const { publishEvent } = require('/opt/nodejs/utils/event-publisher');
const { MongoRepository } = require('/opt/nodejs/db/mongo-repository');
const { NotFoundError } = require('/opt/nodejs/middleware/error-handler');
const { normalizePagination } = require('/opt/nodejs/utils/pagination');
const {
  createFormSchema,
  getFormSchema,
  listFormsSchema,
  publishFormSchema,
  submitFormSchema,
  listSubmissionsSchema,
} = require('../schemas/validation');

const FormDefinition = require('../schemas/form-definition.model');
const FormSubmission = require('../schemas/form-submission.model');
const formRepo = new MongoRepository({ model: FormDefinition, primaryKey: 'form_id' });
const submissionRepo = new MongoRepository({ model: FormSubmission, primaryKey: 'submission_id' });

async function handleEvent(event) {
  const ctx = resolveTenant(event);
  switch (event.field) {
    case 'createForm':
      await requirePermission(ctx, 'form:definition:create');
      return await createForm(ctx, event.arguments);
    case 'getForm':
      await requirePermission(ctx, 'form:definition:read');
      return await getForm(ctx, event.arguments);
    case 'listForms':
      await requirePermission(ctx, 'form:definition:read');
      return await listForms(ctx, event.arguments);
    case 'publishForm':
      await requirePermission(ctx, 'form:definition:publish');
      return await publishForm(ctx, event.arguments);
    case 'submitForm':
      await requirePermission(ctx, 'form:submission:create');
      return await submitForm(ctx, event.arguments);
    case 'listSubmissions':
      await requirePermission(ctx, 'form:submission:read');
      return await listSubmissions(ctx, event.arguments);
    default:
      throw new Error(`Unknown field: ${event.field}`);
  }
}

exports.handler = withConnection(handleEvent);

async function createForm(ctx, args) {
  const input = validate(createFormSchema, args?.input || args || {});
  const data = {
    form_id: generateId(),
    title: input.title,
    description: input.description,
    fields: input.fields || [],
    settings: input.settings || {},
  };
  return await formRepo.create(ctx, data);
}

async function getForm(ctx, args) {
  const { form_id } = validate(getFormSchema, args || {});
  const doc = await formRepo.findById(ctx, form_id);
  if (!doc) throw new NotFoundError('Form not found');
  return doc;
}

async function listForms(ctx, args) {
  const validated = validate(listFormsSchema, args || {});
  const pagination = normalizePagination(validated.pagination);
  return await formRepo.findMany(ctx, {}, pagination);
}

async function publishForm(ctx, args) {
  const { form_id } = validate(publishFormSchema, args || {});
  const updated = await formRepo.updateById(ctx, form_id, { status: 'published' });
  await publishEvent('form-management', 'FormPublished', { form_id, tenant_id: ctx.tenant_id, timestamp: new Date().toISOString() });
  return updated;
}

async function submitForm(ctx, args) {
  const input = validate(submitFormSchema, args?.input || args || {});
  const form_id = input.form_id;
  const form = await formRepo.findById(ctx, form_id);
  if (!form) throw new NotFoundError('Form not found');
  const submission_id = generateId();
  const data = {
    submission_id,
    form_id,
    responses: input.responses || [],
    submitted_by: ctx.user_id,
  };
  const created = await submissionRepo.create(ctx, data);
  await publishEvent('form-management', 'FormSubmitted', { submission_id, form_id, tenant_id: ctx.tenant_id, timestamp: new Date().toISOString() });
  return created;
}

async function listSubmissions(ctx, args) {
  const validated = validate(listSubmissionsSchema, args || {});
  const pagination = normalizePagination(validated.pagination);
  const filter = validated.form_id ? { form_id: validated.form_id } : {};
  const result = await submissionRepo.findMany(ctx, filter, pagination);
  return { items: result.items, nextCursor: result.nextCursor, pageInfo: result.pageInfo };
}
