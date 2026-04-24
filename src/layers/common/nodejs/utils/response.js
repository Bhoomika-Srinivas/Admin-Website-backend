/**
 * @param {*} data - Payload
 * @returns {{ success: boolean, data: * }}
 */
function success(data) {
  return { success: true, data };
}

/**
 * @param {Array} items - List of items
 * @param {string} [cursor] - Next page cursor
 * @param {boolean} [hasMore] - Whether more pages exist
 * @returns {{ success: boolean, data: { items: Array, nextCursor?: string, hasMore?: boolean } }}
 */
function paginated(items, cursor, hasMore) {
  const payload = { items };
  if (cursor !== undefined) payload.nextCursor = cursor;
  if (hasMore !== undefined) payload.hasMore = hasMore;
  return { success: true, data: payload };
}

/**
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {*} [details] - Additional details
 * @returns {{ success: boolean, error: { code: string, message: string, details?: * } }}
 */
function error(code, message, details) {
  const err = { code, message };
  if (details !== undefined) err.details = details;
  return { success: false, error: err };
}

/**
 * Convert a Mongoose document or plain object to a plain JS object.
 * @param {*} doc
 * @returns {Object}
 */
function toPlain(doc) {
  return doc && doc.toObject ? doc.toObject() : { ...doc };
}

module.exports = {
  success,
  paginated,
  error,
  toPlain,
};
