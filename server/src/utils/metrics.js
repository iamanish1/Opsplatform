const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// HTTP Request Metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestErrors = new client.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'status_code'],
});

// Queue Metrics
const queueJobsQueued = new client.Gauge({
  name: 'queue_jobs_queued',
  help: 'Number of jobs currently queued',
  labelNames: ['queue_name'],
});

const queueJobsCompleted = new client.Counter({
  name: 'queue_jobs_completed_total',
  help: 'Total number of completed jobs',
  labelNames: ['queue_name'],
});

const queueJobsFailed = new client.Counter({
  name: 'queue_jobs_failed_total',
  help: 'Total number of failed jobs',
  labelNames: ['queue_name'],
});

const queueJobDuration = new client.Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Duration of queue job processing in seconds',
  labelNames: ['queue_name', 'job_type'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

// Worker Metrics
const workerJobProcessingTime = new client.Histogram({
  name: 'worker_job_processing_time_seconds',
  help: 'Time taken to process a worker job',
  labelNames: ['worker_name', 'job_type'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

const llmLatency = new client.Histogram({
  name: 'llm_latency_seconds',
  help: 'LLM API call latency in seconds',
  labelNames: ['model'],
  buckets: [1, 5, 10, 30, 60],
});

const githubApiCalls = new client.Counter({
  name: 'github_api_calls_total',
  help: 'Total number of GitHub API calls',
  labelNames: ['endpoint', 'status'],
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestErrors);
register.registerMetric(queueJobsQueued);
register.registerMetric(queueJobsCompleted);
register.registerMetric(queueJobsFailed);
register.registerMetric(queueJobDuration);
register.registerMetric(workerJobProcessingTime);
register.registerMetric(llmLatency);
register.registerMetric(githubApiCalls);

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  httpRequestErrors,
  queueJobsQueued,
  queueJobsCompleted,
  queueJobsFailed,
  queueJobDuration,
  workerJobProcessingTime,
  llmLatency,
  githubApiCalls,
};

