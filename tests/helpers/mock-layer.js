/**
 * Shared mock layer for handler tests. Auto-mocks all /opt/nodejs/* modules so handler tests
 * can invoke the real handler with stubbed DB and common layer. Must be required before the handler.
 */

// Virtual mocks for AWS SDK packages (live in Lambda layer, not installed locally)
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ User: { Attributes: [{ Name: 'sub', Value: 'mock-cognito-sub' }] } }),
  })),
  AdminCreateUserCommand: jest.fn(),
  AdminSetUserPasswordCommand: jest.fn(),
  AdminDisableUserCommand: jest.fn(),
  AdminEnableUserCommand: jest.fn(),
  AdminUpdateUserAttributesCommand: jest.fn(),
}), { virtual: true });

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn().mockResolvedValue({}) })),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}), { virtual: true });

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mock-signed-url.example.com'),
}), { virtual: true });

const repoMocks = [];

function createMockRepo() {
  return {
    findById: jest.fn(),
    findMany: jest.fn(),
    findOneGlobal: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
  };
}

const mockResolveTenant = jest.fn((event) => {
  const { createContext } = require('./test-context');
  if (event?.token) {
    return createContext({
      tenant_id: event.token['custom:tenant_id'] || 't_test123',
      user_id: event.token.sub || 'u_test456',
      email: event.token.email,
      permissions: event.token['custom:permissions']
        ? JSON.parse(event.token['custom:permissions'])
        : [],
    });
  }
  return createContext();
});

const mockRequirePermission = jest.fn().mockResolvedValue(undefined);
const mockLog = jest.fn();
const mockConnectToDatabase = jest.fn().mockResolvedValue(undefined);
const mockPublishEvent = jest.fn().mockResolvedValue(undefined);
const mockGenerateId = jest.fn(() => 'mock-id-01');

const mockMongoRepository = jest.fn().mockImplementation(function () {
  const repo = createMockRepo();
  repoMocks.push(repo);
  return repo;
});

jest.mock('/opt/nodejs/middleware/tenant-resolver', () => ({
  resolveTenant: mockResolveTenant,
}), { virtual: true });

jest.mock('/opt/nodejs/middleware/auth-guard', () => ({
  requirePermission: mockRequirePermission,
}), { virtual: true });

jest.mock('/opt/nodejs/middleware/with-connection', () => ({
  withConnection: (handler) => async (event) => {
    try {
      await mockConnectToDatabase();
      return await handler(event);
    } catch (err) {
      const { handleError } = require(require('path').join(process.cwd(), 'src/layers/common/nodejs/middleware/error-handler'));
      return handleError(err, event);
    }
  },
}), { virtual: true });

jest.mock('/opt/nodejs/middleware/input-validator', () => {
  const actual = require(require('path').join(process.cwd(), 'src/layers/common/nodejs/middleware/input-validator'));
  return actual;
}, { virtual: true });

jest.mock('/opt/nodejs/middleware/error-handler', () => {
  const mockActual = require(require('path').join(process.cwd(), 'src/layers/common/nodejs/middleware/error-handler'));
  const mockHandleError = jest.fn((error, event) => ({
    error: {
      message: error.message || 'Internal server error',
      type: error.code || error.name || 'INTERNAL_ERROR',
      ...(error.details && { details: error.details }),
    },
  }));
  return {
    ...mockActual,
    handleError: mockHandleError,
  };
}, { virtual: true });

jest.mock('/opt/nodejs/middleware/request-logger', () => ({
  log: mockLog,
}), { virtual: true });

jest.mock('/opt/nodejs/db/mongo-client', () => ({
  connectToDatabase: mockConnectToDatabase,
}), { virtual: true });

jest.mock('/opt/nodejs/db/mongo-repository', () => ({
  MongoRepository: mockMongoRepository,
}), { virtual: true });

jest.mock('/opt/nodejs/utils/event-publisher', () => ({
  publishEvent: mockPublishEvent,
}), { virtual: true });

jest.mock('/opt/nodejs/utils/id-generator', () => ({
  generateId: mockGenerateId,
}), { virtual: true });

jest.mock('/opt/nodejs/utils/pagination', () => {
  const mockActual = require(require('path').join(process.cwd(), 'src/layers/common/nodejs/utils/pagination'));
  return { ...mockActual };
}, { virtual: true });

jest.mock('/opt/nodejs/utils/retry', () => ({
  withRetry: (fn) => fn(),
}), { virtual: true });

// Security utilities mocks
const mockValidateBase64File = jest.fn((base64, filename, options = {}) => {
  const maxSize = options.maxSize || 10 * 1024 * 1024;
  try {
    if (!base64 || base64.length === 0) {
      return { valid: false, error: 'Empty base64' };
    }
    const buffer = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
    if (buffer.length > maxSize) {
      return { valid: false, error: 'File too large' };
    }
    const ext = filename ? filename.split('.').pop().toLowerCase() : '';
    const mimeType = ext === 'pdf' ? 'application/pdf' : `application/${ext}`;
    return {
      valid: true,
      buffer,
      mimeType,
      extension: ext ? `.${ext}` : '',
      filename: filename || 'unknown',
      size: buffer.length,
    };
  } catch (e) {
    return { valid: false, error: 'Invalid base64' };
  }
});

const mockCheckRateLimit = jest.fn().mockResolvedValue({
  allowed: true,
  remaining: 59,
  retryAfter: null,
});

const mockSanitizePlainText = jest.fn((text) => {
  if (text === null || text === undefined) return null;
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/&/g, '&amp;')
    .trim();
});

const mockSanitizeRichText = jest.fn((html) => {
  if (html === null || html === undefined) return null;
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/\s*on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
});

