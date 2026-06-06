-- Migration: Add Verification Engine fields
-- Covers Phase 1 (execution evidence, verification tier),
--          Phase 2 (hidden test project config),
--          Phase 3 (reflection on Submission),
--          Phase 4 (competency on Score)
--
-- Apply with: npx prisma migrate deploy

-- ─── Project: hidden test + domain fields ─────────────────────────────────
ALTER TABLE `Project`
  ADD COLUMN `slug`            VARCHAR(191) NULL,
  ADD COLUMN `hasHiddenTests`  BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN `hiddenTestSuite` VARCHAR(191) NULL,
  ADD COLUMN `domain`          VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Project_slug_key` ON `Project`(`slug`);

-- ─── Submission: reflection fields ────────────────────────────────────────
ALTER TABLE `Submission`
  ADD COLUMN `reflectionQuestions` JSON NULL,
  ADD COLUMN `reflectionAnswers`   JSON NULL,
  ADD COLUMN `reflectionDueAt`     DATETIME(3) NULL;

-- ─── Score: verification engine fields ────────────────────────────────────
ALTER TABLE `Score`
  -- Verification tier
  ADD COLUMN `verificationTier`     VARCHAR(191) NULL,
  -- Execution evidence (Phase 1)
  ADD COLUMN `dockerBuildSuccess`    BOOLEAN     NULL,
  ADD COLUMN `dockerBuildDurationMs` INT         NULL,
  ADD COLUMN `hiddenTestPassRate`    DOUBLE      NULL,
  ADD COLUMN `hiddenTestTotal`       INT         NULL,
  ADD COLUMN `hiddenTestPassed`      INT         NULL,
  -- Extended static analysis
  ADD COLUMN `coveragePercent`       DOUBLE      NULL,
  ADD COLUMN `criticalVulns`         INT         NULL,
  ADD COLUMN `highVulns`             INT         NULL,
  -- Competency (Phase 4)
  ADD COLUMN `competencyLevel`       INT         NULL,
  ADD COLUMN `competencyDomain`      VARCHAR(191) NULL,
  ADD COLUMN `competencyBreakdown`   JSON        NULL,
  -- Reflection (Phase 3)
  ADD COLUMN `reflectionScore`       DOUBLE      NULL,
  -- Evidence items
  ADD COLUMN `evidenceItems`         JSON        NULL;
