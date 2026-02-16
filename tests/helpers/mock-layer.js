/**
 * Shared mock layer for handler tests. Auto-mocks all /opt/nodejs/* modules so handler tests
 * can invoke the real handler with stubbed DB and common layer. Must be required before the handler.
 */

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
}

module.exports = {
  createMockRepo,
  getMocks,
  resetAllMocks,
};
