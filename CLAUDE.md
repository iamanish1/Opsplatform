# DevHubs — CLAUDE.md

> Context file for AI-assisted development. Read this before touching any code.

---

## What DevHubs Is

**DevHubs is a proof-of-work verification platform for developers.**

Students build industry-inspired projects locally, submit GitHub repositories, and receive evidence-based **Verification Reports**. Recruiters use those reports to evaluate whether a candidate can actually build real software.

**DevHubs is NOT:** an EdTech course platform, a job board, a social network, or a DSA platform.

**The core flow:**
```
Project → Submission → Evaluation → Verification Report
```

Everything in the codebase should serve this flow.

---

## Repository Layout

```
Opsplatform/
├── client/          React 19 + Vite frontend
├── server/          Express 5 + Prisma backend
├── .github/
│   └── workflows/
│       ├── ci.yml       CI: lint + test + build + secrets scan
│       └── deploy.yml   VPS deploy via SSH + pm2 + Nginx
└── CLAUDE.md        ← you are here
```

---

## Tech Stack

### Frontend (`client/`)
| Concern | Tool |
|---|---|
| Framework | React 19 |
| Build | Vite 7 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion 12 |
| Icons | Lucide React |
| Auth state | React Context (`AuthContext`) |
| Server data | Custom fetch hooks in `src/services/` |
| **No Redux, no Zustand, no React Query** | |

### Backend (`server/`)
| Concern | Tool |
|---|---|
| Framework | Express 5 |
| ORM | Prisma 6 (MySQL) |
| Queue | BullMQ 5 + Redis |
| Auth | JWT (jsonwebtoken) + bcrypt |
| GitHub | Octokit REST + GitHub App |
| Email | Resend |
| Logging | Pino |
| Monitoring | Sentry + Prometheus (`prom-client`) |
| Validation | express-validator |
| Security | Helmet + CORS allowlist + rate limiting |

### Infrastructure
- **VPS deployment** (not Kubernetes, not cloud-managed)
- Docker Compose for local dev
- PM2 for process management in production
- Nginx as reverse proxy
- MySQL on VPS-2, Redis on VPS-2

---

## Backend Architecture

### Layer Order (strict — do not skip layers)
```
Express Route
  → Controller        (request/response only, no business logic)
  → Service           (business logic)
  → Repository        (Prisma queries only)
  → Prisma Client     (singleton at src/prisma/client.js)
```

### Key Directories
```
server/src/
├── routes/           One file per resource, wired in routes/index.js
├── controllers/      Thin handlers — call service, return response
├── services/         Business logic
│   └── review/       Specialized AI review sub-services (DO NOT MODIFY)
├── repositories/     Prisma queries — one file per model
├── middlewares/      auth, role, rateLimit, validate, audit, error
├── queues/           BullMQ queue definitions (review, score, portfolio, notification, dead-letter)
├── workers/          Queue processors
├── utils/            logger, metrics, crypto, sanitize, eventBus, sentry
├── config/           index.js (env validation), redis.js
├── prisma/           schema.prisma, client.js, seed.js, migrations/
└── dto/              express-validator rule sets
```

### Queue Pipeline
```
User submits repo
  → reviewQueue      → review.worker.js   → reviewProgress.service.js (live progress)
  → scoreQueue       → score.worker.js    → scoring (10 categories, 0-10 each)
  → portfolioQueue   → portfolio.worker.js → generates public verification profile
  → notificationQueue → notification.worker.js → email via Resend
  → dead-letter.queue → captures failed jobs
```

All queues use **BullMQ + Redis** with exponential backoff and configurable concurrency via env vars.

---

## Frontend Architecture

### Feature-Based Structure
```
client/src/
├── features/
│   ├── auth/         Student OAuth + Company email auth + OAuthCallback
│   ├── dashboard/    Student workspace (projects, submissions, tasks, settings)
│   ├── company/      Recruiter workspace (talent feed, interview requests)
│   ├── landing/      Public marketing page
│   ├── portfolio/    Public verification profile (/portfolio/:slug)
│   ├── leaderboard/  (FROZEN — no new features)
│   └── onboarding/   First-time setup flow
├── components/       Shared UI (AIReviewPanel, TrustScoreCard, ProofCard, etc.)
├── contexts/         AuthContext, ToastContext
├── hooks/            useReviewStatus (SSE), useReviewCache, useParallax
├── services/         API clients (api.js base + per-resource files)
└── utils/            animations, helpers
```

