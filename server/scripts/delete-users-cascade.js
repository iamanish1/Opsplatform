/**
 * Delete all users and cascade delete related records in correct order
 * Usage: node scripts/delete-users-cascade.js
 */

const prisma = require('../src/prisma/client');

async function deleteAllUsersCascade() {
  try {
    console.log('🗑️  Starting user deletion with cascade...');
    
    // Get all users first to count
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users to delete\n`);
    
    // Delete in correct order to avoid foreign key constraint violations
    // Must delete dependent records BEFORE deleting users
    
    console.log('Deleting dependent records...');
    
    // 1. Delete TaskProgress (depends on Submission)
    const taskProgressDeleted = await prisma.taskProgress.deleteMany({});
    console.log(`  ✓ Deleted ${taskProgressDeleted.count} task progress records`);
    
    // 2. Delete PRReview (depends on Submission)
    const prReviewDeleted = await prisma.pRReview.deleteMany({});
    console.log(`  ✓ Deleted ${prReviewDeleted.count} PR review records`);
    
    // 3. Delete Score (depends on Submission)
    const scoreDeleted = await prisma.score.deleteMany({});
    console.log(`  ✓ Deleted ${scoreDeleted.count} score records`);
    
    // 4. Delete Portfolio (depends on Submission)
    const portfolioDeleted = await prisma.portfolio.deleteMany({});
    console.log(`  ✓ Deleted ${portfolioDeleted.count} portfolio records`);
    
    // 5. Delete Submission (depends on User)
    const submissionDeleted = await prisma.submission.deleteMany({});
    console.log(`  ✓ Deleted ${submissionDeleted.count} submission records`);
    
    // 6. Delete InterviewRequest (depends on User)
    const interviewDeleted = await prisma.interviewRequest.deleteMany({});
    console.log(`  ✓ Deleted ${interviewDeleted.count} interview request records`);
    
    // 7. Delete LessonProgress (depends on User)
    const lessonProgressDeleted = await prisma.lessonProgress.deleteMany({});
    console.log(`  ✓ Deleted ${lessonProgressDeleted.count} lesson progress records`);
    
    // 8. Delete Notification (depends on User)
    const notificationDeleted = await prisma.notification.deleteMany({});
    console.log(`  ✓ Deleted ${notificationDeleted.count} notification records`);
    
    // 9. Delete UserNotificationPreferences (depends on User)
    const preferencesDeleted = await prisma.userNotificationPreferences.deleteMany({});
    console.log(`  ✓ Deleted ${preferencesDeleted.count} notification preference records`);
    
    // 10. Delete Company (depends on User)
    const companyDeleted = await prisma.company.deleteMany({});
    console.log(`  ✓ Deleted ${companyDeleted.count} company records`);
    
    // Finally, delete all users
    console.log('\nDeleting users...');
    const result = await prisma.user.deleteMany({});
    console.log(`  ✓ Deleted ${result.count} user records`);
    
    console.log('\n✅ User deletion complete!');
    console.log('✨ All related data has been cleaned up');
  } catch (error) {
    console.error('❌ Error deleting users:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteAllUsersCascade();
