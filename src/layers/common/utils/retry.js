/**
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TRANSIENT_ERROR_CODES = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ENETUNREACH',
  'ThrottlingException',
  'ServiceUnavailable',
  'InternalServerError',
  'RequestLimitExceeded',
  'ProvisionedThroughputExceededException',
  'TransactionConflictException',
];

/**
 * @param {Error} err - Caught error
 * @returns {boolean} - True if the error is typically transient and retryable
 */
function isTransientError(err) {
  const code = err.code || err.name;
  const message = (err.message || '').toLowerCase();
  if (code && TRANSIENT_ERROR_CODES.includes(code)) return true;
  if (message.includes('timeout') || message.includes('econnreset') || message.includes('throttl')) return true;
  return false;
}

/**
 * Execute an async function with exponential backoff retry.
 * @param {Function} fn - Async function () => Promise<T>
 * @param {{ maxRetries?: number, baseDelayMs?: number, retryableErrors?: string[] }} [options]
 * @returns {Promise<T>}
 */
async function withRetry(fn, options = {}) {
  const { maxRetries = 3, baseDelayMs = 100, retryableErrors } = options;
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable = retryableErrors
        ? retryableErrors.some((code) => err.name === code || err.code === code)
        : isTransientError(err);
      if (!isRetryable || attempt === maxRetries) throw err;
      await sleep(baseDelayMs * Math.pow(2, attempt));
    }
  }
  throw lastError;
}

module.exports = {
  sleep,
  isTransientError,
  withRetry,
};