### Auth Flow
1. Student clicks "Login with GitHub" → redirects to `/api/auth/github`
2. Backend completes OAuth → redirects to `/auth/callback?token=...&refreshToken=...&user=...`
3. `OAuthCallback.jsx` calls `handleAuthCallbackFromUrl()` → stores both tokens
4. `AuthContext` verifies token with `GET /api/user/me` on page load

### API Client (`src/services/api.js`)
- Attaches `Authorization: Bearer <token>` to all requests
- On **401**: tries `POST /api/auth/refresh` with stored refresh token → retries original request
- On refresh failure: hard logout → redirect to `/auth/student`
- Race-safe: concurrent 401s share one refresh promise

---

## Database Schema (Prisma / MySQL)

### Models
| Model | Purpose |
|---|---|
| `User` | Students + Company accounts + Admins |
| `Submission` | One per student per project |
| `Project` | Project definitions with `tasksJson` and `tags` |
| `TaskProgress` | Per-task completion state within a submission |
| `PRReview` | Raw AI review output per review run |
| `Score` | 10-category scores (0-10 each) + totalScore (0-100) + badge |
| `Portfolio` | Public verification profile — has a unique `slug` |
| `Company` | Recruiter profile linked to a User |
| `InterviewRequest` | Company → Developer connection request |
| `Notification` | In-app + email notification records |
| `UserNotificationPreferences` | Per-user email opt-in settings |
| `RefreshToken` | Secure session tokens (30-day, rotated on use) |
| `AuditLog` | Admin event trail (auth, submissions, admin actions) |

### Score Categories (10 × 0-10, summed to 0-100)
`codeQuality`, `problemSolving`, `bugRisk`, `devopsExecution`, `optimization`, `documentation`, `gitMaturity`, `collaboration`, `deliverySpeed`, `security`

### Enums
- `UserRole`: `STUDENT | COMPANY | ADMIN`
- `Badge`: `RED | GREEN | YELLOW`
- `SubmissionStatus`: `NOT_STARTED | IN_PROGRESS | SUBMITTED | REVIEWED`
- `InterviewRequestStatus`: `PENDING | ACCEPTED | REJECTED | CANCELLED | COMPLETED`

---

## Security Architecture

### Authentication
- **Access tokens**: Short-lived JWT (15 min in production, set `ACCESS_TOKEN_EXPIRY=15m`)
- **Refresh tokens**: 30-day, stored in `RefreshToken` table, rotated on every use (old token revoked, new issued)
- **Revocation**: `POST /api/auth/logout` revokes the specific refresh token
- Token payload: `{ sub: userId, role, iat, exp }`

### Encryption
- GitHub OAuth tokens encrypted at rest: AES-256-GCM via `server/src/utils/crypto.js`
- Key: `GITHUB_TOKEN_ENCRYPTION_KEY` — 64-char hex (32 bytes)
- Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Legacy unencrypted values handled transparently (no `:` separator = plain text)

### Rate Limiting
| Limiter | Limit | Applied To |
|---|---|---|
| `authLimiter` | 10 / 15 min / IP | Auth endpoints |
| `submissionLimiter` | 5 / 10 min / user | `POST /submissions/:id/submit` |
| `companyLimiter` | 150 / 15 min / IP | Company endpoints |
| `interviewRequestLimiter` | 20 / 15 min / IP | Interview requests |
| `notificationLimiter` | 500 / 15 min / IP | Notification polling |

### CORS
- Strict allowlist — no wildcard
- Controlled by `FRONTEND_URL` env var + optional `EXTRA_ALLOWED_ORIGINS` (comma-separated)

### LLM Prompt Security
- All user-controlled content (PR title, description, author, diff) wrapped in `=== FIELD_BEGIN/END ===` markers before entering prompts
- `wrapUserContent()` in `server/src/utils/sanitize.js`
- Secrets and tokens redacted via pattern matching before LLM submission

### Audit Logging
- `AuditLog` model — fire-and-forget (never blocks requests)
- `auditAction(action, resource, resourceIdFn)` middleware in `server/src/middlewares/audit.middleware.js`
- Applied to: `auth.logout`, `submission.submit`

