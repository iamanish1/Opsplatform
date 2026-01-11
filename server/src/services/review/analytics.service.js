const Redis = require('ioredis');
const logger = require('../../utils/logger');

class AnalyticsService {
  constructor(redis = null) {
    this.redis = redis || new Redis(process.env.REDIS_URL);
    this.namespace = 'analytics:';
    this.ttl = 86400 * 30; // 30 days
  }

  /**
   * Track review completion
   * @param {object} data - Review data
   * @param {string} data.submissionId - Submission ID
   * @param {string} data.model - Model used
   * @param {number} data.duration - Processing duration (ms)
   * @param {number} data.cost - Cost in USD
   * @param {boolean} data.cached - Whether cached
   * @param {object} data.scores - Score categories
   */
  async trackReviewCompletion({ submissionId, model, duration, cost, cached, scores }) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const hour = new Date().getHours();

      // Increment review count
      await this.redis.incr(`${this.namespace}reviews:total`);
      await this.redis.incr(`${this.namespace}reviews:${today}`);
      await this.redis.incr(`${this.namespace}reviews:hour:${today}:${hour}`);

      // Track by model
      await this.redis.incr(`${this.namespace}reviews:model:${model}`);

      // Track cache hits
      if (cached) {
        await this.redis.incr(`${this.namespace}cache:hits:${today}`);
      }

      // Track cost
      await this.redis.incrbyfloat(`${this.namespace}cost:total`, cost);
      await this.redis.incrbyfloat(`${this.namespace}cost:${today}`, cost);
      await this.redis.incrbyfloat(`${this.namespace}cost:model:${model}`, cost);

      // Track duration
      await this.redis.lpush(`${this.namespace}duration:${today}`, duration);
      await this.redis.ltrim(`${this.namespace}duration:${today}`, 0, 10000);

      // Track category scores
      for (const [category, score] of Object.entries(scores)) {
        await this.redis.lpush(`${this.namespace}scores:${category}:${today}`, score);
        await this.redis.ltrim(`${this.namespace}scores:${category}:${today}`, 0, 10000);
      }

      // Set expiration for daily keys
      await this.redis.expire(`${this.namespace}reviews:${today}`, this.ttl);
      await this.redis.expire(`${this.namespace}cost:${today}`, this.ttl);
      await this.redis.expire(`${this.namespace}duration:${today}`, this.ttl);

