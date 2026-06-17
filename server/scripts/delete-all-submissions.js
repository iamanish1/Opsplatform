require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const prisma = require('../src/prisma/client');

async function run() {
  const count = await prisma.submission.count();
  console.log(`Found ${count} submission(s).`);

  if (count === 0) {
    console.log('Nothing to delete.');
    return;
  }

  // Delete in FK-safe order
  const portfolios   = await prisma.portfolio.deleteMany({});
  const interviews   = await prisma.interviewRequest.deleteMany({});
  const prReviews    = await prisma.pRReview.deleteMany({});
  const taskProgress = await prisma.taskProgress.deleteMany({});
  const scores       = await prisma.score.deleteMany({});
  const submissions  = await prisma.submission.deleteMany({});

  console.log(`Deleted: ${portfolios.count} portfolios, ${interviews.count} interview requests, ${prReviews.count} PR reviews, ${taskProgress.count} task progress records, ${scores.count} scores, ${submissions.count} submissions.`);
  console.log('Done.');
}

run()
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
