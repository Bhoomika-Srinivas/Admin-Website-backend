'use strict';

const mockFindOne = jest.fn();
const mockFind = jest.fn();

jest.mock('../../../../src/core-modules/audit-log/schemas/audit-entry.model', () => ({
  findOne: mockFindOne,
  find: mockFind,
}));

require('../../../helpers/mock-layer');
const { createAppSyncEvent } = require('../../../helpers/test-context');
const { handler } = require('../../../../src/core-modules/audit-log/functions/audit-query');

const entries = require('./fixtures/audit-entries.json');

beforeEach(() => {
  mockFindOne.mockReset();
  mockFind.mockReset();
  mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
  mockFind.mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    }),
  });
});

describe('audit-log handler', () => {
  describe('getAuditEntry', () => {
    it('returns entry when found', async () => {
      mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(entries[0]) });
      const event = createAppSyncEvent('getAuditEntry', { entry_id: 'e_fixture1' });
      const result = await handler(event);
      expect(result).toMatchObject({ entry_id: 'e_fixture1', action: 'UserInvited' });
    });
    it('returns error when entry_id is missing', async () => {
      const event = createAppSyncEvent('getAuditEntry', {});
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('entry_id is required');
    });
    it('returns error when entry not found', async () => {
      mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      const event = createAppSyncEvent('getAuditEntry', { entry_id: 'e_nonexistent' });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
    });
  });

  describe('listAuditEntries', () => {
    it('returns items and nextCursor', async () => {
      mockFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(entries) }),
        }),
      });
      const event = createAppSyncEvent('listAuditEntries', {});
      const result = await handler(event);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].entry_id).toBe('e_fixture1');
    });
  });
});
