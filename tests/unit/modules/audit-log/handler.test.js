'use strict';

const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockCountDocuments = jest.fn().mockResolvedValue(0);

jest.mock('../../../../src/core-modules/audit-log/schemas/audit-entry.model', () => ({
  findOne: mockFindOne,
  find: mockFind,
  countDocuments: mockCountDocuments,
}));

require('../../../helpers/mock-layer');
const { createAppSyncEvent } = require('../../../helpers/test-context');
const { handler } = require('../../../../src/core-modules/audit-log/functions/audit-query');

const entries = require('./fixtures/audit-entries.json');

const mockChain = (items) => ({
  sort: jest.fn().mockReturnValue({
    skip: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(items) }),
    }),
  }),
});

beforeEach(() => {
  mockFindOne.mockReset();
  mockFind.mockReset();
  mockCountDocuments.mockReset();
  mockCountDocuments.mockResolvedValue(0);
  mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
  mockFind.mockReturnValue(mockChain([]));
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
      mockFind.mockReturnValue(mockChain(entries));
      mockCountDocuments.mockResolvedValue(1);
      const event = createAppSyncEvent('listAuditEntries', {});
      const result = await handler(event);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].entry_id).toBe('e_fixture1');
    });
  });
});
