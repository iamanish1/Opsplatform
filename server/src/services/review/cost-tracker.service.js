const logger = require('../../config/logger');

class CostTrackerService {
  constructor() {
    // Groq API pricing (as of 2024)
    this.modelPricing = {
      'mixtral-8x7b-32768': {
        name: 'Mixtral 8x7B (Balanced)',
        inputPricing: 0.24 / 1_000_000,      // $0.24 per 1M input tokens
        outputPricing: 0.24 / 1_000_000,     // $0.24 per 1M output tokens
        category: 'balanced'
      },
      'llama3-70b-8192': {
        name: 'Llama 3 70B (Quality)',
        inputPricing: 0.59 / 1_000_000,      // $0.59 per 1M input tokens
        outputPricing: 0.79 / 1_000_000,     // $0.79 per 1M output tokens
        category: 'quality'
      },
      'llama3-8b-8192': {
        name: 'Llama 3 8B (Speed)',
        inputPricing: 0.07 / 1_000_000,      // $0.07 per 1M input tokens
        outputPricing: 0.1 / 1_000_000,      // $0.1 per 1M output tokens
        category: 'speed'
      }
    };

    this.stats = {
      daily: {},
      monthly: {},
      totalCost: 0
    };
  }

  /**
   * Calculate cost for an API call
   * @param {string} model - Model name
   * @param {number} inputTokens - Number of input tokens
   * @param {number} outputTokens - Number of output tokens
   * @returns {number} Cost in USD
   */
  calculateCost(model, inputTokens, outputTokens) {
    const pricing = this.modelPricing[model];
    if (!pricing) {
      logger.warn({ model }, 'Unknown model in cost calculation');
      return 0;
    }

    const inputCost = inputTokens * pricing.inputPricing;
    const outputCost = outputTokens * pricing.outputPricing;
    return inputCost + outputCost;
  }

  /**
   * Track API usage
   * @param {object} options - Usage options
   * @param {string} options.model - Model used
   * @param {number} options.inputTokens - Input tokens
   * @param {number} options.outputTokens - Output tokens
   * @param {string} options.userId - User ID (optional)
   * @param {string} options.submissionId - Submission ID (optional)
   */
  trackUsage({
    model,
    inputTokens,
    outputTokens,
    userId = null,
    submissionId = null
  }) {
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const monthKey = now.toISOString().substring(0, 7);

    // Update daily stats
    if (!this.stats.daily[dateKey]) {
      this.stats.daily[dateKey] = {
        requests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        byModel: {}
      };
    }

    this.stats.daily[dateKey].requests += 1;
    this.stats.daily[dateKey].totalInputTokens += inputTokens;
    this.stats.daily[dateKey].totalOutputTokens += outputTokens;
    this.stats.daily[dateKey].totalCost += cost;

    // Track by model
    if (!this.stats.daily[dateKey].byModel[model]) {
      this.stats.daily[dateKey].byModel[model] = {
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0
      };
    }

    const modelStats = this.stats.daily[dateKey].byModel[model];
    modelStats.requests += 1;
    modelStats.inputTokens += inputTokens;
    modelStats.outputTokens += outputTokens;
    modelStats.cost += cost;

    // Update monthly stats
    if (!this.stats.monthly[monthKey]) {
      this.stats.monthly[monthKey] = {
        requests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        byModel: {}
      };
    }

    this.stats.monthly[monthKey].requests += 1;
    this.stats.monthly[monthKey].totalInputTokens += inputTokens;
    this.stats.monthly[monthKey].totalOutputTokens += outputTokens;
    this.stats.monthly[monthKey].totalCost += cost;

    // Track by model at monthly level
    if (!this.stats.monthly[monthKey].byModel[model]) {
      this.stats.monthly[monthKey].byModel[model] = {
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0
      };
    }

    const monthlyModelStats = this.stats.monthly[monthKey].byModel[model];
    monthlyModelStats.requests += 1;
    monthlyModelStats.inputTokens += inputTokens;
    monthlyModelStats.outputTokens += outputTokens;
    monthlyModelStats.cost += cost;

    // Update total
    this.stats.totalCost += cost;

    logger.debug({
      model,
      cost: cost.toFixed(6),
      inputTokens,
      outputTokens,
      userId,
      submissionId
    }, 'Tracked API usage');

    return cost;
  }

