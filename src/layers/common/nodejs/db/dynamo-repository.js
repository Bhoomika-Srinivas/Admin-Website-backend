const { BaseRepository } = require('./base-repository');
const dynamo = require('./dynamo-client');
const { generateId } = require('../utils/id-generator');

/**
 * DynamoDB implementation of BaseRepository.
 * Expects table with partition key tenant_id and sort key _id (or config.pk/sk).
 */
class DynamoRepository extends BaseRepository {
  constructor(config) {
    super({ ...config, dbType: 'dynamodb' });
    this.tableName = config.tableName;
    this.pk = config.pk || 'tenant_id';
    this.sk = config.sk || '_id';
    if (!this.tableName) {
      throw new Error('DynamoRepository requires config.tableName');
    }
  }

  async _insert(data) {
    const id = data._id || data[this.sk] || generateId();
    const item = {
      ...data,
      [this.pk]: data.tenant_id,
      [this.sk]: id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await dynamo.putItem(
      { TableName: this.tableName, Item: item },
      { tenant_id: item.tenant_id }
    );
    return { ...item, _id: id };
  }

  async _findOne(filter) {
    const tenant_id = filter.tenant_id;
    const id = filter._id;
    if (!tenant_id || !id) return null;
    const item = await dynamo.getItem(
      {
        TableName: this.tableName,
        Key: { [this.pk]: tenant_id, [this.sk]: id },
      },
      { tenant_id }
    );
    return item;
  }

  async _find(filter, pagination = {}) {
    const tenant_id = filter.tenant_id;
    if (!tenant_id) return { items: [], nextCursor: undefined };
    const limit = Math.min(pagination.limit || 20, 100);
    const result = await dynamo.query(
      {
        TableName: this.tableName,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: { '#pk': this.pk },
        ExpressionAttributeValues: { ':pk': tenant_id },
        Limit: limit + 1,
        ExclusiveStartKey: pagination.cursor ? JSON.parse(Buffer.from(pagination.cursor, 'base64').toString()) : undefined,
      },
      { tenant_id }
    );
    const items = result.items || [];
    const hasMore = items.length > limit;
    const nextCursor = hasMore && result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;
    return {
      items: hasMore ? items.slice(0, limit) : items,
      nextCursor,
    };
  }

  async _update(filter, updates) {
    const tenant_id = filter.tenant_id;
    const id = filter._id;
    if (!tenant_id || !id) return null;
    const doc = await this._findOne(filter);
    if (!doc) return null;
    const updated = {
      ...doc,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    await dynamo.putItem(
      { TableName: this.tableName, Item: updated },
      { tenant_id }
    );
    return updated;
  }

  async _delete(filter) {
    const tenant_id = filter.tenant_id;
    const id = filter._id;
    if (!tenant_id || !id) return false;
    await dynamo.deleteItem(
      {
        TableName: this.tableName,
        Key: { [this.pk]: tenant_id, [this.sk]: id },
      },
      { tenant_id }
    );
    return true;
  }
}

module.exports = { DynamoRepository };
