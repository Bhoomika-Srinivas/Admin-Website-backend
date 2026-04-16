/**
 * Input sanitization utilities for XSS prevention
 * Sanitizes user input before storing in database
 */

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

const SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script\b)<[^<]*)*<\/script\u003e/gi;
const EVENT_HANDLER_PATTERN = /\s(on\w+)\s*=\s*["']?[^"']*["']?/gi;
const JAVASCRIPT_PROTOCOL = /javascript:/gi;
const DATA_URI = /data:text\/html/gi;

// Keys that must never be written to avoid prototype pollution
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype']);

/**
 * Escape HTML entities in string
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') return String(str);
  return str.replace(/[\u0026\u003c\u003e"'`\/]/g, (char) => ESCAPE_MAP[char] || char);
}

/**
 * Remove script tags from string
 * @param {string} str
 * @returns {string}
 */
function removeScriptTags(str) {
  if (typeof str !== 'string') return str;
  return str.replace(SCRIPT_PATTERN, '');
}

/**
 * Remove event handlers from HTML
 * @param {string} str
 * @returns {string}
 */
function removeEventHandlers(str) {
  if (typeof str !== 'string') return str;
  return str.replace(EVENT_HANDLER_PATTERN, '');
}

/**
 * Remove javascript: protocol from URLs
 * @param {string} str
 * @returns {string}
 */
function sanitizeUrl(str) {
  if (typeof str !== 'string') return str;
  return str.replace(JAVASCRIPT_PROTOCOL, '').replace(DATA_URI, '');
}

/**
 * Sanitize text content (for rich text fields)
 * Allows safe HTML, removes dangerous tags
 * @param {string} str
 * @returns {string|null}
 */
function sanitizeRichText(str) {
  if (str === null || str === undefined) return null;
  if (typeof str !== 'string') return str;

  let sanitized = str;

  // Remove script tags completely
  sanitized = removeScriptTags(sanitized);

  // Remove event handlers
  sanitized = removeEventHandlers(sanitized);

  // Remove href attributes with javascript:/vbscript: protocols
  sanitized = sanitized.replace(/\s+href\s*=\s*["'](?:javascript:|vbscript:)[^"']*["']/gi, '');

  // Remove style attributes containing CSS expressions
  sanitized = sanitized.replace(/\s+style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '');

  // Remove javascript: protocol elsewhere
  sanitized = sanitizeUrl(sanitized);

  // Remove self-closing dangerous tags (e.g. <embed>, <input>)
  sanitized = sanitized.replace(/<(?:embed|input|button|select)\b[^>]*\/?>/gi, '');

  // Remove paired dangerous tags (lazy match between open/close pair)
  const pairedDangerousTags = ['iframe', 'object', 'form', 'textarea'];
  const tagPattern = new RegExp(
    `<(${pairedDangerousTags.join('|')})[^>]*>[\\s\\S]*?<\\/\\1>`,
    'gi'
  );
  sanitized = sanitized.replace(tagPattern, '');

  return sanitized.trim();
}

/**
 * Sanitize plain text (no HTML allowed — escapes all HTML entities)
 * @param {string} str
 * @returns {string|null}
 */
function sanitizePlainText(str) {
  if (str === null || str === undefined) return null;
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\u00A0/g, ' ')
    .trim();
}

/**
 * Strip HTML tags from string
 * Replaces tags with spaces and decodes HTML entities
 * @param {string} str
 * @returns {string}
 */
function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    // Replace self-closing tags with newlines
    .replace(/\u003cbr\s*\/?\u003e/gi, '\n')
    .replace(/\u003chr\s*\/?\u003e/gi, '\n')
    // Remove other tags
    .replace(/\u003c[^\u003e]*\u003e/g, '')
    // Decode entities
    .replace(/\u0026lt;/g, '<')
    .replace(/\u0026gt;/g, '>')
    .replace(/\u0026amp;/g, '&')
    .replace(/\u0026quot;/g, '"')
    .replace(/\u0026#x27;/g, "'")
    .replace(/\u0026#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

/**
 * Deep sanitize an object
 * @param {*} obj
 * @param {Object} options
 * @param {string[]} options.allowHtml - Fields that allow safe HTML
 * @param {string[]} options.skip - Fields to skip sanitization
 * @param {Set} [_seen] - Internal: tracks visited objects for circular reference detection
 * @returns {*}
 */
function sanitizeObject(obj, options = {}, _seen = new Set()) {
  const { allowHtml = [], skip = [] } = options;

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizePlainText(obj);
  }

  // Preserve Date objects as-is
  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    if (_seen.has(obj)) return null;
    _seen.add(obj);
    const result = obj.map((item) => sanitizeObject(item, options, _seen));
    _seen.delete(obj);
    return result;
  }

  if (typeof obj === 'object') {
    if (_seen.has(obj)) return null;
    _seen.add(obj);
    const sanitized = Object.create(null);
    for (const [key, value] of Object.entries(obj)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      if (skip.includes(key)) {
        sanitized[key] = value;
      } else if (allowHtml.includes(key)) {
        sanitized[key] =
          typeof value === 'string' ? sanitizeRichText(value) : sanitizeObject(value, options, _seen);
      } else {
        sanitized[key] = sanitizeObject(value, options, _seen);
      }
    }
    _seen.delete(obj);
    return sanitized;
  }

  return obj;
}

/**
 * Express/AppSync style middleware for sanitizing input
 * @param {Object} schema - Joi schema
 * @param {*} data - Data to validate and sanitize
 * @param {Object} options - Sanitization options
 * @returns {*}
 */
function validateAndSanitize(schema, data, options = {}) {
  const { validate } = require('./input-validator');

  // First validate
  const validated = validate(schema, data, { stripUnknown: false });

  // Then sanitize
  return sanitizeObject(validated, options);
}

/**
 * Create a validator with built-in sanitization
 * @param {Object} schema - Joi schema
 * @param {Object} options - Sanitization options
 * @returns {Function}
 */
function createSanitizedValidator(schema, options = {}) {
  return (data) => validateAndSanitize(schema, data, options);
}

module.exports = {
  escapeHtml,
  removeScriptTags,
  removeEventHandlers,
  sanitizeUrl,
  sanitizeRichText,
  sanitizePlainText,
  sanitizeObject,
  validateAndSanitize,
  createSanitizedValidator,
  stripHtml,
};
