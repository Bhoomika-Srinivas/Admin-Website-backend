const { connectToDatabase } = require('../db/mongo-client');
const { handleError } = require('./error-handler');

/**
 * Wraps a Lambda handler to ensure MongoDB is connected before execution.
 * Catches errors and returns AppSync/API Gateway-friendly response via handleError.
 * @param {Function} handlerFn - Async (event) => result
 * @returns {Function} Wrapped handler
 */
function withConnection(handlerFn) {
  return async (event) => {
    try {
      await connectToDatabase();
      return await handlerFn(event);
    } catch (error) {
      return handleError(error, event);
    }
  };
}

module.exports = { withConnection };
