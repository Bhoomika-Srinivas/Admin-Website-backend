const { ForbiddenError } = require('./error-handler');

/**
 * Check if a permission string matches a required pattern. Supports wildcards: module:*:*, module:resource:*
 * @param {string} userPermission - e.g. "form:definition:create" or "form:*:*"
 * @param {string} required - e.g. "form:definition:create"
 * @returns {boolean}
 */
function matchPermission(userPermission, required) {
  if (userPermission === required) return true;
  const [uMod, uRes, uAct] = userPermission.split(':');
  const [rMod, rRes, rAct] = required.split(':');
  if (uMod !== '*' && uMod !== rMod) return false;
  if (uRes !== '*' && uRes !== rRes) return false;
  if (uAct !== '*' && uAct !== rAct) return false;
  return true;
}

/**
 * Require that the context has one of the roles/permissions that satisfy the required permission.
 * Permissions are expected on ctx.permissions (string array) from tenant-resolver (injected by Cognito).
 * @param {Object} ctx - { permissions?: string[], tenant_id, user_id }
 * @param {string} requiredPermission - e.g. "form:definition:create"
 * @throws {ForbiddenError} if no matching permission
 */
async function requirePermission(ctx, requiredPermission) {
  const permissions = ctx.permissions || [];
  const hasMatch = permissions.some((p) => matchPermission(p, requiredPermission));
  if (!hasMatch) {
    throw new ForbiddenError(`Missing permission: ${requiredPermission}`, { required: requiredPermission });
  }
}

module.exports = {
  requirePermission,
  matchPermission,
};
