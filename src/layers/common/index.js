const middleware = {
  resolveTenant: require('./middleware/tenant-resolver').resolveTenant,
  requirePermission: require('./middleware/auth-guard').requirePermission,
  validate: require('./middleware/input-validator').validate,
  log: require('./middleware/request-logger').log,
  handleError: require('./middleware/error-handler').handleError,
  withConnection: require('./middleware/with-connection').withConnection,
  withCognitoErrorHandler: require('./middleware/with-cognito-error-handler').withCognitoErrorHandler,
  ...require('./middleware/error-handler'),
};
const db = {
  connectToDatabase: require('./db/mongo-client').connectToDatabase,
  getMongoose: require('./db/mongo-client').getMongoose,
  getRepository: require('./db/db-factory').getRepository,
  BaseRepository: require('./db/base-repository').BaseRepository,
  MongoRepository: require('./db/mongo-repository').MongoRepository,
  DynamoRepository: require('./db/dynamo-repository').DynamoRepository,
};
const utils = {
  success: require('./utils/response').success,
  paginated: require('./utils/response').paginated,
  error: require('./utils/response').error,
  normalizePagination: require('./utils/pagination').normalizePagination,
  toISO: require('./utils/date').toISO,
  nowISO: require('./utils/date').nowISO,
  dayjs: require('./utils/date').dayjs,
  generateId: require('./utils/id-generator').generateId,
  publishEvent: require('./utils/event-publisher').publishEvent,
  withRetry: require('./utils/retry').withRetry,
};

module.exports = {
  middleware,
  db,
  utils,
};
