const axios = require('axios');
const readline = require('readline');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => {
    rl.question(query, resolve);
  });

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║     GitHub PR Fetching Diagnostic Tool v1.0               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Parse GitHub URL to extract owner and repo
function parseGitHubUrl(url) {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter((p) => p);
    if (parts.length >= 2) {
      return {
        owner: parts[0],
        repo: parts[1].replace('.git', ''),
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Test 1: GitHub Authentication
async function testGitHubAuth() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: GitHub Authentication');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!GITHUB_TOKEN) {
    console.log('❌ GITHUB_TOKEN not found in environment variables!');
    console.log('   Set it in your .env file: GITHUB_TOKEN=your_token_here\n');
    return false;
  }

  console.log('✓ GITHUB_TOKEN found');
  console.log(`  Token length: ${GITHUB_TOKEN.length} characters`);
  console.log(`  Token starts with: ${GITHUB_TOKEN.substring(0, 10)}...\n`);

  try {
    console.log('Testing GitHub API authentication...');
    const response = await axios.get(`${GITHUB_API_URL}/user`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
      timeout: 5000,
    });

    console.log('✅ GitHub API Authentication Successful!');
    console.log(`   Authenticated as: @${response.data.login}`);
    console.log(`   Public repos: ${response.data.public_repos}`);
    console.log(`   Rate limit reset: ${response.headers['x-ratelimit-reset']}\n`);
    return true;
  } catch (error) {
    console.log('❌ GitHub API Authentication Failed!');
    if (error.response?.status === 401) {
      console.log('   Error: Invalid or expired token');
    } else if (error.response?.status === 403) {
      console.log('   Error: Forbidden - Token may lack permissions');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    console.log(`   Status: ${error.response?.status}\n`);
    return false;
  }
}

// Test 2: Fetch PR from Specific Repo
async function testFetchPR() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Fetch PR from Specific Repository');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const repoUrl = await question('Enter GitHub repository URL (e.g., https://github.com/owner/repo): ');
  const parsed = parseGitHubUrl(repoUrl);

  if (!parsed) {
    console.log('❌ Invalid GitHub URL format\n');
    return;
  }

  console.log(`\nParsed: owner="${parsed.owner}", repo="${parsed.repo}"`);

  try {
    console.log('\nFetching open PRs...');
    const response = await axios.get(
      `${GITHUB_API_URL}/repos/${parsed.owner}/${parsed.repo}/pulls?state=open&per_page=10`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        timeout: 10000,
      }
    );

    if (response.data.length === 0) {
      console.log('⚠️  No open PRs found in this repository');
      console.log('\nFetching all PRs (last 5)...');
      const allResponse = await axios.get(
        `${GITHUB_API_URL}/repos/${parsed.owner}/${parsed.repo}/pulls?state=all&per_page=5&sort=updated`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
          timeout: 10000,
        }
      );

      if (allResponse.data.length > 0) {
        console.log(`Found ${allResponse.data.length} recent PRs (all states):\n`);
        allResponse.data.forEach((pr, idx) => {
          console.log(`  ${idx + 1}. PR #${pr.number}: "${pr.title}"`);
          console.log(`     State: ${pr.state}`);
          console.log(`     Created: ${new Date(pr.created_at).toLocaleString()}`);
          console.log(`     URL: ${pr.html_url}\n`);
        });
      } else {
        console.log('No PRs found in this repository at all');
      }
    } else {
      console.log(`✅ Found ${response.data.length} open PRs:\n`);
      response.data.forEach((pr, idx) => {
        console.log(`  ${idx + 1}. PR #${pr.number}: "${pr.title}"`);
        console.log(`     Creator: @${pr.user.login}`);
        console.log(`     Created: ${new Date(pr.created_at).toLocaleString()}`);
        console.log(`     URL: ${pr.html_url}\n`);
      });
    }
  } catch (error) {
    console.log(`❌ Failed to fetch PRs: ${error.message}`);
    if (error.response?.status === 404) {
      console.log('   Repository not found');
    } else if (error.response?.status === 403) {
      console.log('   Forbidden - Token may lack permissions');
    }
    console.log();
  }
}

