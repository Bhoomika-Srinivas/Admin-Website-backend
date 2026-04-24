/**
 * File validation utilities for secure upload handling
 * Validates file signatures (magic bytes) rather than extensions
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = {
  'application/pdf': {
    extensions: ['.pdf'],
    signatures: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  },
  'image/jpeg': {
    extensions: ['.jpg', '.jpeg'],
    signatures: [
      [0xFF, 0xD8, 0xFF, 0xE0],
      [0xFF, 0xD8, 0xFF, 0xE1],
      [0xFF, 0xD8, 0xFF, 0xE8],
    ],
  },
  'image/png': {
    extensions: ['.png'],
    signatures: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  },
  'application/msword': {
    extensions: ['.doc'],
    signatures: [[0xD0, 0xCF, 0x11, 0xE0]],
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extensions: ['.docx'],
    signatures: [[0x50, 0x4B, 0x03, 0x04]], // ZIP format (DOCX is ZIP-based)
  },
};

/**
 * Validate file buffer against expected MIME type
 * @param {Buffer} buffer - File buffer
 * @param {string} expectedMimeType - Expected MIME type
 * @returns {boolean}
 */
function validateFileSignature(buffer, expectedMimeType) {
  const config = ALLOWED_MIME_TYPES[expectedMimeType];
  if (!config) return false;

  return config.signatures.some((sig) => {
    if (buffer.length < sig.length) return false;
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) return false;
    }
    return true;
  });
}

/**
 * Get MIME type from file extension
 * @param {string} filename - Original filename
 * @returns {string|null}
 */
function getMimeTypeFromExtension(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  for (const [mimeType, config] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (config.extensions.includes(`.${ext}`)) {
      return mimeType;
    }
  }
  return null;
}

/**
 * Sanitize filename to prevent path traversal
 * @param {string} filename - Original filename
 * @returns {string}
 */
function sanitizeFilename(filename) {
  // First extract just the filename part (remove path)
  const basename = filename.replace(/^.*[\\\/]/, '');
  return basename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
}

/**
 * Validate base64 file upload
 * @param {string} base64String - Base64 encoded file
 * @param {string} filename - Original filename
 * @param {Object} options
 * @param {number} options.maxSize - Max file size in bytes (default: 10MB)
 * @param {string[]} options.allowedTypes - Allowed MIME types
 * @returns {{ valid: boolean, error?: string, buffer?: Buffer, mimeType?: string }}
 */
function validateBase64File(base64String, filename, options = {}) {
  const maxSize = options.maxSize || MAX_FILE_SIZE;
  const allowedTypes = options.allowedTypes || Object.keys(ALLOWED_MIME_TYPES);

  // Check filename
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Empty or invalid base64' };
  }

  const sanitizedName = sanitizeFilename(filename);

  // Get MIME type from extension
  const ext = '.' + filename.toLowerCase().split('.').pop();
  const mimeType = getMimeTypeFromExtension(filename);
  if (!mimeType) {
    return { valid: false, error: `Extension ${ext} not allowed` };
  }

  if (!allowedTypes.includes(mimeType)) {
    return { valid: false, error: `File type ${mimeType} not allowed` };
  }

  // Validate base64
  if (!base64String || typeof base64String !== 'string') {
    return { valid: false, error: 'Empty or invalid base64' };
  }

  // Remove data URI prefix if present
  const base64Data = base64String.replace(/^data:[^;]+;base64,/, '');

  // Check approximate size (base64 is ~4/3 of binary)
  const approximateSize = (base64Data.length * 3) / 4;
  if (approximateSize > maxSize) {
    return {
      valid: false,
      error: 'File too large',
    };
  }

  try {
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate file signature
    if (!validateFileSignature(buffer, mimeType)) {
      return {
        valid: false,
        error: 'File signature does not match allowed types',
      };
    }

    const extension = '.' + filename.toLowerCase().split('.').pop();

    return {
      valid: true,
      buffer,
      mimeType,
      filename: sanitizedName,
      extension,
      size: buffer.length,
    };
  } catch (err) {
    return { valid: false, error: 'Invalid base64' };
  }
}

/**
 * Get file extension from filename
 * @param {string} filename
 * @returns {string}
 */
function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') return '';
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return '.' + parts.pop().toLowerCase();
}

/**
 * Generate a safe random filename
 * @param {string} originalFilename
 * @returns {string}
 */
function generateSafeFilename(originalFilename) {
  const crypto = require('crypto');
  const randomPart = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  const ext = getFileExtension(originalFilename);
  const baseName = originalFilename
    ? originalFilename
        .replace(ext, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase()
        .substring(0, 50)
    : 'file';
  return `${baseName}-${timestamp}-${randomPart}${ext}`;
}

module.exports = {
  validateFileSignature,
  getMimeTypeFromExtension,
  sanitizeFilename,
  getFileExtension,
  generateSafeFilename,
  validateBase64File,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};
