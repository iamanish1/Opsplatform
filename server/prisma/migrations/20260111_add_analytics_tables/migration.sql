-- CreateAnalyticsTable
-- Migration for tracking review analytics

CREATE TABLE IF NOT EXISTS `ReviewAnalytics` (
  `id` VARCHAR(36) NOT NULL,
  `submissionId` VARCHAR(36) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `duration` INT NOT NULL COMMENT 'Processing duration in milliseconds',
  `cost` DECIMAL(10, 6) NOT NULL COMMENT 'Cost in USD',
  `inputTokens` INT DEFAULT 0,
  `outputTokens` INT DEFAULT 0,
  `cached` BOOLEAN DEFAULT FALSE COMMENT 'Whether response was cached',
  `codeQualityScore` INT DEFAULT 0,
  `problemSolvingScore` INT DEFAULT 0,
  `bugRiskScore` INT DEFAULT 0,
  `devopsExecutionScore` INT DEFAULT 0,
  `optimizationScore` INT DEFAULT 0,
  `documentationScore` INT DEFAULT 0,
  `gitMaturityScore` INT DEFAULT 0,
  `collaborationScore` INT DEFAULT 0,
  `deliverySpeedScore` INT DEFAULT 0,
  `securityScore` INT DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE,
  INDEX (`model`),
  INDEX (`cached`),
  INDEX (`createdAt`),
  INDEX (`submissionId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateErrorLogTable
-- Track errors for debugging and alerting

CREATE TABLE IF NOT EXISTS `ErrorLog` (
  `id` VARCHAR(36) NOT NULL,
  `submissionId` VARCHAR(36),
  `jobId` VARCHAR(100),
  `errorType` VARCHAR(100) NOT NULL,
  `errorMessage` TEXT NOT NULL,
  `stack` LONGTEXT,
  `context` JSON COMMENT 'Additional context data',
  `resolved` BOOLEAN DEFAULT FALSE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE,
  INDEX (`errorType`),
  INDEX (`resolved`),
  INDEX (`createdAt`),
  INDEX (`submissionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateDeadLetterJobTable
-- Store failed jobs for recovery

CREATE TABLE IF NOT EXISTS `DeadLetterJob` (
  `id` VARCHAR(36) NOT NULL,
  `originalJobId` VARCHAR(100),
  `queueName` VARCHAR(100) NOT NULL,
  `submissionId` VARCHAR(36),
  `payload` LONGTEXT NOT NULL COMMENT 'Original job payload',
  `failureReason` TEXT,
  `failureCount` INT DEFAULT 1,
  `recovered` BOOLEAN DEFAULT FALSE,
  `recoveredAt` DATETIME,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE,
  INDEX (`queueName`),
  INDEX (`recovered`),
  INDEX (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateCostTrackingTable
-- Track API costs by model and user

CREATE TABLE IF NOT EXISTS `CostTracking` (
  `id` VARCHAR(36) NOT NULL,
  `month` VARCHAR(7) NOT NULL COMMENT 'YYYY-MM format',
  `model` VARCHAR(100) NOT NULL,
  `requests` INT DEFAULT 0,
  `inputTokens` BIGINT DEFAULT 0,
  `outputTokens` BIGINT DEFAULT 0,
  `totalCost` DECIMAL(10, 6) NOT NULL COMMENT 'Cost in USD',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY (`month`, `model`),
  INDEX (`month`),
  INDEX (`model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
