const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Normalize pagination input from API.
 * @param {Object} [input] - { limit, cursor }
 * @returns {{ limit: number, cursor?: string }}
 */
function normalizePagination(input) {
  if (!input) {
    return { limit: DEFAULT_LIMIT };
  }
  const limit = Math.min(
    Math.max(1, Number(input.limit) || DEFAULT_LIMIT),
    MAX_LIMIT
  );
  const cursor = typeof input.cursor === 'string' && input.cursor.length > 0
    ? input.cursor
    : undefined;
  return { limit, cursor };
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  normalizePagination,
};
