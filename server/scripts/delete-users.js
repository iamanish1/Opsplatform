/**
 * Delete all user records from database
 * Usage: node scripts/delete-users.js
 */

const prisma = require('../src/prisma/client');

async function deleteAllUsers() {
  try {
    console.log('🗑️  Starting user deletion...');
    
    // Delete all users
    const result = await prisma.user.deleteMany({});
    
    console.log(`✅ Deleted ${result.count} users from database`);
    console.log('✨ User table is now empty');
  } catch (error) {
    console.error('❌ Error deleting users:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteAllUsers();
