import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    const newPasswordHash = '$2b$10$j86le2hMW/c0y7w9CnhBJeXrzTfrobZEe.AkeSsqlYqP.Wj4j3myG';
    
    const result = await prisma.user.update({
      where: { email: 'jonathan@apollo.inc' },
      data: { 
        password: newPasswordHash,
        role: 'admin',
        firstName: 'Jonathan',
        lastName: 'Bodnar',
        phone: '4699078539',
      },
    });

    console.log('✅ Password updated successfully for:', result.email);
    console.log('New password: Gtui!##!9');
    console.log('You can now log in at the login page!');
  } catch (error) {
    console.error('❌ Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();
