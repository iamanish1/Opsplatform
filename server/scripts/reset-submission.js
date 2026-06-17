require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const prisma = require('../src/prisma/client');

const id = process.argv[2] || 'cmqf6sabw000yw39ch0u5oj9e';

async function reset() {
  await prisma.pRReview.deleteMany({ where: { submissionId: id } });
  await prisma.score.deleteMany({ where: { submissionId: id } });
  await prisma.taskProgress.deleteMany({ where: { submissionId: id } });
  await prisma.submission.update({
    where: { id },
    data: { status: 'IN_PROGRESS', repoUrl: null },
  });
  console.log(`✓ Submission ${id} reset to clean state`);
  await prisma.$disconnect();
}

reset().catch((e) => { console.error(e.message); process.exit(1); });
