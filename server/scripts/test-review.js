/**
 * Direct test of the review engine — bypasses the queue entirely.
 *
 * Usage:
 *   node scripts/test-review.js <owner/repo> <prNumber> [submissionId]
 *
 * Examples:
 *   node scripts/test-review.js iamanish1/test-repo 1
 *   node scripts/test-review.js iamanish1/my-project 3 cm123abc
 *
 * What it does:
 *   1. Creates a temporary submission in the DB (or uses an existing one)
 *   2. Calls processPRReview() directly — same code path the queue worker uses
 *   3. Prints the full score + verification tier
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { processPRReview } = require('../src/services/review.service');
const prisma = require('../src/prisma/client');

const repoFullName = process.argv[2];
const prNumber     = parseInt(process.argv[3], 10);
const submissionId = process.argv[4] || null;

if (!repoFullName || !prNumber) {
  console.error('Usage: node scripts/test-review.js <owner/repo> <prNumber> [submissionId]');
  console.error('Example: node scripts/test-review.js iamanish1/test-repo 1');
  process.exit(1);
}

const userToken = process.env.GITHUB_Token || process.env.GITHUB_TOKEN;
if (!userToken) {
  console.error('GITHUB_Token not set in .env');
  process.exit(1);
}

async function run() {
  let sid = submissionId;

  if (!sid) {
    // Find or create a test submission
    console.log('Looking for an existing submission to use as test target...');
    const existing = await prisma.submission.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      sid = existing.id;
      console.log(`Using existing submission: ${sid}`);
      // Update repo URL to match what we're testing
      await prisma.submission.update({
        where: { id: sid },
        data: {
          repoUrl: `https://github.com/${repoFullName}`,
          status: 'IN_PROGRESS',
        },
      });
    } else {
      // Need a user and project to create a submission
      const project = await prisma.project.findFirst();
      const user = await prisma.user.findFirst();
      if (!project || !user) {
        console.error('No projects or users in DB. Log in to the app first to create a user, then retry.');
        process.exit(1);
      }
      const sub = await prisma.submission.create({
        data: {
          userId:   user.id,
          projectId: project.id,
          repoUrl:  `https://github.com/${repoFullName}`,
          status:   'IN_PROGRESS',
        },
      });
      sid = sub.id;
      console.log(`Created test submission: ${sid}`);
    }
  }

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║      DevHubs Review Engine — Direct Test     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`Repo:         ${repoFullName}`);
  console.log(`PR Number:    #${prNumber}`);
  console.log(`Submission:   ${sid}`);
  console.log(`Auth:         userToken (${userToken.slice(0, 8)}...)`);
  console.log('\nRunning review pipeline (30-60s)...\n');

  const start = Date.now();

  try {
    await processPRReview({
      submissionId: sid,
      repoFullName,
      prNumber,
      installationId: null,
      userToken,
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    // Fetch the saved score
    const score = await prisma.score.findUnique({ where: { submissionId: sid } });
    const sub   = await prisma.submission.findUnique({ where: { id: sid } });

    console.log('\n═══════════════════ RESULT ════════════════════');
    console.log(`Duration:           ${elapsed}s`);
    console.log(`Status:             ${sub?.status}`);
    if (score) {
      console.log(`\nTotal Score:        ${score.totalScore}/100`);
      console.log(`Badge:              ${score.badge}`);
      console.log(`Verification Tier:  ${score.verificationTier || 'n/a'}`);
      console.log(`Competency Level:   ${score.competencyLevel ?? 'n/a'} — ${score.competencyDomain || ''}`);
      console.log('\nCategory Scores:');
      const cats = ['codeQuality','problemSolving','bugRisk','devopsExecution','optimization','documentation','gitMaturity','collaboration','deliverySpeed','security'];
      for (const cat of cats) {
        const val = score[cat];
        const bar = val != null ? '█'.repeat(Math.round(val)) + '░'.repeat(10 - Math.round(val)) : '—';
        console.log(`  ${cat.padEnd(18)} ${bar} ${val ?? '—'}/10`);
      }
      if (score.verificationTier) {
        console.log(`\nVerification gates: ${score.gateResults || 'see DB'}`);
      }
    } else {
      console.log('No score record found — check server logs for errors.');
    }
    console.log('══════════════════════════════════════════════');
  } catch (err) {
    console.error('\n✗ Review pipeline error:', err.message);
    if (process.env.DEBUG) console.error(err.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
