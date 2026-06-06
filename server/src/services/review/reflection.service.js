/**
 * Reflection Service (Phase 3)
 *
 * Two operations:
 *   1. generateQuestions(prDiff) — uses Groq to produce 3 targeted reflection questions
 *      from the actual PR diff. Questions are non-generic and cannot be answered by
 *      someone who copy-pasted the code.
 *
 *   2. crossCheckAnswers(prDiff, questions, answers) — uses Groq to score each answer
 *      for technical accuracy, specificity, and consistency with the actual code.
 *      A consistency flag (true = inconsistency detected) is the primary anti-cheating signal.
 */

const llamaService = require('./llama.service');
const { wrapUserContent } = require('../../utils/sanitize');
const logger = require('../../utils/logger');

const QUESTION_COUNT = 3;

/**
 * Generate reflection questions from a PR diff.
 * @param {Object} prMetadata - { title, description }
 * @param {Object} diffData   - { files: [{ filename, patch }] }
 * @returns {Promise<Array>} [{ id, text, targetArea }]
 */
async function generateQuestions(prMetadata, diffData) {
  // Build a compact diff summary for the prompt
  const diffSummary = (diffData.files || [])
    .slice(0, 3)
    .map((f) => {
      const addedLines = (f.patch || '')
        .split('\n')
        .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
        .slice(0, 30)
        .join('\n');
      return `File: ${f.filename}\n${addedLines}`;
    })
    .join('\n\n---\n\n');

  const prompt = `You are a senior engineer reviewing a developer's code submission for evidence-based verification.

Your task: Generate exactly ${QUESTION_COUNT} reflection questions about the PR below.

Rules:
- Each question must be SPECIFIC to this PR (not generic like "why did you choose this approach?")
- Questions must require understanding WHY a specific implementation decision was made
- Questions must be impossible to answer correctly without having written the code
- Reference actual code constructs, function names, or patterns visible in the diff
- Target areas: architecture, security, performance, debugging, trade-offs

PR Title: ${wrapUserContent(prMetadata.title || 'Untitled', 'PR_TITLE')}

PR Diff (sample):
${wrapUserContent(diffSummary.slice(0, 3000), 'PR_DIFF')}

Return ONLY valid JSON with this exact structure:
{
  "questions": [
    { "id": "q1", "text": "...", "targetArea": "architecture|security|performance|debugging|tradeoffs" },
    { "id": "q2", "text": "...", "targetArea": "..." },
    { "id": "q3", "text": "...", "targetArea": "..." }
  ]
}`;

  try {
    const response = await llamaService.callLlama(prompt);
    const content = response.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*"questions"[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in question generation response');

    const parsed = JSON.parse(jsonMatch[0]);
    const questions = (parsed.questions || [])
      .filter((q) => q.id && q.text && q.targetArea)
      .slice(0, QUESTION_COUNT);

    if (questions.length === 0) throw new Error('No valid questions generated');

    logger.info({ count: questions.length }, '[Reflection] Questions generated');
    return questions;
  } catch (err) {
    logger.warn({ error: err.message }, '[Reflection] Question generation failed — using fallback questions');
    // Fallback: generic but still require code knowledge
    return [
      { id: 'q1', text: 'Describe the main architectural decision you made in this PR and why you chose this approach over alternatives.', targetArea: 'architecture' },
      { id: 'q2', text: 'What is the most complex part of your implementation and what edge cases did you consider?', targetArea: 'debugging' },
      { id: 'q3', text: 'What security or performance trade-offs did you make and how would you improve them with more time?', targetArea: 'tradeoffs' },
    ];
  }
}

/**
 * Cross-check student answers against the actual PR diff.
 * Returns per-question scores and consistency flags.
 *
 * @param {Object} prDiff        - { files: [{ filename, patch }] }
 * @param {Array}  questions     - [{ id, text, targetArea }]
 * @param {Array}  answers       - [{ id, answer }]
 * @returns {Promise<Object>} { crossCheckScores, consistencyFlags, reflectionScore, reflectionSummary }
 */
async function crossCheckAnswers(prDiff, questions, answers) {
  if (!answers || answers.length === 0) {
    return {
      crossCheckScores: [],
      consistencyFlags: [],
      reflectionScore: null,
      reflectionSummary: 'No answers submitted',
    };
  }

  const diffSummary = (prDiff.files || [])
    .slice(0, 3)
    .map((f) => {
      const addedLines = (f.patch || '')
        .split('\n')
        .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
        .slice(0, 40)
        .join('\n');
      return `File: ${f.filename}\n${addedLines}`;
    })
    .join('\n\n---\n\n');

  // Build QA pairs for the prompt
  const qaPairs = questions.map((q) => {
    const answer = answers.find((a) => a.id === q.id);
    return `Q: ${q.text}\nA: ${wrapUserContent(answer?.answer || '(no answer)', 'ANSWER')}`;
  }).join('\n\n');

  const prompt = `You are a senior engineer evaluating whether a developer truly wrote the code in a PR.

PR Diff (sample):
${wrapUserContent(diffSummary.slice(0, 3000), 'PR_DIFF')}

Questions and developer answers:
${qaPairs}

For each answer (q1, q2, q3), score it on three dimensions:
1. Technical accuracy relative to the actual code (0-10)
2. Specificity — vague platitudes score low (0-10)
3. Consistency — does the answer CONTRADICT the actual code? (true/false)

A consistency flag of true means the developer's stated reasoning is incompatible with what the code actually does — a strong indicator they did not write it.

Return ONLY valid JSON:
{
  "scores": { "q1": 8, "q2": 6, "q3": 3 },
  "consistencyFlags": { "q1": false, "q2": false, "q3": true },
  "summary": "Brief 1-2 sentence summary of the reflection quality"
}`;

  try {
    const response = await llamaService.callLlama(prompt);
    const content = response.content || '';

    const jsonMatch = content.match(/\{[\s\S]*"scores"[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in cross-check response');

    const parsed = JSON.parse(jsonMatch[0]);
    const scores = parsed.scores || {};
    const flags = parsed.consistencyFlags || {};

    const crossCheckScores = questions.map((q) =>
      Math.max(0, Math.min(10, Number(scores[q.id]) || 5))
    );
    const consistencyFlags = questions.map((q) => Boolean(flags[q.id]));

    const reflectionScore = crossCheckScores.length > 0
      ? parseFloat((crossCheckScores.reduce((s, v) => s + v, 0) / crossCheckScores.length).toFixed(2))
      : null;

    logger.info({
      reflectionScore,
      anyInconsistency: consistencyFlags.some(Boolean),
    }, '[Reflection] Cross-check complete');

    return {
      crossCheckScores,
      consistencyFlags,
      reflectionScore,
      reflectionSummary: parsed.summary || 'Cross-check complete',
    };
  } catch (err) {
    logger.warn({ error: err.message }, '[Reflection] Cross-check failed');
    return {
      crossCheckScores: [],
      consistencyFlags: [],
      reflectionScore: null,
      reflectionSummary: 'Cross-check failed — answers not evaluated',
    };
  }
}

module.exports = { generateQuestions, crossCheckAnswers };
