const { BaseRepository } = require('./base-repository');

/**
 * Returns a repository instance for the given module config.
 * @param {Object} moduleConfig - { dbType: 'mongodb'|'dynamodb', model?: Mongoose model, tableName?: string }
 * @returns {BaseRepository} - Subclass instance (caller must use module-specific repository that extends BaseRepository)
 */
function getRepository(moduleConfig) {
  if (moduleConfig.dbType === 'dynamodb') {
    const { DynamoRepository } = require('./dynamo-repository');
    return new DynamoRepository(moduleConfig);
  }
  const { MongoRepository } = require('./mongo-repository');
  return new MongoRepository(moduleConfig);
}

module.exports = { getRepository };
