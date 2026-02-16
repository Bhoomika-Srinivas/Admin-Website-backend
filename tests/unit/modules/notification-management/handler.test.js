'use strict';

const mockFindOneAndUpdate = jest.fn().mockResolvedValue({});
const mockPreferenceFindOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ user_id: 'u_test456', channels: {} }) });

jest.mock('../../../../src/core-modules/notification-management/schemas/preference.model', () => ({
  findOneAndUpdate: mockFindOneAndUpdate,
  findOne: mockPreferenceFindOne,
}));

require('../../../helpers/mock-layer');
const { createAppSyncEvent } = require('../../../helpers/test-context');
const { getMocks } = require('../../../helpers/mock-layer');
const { handler } = require('../../../../src/core-modules/notification-management/functions/handler');

const templates = require('./fixtures/templates.json');
const notifications = require('./fixtures/notifications.json');
const templateRepo = () => getMocks().repos[0];
const notificationRepo = () => getMocks().repos[1];

beforeEach(() => {
  templateRepo().findById.mockReset();
  templateRepo().findMany.mockReset();
  templateRepo().create.mockReset();
  notificationRepo().findById.mockReset();
  notificationRepo().findMany.mockReset();
  mockPreferenceFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ user_id: 'u_test456', channels: {} }) });
});

describe('notification-management handler', () => {
  describe('createTemplate', () => {
    it('returns created template', async () => {
      const created = { template_id: 'mock-id-01', name: 'new-tpl', channel: 'email', tenant_id: 't_test123' };
      templateRepo().create.mockResolvedValue(created);
      const event = createAppSyncEvent('createTemplate', { input: { name: 'new-tpl', channel: 'email' } });
      const result = await handler(event);
      expect(result).toMatchObject({ name: 'new-tpl', channel: 'email' });
    });
  });

  describe('getTemplate', () => {
    it('returns template when found', async () => {
      templateRepo().findById.mockImplementation((ctx, id) =>
        Promise.resolve(templates.find((t) => t.template_id === id) || null)
      );
      const event = createAppSyncEvent('getTemplate', { template_id: 'tp_fixture1' });
      const result = await handler(event);
      expect(result).toMatchObject({ template_id: 'tp_fixture1', name: 'welcome-email' });
    });
    it('returns error when template_id is missing', async () => {
      const event = createAppSyncEvent('getTemplate', {});
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('template_id');
    });
    it('returns error when template not found', async () => {
      templateRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('getTemplate', { template_id: 'tp_nonexistent' });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
    });
  });

  describe('listTemplates', () => {
    it('returns result from findMany', async () => {
      templateRepo().findMany.mockResolvedValue({ items: templates, nextCursor: null });
      const event = createAppSyncEvent('listTemplates', {});
      const result = await handler(event);
      expect(result.items).toHaveLength(1);
    });
  });

  describe('listNotifications', () => {
    it('returns items and nextCursor', async () => {
      notificationRepo().findMany.mockResolvedValue({ items: notifications, nextCursor: null });
      const event = createAppSyncEvent('listNotifications', {});
      const result = await handler(event);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].notification_id).toBe('n_fixture1');
    });
  });

  describe('updatePreference', () => {
    it('returns updated preference', async () => {
      const updated = { user_id: 'u_test456', tenant_id: 't_test123', channels: { email: true } };
      mockPreferenceFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(updated) });
      const event = createAppSyncEvent('updatePreference', { input: { user_id: 'u_test456', channels: { email: true } } });
      const result = await handler(event);
      expect(result).toMatchObject({ user_id: 'u_test456', channels: { email: true } });
      expect(mockFindOneAndUpdate).toHaveBeenCalled();
    });
  });
});
