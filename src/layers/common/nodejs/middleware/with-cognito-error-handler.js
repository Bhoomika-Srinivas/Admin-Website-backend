const { connectToDatabase } = require('../db/mongo-client');

/**
 * Wraps a Cognito Lambda trigger handler. Ensures DB connection, then runs the handler.
 * On error, logs structured JSON and re-throws so Cognito treats the trigger as failed.
 * @param {Function} handlerFn - Async (event) => event
 * @returns {Function} Wrapped handler
 */
function withCognitoErrorHandler(handlerFn) {
  return async (event) => {
    try {
      await connectToDatabase();
      return await handlerFn(event);
    } catch (err) {
      console.error(
        JSON.stringify({
          level: 'error',
          trigger: event?.triggerSource,
          message: err?.message || 'Trigger failed',
        })
      );
      throw new Error(err?.message || 'Trigger failed');
    }
  };
}

module.exports = { withCognitoErrorHandler };
