/**
 * Structured JSON log for request/operation. Use for audit and debugging.
 * @param {Object} ctx - { tenant_id, user_id, ... }
 * @param {string} moduleName - Module identifier
 * @param {string} operation - Operation name
 * @param {Object} [meta] - Additional fields
 * @param {number} [durationMs] - Elapsed time
 * @param {string} [status] - success | error
 */
function log(ctx, moduleName, operation, meta = {}, durationMs, status = 'success') {
  const payload = {
    level: 'info',
    module: moduleName,
    operation,
    tenant_id: ctx?.tenant_id,
    user_id: ctx?.user_id,
    correlationId: ctx?.correlationId || meta?.requestId,
    ...(durationMs !== undefined && { duration_ms: durationMs }),
    status,
    ...meta,
  };
  if (typeof console.log === 'function') {
    console.log(JSON.stringify(payload));
  }
}

module.exports = { log };
