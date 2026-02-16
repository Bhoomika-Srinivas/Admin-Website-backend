const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver');
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard');
const { handleError } = require('/opt/nodejs/middleware/error-handler');
const { log } = require('/opt/nodejs/middleware/request-logger');

exports.handler = async (event) => {
  try {
    const ctx = resolveTenant(event);
    log(ctx, 'MODULE_NAME', event.field);

    switch (event.field) {
      default:
        throw new Error(`Unknown field: ${event.field}`);
    }
  } catch (error) {
    return handleError(error, event);
  }
};
