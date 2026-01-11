const logger = require('../../utils/logger');

class ModelSelectorService {
  constructor() {
    // Available models and their characteristics
    this.models = {
      'mixtral-8x7b-32768': {
        name: 'Mixtral 8x7B',
        category: 'balanced',
        description: 'Balanced speed/quality tradeoff',
        inputTokensPerSecond: 50,
        inputPricing: 0.24 / 1_000_000,
        outputPricing: 0.24 / 1_000_000,
        costPerRequest: 0.0001,
        qualityScore: 0.8,
        speedScore: 0.8,
        bestFor: ['general reviews', 'balanced analysis'],
        maxTokens: 32768
      },
      'llama3-70b-8192': {
        name: 'Llama 3 70B',
        category: 'quality',
        description: 'Best quality, slower',
        inputTokensPerSecond: 20,
        inputPricing: 0.59 / 1_000_000,
        outputPricing: 0.79 / 1_000_000,
        costPerRequest: 0.00025,
        qualityScore: 0.95,
        speedScore: 0.5,
        bestFor: ['complex analysis', 'detailed reviews', 'enterprise'],
        maxTokens: 8192
      },
      'llama3-8b-8192': {
        name: 'Llama 3 8B',
        category: 'speed',
        description: 'Fastest, lower quality',
        inputTokensPerSecond: 80,
        inputPricing: 0.07 / 1_000_000,
        outputPricing: 0.1 / 1_000_000,
        costPerRequest: 0.00003,
        qualityScore: 0.6,
        speedScore: 0.95,
        bestFor: ['quick reviews', 'high volume', 'cost-sensitive'],
        maxTokens: 8192
      }
    };
  }

  /**
   * Select best model based on context
   * @param {object} options - Selection options
   * @param {string} options.strategy - 'balanced', 'quality', 'speed', or 'cost'
   * @param {number} options.estimatedTokens - Estimated prompt tokens
   * @param {number} options.budgetPerRequest - Max cost per request (USD)
   * @param {string} options.submissionType - Type of submission
   * @returns {object} Selected model with details
   */
  selectModel({
    strategy = 'balanced',
    estimatedTokens = 1000,
    budgetPerRequest = 0.001,
    submissionType = 'general'
  }) {
    logger.debug({ strategy, estimatedTokens, budgetPerRequest }, 'Selecting model');

    let selectedModelKey = 'mixtral-8x7b-32768'; // Default

    if (strategy === 'quality') {
      selectedModelKey = 'llama3-70b-8192';
    } else if (strategy === 'speed') {
      selectedModelKey = 'llama3-8b-8192';
    } else if (strategy === 'cost') {
      // Find cheapest model that fits budget
      for (const [key, model] of Object.entries(this.models)) {
        if (model.costPerRequest <= budgetPerRequest) {
          selectedModelKey = key;
          break;
        }
      }
    } else if (strategy === 'balanced') {
      // Default balanced selection
      selectedModelKey = 'mixtral-8x7b-32768';
    }

    // Check if model can handle the tokens
    const selected = this.models[selectedModelKey];
    if (estimatedTokens > selected.maxTokens) {
      logger.warn(
        { estimatedTokens, maxTokens: selected.maxTokens, selectedModel: selectedModelKey },
        'Estimated tokens exceed model limit - switching to larger model'
      );
      selectedModelKey = 'llama3-70b-8192';
    }

    const model = this.models[selectedModelKey];
    logger.info({ selectedModel: selectedModelKey, strategy }, 'Model selected');

    return {
      key: selectedModelKey,
      name: model.name,
      category: model.category,
      ...model
    };
  }

  /**
   * Get model info
   * @param {string} modelKey - Model key
   * @returns {object} Model information
   */
  getModelInfo(modelKey) {
    const model = this.models[modelKey];
    if (!model) {
      throw new Error(`Unknown model: ${modelKey}`);
    }

    return {
      key: modelKey,
      name: model.name,
      category: model.category,
      description: model.description,
      pricing: {
        inputPricing: model.inputPricing,
        outputPricing: model.outputPricing,
        costPerRequest: model.costPerRequest
      },
      performance: {
        qualityScore: model.qualityScore,
        speedScore: model.speedScore,
        maxTokens: model.maxTokens,
        tokensPerSecond: model.inputTokensPerSecond
      },
      bestFor: model.bestFor
    };
  }

  /**
   * List all available models
   * @returns {array} List of models
   */
  listModels() {
    return Object.entries(this.models).map(([key, model]) => ({
      key,
      name: model.name,
      category: model.category,
      description: model.description,
      costPerRequest: model.costPerRequest
    }));
  }

  /**
   * Get model recommendation based on constraints
   * @param {object} constraints - Selection constraints
   * @param {boolean} constraints.prioritizeQuality - Quality over cost/speed
   * @param {boolean} constraints.prioritizeSpeed - Speed over quality
   * @param {boolean} constraints.prioritizeCost - Cost over quality/speed
   * @returns {object} Recommended model
   */
  recommendModel({ prioritizeQuality, prioritizeSpeed, prioritizeCost }) {
    let strategy = 'balanced';

    if (prioritizeQuality) {
      strategy = 'quality';
    } else if (prioritizeSpeed) {
      strategy = 'speed';
    } else if (prioritizeCost) {
      strategy = 'cost';
    }

    return this.selectModel({ strategy });
  }

  /**
   * Compare models for a specific use case
   * @param {object} useCase - Use case definition
   * @param {number} useCase.estimatedTokens - Estimated tokens
   * @param {string} useCase.priority - 'quality', 'speed', or 'cost'
   * @returns {array} Ranked models
   */
  compareModels({ estimatedTokens = 1000, priority = 'balanced' }) {
    const comparison = [];

    for (const [key, model] of Object.entries(this.models)) {
      const score = this.calculateScore(model, priority);
      comparison.push({
        key,
        name: model.name,
        category: model.category,
        score: parseFloat(score.toFixed(2)),
        costPerRequest: model.costPerRequest,
        qualityScore: model.qualityScore,
        speedScore: model.speedScore,
        canHandle: estimatedTokens <= model.maxTokens
      });
    }

    // Sort by score (highest first)
    return comparison.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate score for a model based on priority
   * @private
   * @param {object} model - Model object
   * @param {string} priority - Priority type
   * @returns {number} Score (0-100)
   */
  calculateScore(model, priority) {
    switch (priority) {
      case 'quality':
        return model.qualityScore * 100;
      case 'speed':
        return model.speedScore * 100;
      case 'cost':
        // Lower cost = higher score
        return (1 - model.costPerRequest * 10000) * 100;
      default:
        // Balanced: average of quality, speed, and inverse of cost
        return ((model.qualityScore + model.speedScore) / 2) * 100;
    }
  }
}

module.exports = new ModelSelectorService();
