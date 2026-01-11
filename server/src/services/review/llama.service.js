/**
 * Groq Service for Review Worker
 * Integrates with Groq API to call open-source LLM models
 * Groq provides free tier: 10k requests/month + fastest inference
 */

const axios = require('axios');
const CacheService = require('./cache.service');
const costTrackerService = require('./cost-tracker.service');
const logger = require('../../utils/logger');

// Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const LLM_TIMEOUT = parseInt(process.env.LLM_TIMEOUT || '30000', 10);
const MAX_RETRIES = parseInt(process.env.LLM_MAX_RETRIES || '3', 10);
const USE_CACHE = process.env.USE_REVIEW_CACHE !== 'false'; // Default: enabled

// Initialize cache service
const cacheService = new CacheService();

// Rate limiting state
const rateLimitState = {
  remainingRequests: null,
  resetAt: null,
  totalRequests: 0,
};

// Validate configuration on module load
if (!GROQ_API_KEY) {
  logger.error('GROQ_API_KEY environment variable is not set');
  logger.error('Get free API key from: https://console.groq.com');
  logger.error('Add to .env: GROQ_API_KEY=your_key_here');
}

/**
 * Call Groq API with OpenAI-compatible interface
 * @param {string} prompt - Prompt to send to LLM
 * @returns {Promise<{content: string, usage: object, model: string}>} LLM response with metadata
 */
async function callLlama(prompt) {
  if (!GROQ_API_KEY) {
    throw new Error(
      'GROQ_API_KEY not configured. Get free key from https://console.groq.com'
    );
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000,
      },
      {
        timeout: LLM_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Update rate limit state
    const headers = response.headers;
    if (headers['x-ratelimit-remaining-requests']) {
      rateLimitState.remainingRequests = parseInt(
        headers['x-ratelimit-remaining-requests'],
        10
      );
      rateLimitState.resetAt = headers['x-ratelimit-reset'];
      rateLimitState.totalRequests++;

      if (rateLimitState.remainingRequests <= 100) {
        logger.warn({
          remainingRequests: rateLimitState.remainingRequests,
          resetAt: rateLimitState.resetAt
        }, 'Groq rate limit warning');
      }
    }

    // Extract content and usage data
    const content = response.data.choices?.[0]?.message?.content;
    const usage = response.data.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };

    if (!content) {
      throw new Error('Invalid response format from Groq API');
    }

    // Track cost
    const cost = costTrackerService.trackUsage({
      model: GROQ_MODEL,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0
    });

    logger.debug({
      model: GROQ_MODEL,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      cost: cost.toFixed(6)
    }, 'LLM API call completed');

    return {
      content,
      usage,
      model: GROQ_MODEL,
      cost
    };
  } catch (error) {
    // Handle specific Groq errors
    if (error.response?.status === 401) {
      throw new Error(
        'Invalid Groq API key. Get free key from https://console.groq.com'
      );
    }

    if (error.response?.status === 429) {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      throw new Error(
        `Rate limited by Groq. Reset at: ${resetTime}. Upgrade plan at: https://console.groq.com`
      );
    }

    if (error.response?.status === 400) {
      const detail = error.response.data?.error?.message || 'Bad request';
      throw new Error(`Groq API error: ${detail}`);
    }

    if (error.code === 'ETIMEDOUT') {
      throw new Error(`LLM request timed out after ${LLM_TIMEOUT}ms`);
    }

    if (error.code === 'ENOTFOUND') {
      throw new Error('Network error: Cannot reach Groq API. Check internet connection.');
    }

    throw new Error(`Failed to call Groq API: ${error.message}`);
  }
}

/**
 * Parse LLM response to extract JSON
 * @param {string} response - Raw LLM response
 * @returns {Object} Parsed JSON object
 */
function parseLLMResponse(response) {
  if (!response) {
    throw new Error('Empty LLM response');
  }

  // Try to extract JSON from response (may have markdown code blocks)
  let jsonString = response.trim();

  // Remove markdown code blocks if present
  jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  // Try to find JSON object
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonString = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonString);

    // Validate required fields
    const requiredFields = [
      'codeQuality',
      'problemSolving',
      'bugRisk',
      'devopsExecution',
      'optimization',
      'documentation',
      'gitMaturity',
      'collaboration',
      'deliverySpeed',
      'security',
    ];

    for (const field of requiredFields) {
      if (typeof parsed[field] !== 'number' || parsed[field] < 0 || parsed[field] > 10) {
        throw new Error(`Invalid ${field} score: ${parsed[field]}`);
      }
    }

    // Ensure summary and suggestions exist
    if (!parsed.summary) {
      parsed.summary = 'No summary provided.';
    }
    if (!Array.isArray(parsed.suggestions)) {
      parsed.suggestions = [];
    }

    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse LLM JSON response: ${error.message}. Response: ${response.substring(0, 200)}`);
  }
}

/**
 * Generate review using Groq LLM with caching
 * @param {string} prompt - Complete prompt for LLM
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<Object>} Parsed LLM response
 */
async function generateReview(prompt, maxRetries = MAX_RETRIES) {
  let lastError = null;

  // Check cache first if enabled
  if (USE_CACHE) {
    const cachedResponse = await cacheService.getReview(prompt);
    if (cachedResponse) {
      logger.info('Using cached LLM response');
      return cachedResponse;
    }
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info({ attempt, maxRetries }, 'Calling Groq LLM');
      const response = await callLlama(prompt);
      logger.info('Received response, parsing JSON');
      const parsed = parseLLMResponse(response.content);
      logger.info('Successfully parsed LLM response');

      // Cache the successful response
      if (USE_CACHE) {
        await cacheService.setReview(prompt, parsed);
      }

      return parsed;
    } catch (error) {
      lastError = error;
      logger.warn({ attempt, error: error.message }, 'LLM attempt failed');

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.info({ delay }, 'Retrying LLM call');
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed - return default scores
  logger.error(
    { attempts: maxRetries, error: lastError?.message },
    'All LLM attempts failed. Using fallback scores.'
  );

  return {
    codeQuality: 5,
    problemSolving: 5,
    bugRisk: 5,
    devopsExecution: 5,
    optimization: 5,
    documentation: 5,
    gitMaturity: 5,
    collaboration: 5,
    deliverySpeed: 5,
    security: 5,
    summary: 'AI review unavailable. Please ensure Groq API is accessible.',
    suggestions: ['Check GROQ_API_KEY configuration', 'Verify network connectivity', 'Check Groq API status'],
    fallback: true,
  };
}

module.exports = {
  callLlama,
  parseLLMResponse,
  generateReview,
};

