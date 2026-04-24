const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

/**
 * Normalize pagination input from API.
 * @param {Object} [input] - { limit, cursor }
 * @returns {{ limit: number, cursor?: string }}
 */
function normalizePagination(input) {
  if (!input) {
    return { limit: DEFAULT_LIMIT, page: 1 };
  }
  const limit = Math.min(
    Math.max(1, Number(input.limit) || DEFAULT_LIMIT),
    MAX_LIMIT
  );
  const page = Math.max(1, Number(input.page) || 1);
  const cursor = typeof input.cursor === 'string' && input.cursor.length > 0
    ? input.cursor
    : undefined;
  return { limit, page, cursor };
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  normalizePagination,
};
