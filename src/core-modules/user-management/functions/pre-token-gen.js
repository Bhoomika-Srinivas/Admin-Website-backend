/**
 * Cognito PreTokenGeneration trigger. Inject custom:tenant_id, custom:roles, custom:permissions into ID token.
 * Event: { request: { userAttributes }, response: { claimsOverrideDetails } }
 */
const { withCognitoErrorHandler } = require('/opt/nodejs/middleware/with-cognito-error-handler');

async function handlePreTokenGen(event) {
  const sub = event.request?.userAttributes?.sub;
  const tenant_id = event.request?.userAttributes?.['custom:tenant_id'];
  if (!tenant_id && !sub) {
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
