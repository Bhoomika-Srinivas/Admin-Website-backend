'use strict';

require('../../../helpers/mock-layer');
const { createAppSyncEvent } = require('../../../helpers/test-context');
const { getMocks } = require('../../../helpers/mock-layer');
const { handler } = require('../../../../src/core-modules/workflow-management/functions/handler');

const workflows = require('./fixtures/workflows.json');
const instances = require('./fixtures/instances.json');
const defRepo = () => getMocks().repos[0];
const instanceRepo = () => getMocks().repos[1];

beforeEach(() => {
  defRepo().findById.mockReset();
  defRepo().findMany.mockReset();
  instanceRepo().findMany.mockReset();
});

describe('workflow-management handler', () => {
  describe('getWorkflow', () => {
    it('returns workflow when found', async () => {
      defRepo().findById.mockImplementation((ctx, id) =>
        Promise.resolve(workflows.find((w) => w.workflow_id === id) || null)
      );
      const event = createAppSyncEvent('getWorkflow', { workflow_id: 'wf_fixture1' });
      const result = await handler(event);
      expect(result).toMatchObject({ workflow_id: 'wf_fixture1', name: 'Approval Flow' });
    });
    it('returns error when workflow_id is missing', async () => {
      const event = createAppSyncEvent('getWorkflow', {});
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('workflow_id');
    });
    it('returns error when workflow not found', async () => {
      defRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('getWorkflow', { workflow_id: 'wf_nonexistent' });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
    });
  });

  describe('listWorkflows', () => {
    it('returns result from findMany', async () => {
      defRepo().findMany.mockResolvedValue({ items: workflows, nextCursor: null });
      const event = createAppSyncEvent('listWorkflows', {});
      const result = await handler(event);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].workflow_id).toBe('wf_fixture1');
    });
  });

  describe('listWorkflowInstances', () => {
    it('returns items and nextCursor', async () => {
      instanceRepo().findMany.mockResolvedValue({ items: instances, nextCursor: null });
      const event = createAppSyncEvent('listWorkflowInstances', {});
      const result = await handler(event);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].instance_id).toBe('wi_fixture1');
    });
    it('filters by workflow_id when provided', async () => {
      instanceRepo().findMany.mockResolvedValue({ items: instances, nextCursor: null });
      const event = createAppSyncEvent('listWorkflowInstances', { workflow_id: 'wf_fixture1' });
      await handler(event);
      expect(instanceRepo().findMany).toHaveBeenCalledWith(expect.any(Object), { workflow_id: 'wf_fixture1' }, expect.any(Object));
    });
  });
});
