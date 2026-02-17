/**
 * Base application error with code and optional statusCode/details.
 */
class AppError extends Error {
  /**
   * @param {string} message
   * @param {string} [code] - Error code (default: INTERNAL_ERROR)
   * @param {number} [statusCode] - HTTP-style status (default: 500)
   * @param {*} [details]
   */
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details) {
    super(message, 'FORBIDDEN', 403, details);
    this.name = 'ForbiddenError';
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', details) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details) {
    super(message, 'UNAUTHORIZED', 401, details);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Map error to AppSync/API Gateway-friendly response. Logs error; never leaks stack in non-dev.
 * @param {Error} error
 * @param {Object} [event] - Lambda event (for correlation)
 * @returns {Object} - For AppSync: { error: { message, type, ... } }; for API Gateway: { statusCode, body }
 */
function handleError(error, event = {}) {
  const isDev = process.env.STAGE === 'dev' || process.env.AWS_SAM_LOCAL || process.env.IS_OFFLINE;
  const appError = error instanceof AppError
    ? error
    : new AppError(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);

  const logPayload = {
    level: 'error',
    message: appError.message,
    code: appError.code,
    correlationId: event.requestId || event.id || event.arguments?.id,
    stack: isDev && error.stack ? error.stack : undefined,
  };
  if (typeof console.error === 'function') {
    console.error(JSON.stringify(logPayload));
  }

  const response = {
    error: {
      message: appError.message,
      type: appError.code,
      ...(appError.details && { details: appError.details }),
    },
  };

  if (event.body !== undefined) {
    return {
      statusCode: appError.statusCode,
      body: JSON.stringify(response),
    };
  }

  return response;
}

module.exports = {
  AppError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  handleError,
};
