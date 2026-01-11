const logger = require('../../utils/logger');

class PromptOptimizerService {
  constructor() {
    // Token estimation: 1 token ≈ 4 characters
    this.tokensPerCharacter = 0.25;
    this.tokenBudgets = {
      'mixtral-8x7b-32768': {
        maxTokens: 32768,
        inputLimit: 30000,
        outputLimit: 2768,
        recommendedUsage: 0.8 // 80% of input limit
      },
      'llama3-70b-8192': {
        maxTokens: 8192,
        inputLimit: 7000,
        outputLimit: 1192,
        recommendedUsage: 0.8
      },
      'llama3-8b-8192': {
        maxTokens: 8192,
        inputLimit: 7000,
        outputLimit: 1192,
        recommendedUsage: 0.8
      }
    };
  }

  /**
   * Estimate tokens in text
   * @param {string} text - Text to estimate
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    if (!text) return 0;
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length * this.tokensPerCharacter);
  }

  /**
   * Get token budget for a model
   * @param {string} model - Model name
   * @returns {object} Token budget info
   */
  getTokenBudget(model) {
    const budget = this.tokenBudgets[model];
    if (!budget) {
      logger.warn({ model }, 'Unknown model in token budget');
      return this.tokenBudgets['mixtral-8x7b-32768']; // Default
    }
    return budget;
  }

  /**
   * Analyze prompt structure and token usage
   * @param {object} prompt - Prompt components
   * @param {string} prompt.systemPrompt - System instructions
   * @param {string} prompt.prMetadata - PR metadata
   * @param {string} prompt.diff - Code diff
   * @param {string} prompt.staticReport - Static analysis
   * @param {string} prompt.ciReport - CI/CD logs
   * @param {string} model - Model name
   * @returns {object} Analysis results
   */
  analyzePrompt({ systemPrompt, prMetadata, diff, staticReport, ciReport }, model) {
    const budget = this.getTokenBudget(model);

    const components = {
      systemPrompt: this.estimateTokens(systemPrompt),
      prMetadata: this.estimateTokens(prMetadata),
      diff: this.estimateTokens(diff),
      staticReport: this.estimateTokens(staticReport),
      ciReport: this.estimateTokens(ciReport)
    };

    const totalTokens = Object.values(components).reduce((a, b) => a + b, 0);
    const budgetLimit = budget.inputLimit;
    const isWithinBudget = totalTokens <= budgetLimit;
    const utilizationPercent = (totalTokens / budgetLimit) * 100;

    return {
      model,
      components,
      totalTokens,
      budgetLimit,
      isWithinBudget,
      utilizationPercent: parseFloat(utilizationPercent.toFixed(2)),
      recommendation: this.getRecommendation(utilizationPercent)
    };
  }

  /**
   * Get optimization recommendation
   * @private
   * @param {number} utilizationPercent - Utilization percentage
   * @returns {string} Recommendation
   */
  getRecommendation(utilizationPercent) {
    if (utilizationPercent > 100) {
      return 'CRITICAL: Prompt exceeds token limit. Immediate optimization needed.';
    } else if (utilizationPercent > 90) {
      return 'WARNING: Prompt uses 90%+ of token budget. Consider optimization.';
    } else if (utilizationPercent > 80) {
      return 'CAUTION: Prompt uses 80%+ of token budget. Optimization recommended.';
    } else if (utilizationPercent > 60) {
      return 'OK: Prompt has comfortable token budget.';
    } else {
      return 'GOOD: Prompt has plenty of token budget available.';
    }
  }

  /**
   * Optimize prompt length while preserving key information
   * @param {object} prompt - Prompt components
   * @param {string} model - Model name
   * @param {boolean} aggressive - Use aggressive compression
   * @returns {object} Optimized prompt
   */
  optimizeLength({ systemPrompt, prMetadata, diff, staticReport, ciReport }, model, aggressive = false) {
    const budget = this.getTokenBudget(model);
    const budgetLimit = budget.inputLimit;

    let components = {
      systemPrompt: systemPrompt || '',
      prMetadata: prMetadata || '',
      diff: diff || '',
      staticReport: staticReport || '',
      ciReport: ciReport || ''
    };

    // Calculate current usage
    const currentTokens = Object.values(components).reduce((sum, text) => {
      return sum + this.estimateTokens(text);
    }, 0);

    if (currentTokens <= budgetLimit) {
      logger.debug({ currentTokens, budgetLimit }, 'Prompt within budget, no optimization needed');
      return {
        optimized: false,
        originalTokens: currentTokens,
        optimizedTokens: currentTokens,
        components
      };
    }

    logger.info({ currentTokens, budgetLimit, excess: currentTokens - budgetLimit }, 'Optimizing prompt');

    // Preserve system prompt (required)
    const preservedTokens = this.estimateTokens(components.systemPrompt);
    let availableTokens = budgetLimit - preservedTokens;

    // Prioritize: metadata > static report > CI report > diff
    const ratios = {
      prMetadata: 0.2,      // 20% of budget
      staticReport: 0.3,    // 30% of budget
      ciReport: 0.2,        // 20% of budget
      diff: 0.3             // 30% of budget
    };

    // Allocate tokens proportionally
    for (const [key, ratio] of Object.entries(ratios)) {
      const allocation = Math.floor(availableTokens * ratio);
      const text = components[key];
      const textTokens = this.estimateTokens(text);

      if (textTokens > allocation) {
        // Truncate to allocation
        const maxChars = Math.floor(allocation / this.tokensPerCharacter);
        components[key] = text.substring(0, maxChars) + '...[truncated]';
      }
    }

    const optimizedTokens = Object.values(components).reduce((sum, text) => {
      return sum + this.estimateTokens(text);
    }, 0);

    return {
      optimized: true,
      originalTokens: currentTokens,
      optimizedTokens: optimizedTokens,
      reduction: currentTokens - optimizedTokens,
      components
    };
  }

  /**
   * Compress text while preserving key information
   * @param {string} text - Text to compress
   * @param {number} targetTokens - Target token count
   * @returns {string} Compressed text
   */
  compress(text, targetTokens) {
    if (!text) return '';

    const currentTokens = this.estimateTokens(text);
    if (currentTokens <= targetTokens) {
      return text;
    }

    // Calculate max characters
    const maxChars = Math.floor(targetTokens / this.tokensPerCharacter);
    return text.substring(0, maxChars) + '\n[truncated...]';
  }

  /**
   * Recommend optimal model and budget for prompt
   * @param {object} promptComponents - Prompt components
   * @returns {object} Budget recommendation
   */
  recommendBudget(promptComponents) {
    const totalTokens = Object.values(promptComponents).reduce((sum, text) => {
      return sum + this.estimateTokens(text);
    }, 0);

    const recommendations = [];

    // Check each model
    const models = ['llama3-8b-8192', 'mixtral-8x7b-32768', 'llama3-70b-8192'];

    for (const model of models) {
      const budget = this.getTokenBudget(model);
      const fits = totalTokens <= budget.inputLimit;
      recommendations.push({
        model,
        fits,
        budget: budget.inputLimit,
        utilizationPercent: fits
          ? (totalTokens / budget.inputLimit) * 100
          : ((totalTokens / budget.inputLimit) * 100)
      });
    }

    const fitting = recommendations.filter(r => r.fits);
    let recommendedModel = fitting.length > 0 ? fitting[0] : recommendations[recommendations.length - 1];

    return {
      totalTokens,
      recommendedModel: recommendedModel.model,
      recommendations: recommendations.sort((a, b) => a.budget - b.budget)
    };
  }
}

module.exports = new PromptOptimizerService();
