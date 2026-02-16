const { BaseRepository } = require('./base-repository');
const { generateId } = require('../utils/id-generator');

/**
 * MongoDB implementation of BaseRepository using Mongoose model.
 */
class MongoRepository extends BaseRepository {
  constructor(config) {
    super({ ...config, dbType: 'mongodb' });
    this.model = config.model;
    if (!this.model) {
      throw new Error('MongoRepository requires config.model (Mongoose model)');
    }
  }

  async _insert(data) {
    const id = data._id != null ? data._id : (data[this.primaryKey] != null ? data[this.primaryKey] : generateId());
    const doc = new this.model({
      ...data,
      _id: id,
    });
    const saved = await doc.save();
    return saved.toObject ? saved.toObject() : saved;
  }

  async _findOne(filter) {
    const doc = await this.model.findOne(filter).lean();
    return doc || null;
  }

  async _find(filter, pagination = {}) {
    const limit = Math.min(pagination.limit || 20, 100);
    let query = this.model.find(filter).sort({ created_at: -1 }).limit(limit + 1).lean();
    if (pagination.cursor) {
      query = query.where('created_at').lt(new Date(pagination.cursor));
    }
    const items = await query;
    const hasMore = items.length > limit;
    const nextCursor = hasMore ? items[limit - 1]?.created_at?.toISOString() : null;
    return {
      items: hasMore ? items.slice(0, limit) : items,
      nextCursor: nextCursor || undefined,
    };
  }

  async _update(filter, updates) {
    const doc = await this.model.findOneAndUpdate(
      filter,
      { $set: { ...updates, updated_at: new Date() } },
      { new: true }
    ).lean();
    return doc || null;
  }

  async _delete(filter) {
    const result = await this.model.deleteOne(filter);
    return result.deletedCount === 1;
  }
}

module.exports = { MongoRepository };
