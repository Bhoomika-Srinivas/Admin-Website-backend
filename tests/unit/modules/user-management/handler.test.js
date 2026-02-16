'use strict';

require('../../../helpers/mock-layer');
const { createAppSyncEvent } = require('../../../helpers/test-context');
const { getMocks } = require('../../../helpers/mock-layer');
const { handler } = require('../../../../src/core-modules/user-management/functions/handler');

const users = require('./fixtures/users.json');
const roles = require('./fixtures/roles.json');

const userRepo = () => getMocks().repos[0];
const roleRepo = () => getMocks().repos[1];

beforeEach(() => {
  getMocks().publishEvent.mockClear();
  userRepo().findById.mockReset();
  userRepo().findMany.mockReset();
  userRepo().create.mockReset();
  userRepo().updateById.mockReset();
  roleRepo().findById.mockReset();
  roleRepo().findMany.mockReset();
  roleRepo().create.mockReset();
  roleRepo().updateById.mockReset();
});

describe('user-management handler', () => {
  describe('getUser', () => {
    it('returns user when found', async () => {
      userRepo().findById.mockImplementation((ctx, id) =>
        Promise.resolve(users.find((u) => u.user_id === id) || null)
      );
      const event = createAppSyncEvent('getUser', { user_id: 'u_fixture1' });
      const result = await handler(event);
      expect(result).toMatchObject({
        user_id: 'u_fixture1',
        email: 'alice@example.com',
        name: 'Alice User',
        status: 'active',
      });
      expect(result).not.toHaveProperty('error');
    });

    it('returns error when user_id is missing', async () => {
      const event = createAppSyncEvent('getUser', {});
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('user_id');
      expect(result.error.type).toBe('VALIDATION_ERROR');
    });

    it('returns error when user not found', async () => {
      userRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('getUser', { user_id: 'u_nonexistent' });
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('not found');
      expect(result.error.type).toBe('NOT_FOUND');
    });
  });

  describe('listUsers', () => {
    it('returns items and nextCursor', async () => {
      userRepo().findMany.mockResolvedValue({
        items: users,
        nextCursor: null,
      });
      const event = createAppSyncEvent('listUsers', { pagination: { limit: 10 } });
      const result = await handler(event);
      expect(result).toEqual({ items: users, nextCursor: null });
      expect(result.items).toHaveLength(3);
    });
  });

  describe('listRoles', () => {
    it('returns items and nextCursor', async () => {
      roleRepo().findMany.mockResolvedValue({
        items: roles,
        nextCursor: undefined,
      });
      const event = createAppSyncEvent('listRoles', {});
      const result = await handler(event);
      expect(result.items).toHaveLength(3);
      expect(result.items[0]).toMatchObject({ role_id: 'r_member', name: 'member' });
    });
  });

  describe('updateUser', () => {
    it('returns updated user on success', async () => {
      const existing = users[0];
      const updated = { ...existing, name: 'Alice Updated', updated_at: new Date().toISOString() };
      userRepo().findById.mockResolvedValue(existing);
      userRepo().updateById.mockResolvedValue(updated);
      const event = createAppSyncEvent('updateUser', {
        user_id: 'u_fixture1',
        input: { name: 'Alice Updated' },
      });
      const result = await handler(event);
      expect(result).toMatchObject({ user_id: 'u_fixture1', name: 'Alice Updated' });
      expect(userRepo().updateById).toHaveBeenCalledWith(
        expect.any(Object),
        'u_fixture1',
        expect.objectContaining({ name: 'Alice Updated' })
      );
    });

    it('returns error when user_id is missing', async () => {
      const event = createAppSyncEvent('updateUser', { input: { name: 'X' } });
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('user_id');
    });

    it('returns error when user not found', async () => {
      userRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('updateUser', {
        user_id: 'u_nonexistent',
        input: { name: 'X' },
      });
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('NOT_FOUND');
    });
  });

  describe('inviteUser', () => {
    it('creates user and publishes UserInvited event', async () => {
      const created = {
        user_id: 'mock-id-01',
        tenant_id: 't_test123',
        email: 'new@example.com',
        name: 'new@example.com',
        status: 'invited',
        roles: ['member'],
      };
      userRepo().create.mockResolvedValue(created);
      const event = createAppSyncEvent('inviteUser', {
        input: { email: 'new@example.com' },
      });
      const result = await handler(event);
      expect(result).toMatchObject({ email: 'new@example.com', status: 'invited' });
      expect(getMocks().publishEvent).toHaveBeenCalledTimes(1);
      expect(getMocks().publishEvent).toHaveBeenCalledWith(
        'user-management',
        'UserInvited',
        expect.objectContaining({
          email: 'new@example.com',
          invited_by: 'u_test456',
          tenant_id: 't_test123',
        })
      );
    });

    it('returns error when email is missing', async () => {
      const event = createAppSyncEvent('inviteUser', { input: {} });
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('email');
      expect(getMocks().publishEvent).not.toHaveBeenCalled();
    });
  });

  describe('deactivateUser', () => {
    it('updates status and publishes UserDeactivated event', async () => {
      const existing = users[0];
      const updated = { ...existing, status: 'deactivated' };
      userRepo().findById.mockResolvedValue(existing);
      userRepo().updateById.mockResolvedValue(updated);
      const event = createAppSyncEvent('deactivateUser', { user_id: 'u_fixture1' });
      const result = await handler(event);
      expect(result.status).toBe('deactivated');
      expect(getMocks().publishEvent).toHaveBeenCalledWith(
        'user-management',
        'UserDeactivated',
        expect.objectContaining({
          user_id: 'u_fixture1',
          tenant_id: 't_test123',
          deactivated_by: 'u_test456',
        })
      );
    });

    it('returns error when user_id is missing', async () => {
      const event = createAppSyncEvent('deactivateUser', {});
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('user_id');
      expect(getMocks().publishEvent).not.toHaveBeenCalled();
    });

    it('returns error when user not found and does not publish', async () => {
      userRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('deactivateUser', { user_id: 'u_nonexistent' });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
      expect(getMocks().publishEvent).not.toHaveBeenCalled();
    });
  });

  describe('createRole', () => {
    it('returns created role', async () => {
      const created = {
        role_id: 'mock-id-01',
        tenant_id: 't_test123',
        name: 'new-role',
        description: 'A new role',
        permissions: ['user:user:read'],
        is_system: false,
      };
      roleRepo().create.mockResolvedValue(created);
      const event = createAppSyncEvent('createRole', {
        input: { name: 'new-role', description: 'A new role', permissions: ['user:user:read'] },
      });
      const result = await handler(event);
      expect(result).toMatchObject({ name: 'new-role', is_system: false });
    });

    it('returns error when name is missing', async () => {
      const event = createAppSyncEvent('createRole', { input: {} });
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('name');
    });
  });

  describe('updateRole', () => {
    it('returns updated role when role exists and is not system', async () => {
      const existing = roles[2];
      const updated = { ...existing, name: 'custom-role-renamed' };
      roleRepo().findById.mockResolvedValue(existing);
      roleRepo().updateById.mockResolvedValue(updated);
      const event = createAppSyncEvent('updateRole', {
        role_id: 'r_custom1',
        input: { name: 'custom-role-renamed' },
      });
      const result = await handler(event);
      expect(result.name).toBe('custom-role-renamed');
    });

    it('returns error when role_id is missing', async () => {
      const event = createAppSyncEvent('updateRole', { input: { name: 'X' } });
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('role_id');
    });

    it('returns error when role not found', async () => {
      roleRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('updateRole', {
        role_id: 'r_nonexistent',
        input: { name: 'X' },
      });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
    });

    it('returns error when updating system role', async () => {
      roleRepo().findById.mockResolvedValue(roles[0]);
      const event = createAppSyncEvent('updateRole', {
        role_id: 'r_member',
        input: { name: 'cannot-update' },
      });
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Cannot update system role');
      expect(result.error.type).toBe('CONFLICT');
      expect(roleRepo().updateById).not.toHaveBeenCalled();
    });
  });

  describe('assignRole', () => {
    it('adds role to user and publishes RoleAssigned event', async () => {
      const user = users[0];
      const updated = { ...user, roles: [...user.roles, 'r_custom1'] };
      userRepo().findById.mockResolvedValue(user);
      roleRepo().findById.mockResolvedValue(roles[2]);
      userRepo().updateById.mockResolvedValue(updated);
      const event = createAppSyncEvent('assignRole', {
        user_id: 'u_fixture1',
        role_id: 'r_custom1',
      });
      const result = await handler(event);
      expect(result.roles).toContain('r_custom1');
      expect(getMocks().publishEvent).toHaveBeenCalledWith(
        'user-management',
        'RoleAssigned',
        expect.objectContaining({
          user_id: 'u_fixture1',
          role_id: 'r_custom1',
          tenant_id: 't_test123',
          assigned_by: 'u_test456',
        })
      );
    });

    it('returns user unchanged when role already assigned', async () => {
      const user = users[1];
      userRepo().findById.mockResolvedValue(user);
      roleRepo().findById.mockResolvedValue(roles[0]);
      const event = createAppSyncEvent('assignRole', {
        user_id: 'u_fixture2',
        role_id: 'r_member',
      });
      const result = await handler(event);
      expect(result).toEqual(user);
      expect(userRepo().updateById).not.toHaveBeenCalled();
      expect(getMocks().publishEvent).not.toHaveBeenCalled();
    });

    it('returns error when user_id or role_id is missing', async () => {
      const event = createAppSyncEvent('assignRole', { user_id: 'u_fixture1' });
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/user_id|role_id/);
      expect(getMocks().publishEvent).not.toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      userRepo().findById.mockResolvedValue(null);
      roleRepo().findById.mockResolvedValue(roles[0]);
      const event = createAppSyncEvent('assignRole', {
        user_id: 'u_nonexistent',
        role_id: 'r_member',
      });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
      expect(getMocks().publishEvent).not.toHaveBeenCalled();
    });

    it('returns error when role not found', async () => {
      userRepo().findById.mockResolvedValue(users[0]);
      roleRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('assignRole', {
        user_id: 'u_fixture1',
        role_id: 'r_nonexistent',
      });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
      expect(getMocks().publishEvent).not.toHaveBeenCalled();
    });
  });

  describe('removeRole', () => {
    it('removes role from user', async () => {
      const user = users[1];
      const updated = { ...user, roles: ['r_admin'] };
      userRepo().findById.mockResolvedValue(user);
      userRepo().updateById.mockResolvedValue(updated);
      const event = createAppSyncEvent('removeRole', {
        user_id: 'u_fixture2',
        role_id: 'r_member',
      });
      const result = await handler(event);
      expect(result.roles).not.toContain('r_member');
      expect(result.roles).toContain('r_admin');
    });

    it('returns error when user_id or role_id is missing', async () => {
      const event = createAppSyncEvent('removeRole', { user_id: 'u_fixture1' });
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/user_id|role_id/);
    });

    it('returns error when user not found', async () => {
      userRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('removeRole', {
        user_id: 'u_nonexistent',
        role_id: 'r_member',
      });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
    });
  });
});
