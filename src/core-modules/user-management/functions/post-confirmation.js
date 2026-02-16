/**
 * Cognito PostConfirmation trigger. Create user record in DB and assign default role.
 * Event: { triggerSource, request: { userAttributes: { sub, email, name, ... } } }
 */
const { withCognitoErrorHandler } = require('/opt/nodejs/middleware/with-cognito-error-handler');
const { generateId } = require('/opt/nodejs/utils/id-generator');
const { publishEvent } = require('/opt/nodejs/utils/event-publisher');

async function handlePostConfirmation(event) {
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp' && event.triggerSource !== 'PostConfirmation_ConfirmForgotPassword') {
    return event;
  }
  const sub = event.request?.userAttributes?.sub;
  const email = event.request?.userAttributes?.email;
  const name = event.request?.userAttributes?.name || email;
  const tenant_id = event.request?.userAttributes?.['custom:tenant_id'];

  if (!tenant_id || !sub) {
    return event;
  }

  const User = require('../schemas/user.model');
  const Role = require('../schemas/role.model');
  const existing = await User.findOne({ cognito_sub: sub }).lean();
  if (existing) {
    return event;
  }

  const user_id = generateId();
  const defaultRole = await Role.findOne({ tenant_id, name: 'member' }).lean();
  const roles = defaultRole ? [defaultRole.role_id] : [];

  await User.create({
    user_id,
    tenant_id,
    cognito_sub: sub,
    email,
    name,
    status: 'active',
    roles,
  });

  await publishEvent('user-management', 'UserCreated', {
    user_id,
    tenant_id,
    email,
    cognito_sub: sub,
    timestamp: new Date().toISOString(),
  });

  return event;
}

exports.handler = withCognitoErrorHandler(handlePostConfirmation);
