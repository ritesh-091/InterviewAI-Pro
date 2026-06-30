const redis = require('redis');

let redisClient = null;
let isRedisConnected = false;

if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('Redis Cache connection established successfully.');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      console.error('Redis Cache error:', err.message);
    });

    redisClient.connect().catch(err => {
      console.warn('Failed to bind Redis client in async loop:', err.message);
    });
  } catch (err) {
    console.error('Failed to initialize Redis client:', err);
  }
}

// Local in-memory fallback cache container
const memoryCache = new Map();

/**
 * Retrieves a cached value
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Returns cached content or null
 */
const getCache = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to fetch cache key ${key} from Redis:`, error);
    }
  }

  // Memory fallback
  const cached = memoryCache.get(key);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return cached.value;
  }
  return null;
};

/**
 * Sets a value in the cache with expiration (in seconds)
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time-to-live in seconds (default 3600)
 */
const setCache = async (key, value, ttl = 3600) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttl
      });
      return;
    } catch (error) {
      console.error(`Failed to write cache key ${key} to Redis:`, error);
    }
  }

  // Memory fallback
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + (ttl * 1000)
  });
};

/**
 * Invalidates a cached value
 * @param {string} key - Cache key
 */
const deleteCache = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (error) {
      console.error(`Failed to delete cache key ${key} from Redis:`, error);
    }
  }

  // Memory fallback
  memoryCache.delete(key);
};

module.exports = {
  getCache,
  setCache,
  deleteCache
};
