/**
 * Base repository for tenant-scoped CRUD. Subclasses implement _insert, _findOne, _find, _update, _delete.
 * All public methods auto-inject tenant_id and created_by/updated_by from context.
 */
class BaseRepository {
  /**
   * @param {Object} config - { model (Mongoose model) or tableName (DynamoDB), dbType: 'mongodb'|'dynamodb', primaryKey: string }
   */
  constructor(config) {
    this.config = config;
    this.dbType = config.dbType || 'mongodb';
    this.primaryKey = config.primaryKey || '_id';
  }

  /**
   * @param {Object} ctx - { tenant_id, user_id }
   * @param {Object} data - Document to create
   * @returns {Promise<Object>}
   */
  async create(ctx, data) {
    const payload = {
      ...data,
      tenant_id: ctx.tenant_id,
      created_by: ctx.user_id || null,
      updated_by: ctx.user_id || null,
    };
    return this._insert(payload);
  }

  /**
   * @param {Object} ctx - { tenant_id }
   * @param {string} id - Document id
   * @returns {Promise<Object|null>}
   */
  async findById(ctx, id) {
    return this._findOne({ [this.primaryKey]: id, tenant_id: ctx.tenant_id });
  }

  /**
   * Find one document by filter without tenant scoping (use only for global uniqueness checks).
   * @param {Object} filter - Mongo filter
   * @returns {Promise<Object|null>}
   */
  async findOneGlobal(filter) {
    return this._findOne(filter);
  }

  /**
   * @param {Object} ctx - { tenant_id }
   * @param {Object} filter - Additional filter
   * @param {Object} [pagination] - { limit, cursor }
   * @returns {Promise<{ items: Array, nextCursor?: string }>}
   */
  async findMany(ctx, filter = {}, pagination = {}) {
    const fullFilter = { ...filter, tenant_id: ctx.tenant_id };
    return this._find(fullFilter, pagination);
  }

  /**
   * @param {Object} ctx - { tenant_id, user_id }
   * @param {string} id - Document id
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>}
   */
  async updateById(ctx, id, updates) {
    const withMeta = { ...updates, updated_by: ctx.user_id || undefined };
    return this._update({ [this.primaryKey]: id, tenant_id: ctx.tenant_id }, withMeta);
  }

  /**
   * @param {Object} ctx - { tenant_id }
   * @param {string} id - Document id
   * @returns {Promise<boolean>}
   */
  async deleteById(ctx, id) {
    return this._delete({ [this.primaryKey]: id, tenant_id: ctx.tenant_id });
  }

  async _insert(data) {
    throw new Error('_insert must be implemented');
  }

  async _findOne(filter) {
    throw new Error('_findOne must be implemented');
  }

  async _find(filter, pagination) {
    throw new Error('_find must be implemented');
  }

  async _update(filter, updates) {
    throw new Error('_update must be implemented');
  }

  async _delete(filter) {
    throw new Error('_delete must be implemented');
  }
}

module.exports = { BaseRepository };
