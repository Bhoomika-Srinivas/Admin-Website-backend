/**
 * Cognito PostConfirmation trigger. Create user record in DB and assign default role.
 * Event: { triggerSource, request: { userAttributes: { sub, email, name, ... } } }
 */
const { withCognitoErrorHandler } = require('/opt/nodejs/middleware/with-cognito-error-handler');
const { generateId } = require('/opt/nodejs/utils/id-generator');
const { publishEvent } = require('/opt/nodejs/utils/event-publisher');
const { Resend } = require('resend');

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

  // Send welcome email
  try {
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const appUrl = process.env.APP_URL || 'https://yourdomain.com';
    if (resendKey) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Welcome to the platform',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;color:#222">
            <h2 style="margin-bottom:4px">Welcome to the platform</h2>
            <p style="color:#555;margin-bottom:24px">Your account has been created successfully. You can now log in at:</p>
            <p><a href="${appUrl}">${appUrl}</a></p>
            <p style="color:#999;font-size:13px">If you have any questions, please contact support.</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.warn('Failed to send welcome email:', err.message);
  }

  return event;
}

exports.handler = withCognitoErrorHandler(handlePostConfirmation);
