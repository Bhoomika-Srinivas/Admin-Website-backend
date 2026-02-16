const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver');
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard');
const { validate } = require('/opt/nodejs/middleware/input-validator');
const { withConnection } = require('/opt/nodejs/middleware/with-connection');
const { MongoRepository } = require('/opt/nodejs/db/mongo-repository');
const { NotFoundError } = require('/opt/nodejs/middleware/error-handler');
const { normalizePagination } = require('/opt/nodejs/utils/pagination');
const {
  getWorkflowSchema,
  listWorkflowsSchema,
  listWorkflowInstancesSchema,
} = require('../schemas/validation');

const WorkflowDefinition = require('../schemas/workflow-definition.model');
const WorkflowInstance = require('../schemas/workflow-instance.model');
const defRepo = new MongoRepository({ model: WorkflowDefinition, primaryKey: 'workflow_id' });
const instanceRepo = new MongoRepository({ model: WorkflowInstance, primaryKey: 'instance_id' });

async function handleEvent(event) {
  const ctx = resolveTenant(event);
  switch (event.field) {
    case 'getWorkflow':
      await requirePermission(ctx, 'workflow:definition:read');
      return await getWorkflow(ctx, event.arguments);
    case 'listWorkflows':
      await requirePermission(ctx, 'workflow:definition:read');
      return await listWorkflows(ctx, event.arguments);
    case 'listWorkflowInstances':
      await requirePermission(ctx, 'workflow:instance:read');
      return await listWorkflowInstances(ctx, event.arguments);
    default:
      throw new Error(`Unknown field: ${event.field}`);
  }
}

exports.handler = withConnection(handleEvent);

async function getWorkflow(ctx, args) {
  const { workflow_id } = validate(getWorkflowSchema, args || {});
  const doc = await defRepo.findById(ctx, workflow_id);
  if (!doc) throw new NotFoundError('Workflow not found');
  return doc;
}

async function listWorkflows(ctx, args) {
  const validated = validate(listWorkflowsSchema, args || {});
  const pagination = normalizePagination(validated.pagination);
  return await defRepo.findMany(ctx, {}, pagination);
}

async function listWorkflowInstances(ctx, args) {
  const validated = validate(listWorkflowInstancesSchema, args || {});
  const pagination = normalizePagination(validated.pagination);
  const filter = validated.workflow_id ? { workflow_id: validated.workflow_id } : {};
  return await instanceRepo.findMany(ctx, filter, pagination);
}
