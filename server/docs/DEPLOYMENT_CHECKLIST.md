# Deployment Readiness Checklist

Use this checklist before deploying DevHubs backend to production.

## Pre-Deployment

### Testing
- [ ] All unit tests passing (`npm test`)
- [ ] Test coverage ≥ 70% (`npm run test:coverage`)
- [ ] Integration tests passing
- [ ] Worker simulation tests passing
- [ ] Manual testing of critical flows completed

### Environment Variables
- [ ] All required environment variables set
- [ ] `JWT_SECRET` is strong and unique
- [ ] `GITHUB_WEBHOOK_SECRET` is configured
- [ ] `DATABASE_URL` is correct
- [ ] `REDIS_URL` is configured (if using Redis)
- [ ] `SENTRY_DSN` is set (for error tracking)
- [ ] `.env` file is NOT committed to git

### Security
- [ ] All protected routes use authentication middleware
- [ ] Role-based access control verified
- [ ] Input validation active on all routes
- [ ] Rate limiting configured and active
- [ ] Webhook signature validation working
- [ ] LLM secret sanitization active
- [ ] No secrets in code or logs

### Logging
- [ ] Structured logging (pino) implemented
- [ ] All console.log replaced with logger
- [ ] Error logging to Sentry configured
- [ ] Log levels appropriate for production

### Observability
- [ ] Health endpoint working (`/api/health`)
- [ ] Metrics endpoint working (`/api/metrics`)
- [ ] Queue dashboard accessible (`/admin/queues`)
- [ ] Sentry connected and receiving errors
- [ ] Prometheus scraping metrics (if using)

### Performance
- [ ] Heavy tasks use queues (not blocking API)
- [ ] Prisma queries optimized (using `select`)
- [ ] Pagination implemented on list endpoints
- [ ] Database indexes created
- [ ] Redis caching configured (if applicable)

### Workers
- [ ] Review worker handling failures gracefully
- [ ] Score worker handling failures gracefully
- [ ] Portfolio worker handling failures gracefully
- [ ] Notification worker handling failures gracefully
- [ ] Workers have retry logic
- [ ] Failed jobs are logged and monitored

## Deployment

### Database
- [ ] Database migrations run (`npm run migrate:deploy`)
- [ ] Database backup taken
- [ ] Database connection pool configured
- [ ] Database indexes created

### Infrastructure
- [ ] Server has sufficient resources (CPU, RAM)
- [ ] Redis/queue infrastructure ready
- [ ] Load balancer configured (if applicable)
- [ ] SSL/TLS certificates configured
- [ ] Domain and DNS configured

### Monitoring
- [ ] Uptime monitoring configured (UptimeRobot/BetterStack)
- [ ] Sentry alerts configured
- [ ] Prometheus/Grafana dashboards ready
- [ ] Log aggregation set up

### Rollback Plan
- [ ] Previous version tagged in git
- [ ] Database rollback script ready
- [ ] Environment variable rollback documented
- [ ] Rollback procedure tested

## Post-Deployment

### Verification
- [ ] Health check returns `200 OK`
- [ ] API endpoints responding correctly
- [ ] Workers processing jobs
- [ ] Queues processing normally
- [ ] No errors in Sentry
- [ ] Metrics being collected

### Monitoring
- [ ] Watch error rates for first hour
- [ ] Monitor queue backlog
- [ ] Check worker processing times
- [ ] Verify Sentry is receiving events
- [ ] Confirm uptime monitoring is working

## Staging Environment

Before production deployment:
- [ ] Staging environment tested
- [ ] All features work in staging
- [ ] Performance acceptable
- [ ] No critical bugs found

## Documentation

- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Deployment procedure documented
- [ ] Rollback procedure documented
- [ ] Monitoring setup documented

## Security Review

- [ ] Security audit completed
- [ ] Dependencies updated (no known vulnerabilities)
- [ ] Secrets management verified
- [ ] Access controls reviewed
- [ ] Rate limiting tested

## Final Checklist

- [ ] All tests passing
- [ ] All environment variables validated
- [ ] All security measures active
- [ ] Monitoring and alerting configured
- [ ] Rollback plan ready
- [ ] Team notified of deployment
- [ ] Deployment window scheduled

---

**Note**: This checklist should be reviewed and updated as the system evolves.

