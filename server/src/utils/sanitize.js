/**
 * Sanitize code content before sending to LLM
 * Removes secrets, tokens, and sensitive data
 */

// Common secret patterns to detect and redact
const SECRET_PATTERNS = [
  // API Keys
  /api[_-]?key\s*[:=]\s*["']?([^"'\s]{10,})/gi,
  /apikey\s*[:=]\s*["']?([^"'\s]{10,})/gi,
  
  // Tokens
  /token\s*[:=]\s*["']?([^"'\s]{10,})/gi,
  /access[_-]?token\s*[:=]\s*["']?([^"'\s]{10,})/gi,
  /bearer\s+([a-zA-Z0-9\-_]{20,})/gi,
  
  // Passwords
  /password\s*[:=]\s*["']?([^"'\s]{6,})/gi,
  /passwd\s*[:=]\s*["']?([^"'\s]{6,})/gi,
  
  // Secrets
  /secret\s*[:=]\s*["']?([^"'\s]{10,})/gi,
  /secret[_-]?key\s*[:=]\s*["']?([^"'\s]{10,})/gi,
  
  // Private Keys
  /BEGIN\s+(RSA\s+)?PRIVATE\s+KEY[\s\S]*?END\s+(RSA\s+)?PRIVATE\s+KEY/gi,
  
  // AWS Keys
  /aws[_-]?access[_-]?key[_-]?id\s*[:=]\s*["']?([^"'\s]{10,})/gi,
  /aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*["']?([^"'\s]{20,})/gi,
  
  // Environment variables that might contain secrets
  /\.env/gi,
  /process\.env\.[A-Z_]+/g,
  
  // GitHub tokens
  /ghp_[a-zA-Z0-9]{36}/g,
  /github_pat_[a-zA-Z0-9_]{82}/g,
  
  // JWT tokens (long base64 strings)
  /eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
];

// Patterns to completely remove (entire lines)
const REMOVE_LINE_PATTERNS = [
  /^\s*\.env/gi,
  /^\s*#\s*secret/gi,
  /^\s*#\s*password/gi,
  /^\s*#\s*token/gi,
];

/**
 * Redact secrets in a string
 * @param {string} content - Content to sanitize
 * @returns {string} Sanitized content
 */
function sanitizeContent(content) {
  if (!content || typeof content !== 'string') {
    return content;
  }

  let sanitized = content;

  // Remove entire lines that contain sensitive patterns
  const lines = sanitized.split('\n');
  const filteredLines = lines.filter((line) => {
    return !REMOVE_LINE_PATTERNS.some((pattern) => pattern.test(line));
  });
  sanitized = filteredLines.join('\n');

  // Replace secret patterns with redacted placeholders
  SECRET_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, (match, captured) => {
      if (captured) {
        return match.replace(captured, '[REDACTED]');
      }
      return '[REDACTED]';
    });
  });

  // Remove .env file references and values
  sanitized = sanitized.replace(/\.env\s*[:=]\s*["']?[^"'\n]+/gi, '.env=[REDACTED]');

  return sanitized;
}

/**
 * Sanitize file content before sending to LLM
 * @param {Array} files - Array of file objects with filename and content
 * @returns {Array} Sanitized files
 */
function sanitizeFiles(files) {
  if (!Array.isArray(files)) {
    return files;
  }

  return files.map((file) => {
    if (file.content) {
      return {
        ...file,
        content: sanitizeContent(file.content),
      };
    }
    return file;
  });
}

/**
 * Sanitize diff/patch content
 * @param {string} diff - Diff content
 * @returns {string} Sanitized diff
 */
function sanitizeDiff(diff) {
  return sanitizeContent(diff);
}

module.exports = {
  sanitizeContent,
  sanitizeFiles,
  sanitizeDiff,
};

