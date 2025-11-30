# Monitoring & Observability Guide

This document describes how to set up monitoring and observability for the DevHubs backend.

## Health Checks

### Endpoint
- **GET** `/api/health`

### Response
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

### Status Codes
- `200` - All systems healthy
- `503` - Degraded (database down)

## Prometheus Metrics

### Endpoint
- **GET** `/api/metrics`

### Available Metrics

#### HTTP Metrics
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_total` - Total request count
- `http_request_errors_total` - Error count

#### Queue Metrics
- `queue_jobs_queued` - Current queued jobs
- `queue_jobs_completed_total` - Completed jobs
- `queue_jobs_failed_total` - Failed jobs
- `queue_job_duration_seconds` - Job processing time

#### Worker Metrics
- `worker_job_processing_time_seconds` - Worker processing time
- `llm_latency_seconds` - LLM API latency
- `github_api_calls_total` - GitHub API call count

### Setup Prometheus

1. Add to `prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'devhubs-backend'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:4000']
```

2. Access metrics at: `http://localhost:4000/api/metrics`

## Sentry Error Tracking

### Setup

1. Create a Sentry project at https://sentry.io
2. Get your DSN
3. Set environment variables:
   - `SENTRY_DSN` - Your Sentry DSN
   - `SENTRY_ENVIRONMENT` - Environment (development/staging/production)
   - `SENTRY_RELEASE` - Optional release version

### Alerts

Configure alerts in Sentry dashboard for:
- Error rate > 10 errors/minute
- Worker crashes
- Queue failures

## Queue Dashboard (BullBoard)

### Access
- **URL**: `/admin/queues`
- **Auth**: Requires ADMIN role (JWT token)

### Features
- View all queues: reviewQueue, scoreQueue, portfolioQueue, notificationQueue
- Monitor job status: pending, active, completed, failed
- Retry failed jobs
- View job details and payloads

## Uptime Monitoring

### Recommended Services
- **UptimeRobot**: https://uptimerobot.com
- **BetterStack**: https://betterstack.com

### Endpoints to Monitor

1. **API Health**
   - URL: `https://your-domain.com/api/health`
   - Expected: `200 OK`
   - Interval: 5 minutes

2. **Worker Health** (if exposed)
   - Monitor worker process uptime
   - Check queue processing

### Alert Configuration

Set up alerts for:
- Health check failures
- Response time > 5 seconds
- Error rate spikes
- Queue backlog > 100 jobs

## Logging

### Structured Logs (Pino)

All logs are structured JSON format:
```json
{
  "level": "info",
  "time": "2024-01-01T00:00:00.000Z",
  "msg": "User signed up",
  "userId": "user123"
}
```

### Log Levels
- `debug` - Development only
- `info` - General information
- `warn` - Warnings
- `error` - Errors

### Log Aggregation

For production, consider:
- **Datadog**: https://datadoghq.com
- **Logtail**: https://logtail.com
- **Elasticsearch + Kibana**

## Grafana Dashboards

### Recommended Dashboards

1. **API Performance**
   - Request rate
   - Latency (p50, p95, p99)
   - Error rate

2. **Queue Health**
   - Jobs queued
   - Processing time
   - Failure rate

3. **Worker Performance**
   - Job throughput
   - LLM latency
   - GitHub API calls

### Example Queries

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_request_errors_total[5m])

# Queue backlog
queue_jobs_queued

# Average job duration
histogram_quantile(0.95, queue_job_duration_seconds_bucket)
```

## Best Practices

1. **Set up alerts** for critical metrics
2. **Monitor queue backlog** - if > 100, scale workers
3. **Track LLM latency** - if > 30s, investigate
4. **Watch error rates** - investigate spikes immediately
5. **Review Sentry** daily for new error patterns

