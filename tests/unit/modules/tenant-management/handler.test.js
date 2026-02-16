'use strict';

jest.mock('../../../../src/core-modules/tenant-management/schemas/tenant.model', () => ({
  findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
}));

require('../../../helpers/mock-layer');
const { createAppSyncEvent } = require('../../../helpers/test-context');
const { getMocks } = require('../../../helpers/mock-layer');
const { handler } = require('../../../../src/core-modules/tenant-management/functions/handler');
const Tenant = require('../../../../src/core-modules/tenant-management/schemas/tenant.model');

const tenants = require('./fixtures/tenants.json');
const tenantRepo = () => getMocks().repos[0];

beforeEach(() => {
  getMocks().publishEvent.mockClear();
  tenantRepo().findById.mockReset();
  tenantRepo().findMany.mockReset();
  tenantRepo().findOneGlobal.mockReset();
  tenantRepo().create.mockReset();
  tenantRepo().updateById.mockReset();
  tenantRepo().findOneGlobal.mockResolvedValue(null);
  Tenant.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
});

describe('tenant-management handler', () => {
  describe('getTenant', () => {
    it('returns tenant when found', async () => {
      tenantRepo().findById.mockImplementation((ctx, id) =>
        Promise.resolve(tenants.find((t) => t.tenant_id === id) || null)
      );
      const event = createAppSyncEvent('getTenant', { tenant_id: 't_fixture1' });
      const result = await handler(event);
      expect(result).toMatchObject({ tenant_id: 't_fixture1', name: 'Acme Corp', slug: 'acme-corp' });
    });
    it('returns error when tenant_id is missing', async () => {
      const event = createAppSyncEvent('getTenant', {});
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('tenant_id');
    });
    it('returns error when tenant not found', async () => {
      tenantRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('getTenant', { tenant_id: 't_nonexistent' });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
    });
  });

  describe('listTenants', () => {
    it('returns items and nextCursor', async () => {
      tenantRepo().findMany.mockResolvedValue({ items: tenants, nextCursor: null });
      const event = createAppSyncEvent('listTenants', {});
      const result = await handler(event);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].tenant_id).toBe('t_fixture1');
    });
  });

  describe('createTenant', () => {
    it('creates tenant and publishes TenantCreated event', async () => {
      const created = { tenant_id: 'mock-id-01', name: 'New Co', slug: 'new-co', plan: 'free', status: 'active', owner_user_id: 'u_test456' };
      tenantRepo().findOneGlobal.mockResolvedValue(null);
      tenantRepo().create.mockResolvedValue(created);
      const event = createAppSyncEvent('createTenant', { input: { name: 'New Co' } });
      const result = await handler(event);
      expect(result).toMatchObject({ name: 'New Co', slug: 'new-co' });
      expect(getMocks().publishEvent).toHaveBeenCalledWith('tenant-management', 'TenantCreated', expect.objectContaining({ name: 'New Co', slug: 'new-co' }));
    });
    it('returns error when slug already exists', async () => {
      tenantRepo().findOneGlobal.mockResolvedValue({ slug: 'acme-corp' });
      const event = createAppSyncEvent('createTenant', { input: { name: 'Acme Corp' } });
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('CONFLICT');
      expect(tenantRepo().create).not.toHaveBeenCalled();
    });
  });

  describe('updateTenant', () => {
    it('returns updated tenant and publishes TenantUpdated', async () => {
      const existing = tenants[0];
      const updated = { ...existing, name: 'Acme Updated' };
      tenantRepo().findById.mockResolvedValue(existing);
      tenantRepo().updateById.mockResolvedValue(updated);
      const event = createAppSyncEvent('updateTenant', { tenant_id: 't_fixture1', input: { name: 'Acme Updated' } });
      const result = await handler(event);
      expect(result.name).toBe('Acme Updated');
      expect(getMocks().publishEvent).toHaveBeenCalledWith('tenant-management', 'TenantUpdated', expect.objectContaining({ tenant_id: 't_fixture1' }));
    });
    it('returns error when tenant_id is missing', async () => {
      const event = createAppSyncEvent('updateTenant', { input: { name: 'X' } });
      const result = await handler(event);
      expect(result.error.message).toContain('tenant_id');
    });
    it('returns error when tenant not found', async () => {
      tenantRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('updateTenant', { tenant_id: 't_nonexistent', input: { name: 'X' } });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
    });
  });

  describe('suspendTenant', () => {
    it('updates status and publishes TenantSuspended', async () => {
      const existing = tenants[0];
      const updated = { ...existing, status: 'suspended' };
      tenantRepo().findById.mockResolvedValue(existing);
      tenantRepo().updateById.mockResolvedValue(updated);
      const event = createAppSyncEvent('suspendTenant', { tenant_id: 't_fixture1' });
      const result = await handler(event);
      expect(result.status).toBe('suspended');
      expect(getMocks().publishEvent).toHaveBeenCalledWith('tenant-management', 'TenantSuspended', expect.objectContaining({ tenant_id: 't_fixture1' }));
    });
    it('returns error when tenant_id is missing', async () => {
      const event = createAppSyncEvent('suspendTenant', {});
      const result = await handler(event);
      expect(result.error.message).toContain('tenant_id');
    });
    it('returns error when tenant not found', async () => {
      tenantRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('suspendTenant', { tenant_id: 't_nonexistent' });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
    });
  });
});
