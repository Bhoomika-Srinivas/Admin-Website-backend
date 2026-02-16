const { createAppSyncEvent } = require('../../helpers/test-context');

jest.mock('/opt/nodejs/middleware/tenant-resolver', () => ({
  resolveTenant: jest.fn((event) => {
    if (event?.token) {
      return {
        tenant_id: event.token['custom:tenant_id'],
        user_id: event.token.sub,
        email: event.token.email,
        permissions: event.token['custom:permissions'] ? JSON.parse(event.token['custom:permissions']) : [],
        source: 'appsync',
      };
    }
    return { source: 'unknown' };
  }),
}), { virtual: true });

describe('tenant-resolver (integration with mock)', () => {
  it('createAppSyncEvent produces event with token', () => {
    const event = createAppSyncEvent('getTenant', { tenant_id: 't_abc' });
    expect(event.field).toBe('getTenant');
    expect(event.arguments.tenant_id).toBe('t_abc');
    expect(event.token['custom:tenant_id']).toBe('t_test123');
  });
});
