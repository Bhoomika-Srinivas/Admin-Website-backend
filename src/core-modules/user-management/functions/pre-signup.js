/**
 * Cognito PreSignUp trigger. Validate tenant limits and email domain.
 * Event: { triggerSource, request: { userAttributes }, response: { autoConfirmUser, ... } }
 */
const { withCognitoErrorHandler } = require('/opt/nodejs/middleware/with-cognito-error-handler');

async function handlePreSignUp(event) {
  if (event.triggerSource !== 'PreSignUp_AdminCreateUser' && event.triggerSource !== 'PreSignUp_SignUp') {
    return event;
  }
  const tenant_id = event.request?.userAttributes?.['custom:tenant_id'];
  if (!tenant_id) {
    return event;
  }
  const TenantRef = require('../schemas/tenant-ref.model');
  const tenant = await TenantRef.findOne({ tenant_id }).lean();
  if (!tenant) {
    throw new Error('Tenant not found');
  }
  const maxUsers = tenant.config?.max_users ?? 5;
  const User = require('../schemas/user.model');
  const userCount = await User.countDocuments({ tenant_id });
  if (userCount >= maxUsers) {
    throw new Error(`Tenant user limit reached (${maxUsers})`);
  }
  return event;
}

exports.handler = withCognitoErrorHandler(handlePreSignUp);