      logger.debug({ submissionId, model, cost }, 'Analytics tracked');
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to track analytics');
    }
  }

  /**
   * Track error occurrence
   * @param {object} data - Error data
   * @param {string} data.type - Error type
   * @param {string} data.message - Error message
   * @param {string} data.submissionId - Submission ID (optional)
   */
  async trackError({ type, message, submissionId }) {
    try {
      const today = new Date().toISOString().split('T')[0];

      await this.redis.incr(`${this.namespace}errors:total`);
      await this.redis.incr(`${this.namespace}errors:${today}`);
      await this.redis.incr(`${this.namespace}errors:${type}:${today}`);

      // Keep error log for debugging
      await this.redis.lpush(
        `${this.namespace}error:log:${today}`,
        JSON.stringify({
          type,
          message,
          submissionId,
          timestamp: new Date().toISOString()
        })
      );
      await this.redis.ltrim(`${this.namespace}error:log:${today}`, 0, 1000);

      logger.debug({ type, submissionId }, 'Error tracked');
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to track error analytics');
    }
  }

  /**
   * Get review trends
   * @param {number} days - Number of days to analyze
   * @returns {Promise<object>} Trends data
   */
  async getReviewTrends(days = 7) {
    try {
      const trends = [];
      const today = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const count = await this.redis.get(`${this.namespace}reviews:${dateStr}`);
        const cost = await this.redis.get(`${this.namespace}cost:${dateStr}`);
        const durations = await this.redis.lrange(`${this.namespace}duration:${dateStr}`, 0, -1);

        if (count) {
          const avgDuration = durations.length > 0
            ? durations.reduce((a, b) => a + parseInt(b), 0) / durations.length
            : 0;

          trends.push({
            date: dateStr,
            reviewCount: parseInt(count),
            totalCost: parseFloat(cost || '0').toFixed(4),
            avgDuration: avgDuration.toFixed(0),
            errorCount: await this.redis.get(`${this.namespace}errors:${dateStr}`) || '0'
          });
        }
      }

      return {
        period: `${days} days`,
        trends: trends.sort((a, b) => new Date(a.date) - new Date(b.date)),
        summary: this.calculateTrendsSummary(trends)
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get review trends');
      return { period: `${days} days`, trends: [], summary: {} };
    }
  }

  /**
   * Get category performance metrics
   * @param {number} days - Number of days to analyze
   * @returns {Promise<object>} Category metrics
   */
  async getCategoryPerformance(days = 7) {
    try {
      const categories = [
        'codeQuality',
        'problemSolving',
        'bugRisk',
        'devopsExecution',
        'optimization',
        'documentation',
        'gitMaturity',
        'collaboration',
        'deliverySpeed',
        'security'
      ];

      const performance = {};

      for (const category of categories) {
        const scores = [];
        const today = new Date();

        for (let i = 0; i < days; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const categoryScores = await this.redis.lrange(
            `${this.namespace}scores:${category}:${dateStr}`,
            0,
            -1
          );

          if (categoryScores.length > 0) {
            const avg = categoryScores.reduce((a, b) => a + parseInt(b), 0) / categoryScores.length;
            scores.push(avg);
          }
        }

        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          const max = Math.max(...scores);
          const min = Math.min(...scores);

          performance[category] = {
            average: parseFloat(avg.toFixed(2)),
            max: parseFloat(max.toFixed(2)),
            min: parseFloat(min.toFixed(2)),
            trend: scores.length > 1 ? scores[0] - scores[scores.length - 1] : 0
          };
        }
      }

      return {
        period: `${days} days`,
        categories: performance,
        topCategories: this.rankCategories(performance, 'average').slice(0, 3),
        weakCategories: this.rankCategories(performance, 'average', true).slice(0, 3)
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get category performance');
      return { period: `${days} days`, categories: {}, topCategories: [], weakCategories: [] };
    }
  }

  /**
   * Get model usage statistics
   * @returns {Promise<object>} Model usage data
   */
  async getModelUsage() {
    try {
      const models = [
        'mixtral-8x7b-32768',
        'llama3-70b-8192',
        'llama3-8b-8192'
      ];

      const usage = {};
      let total = 0;

      for (const model of models) {
        const count = parseInt(await this.redis.get(`${this.namespace}reviews:model:${model}`) || '0');
        const cost = parseFloat(await this.redis.get(`${this.namespace}cost:model:${model}`) || '0');

        usage[model] = {
          count,
          cost: cost.toFixed(4),
          percentage: 0
        };
        total += count;
      }

      // Calculate percentages
      for (const model of models) {
        usage[model].percentage = total > 0
          ? ((usage[model].count / total) * 100).toFixed(2)
          : 0;
      }

      return {
        timestamp: new Date().toISOString(),
        totalReviews: total,
        byModel: usage
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get model usage');
      return { timestamp: new Date().toISOString(), totalReviews: 0, byModel: {} };
    }
  }

  /**
   * Get health check status
   * @returns {Promise<object>} Health data
   */
  async getHealthCheck() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const totalReviews = await this.redis.get(`${this.namespace}reviews:total`) || '0';
      const todayReviews = await this.redis.get(`${this.namespace}reviews:${today}`) || '0';
      const totalErrors = await this.redis.get(`${this.namespace}errors:total`) || '0';
      const todayErrors = await this.redis.get(`${this.namespace}errors:${today}`) || '0';
      const totalCost = await this.redis.get(`${this.namespace}cost:total`) || '0';
      const todayCost = await this.redis.get(`${this.namespace}cost:${today}`) || '0';
      const totalCacheHits = await this.redis.get(`${this.namespace}cache:hits:${today}`) || '0';

      const successRate = (parseInt(totalReviews) - parseInt(totalErrors)) / parseInt(totalReviews) * 100 || 0;

      return {
        status: 'operational',
        timestamp: new Date().toISOString(),
        today: {
          reviews: parseInt(todayReviews),
          errors: parseInt(todayErrors),
          cost: parseFloat(todayCost).toFixed(4),
          cacheHits: parseInt(totalCacheHits)
        },
        allTime: {
          reviews: parseInt(totalReviews),
          errors: parseInt(totalErrors),
          cost: parseFloat(totalCost).toFixed(4),
          successRate: parseFloat(successRate.toFixed(2))
        }
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get health check');
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Calculate trends summary
   * @private
   */
  calculateTrendsSummary(trends) {
    if (trends.length === 0) return {};

    const reviewCounts = trends.map(t => t.reviewCount);
    const costs = trends.map(t => parseFloat(t.totalCost));
    const durations = trends.map(t => parseInt(t.avgDuration));

    return {
      avgReviewsPerDay: (reviewCounts.reduce((a, b) => a + b, 0) / reviewCounts.length).toFixed(0),
      totalCost: costs.reduce((a, b) => a + b, 0).toFixed(4),
      avgDuration: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(0),
      maxReviewsDay: Math.max(...reviewCounts),
      minReviewsDay: Math.min(...reviewCounts)
    };
  }

  /**
   * Rank categories
   * @private
   */
  rankCategories(performance, metric, reverse = false) {
    const ranked = Object.entries(performance)
      .map(([name, data]) => ({
        name,
        score: data[metric]
      }))
      .sort((a, b) => reverse ? a.score - b.score : b.score - a.score);

    return ranked;
  }
}

module.exports = AnalyticsService;