  /**
   * Get usage statistics
   * @param {string} period - 'daily', 'monthly', or specific date/month
   * @returns {object} Usage statistics
   */
  getUsageStats(period = 'daily') {
    if (period === 'daily') {
      return this.stats.daily;
    } else if (period === 'monthly') {
      return this.stats.monthly;
    } else {
      // Return specific date/month
      return this.stats.daily[period] || this.stats.monthly[period] || null;
    }
  }

  /**
   * Check if budget is exceeded
   * @param {number} budgetUSD - Monthly budget in USD
   * @returns {object} Budget status
   */
  checkBudgetStatus(budgetUSD = 100) {
    const monthKey = new Date().toISOString().substring(0, 7);
    const monthlyStats = this.stats.monthly[monthKey] || { totalCost: 0 };
    const spent = monthlyStats.totalCost;
    const percentage = (spent / budgetUSD) * 100;
    const remaining = budgetUSD - spent;

    const status = {
      budget: budgetUSD,
      spent: parseFloat(spent.toFixed(4)),
      remaining: parseFloat(remaining.toFixed(4)),
      percentageUsed: parseFloat(percentage.toFixed(2)),
      month: monthKey,
      isWarning: percentage >= 80,
      isExceeded: percentage >= 100,
      daysRemaining: this.getDaysRemainingInMonth()
    };

    if (status.isExceeded) {
      logger.warn(status, 'Budget exceeded!');
    } else if (status.isWarning) {
      logger.warn(status, 'Budget warning - 80% used');
    }

    return status;
  }

  /**
   * Get all statistics
   * @returns {object} All stats
   */
  getAllStats() {
    return {
      daily: this.stats.daily,
      monthly: this.stats.monthly,
      totalCost: parseFloat(this.stats.totalCost.toFixed(4)),
      models: this.modelPricing
    };
  }

  /**
   * Get cost breakdown by model
   * @param {string} period - 'daily' or 'monthly'
   * @param {string} dateKey - Specific date or month
   * @returns {object} Cost breakdown
   */
  getCostBreakdown(period = 'monthly', dateKey = null) {
    const target = dateKey || this.getCurrentPeriodKey(period);
    const stats = period === 'monthly' ? this.stats.monthly[target] : this.stats.daily[target];

    if (!stats) {
      return { period, target, breakdown: {} };
    }

    const breakdown = {};
    for (const [model, data] of Object.entries(stats.byModel)) {
      breakdown[model] = {
        name: this.modelPricing[model]?.name || model,
        requests: data.requests,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        cost: parseFloat(data.cost.toFixed(6)),
        percentageOfTotal: parseFloat(((data.cost / stats.totalCost) * 100).toFixed(2))
      };
    }

    return {
      period,
      target,
      totalCost: parseFloat(stats.totalCost.toFixed(4)),
      breakdown
    };
  }

  /**
   * Get current period key
   * @param {string} period - 'daily' or 'monthly'
   * @returns {string} Current period key
   */
  getCurrentPeriodKey(period = 'monthly') {
    const now = new Date();
    if (period === 'daily') {
      return now.toISOString().split('T')[0];
    } else {
      return now.toISOString().substring(0, 7);
    }
  }

  /**
   * Get days remaining in month
   * @returns {number} Days remaining
   */
  getDaysRemainingInMonth() {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate() - now.getDate();
  }

  /**
   * Reset statistics (for testing)
   */
  resetStats() {
    this.stats = {
      daily: {},
      monthly: {},
      totalCost: 0
    };
  }
}

// Export as singleton
module.exports = new CostTrackerService();
