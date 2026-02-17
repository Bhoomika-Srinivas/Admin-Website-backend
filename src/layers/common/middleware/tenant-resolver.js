/**
 * Parse value as JSON array; return [] on invalid or non-array.
 * @param {*} val - Value (string or array)
 * @returns {string[]}
 */
function safeParseArray(val) {
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val || '[]');
  } catch {
    return [];
  }
}

/**
 * Resolve tenant and user context from various invocation sources.
 * @param {Object} event - Lambda event (AppSync payload, API Gateway, EventBridge, or direct)
 * @returns {{ tenant_id?: string, user_id?: string, email?: string, name?: string, roles?: string[], permissions?: string[], source: string }}
 */
function resolveTenant(event) {
  if (!event) {
    return { source: 'unknown' };
  }

  if (event.token && typeof event.token === 'object') {
    const token = event.token;
    return {
      tenant_id: token['custom:tenant_id'] || token.tenant_id,
      user_id: token.sub || token['cognito:username'],
      email: token.email,
      name: token.name,
      roles: safeParseArray(token['custom:roles']),
      permissions: safeParseArray(token['custom:permissions']),
      source: 'appsync',
    };
  }

  if (event.detail && typeof event.detail === 'object') {
    return {
      tenant_id: event.detail.tenant_id,
      user_id: event.detail.user_id || event.detail.actor_id,
      email: event.detail.email,
      source: 'eventbridge',
      ...event.detail,
    };
  }

  if (event.tenant_id !== undefined) {
    return {
      tenant_id: event.tenant_id,
      user_id: event.user_id,
      email: event.email,
      name: event.name,
      roles: event.roles || [],
      permissions: event.permissions || [],
      source: 'direct',
    };
  }

  if (event.requestContext?.authorizer?.claims) {
    const claims = event.requestContext.authorizer.claims;
    return {
      tenant_id: claims['custom:tenant_id'],
      user_id: claims.sub,
      email: claims.email,
      name: claims.name,
      roles: safeParseArray(claims['custom:roles']),
      permissions: safeParseArray(claims['custom:permissions']),
      source: 'api_gateway',
    };
  }

  return {
    tenant_id: event.tenant_id,
    user_id: event.user_id,
    source: 'unknown',
  };
}

module.exports = { resolveTenant };
