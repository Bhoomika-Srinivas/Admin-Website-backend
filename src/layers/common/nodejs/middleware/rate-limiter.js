/**
 * Rate limiting middleware using DynamoDB (or in-memory for local dev)
 * Falls back to simple in-memory tracking when DynamoDB is not available
 */

const { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { ForbiddenError } = require('./error-handler');

const REQUESTS_PER_MINUTE = parseInt(process.env.RATE_LIMIT_PER_MINUTE, 10) || 60;
const REQUESTS_PER_HOUR = parseInt(process.env.RATE_LIMIT_PER_HOUR, 10) || 1000;

// Module-level client — reused across warm Lambda invocations
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

// In-memory fallback for local dev
const localStore = new Map();
const LOCAL_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Cleanup old entries periodically
if (process.env.AWS_SAM_LOCAL || process.env.IS_OFFLINE) {
  setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    const currentHourWindow = Math.floor(now / 3600);
    for (const [key, data] of localStore.entries()) {
      if (data.hourWindow < currentHourWindow - 1) {
        localStore.delete(key);
      }
    }
  }, LOCAL_CLEANUP_INTERVAL);
}

/**
 * Get rate limit key for a request
 * @param {Object} ctx - Request context
 * @param {string} identifier - Optional custom identifier
 * @returns {string}
 */
function getRateLimitKey(ctx, identifier) {
  if (identifier) return identifier;
  if (ctx.user_id) return `user:${ctx.user_id}`;
  if (ctx.ip) return `ip:${ctx.ip}`;
  return `anon:${ctx.correlationId || 'unknown'}`;
}

/**
 * Check in-memory rate limit (for local dev)
 * @param {string} key
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
function checkLocalRateLimit(key) {
  const now = Math.floor(Date.now() / 1000); // seconds
  const minuteWindow = Math.floor(now / 60);
  const hourWindow = Math.floor(now / 3600);

  const data = localStore.get(key) || {
    minuteCount: 0,
    hourCount: 0,
    minuteWindow,
    hourWindow,
  };

  // Reset windows if needed
  if (data.minuteWindow !== minuteWindow) {
    data.minuteCount = 0;
    data.minuteWindow = minuteWindow;
  }
  if (data.hourWindow !== hourWindow) {
    data.hourCount = 0;
    data.hourWindow = hourWindow;
  }

  // Check limits
  if (data.minuteCount >= REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: (minuteWindow + 1) * 60,
    };
  }

  if (data.hourCount >= REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: (hourWindow + 1) * 3600,
    };
  }

  // Increment counters
  data.minuteCount++;
  data.hourCount++;
  localStore.set(key, data);

  return {
    allowed: true,
    remaining: REQUESTS_PER_MINUTE - data.minuteCount,
    resetAt: (minuteWindow + 1) * 60,
  };
}

/**
 * Check rate limit using DynamoDB (production)
 * @param {string} key
 * @returns {Promise<{ allowed: boolean, remaining: number, resetAt: number }>}
 */
async function checkDynamoRateLimit(key) {
  const tableName = process.env.RATE_LIMIT_TABLE;
  if (!tableName) {
    // Fall back to local if table not configured
    return checkLocalRateLimit(key);
  }

  const now = Math.floor(Date.now() / 1000);
  const minuteWindow = Math.floor(now / 60);
  const hourWindow = Math.floor(now / 3600);

  try {
    // Get current counts
    const result = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: {
          identifier: { S: key },
        },
      })
    );

    let minuteCount = 0;
    let hourCount = 0;
    let currentMinuteWindow = minuteWindow;
    let currentHourWindow = hourWindow;

    if (result.Item) {
      currentMinuteWindow = parseInt(result.Item.minuteWindow?.N || '0', 10);
      currentHourWindow = parseInt(result.Item.hourWindow?.N || '0', 10);

      if (currentMinuteWindow === minuteWindow) {
        minuteCount = parseInt(result.Item.minuteCount?.N || '0', 10);
      }
      if (currentHourWindow === hourWindow) {
        hourCount = parseInt(result.Item.hourCount?.N || '0', 10);
      }
    }

    // Check limits
    if (minuteCount >= REQUESTS_PER_MINUTE) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: (minuteWindow + 1) * 60,
      };
    }

    if (hourCount >= REQUESTS_PER_HOUR) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: (hourWindow + 1) * 3600,
      };
    }

    // Update counters
    await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: {
          identifier: { S: key },
          minuteCount: { N: String(minuteCount + 1) },
          hourCount: { N: String(hourCount + 1) },
          minuteWindow: { N: String(minuteWindow) },
          hourWindow: { N: String(hourWindow) },
          ttl: { N: String(hourWindow * 3600 + 7200) }, // TTL 2 hours
        },
      })
    );

    return {
      allowed: true,
      remaining: REQUESTS_PER_MINUTE - minuteCount - 1,
      resetAt: (minuteWindow + 1) * 60,
    };
  } catch (err) {
    // If DynamoDB fails, allow request but log error
    console.error('Rate limit check failed:', err);
    return { allowed: true, remaining: -1, resetAt: 0 };
  }
}

/**
 * Rate limiting middleware
 * @param {Object} ctx - Request context
 * @param {string} [identifier] - Optional custom identifier
 * @returns {Promise<void>}
 * @throws {ForbiddenError} If rate limit exceeded
 */
async function checkRateLimit(ctx, identifier) {
  const key = getRateLimitKey(ctx, identifier);

  const isLocal = process.env.AWS_SAM_LOCAL || process.env.IS_OFFLINE;
  const result = isLocal
    ? checkLocalRateLimit(key)
    : await checkDynamoRateLimit(key);

  if (!result.allowed) {
    throw new ForbiddenError('Rate limit exceeded. Please try again later.', {
      retryAfter: Math.ceil((result.resetAt * 1000 - Date.now()) / 1000),
    });
  }

  return result;
}

module.exports = {
  checkRateLimit,
  checkLocalRateLimit,
  checkDynamoRateLimit,
  REQUESTS_PER_MINUTE,
  REQUESTS_PER_HOUR,
};
