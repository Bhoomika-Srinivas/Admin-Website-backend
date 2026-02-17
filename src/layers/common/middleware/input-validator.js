const Joi = require('joi');
const { ValidationError } = require('./error-handler');

/**
 * Validate data against a Joi schema. Throws ValidationError with field-level details.
 * @param {Joi.Schema} schema - Joi schema
 * @param {*} data - Data to validate
 * @param {{ stripUnknown?: boolean }} [options] - { stripUnknown: true } to remove unknown keys
 * @returns {*} - Validated (and possibly stripped) data
 * @throws {ValidationError}
 */
function validate(schema, data, options = {}) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: options.stripUnknown !== false,
  });
  if (error) {
    const details = error.details.map((d) => ({
      path: d.path.join('.'),
      message: d.message,
    }));
    throw new ValidationError(error.message, details);
  }
  return value;
}

module.exports = { validate };
