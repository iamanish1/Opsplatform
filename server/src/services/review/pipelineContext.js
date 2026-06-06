/**
 * PipelineContext — accumulates all evidence as the review pipeline progresses.
 * Passed through every step of processPRReview so each stage can read prior
 * results and append its own findings without coupling steps together.
 */
class PipelineContext {
  constructor(submission) {
    this.submission = submission;

    // GitHub
    this.github = {
      octokit: null,
      repoFullName: null,
      prNumber: null,
      installationId: null,
    };

    // PR data
    this.pr = {
      metadata: null, // title, description, author, additions, deletions, changedFiles
      diff: null,     // { files, totalFiles, totalAdditions, totalDeletions }
    };

    // Static analysis
    this.staticAnalysis = {
      eslintErrors: 0,
      eslintWarnings: 0,
      eslintIssues: [],
      dockerIssues: [],
      dockerIssueCount: 0,
      yamlIssues: [],
      yamlIssueCount: 0,
      securityAlerts: [],
      securityAlertCount: 0,
      fileCount: 0,
      prSize: 0,
      gitScore: 10,
      gitIssues: [],
      // Extended (Phase 1)
      criticalVulns: 0,
      highVulns: 0,
      mediumVulns: 0,
      coveragePercent: null,
      coverageFound: false,
      averageComplexity: null,
      maxComplexity: null,
      complexFunctions: [],
      dependencyAuditAvailable: false,
    };

    // CI/CD
    this.ci = null; // { ciStatus, workflowCount, testResults, failures }

    // Execution evidence (from VPS3 Docker eval — Phase 1)
    this.execution = {
      dispatched: false,
      timedOut: false,
      evalError: null,
      dockerBuildSuccess: null,
      dockerBuildDurationMs: null,
      dockerBuildLog: null,
      containerExitCode: null,
      hiddenTestPassRate: null,
      hiddenTestTotal: null,
      hiddenTestPassed: null,
      hiddenTestFailed: null,
      hiddenTestCategories: null,
      testOutput: null,
    };

    // Reflection (Phase 3)
    this.reflection = {
      questionsGenerated: false,
      questions: [],          // [{ id, text, targetArea }]
      answersReceived: false,
      answers: [],            // [{ id, answer }]
      crossCheckScores: [],   // [0-10]
      consistencyFlags: [],   // [boolean] — true = inconsistency detected
      reflectionScore: null,  // avg of crossCheckScores
      reflectionSummary: null,
    };

    // LLM narrative (qualitative, not primary score driver)
    this.llmNarrative = {
      raw: null,          // raw parsed LLM JSON
      summary: null,
      suggestions: [],
      scores: null,       // { codeQuality, problemSolving, ... } — LLM opinion
      fallback: false,    // true if LLM failed and defaults were used
    };

    // Final scores
    this.scores = {
      deterministic: null,  // { codeQuality, ... } — rule-based
      llmFused: null,       // after fusion weights
      final: null,          // after evidence gates
      totalScore: 0,
      badge: 'RED',
      appliedRules: [],
      gateResults: [],      // { gate, passed, reason }
      verificationTier: 'NOT_VERIFIED',
    };

    // Competency (Phase 4)
    this.competency = {
      level: null,          // 1-5
      domain: null,         // "backend"|"frontend"|"fullstack"|"devops"
      breakdown: null,      // { problemSolving: 3, security: 4, ... }
    };

    // Evidence items for report (human-readable strings)
    this.evidence = [];

    // Non-fatal errors that occurred during the pipeline
    this.errors = [];

    // Per-step timing for observability
    this.timing = {};
  }

  /**
   * Record a non-fatal error (pipeline continues, error surfaced in report)
   */
  recordError(step, error) {
    this.errors.push({ step, message: error.message || String(error), at: new Date().toISOString() });
  }

  /**
   * Record timing for a step
   */
  startTimer(step) {
    this.timing[step] = { start: Date.now() };
  }

  endTimer(step) {
    if (this.timing[step]) {
      this.timing[step].durationMs = Date.now() - this.timing[step].start;
    }
  }

  /**
   * Push a human-readable evidence string
   */
  addEvidence(text) {
    this.evidence.push(text);
  }

  /**
   * Returns true if Docker execution evidence is available
   */
  hasExecutionEvidence() {
    return this.execution.dockerBuildSuccess !== null;
  }

  /**
   * Returns true if hidden test results are available
   */
  hasHiddenTestResults() {
    return this.execution.hiddenTestPassRate !== null;
  }
}

module.exports = PipelineContext;