---

## Real-Time Review Status (SSE)

### Endpoint
`GET /api/submissions/:submissionId/review-stream`

### How it works
1. Backend streams `reviewProgress` service state every 1.5s as SSE events
2. Closes automatically when status reaches `REVIEWED` or `ERROR`
3. Auth: accepts `?token=` query param (scoped only to this path — EventSource can't send headers)

### Frontend
`client/src/hooks/useReviewStatus.js`
- Connects via `EventSource`
- Falls back to 3s polling if SSE fails or browser lacks support
- Fetches full review details via `getReviewDetails()` once `REVIEWED`

---

## API Routes Reference

```
/api/auth/github              GET   Initiate GitHub OAuth
/api/auth/github/callback     GET   OAuth callback → redirect to frontend
/api/auth/refresh             POST  Rotate refresh token → new access + refresh tokens
/api/auth/status              GET   Auth status (requires auth)
/api/auth/logout              POST  Revoke refresh token

/api/user/me                  GET   Current user profile
/api/user/:id                 PATCH Update profile

/api/projects                 GET   List all projects
/api/projects/:id             GET   Project detail

/api/submissions              GET   User's submissions
/api/submissions/:id          GET   Submission detail
/api/submissions/:id/submit   POST  Submit for review (rate limited)
/api/submissions/:id/status   GET   Review status (polling fallback)
/api/submissions/:id/review-stream  GET  SSE stream (prefer this)
/api/submissions/:id/review   GET   Full review details
/api/submissions/:id/review/categories  GET  Category breakdown
/api/submissions/:id/fetch-pr POST  Manual PR detection retry
/api/submissions/:id/repo-url PATCH Update repo URL
/api/submissions/:id/tasks    GET   Task list
/api/submissions/:id/tasks/:taskId PUT  Toggle task completion
/api/submissions/:id/progress GET   Task completion progress

/api/portfolio/:slug          GET   Public verification profile

/api/company/profile          GET/PATCH Company profile
/api/talent                   GET   Talent feed (recruiter)
/api/interview-requests       GET/POST Interview requests

/api/notifications            GET   User notifications
/api/notifications/:id/read   PATCH Mark read
/api/notifications/preferences GET/PATCH Email opt-in settings

/api/leaderboard              GET   Public leaderboard (FROZEN)
/api/analytics                GET   Analytics (admin)
/api/metrics                  GET   Prometheus metrics
/admin/queues                 GET   Bull Board dashboard (ADMIN only)
```

---

## Environment Variables

### Required in production
```bash
# Database
DATABASE_URL=mysql://user:pass@host:3306/devhubs

# Auth
JWT_SECRET=<min 32 chars, random>
ACCESS_TOKEN_EXPIRY=15m

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=https://api.devhubs.io/api/auth/github/callback

# GitHub App (for private repos + webhooks)
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=

# Encryption
GITHUB_TOKEN_ENCRYPTION_KEY=<64 hex chars>

# Redis
REDIS_URL=redis://host:6379

# LLM
GROQ_API_KEY=
GROQ_MODEL=mixtral-8x7b-32768

# Email
RESEND_API_KEY=
EMAIL_FROM=notifications@devhubs.io
EMAIL_FROM_NAME=DevHubs

# CORS
FRONTEND_URL=https://app.devhubs.io

# Monitoring
SENTRY_DSN=
```

### Optional / defaults
```bash
PORT=4000
NODE_ENV=production
JWT_EXPIRES_IN=7d            # legacy fallback, prefer ACCESS_TOKEN_EXPIRY
LLM_TIMEOUT=30000
LLM_MAX_RETRIES=3
CACHE_TTL_SECONDS=3600
USE_REVIEW_CACHE=true
BUDGET_USD=100               # monthly LLM spend cap
BUDGET_CHECK_ENABLED=true
QUEUE_CONCURRENCY_REVIEW=3
QUEUE_CONCURRENCY_SCORE=2
QUEUE_TIMEOUT_REVIEW=300000
EXTRA_ALLOWED_ORIGINS=       # comma-separated additional CORS origins
LOG_LEVEL=info
AUTO_MIGRATE=false
```

---

## Development Commands

### Backend
```bash
cd server
npm run dev              # Start Express server (port 4000)
npm test                 # Jest tests
npm run migrate          # Run Prisma migrations (dev)
npm run migrate:deploy   # Apply migrations (production)
npm run seed             # Seed sample data
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma studio        # Visual DB browser
```

### Frontend
```bash
cd client
npm run dev              # Vite dev server (port 5173)
npm run build            # Production build → dist/
npm run lint             # ESLint
npm run preview          # Preview production build
```

### Generate encryption key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Frozen Modules (no new features — bug fixes only)

| Module | Location |
|---|---|
| Lessons | `server/src/routes/lessons.routes.js`, `client/src/features/dashboard/pages/Lessons/` |
| Leaderboard | `server/src/routes/leaderboard.routes.js`, `client/src/features/leaderboard/` |
| Advanced gamification | Anywhere |

These are frozen because they don't contribute to the core **Project → Submission → Evaluation → Verification** flow.

---

## Review Engine (DO NOT MODIFY)

The AI review pipeline is core IP. Do not modify these files unless you have an explicit reason:

```
server/src/services/review/          All 14 specialized review services
server/src/workers/review.worker.js
server/src/workers/score.worker.js
server/src/services/reviewProgress.service.js
```

Only integrate with these via their public interfaces:
- `reviewProgress.get(submissionId)` — get live progress
- `reviewProgress.start/update/complete/fail(submissionId, ...)` — update state

---

## Naming Conventions (Product Branding)

The platform uses **evidence-based verification** language, not "trust scores."

| Old (do not use) | New (use this) |
|---|---|
| Trust Score | Verification Score |
| Portfolio | Verification Profile |
| Score Breakdown | Verification Evidence |
| RED/YELLOW/GREEN badge | Not Verified / Partially Verified / Verified |

**Note:** Frontend file names like `TrustScoreCard.jsx` were kept intentionally to avoid breaking imports. Only user-visible strings were updated. Do not rename these files.

---

## Key Files to Know

| File | What it does |
|---|---|
| `server/src/app.js` | Express setup: Sentry, CORS, routes, error handler |
| `server/src/server.js` | Entry point: DB connect, listen, graceful shutdown |
| `server/src/config/index.js` | Env var validation + config object |
| `server/src/utils/crypto.js` | AES-256-GCM encrypt/decrypt for GitHub tokens |
| `server/src/utils/sanitize.js` | LLM input sanitization + `wrapUserContent()` |
| `server/src/middlewares/auth.middleware.js` | JWT verify + optional `?token=` for SSE |
| `server/src/middlewares/audit.middleware.js` | `auditAction()` factory for event logging |
| `server/src/middlewares/rateLimit.middleware.js` | All rate limiters |
| `server/src/repositories/refreshToken.repo.js` | Refresh token CRUD + rotation |
| `server/src/repositories/auditLog.repo.js` | Audit log write + query |
| `server/prisma/schema.prisma` | Source of truth for all data models |
| `client/src/services/api.js` | Base fetch client with 401 auto-refresh |
| `client/src/services/authApi.js` | Token storage (access + refresh) |
| `client/src/contexts/AuthContext.jsx` | Global auth state |
| `client/src/hooks/useReviewStatus.js` | SSE + polling fallback for review progress |
| `client/src/App.jsx` | Route definitions |

---

## Migration Checklist (when deploying to VPS)

Run these in order after `git pull`:

```bash
cd server
npm ci
npx prisma migrate deploy   # applies pending migrations
npx prisma generate          # regenerates client
pm2 restart devhubs-api
```

Pending migration (must run once):
```
server/prisma/migrations/20240101000001_add_refresh_tokens_and_audit_log/migration.sql
```
Adds: `RefreshToken` table, `AuditLog` table, FK constraint.

---

## Principles for This Codebase

1. **Do not rewrite — refactor incrementally.** The queue pipeline, GitHub integration, review services, and recruiter module represent real engineering investment. Preserve them.
2. **Do not migrate to NestJS, Next.js, or PostgreSQL.** Express + React + MySQL works and is deployed.
3. **New files use the existing patterns**: Route → Controller → Service → Repository → Prisma.
4. **Security is non-negotiable**: Never weaken rate limits, never widen CORS, never log tokens.
5. **The review engine is off-limits** for modification during this phase.
6. **Business impact over engineering perfection**: Ship meaningful improvements, not refactors for their own sake.
