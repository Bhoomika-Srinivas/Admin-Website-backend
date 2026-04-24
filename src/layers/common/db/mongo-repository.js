const { BaseRepository } = require('./base-repository');

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

  /**
   * Insert document.
   * IMPORTANT: Do NOT manually set _id.
   * Let Mongo generate ObjectId automatically.
   */
  async _insert(data) {
    const doc = new this.model({
      ...data
    });

    const saved = await doc.save();
    return saved.toObject ? saved.toObject() : saved;
  }

  /**
   * Find one document
   */
  async _findOne(filter) {
    const doc = await this.model.findOne(filter).lean();
    return doc || null;
  }

  /**
   * Find many with pagination
   */
  async _find(filter, pagination = {}) {
    const limit = Math.min(pagination.limit || 100, 500);
    const page = Math.max(pagination.page || 1, 1);
    const skip = (page - 1) * limit;

    let baseQuery = this.model.find(filter);

    // Cursor-based (legacy support)
    if (pagination.cursor) {
      baseQuery = baseQuery.where('created_at').lt(new Date(pagination.cursor));
      const items = await baseQuery.sort({ created_at: -1 }).limit(limit + 1).lean();
      const hasMore = items.length > limit;
      const nextCursor = hasMore ? items[limit - 1]?.created_at?.toISOString() : null;
      return {
        items: hasMore ? items.slice(0, limit) : items,
        nextCursor: nextCursor || null,
        pageInfo: { hasNextPage: hasMore, endCursor: nextCursor || null, page, limit },
      };
    }

    // Offset-based pagination
    const [items, total] = await Promise.all([
      baseQuery.clone().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      baseQuery.clone().countDocuments(),
    ]);

    return {
      items,
      nextCursor: null,
      pageInfo: { total, page, limit, hasNextPage: skip + items.length < total, endCursor: null },
    };
  }

  /**
   * Update document
   */
  async _update(filter, updates) {
    const doc = await this.model.findOneAndUpdate(
      filter,
      { $set: { ...updates, updated_at: new Date() } },
      { new: true }
    ).lean();

    return doc || null;
  }

  /**
   * Delete document
   */
  async _delete(filter) {
    const result = await this.model.deleteOne(filter);
    return result.deletedCount === 1;
  }
}

module.exports = { MongoRepository };
