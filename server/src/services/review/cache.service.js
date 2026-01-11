const crypto = require('crypto');
const Redis = require('ioredis');
const logger = require('../../config/logger');

class CacheService {
  constructor(redis = null) {
    this.redis = redis || new Redis(process.env.REDIS_URL);
    this.ttl = parseInt(process.env.CACHE_TTL_SECONDS || '3600'); // 1 hour default
    this.metricsPrefix = 'cache:metrics:';
    this.cachePrefix = 'review:cache:';
  }

  /**
   * Generate cache key from prompt
   * @param {string} prompt - The LLM prompt
   * @returns {string} Cache key
   */
  generateCacheKey(prompt) {
    const hash = crypto.createHash('sha256').update(prompt).digest('hex');
    return `${this.cachePrefix}${hash}`;
  }

  /**
   * Get cached review response
   * @param {string} prompt - The LLM prompt
   * @returns {Promise<object|null>} Cached response or null
   */
  async getReview(prompt) {
    try {
      const key = this.generateCacheKey(prompt);
      const cached = await this.redis.get(key);
      
      if (cached) {
        this.trackMetric('hit', 1);
        logger.debug(`Cache hit for prompt hash`);
        return JSON.parse(cached);
      }
      
      this.trackMetric('miss', 1);
      logger.debug(`Cache miss for prompt hash`);
      return null;
    } catch (error) {
      logger.error({ error }, 'Cache retrieval failed');
      return null;
    }
  }

  /**
   * Set cached review response
   * @param {string} prompt - The LLM prompt
   * @param {object} response - The LLM response
   * @returns {Promise<boolean>}
   */
  async setReview(prompt, response) {
    try {
      const key = this.generateCacheKey(prompt);
      await this.redis.setex(key, this.ttl, JSON.stringify(response));
      logger.debug(`Cached review response for prompt hash`);
      return true;
    } catch (error) {
      logger.error({ error }, 'Cache set failed');
      return false;
    }
  }

  /**
   * Track cache metrics
   * @param {string} metric - 'hit' or 'miss'
   * @param {number} value - Value to add
   */
  trackMetric(metric, value = 1) {
    const today = new Date().toISOString().split('T')[0];
    const key = `${this.metricsPrefix}${metric}:${today}`;
    this.redis.incrby(key, value);
    this.redis.expire(key, 86400 * 30); // 30 days
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>} Cache stats
   */
  async getStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const hits = await this.redis.get(`${this.metricsPrefix}hit:${today}`);
      const misses = await this.redis.get(`${this.metricsPrefix}miss:${today}`);
      
      const hitsNum = parseInt(hits) || 0;
      const missesNum = parseInt(misses) || 0;
      const total = hitsNum + missesNum;
      const hitRate = total > 0 ? ((hitsNum / total) * 100).toFixed(2) : 0;

      return {
        hits: hitsNum,
        misses: missesNum,
        total,
        hitRate: parseFloat(hitRate),
        date: today
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get cache stats');
      return { hits: 0, misses: 0, total: 0, hitRate: 0 };
    }
  }

  /**
   * Clear all cached reviews
   * @returns {Promise<number>} Number of keys deleted
   */
  async clearAllCache() {
    try {
      const pattern = `${this.cachePrefix}*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }

      return await this.redis.del(...keys);
    } catch (error) {
      logger.error({ error }, 'Failed to clear cache');
      return 0;
    }
  }

  /**
   * Get hit rate for a period
   * @param {number} days - Number of days to check
   * @returns {Promise<object>} Hit rate data
   */
  async getHitRate(days = 7) {
    try {
      const hitRates = [];
      const today = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const hits = await this.redis.get(`${this.metricsPrefix}hit:${dateStr}`);
        const misses = await this.redis.get(`${this.metricsPrefix}miss:${dateStr}`);

        const hitsNum = parseInt(hits) || 0;
        const missesNum = parseInt(misses) || 0;
        const total = hitsNum + missesNum;
        const rate = total > 0 ? ((hitsNum / total) * 100).toFixed(2) : 0;

        if (total > 0) {
          hitRates.push({
            date: dateStr,
            hits: hitsNum,
            misses: missesNum,
            hitRate: parseFloat(rate)
          });
        }
      }

      return {
        period: `${days} days`,
        data: hitRates,
        averageHitRate: hitRates.length > 0
          ? (hitRates.reduce((sum, d) => sum + d.hitRate, 0) / hitRates.length).toFixed(2)
          : 0
      };
    } catch (error) {
      logger.error({ error }, 'Failed to calculate hit rate');
      return { period: `${days} days`, data: [], averageHitRate: 0 };
    }
  }
}

module.exports = CacheService;
