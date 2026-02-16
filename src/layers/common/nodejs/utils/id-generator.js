const { ulid } = require('ulid');

/**
 * Generate a sortable unique ID (ULID).
 * @returns {string}
 */
function generateId() {
  return ulid();
}

module.exports = { generateId };
