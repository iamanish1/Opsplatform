/**
 * Delete a specific user by email
 * Usage: node scripts/delete-user-by-email.js user@example.com
 */

const prisma = require('../src/prisma/client');

async function deleteUserByEmail(email) {
  try {
    if (!email) {
      console.error('❌ Email is required');
      console.log('Usage: node scripts/delete-user-by-email.js user@example.com');
      process.exit(1);
    }

    console.log(`🗑️  Deleting user: ${email}...`);
    
    // Find user first
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name || 'N/A'} (${user.email})`);

    // Delete the user (cascade deletes related records)
    const result = await prisma.user.delete({
      where: { email },
    });

    console.log(`✅ Deleted user: ${result.email}`);
    console.log('✨ Related records cascaded delete');
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line args
const email = process.argv[2];
deleteUserByEmail(email);
