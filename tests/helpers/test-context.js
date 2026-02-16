/**
 * Factory for mock Lambda/AppSync context with tenant and user for unit tests.
 * @param {Object} overrides - Override default context
 * @returns {Object} ctx - { tenant_id, user_id, email, permissions, roles, source }
 */
function createContext(overrides = {}) {
  return {
    tenant_id: 't_test123',
    user_id: 'u_test456',
    email: 'test@example.com',
    name: 'Test User',
    permissions: ['tenant:tenant:read', 'tenant:tenant:list', 'user:user:read'],
    roles: ['member'],
    source: 'appsync',
    ...overrides,
  };
}

/**
 * Create a mock AppSync-style Lambda event for a given field and arguments.
 */
function createAppSyncEvent(field, args = {}) {
  return {
    field,
    arguments: args,
    token: {
      'custom:tenant_id': 't_test123',
      sub: 'u_test456',
      email: 'test@example.com',
      name: 'Test User',
      'custom:roles': JSON.stringify(['member']),
      'custom:permissions': JSON.stringify(['tenant:tenant:read', 'user:user:read']),
    },
  };
}

module.exports = {
  createContext,
  createAppSyncEvent,
};
