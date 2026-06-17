require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const prisma = require('../src/prisma/client');
const id = process.argv[2] || 'cmqf6sabw000yw39ch0u5oj9e';
prisma.submission.findUnique({
  where: { id },
  select: { id: true, status: true, repoUrl: true, prNumber: true, userId: true, projectId: true }
}).then(s => {
  console.log(JSON.stringify(s, null, 2));
  return prisma.$disconnect();
});