// Test 3: Test PR Fetch for Submission
async function testSubmissionPRFetch() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Test PR Fetch for Specific Submission');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const submissionId = await question('Enter Submission ID: ');

  try {
    console.log('Fetching submission from database...');
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { project: true },
    });

    if (!submission) {
      console.log(`❌ Submission not found with ID: ${submissionId}\n`);
      return;
    }

    console.log('✓ Submission found');
    console.log(`  Project: ${submission.project.name}`);
    console.log(`  Repository URL: ${submission.repositoryUrl}`);
    console.log(`  Status: ${submission.status}`);
    console.log(`  PR Number: ${submission.prNumber || 'Not set'}`);
    console.log(`  PR Attached: ${submission.prAttached || 'False'}\n`);

    const parsed = parseGitHubUrl(submission.repositoryUrl);
    if (!parsed) {
      console.log('❌ Invalid repository URL format\n');
      return;
    }

    console.log('Fetching open PRs from repository...');
    const response = await axios.get(
      `${GITHUB_API_URL}/repos/${parsed.owner}/${parsed.repo}/pulls?state=open&per_page=10`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        timeout: 10000,
      }
    );

    if (response.data.length === 0) {
      console.log('⚠️  No open PRs found');
      console.log('   - Verify that a PR was created on GitHub');
      console.log('   - Check the repository at: ' + submission.repositoryUrl + '\n');
    } else {
      console.log(`✅ Found ${response.data.length} open PRs:\n`);
      response.data.forEach((pr, idx) => {
        console.log(`  ${idx + 1}. PR #${pr.number}: "${pr.title}"`);
        console.log(`     URL: ${pr.html_url}\n`);
      });

      // Simulate what the backend would do
      const latestPR = response.data[0];
      console.log(`Simulating backend action: Would attach PR #${latestPR.number} to submission\n`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
}

// Test 4: Check Rate Limits
async function checkRateLimits() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: GitHub API Rate Limits');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await axios.get(`${GITHUB_API_URL}/rate_limit`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
      timeout: 5000,
    });

    const core = response.data.resources.core;
    const graphql = response.data.resources.graphql;

    console.log('Core API Rate Limits:');
    console.log(`  Limit: ${core.limit}`);
    console.log(`  Remaining: ${core.remaining}`);
    console.log(`  Reset: ${new Date(core.reset * 1000).toLocaleString()}`);

    if (core.remaining < 10) {
      console.log('  ⚠️  Warning: Rate limit nearly exhausted!\n');
    } else {
      console.log('  ✓ Plenty of requests available\n');
    }

    console.log('GraphQL API Rate Limits:');
    console.log(`  Limit: ${graphql.limit}`);
    console.log(`  Remaining: ${graphql.remaining}`);
    console.log(`  Reset: ${new Date(graphql.reset * 1000).toLocaleString()}\n`);
  } catch (error) {
    console.log(`❌ Failed to check rate limits: ${error.message}\n`);
  }
}

// Main menu
async function main() {
  let running = true;

  while (running) {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('Choose a test to run:');
    console.log('════════════════════════════════════════════════════════════');
    console.log('1. Test GitHub Authentication');
    console.log('2. Test PR Fetch from Specific Repository');
    console.log('3. Test PR Fetch for Submission');
    console.log('4. Check GitHub API Rate Limits');
    console.log('5. Exit\n');

    const choice = await question('Enter your choice (1-5): ');

    switch (choice.trim()) {
      case '1':
        await testGitHubAuth();
        break;
      case '2':
        await testFetchPR();
        break;
      case '3':
        await testSubmissionPRFetch();
        break;
      case '4':
        await checkRateLimits();
        break;
      case '5':
        running = false;
        console.log('\nExiting diagnostic tool...\n');
        break;
      default:
        console.log('❌ Invalid choice. Please enter 1-5.\n');
    }
  }

  rl.close();
  await prisma.$disconnect();
}

main().catch(console.error);
