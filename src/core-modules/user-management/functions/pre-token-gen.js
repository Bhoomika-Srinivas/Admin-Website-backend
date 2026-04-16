/**
 * Cognito PreTokenGeneration trigger. Inject custom:tenant_id, custom:roles, custom:permissions into ID token.
 * Uses caching to reduce database load.
 * Event: { request: { userAttributes }, response: { claimsOverrideDetails } }
 */
const { withCognitoErrorHandler } = require('/opt/nodejs/middleware/with-cognito-error-handler');
const { getUserPermissions, setUserPermissions } = require('/opt/nodejs/utils/redis-cache');

async function handlePreTokenGen(event) {
  const sub = event.request?.userAttributes?.sub;
  const tenant_id = event.request?.userAttributes?.['custom:tenant_id'];
  if (!tenant_id && !sub) {
    return event;
  }

  // Check cache first
  const cached = await getUserPermissions(sub);
  if (cached) {
    event.response = event.response || {};
    event.response.claimsOverrideDetails = event.response.claimsOverrideDetails || {};
    event.response.claimsOverrideDetails.claimsToAddOrOverride = {
      'custom:tenant_id': cached.tenant_id || tenant_id || '',
      'custom:roles': JSON.stringify(cached.roles || []),
      'custom:permissions': JSON.stringify(cached.permissions || []),
    };
    return event;
  }

  const User = require('../schemas/user.model');
  const Role = require('../schemas/role.model');
  const user = await User.findOne({ cognito_sub: sub }).lean();
  if (!user) {
    event.response = event.response || {};
    event.response.claimsOverrideDetails = event.response.claimsOverrideDetails || {};
    event.response.claimsOverrideDetails.claimsToAddOrOverride = {
      'custom:tenant_id': tenant_id || '',
      'custom:roles': JSON.stringify([]),
      'custom:permissions': JSON.stringify([]),
    };
    return event;
  }

  const roleIds = user.roles || [];
  const roles = await Role.find({ role_id: { $in: roleIds }, tenant_id: user.tenant_id }).lean();
  const permissions = [...new Set(roles.flatMap((r) => r.permissions || []))];

  // Cache for 5 minutes
  await setUserPermissions(sub, {
    tenant_id: user.tenant_id,
    roles: roleIds,
    permissions,
  }, 300);

  event.response = event.response || {};
  event.response.claimsOverrideDetails = event.response.claimsOverrideDetails || {};
  event.response.claimsOverrideDetails.claimsToAddOrOverride = {
    'custom:tenant_id': user.tenant_id,
    'custom:roles': JSON.stringify(roleIds),
    'custom:permissions': JSON.stringify(permissions),
  };

  return event;
}

exports.handler = withCognitoErrorHandler(handlePreTokenGen);
