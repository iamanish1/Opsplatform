/**
 * Llama Service for Review Worker
 * Integrates with Ollama API to call Llama 3 model
 */

const axios = require('axios');
const config = require('../../config');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';
const LLM_TIMEOUT = parseInt(process.env.LLM_TIMEOUT || '30000', 10);

/**
 * Call Ollama API
 * @param {string} prompt - Prompt to send to LLM
 * @returns {Promise<string>} LLM response
 */
async function callLlama(prompt) {
  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      },
      {
        timeout: LLM_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Ollama returns response in response.data.response
    return response.data.response || '';
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Ollama is not running. Please start Ollama and ensure it's accessible at ${OLLAMA_URL}`);
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error(`LLM request timed out after ${LLM_TIMEOUT}ms`);
    }
    throw new Error(`Failed to call Ollama: ${error.message}`);
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
 * Generate review using Llama 3
 * @param {string} prompt - Complete prompt for LLM
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<Object>} Parsed LLM response
 */
async function generateReview(prompt, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Llama Service] Calling Ollama (attempt ${attempt}/${maxRetries})...`);
      const response = await callLlama(prompt);
      console.log(`[Llama Service] Received response, parsing JSON...`);
      const parsed = parseLLMResponse(response);
      console.log(`[Llama Service] Successfully parsed LLM response`);
      return parsed;
    } catch (error) {
      lastError = error;
      console.warn(`[Llama Service] Attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[Llama Service] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed - return default scores
  console.error(`[Llama Service] All ${maxRetries} attempts failed. Using fallback scores.`);
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
    summary: 'AI review unavailable. Please ensure Ollama is running and llama3 model is installed.',
    suggestions: ['Install Ollama: https://ollama.com', 'Pull llama3 model: ollama pull llama3'],
    fallback: true,
  };
}

module.exports = {
  callLlama,
  parseLLMResponse,
  generateReview,
};

