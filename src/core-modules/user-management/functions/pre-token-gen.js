/**
 * Cognito PreTokenGeneration trigger. Inject custom:tenant_id, custom:roles, custom:permissions into ID token.
 * Uses caching to reduce database load.
 * Event: { request: { userAttributes }, response: { claimsOverrideDetails } }
 */
const { withCognitoErrorHandler } = require('/opt/nodejs/middleware/with-cognito-error-handler');
const { connectToDatabase } = require('/opt/nodejs/db/mongo-client');
const { getUserPermissions, setUserPermissions } = require('/opt/nodejs/utils/redis-cache');

async function handlePreTokenGen(event) {
  const sub = event.request?.userAttributes?.sub;
  const tenant_id = event.request?.userAttributes?.['custom:tenant_id'];
  if (!tenant_id && !sub) {
    return event;
  }

  await connectToDatabase();

  // Check cache first
  const cached = await getUserPermissions(sub);
  if (cached) {
    event.response = event.response || {};
    event.response.claimsOverrideDetails = event.response.claimsOverrideDetails || {};
    event.response.claimsOverrideDetails.claimsToAddOrOverride = {
      'custom:tenant_id': cached.tenant_id || tenant_id || '',
      'custom:roles': JSON.stringify(cached.roleNames || cached.roles || []),
      'custom:permissions': JSON.stringify(cached.permissions || []),
      'custom:department': cached.department || '',
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
      'custom:department': '',
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
    roleNames: roles.map((r) => r.name),
    permissions,
    department: user.department || '',
  }, 300);

  event.response = event.response || {};
  event.response.claimsOverrideDetails = event.response.claimsOverrideDetails || {};
  event.response.claimsOverrideDetails.claimsToAddOrOverride = {
    'custom:tenant_id': user.tenant_id,
    'custom:roles': JSON.stringify(roles.map((r) => r.name)),
    'custom:permissions': JSON.stringify(permissions),
    'custom:department': user.department || '',
  };

  return event;
}

exports.handler = withCognitoErrorHandler(handlePreTokenGen);