const mockSanitizeObject = jest.fn((obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => mockSanitizeObject(item));
  }
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = mockSanitizePlainText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = mockSanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
});

jest.mock('/opt/nodejs/utils/file-validator', () => ({
  validateBase64File: mockValidateBase64File,
  getFileExtension: jest.fn((filename) => {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts.pop().toLowerCase()}` : '';
  }),
  generateSafeFilename: jest.fn((filename) => {
    const safe = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : 'file';
    return `${safe.substring(0, 50)}_${Date.now()}`;
  }),
  ALLOWED_MIME_TYPES: {
    'application/pdf': { extensions: ['.pdf'], signatures: [[0x25, 0x50, 0x44, 0x46]] },
    'image/jpeg': { extensions: ['.jpg', '.jpeg'], signatures: [[0xFF, 0xD8, 0xFF]] },
    'image/png': { extensions: ['.png'], signatures: [[0x89, 0x50, 0x4E, 0x47]] },
  },
  MAX_FILE_SIZE: 10 * 1024 * 1024,
}), { virtual: true });

jest.mock('/opt/nodejs/middleware/rate-limiter', () => ({
  checkRateLimit: mockCheckRateLimit,
  RateLimitError: class RateLimitError extends Error {
    constructor(message = 'Rate limit exceeded') {
      super(message);
      this.code = 'RATE_LIMIT_EXCEEDED';
      this.statusCode = 429;
    }
  },
}), { virtual: true });

jest.mock('/opt/nodejs/middleware/sanitizer', () => ({
  escapeHtml: mockSanitizePlainText,
  sanitizePlainText: mockSanitizePlainText,
  sanitizeRichText: mockSanitizeRichText,
  sanitizeObject: mockSanitizeObject,
  stripHtml: jest.fn((html) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').trim();
  }),
}), { virtual: true });

function getMocks() {
  const errorHandlerModule = require('/opt/nodejs/middleware/error-handler');
  return {
    resolveTenant: mockResolveTenant,
    requirePermission: mockRequirePermission,
    log: mockLog,
    connectToDatabase: mockConnectToDatabase,
    publishEvent: mockPublishEvent,
    generateId: mockGenerateId,
    handleError: errorHandlerModule.handleError,
    /** Array of mock repo instances in the order they were constructed (e.g. [userRepo, roleRepo]) */
    repos: repoMocks,
    // Security utilities
    validateBase64File: mockValidateBase64File,
    checkRateLimit: mockCheckRateLimit,
    sanitizePlainText: mockSanitizePlainText,
    sanitizeRichText: mockSanitizeRichText,
    sanitizeObject: mockSanitizeObject,
    // Cache utilities
    getUserPermissions: mockGetUserPermissions,
    setUserPermissions: mockSetUserPermissions,
    invalidateUserPermissions: mockInvalidateUserPermissions,
    getTenantConfig: mockGetTenantConfig,
    setTenantConfig: mockSetTenantConfig,
    getRole: mockGetRole,
    setRole: mockSetRole,
  };
}

function resetAllMocks() {
  mockResolveTenant.mockClear();
  mockRequirePermission.mockClear();
  mockLog.mockClear();
  mockConnectToDatabase.mockClear();
  mockPublishEvent.mockClear();
  mockGenerateId.mockClear();
  mockMongoRepository.mockClear();
  repoMocks.forEach((repo) => {
    repo.findById.mockClear();
    repo.findMany.mockClear();
    if (repo.findOneGlobal) repo.findOneGlobal.mockClear();
    repo.create.mockClear();
    repo.updateById.mockClear();
    repo.deleteById.mockClear();
  });
  const errorHandlerModule = require('/opt/nodejs/middleware/error-handler');
  if (errorHandlerModule.handleError?.mockClear) {
    errorHandlerModule.handleError.mockClear();
  }
  // Clear security utility mocks
  mockValidateBase64File.mockClear();
  mockCheckRateLimit.mockClear();
  mockSanitizePlainText.mockClear();
  mockSanitizeRichText.mockClear();
  mockSanitizeObject.mockClear();
  // Clear cache mocks
  mockGetUserPermissions.mockClear();
  mockSetUserPermissions.mockClear();
  mockInvalidateUserPermissions.mockClear();
  mockGetTenantConfig.mockClear();
  mockSetTenantConfig.mockClear();
  mockGetRole.mockClear();
  mockSetRole.mockClear();
}

// Redis cache mocks
const mockGetUserPermissions = jest.fn().mockResolvedValue(null);
const mockSetUserPermissions = jest.fn().mockResolvedValue(undefined);
const mockInvalidateUserPermissions = jest.fn().mockResolvedValue(undefined);
const mockGetTenantConfig = jest.fn().mockResolvedValue(null);
const mockSetTenantConfig = jest.fn().mockResolvedValue(undefined);
const mockGetRole = jest.fn().mockResolvedValue(null);
const mockSetRole = jest.fn().mockResolvedValue(undefined);

jest.mock('/opt/nodejs/utils/redis-cache', () => ({
  getUserPermissions: mockGetUserPermissions,
  setUserPermissions: mockSetUserPermissions,
  invalidateUserPermissions: mockInvalidateUserPermissions,
  getTenantConfig: mockGetTenantConfig,
  setTenantConfig: mockSetTenantConfig,
  getRole: mockGetRole,
  setRole: mockSetRole,
  invalidateTenant: jest.fn().mockResolvedValue(undefined),
  clearAll: jest.fn().mockResolvedValue(undefined),
  getStats: jest.fn().mockReturnValue({ size: 0, keys: [] }),
  getCacheKey: jest.fn((prefix, id) => `${prefix}:${id}`),
  DEFAULT_TTL: 300,
}), { virtual: true });

module.exports = {
  createMockRepo,
  getMocks,
  resetAllMocks,
};
