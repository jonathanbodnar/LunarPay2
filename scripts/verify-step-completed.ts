/**
 * Script to verify and add step_completed column if it doesn't exist
 * Run: npx ts-node scripts/verify-step-completed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if column exists by trying to query it
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'church_onboard_fortis' 
      AND column_name = 'step_completed';
    ` as Array<{ column_name: string }>;

    if (result.length === 0) {
      console.log('❌ step_completed column does not exist. Adding it...');
      
      // Add the column
      await prisma.$executeRaw`
        ALTER TABLE church_onboard_fortis 
        ADD COLUMN step_completed INTEGER DEFAULT 0;
      `;
      
      console.log('✅ step_completed column added successfully!');
    } else {
      console.log('✅ step_completed column already exists');
    }

    // Also check for encryption fields
    const encryptionFields = ['ach_account_number', 'ach_routing_number', 'ach_account_number2', 'ach_routing_number2'];
    
    for (const field of encryptionFields) {
      const fieldCheck = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'church_onboard_fortis' 
        AND column_name = ${field};
      ` as Array<{ column_name: string }>;

      if (fieldCheck.length === 0) {
        console.log(`⚠️  ${field} column does not exist (expected if not migrated yet)`);
      } else {
        console.log(`✅ ${field} column exists`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

