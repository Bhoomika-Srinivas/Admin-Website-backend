/**
 * Redis caching utility for Lambda functions
 * Provides caching for user roles, permissions, and tenant configs
 * Falls back to in-memory when Redis is unavailable
 */

const DEFAULT_TTL = 300; // 5 minutes

// Simple in-memory cache for fallback
const memoryCache = new Map();
const memoryCacheTTL = new Map();

/**
 * Get cache key with prefix
 * @param {string} prefix - Key prefix (e.g., 'user', 'tenant')
 * @param {string} id - Identifier
 * @returns {string}
 */
function getCacheKey(prefix, id) {
  return `${prefix}:${id}`;
}

/**
 * Get value from in-memory cache
 * @param {string} key
 * @returns {*|null}
 */
function getFromMemory(key) {
  const expiry = memoryCacheTTL.get(key);
  if (expiry && expiry < Date.now()) {
    memoryCache.delete(key);
    memoryCacheTTL.delete(key);
    return null;
  }
  return memoryCache.get(key) || null;
}

/**
 * Set value in in-memory cache
 * @param {string} key
 * @param {*} value
 * @param {number} ttlSeconds
 */
function setInMemory(key, value, ttlSeconds = DEFAULT_TTL) {
  memoryCache.set(key, value);
  memoryCacheTTL.set(key, Date.now() + (ttlSeconds * 1000));
}

/**
 * Delete value from in-memory cache
 * @param {string} key
 */
function deleteFromMemory(key) {
  memoryCache.delete(key);
  memoryCacheTTL.delete(key);
}

/**
 * Get cached user roles and permissions
 * @param {string} userId
 * @returns {Promise<{roles: string[], permissions: string[], tenant_id: string}|null>}
 */
async function getUserPermissions(userId) {
  const key = getCacheKey('user:perms', userId);

  // Try memory cache first
  const cached = getFromMemory(key);
  if (cached) {
    return cached;
  }

  return null;
}

/**
 * Cache user permissions
 * @param {string} userId
 * @param {Object} data
 * @param {number} ttlSeconds
 */
async function setUserPermissions(userId, data, ttlSeconds = 300) {
  const key = getCacheKey('user:perms', userId);
  setInMemory(key, data, ttlSeconds);
}

/**
 * Invalidate user permissions cache
 * @param {string} userId
 */
async function invalidateUserPermissions(userId) {
  const key = getCacheKey('user:perms', userId);
  deleteFromMemory(key);
}

/**
 * Get cached tenant config
 * @param {string} tenantId
 * @returns {Promise<Object|null>}
 */
async function getTenantConfig(tenantId) {
  const key = getCacheKey('tenant:config', tenantId);
  return getFromMemory(key);
}

/**
 * Cache tenant config
 * @param {string} tenantId
 * @param {Object} config
 * @param {number} ttlSeconds
 */
async function setTenantConfig(tenantId, config, ttlSeconds = 600) {
  const key = getCacheKey('tenant:config', tenantId);
  setInMemory(key, config, ttlSeconds);
}

/**
 * Get cached role
 * @param {string} tenantId
 * @param {string} roleId
 * @returns {Promise<Object|null>}
 */
async function getRole(tenantId, roleId) {
  const key = getCacheKey(`tenant:${tenantId}:role`, roleId);
  return getFromMemory(key);
}

/**
 * Cache role
 * @param {string} tenantId
 * @param {string} roleId
 * @param {Object} role
 * @param {number} ttlSeconds
 */
async function setRole(tenantId, roleId, role, ttlSeconds = 300) {
  const key = getCacheKey(`tenant:${tenantId}:role`, roleId);
  setInMemory(key, role, ttlSeconds);
}

/**
 * Invalidate all cache for a tenant
 * @param {string} tenantId
 */
async function invalidateTenant(tenantId) {
  const prefix = `tenant:${tenantId}:`;
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      deleteFromMemory(key);
    }
  }
}

/**
 * Clear all cache
 */
async function clearAll() {
  memoryCache.clear();
  memoryCacheTTL.clear();
}

/**
 * Get cache stats
 * @returns {{size: number, keys: string[]}}
 */
function getStats() {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
  };
}

module.exports = {
  getUserPermissions,
  setUserPermissions,
  invalidateUserPermissions,
  getTenantConfig,
  setTenantConfig,
  getRole,
  setRole,
  invalidateTenant,
  clearAll,
  getStats,
  getCacheKey,
  DEFAULT_TTL,
};
