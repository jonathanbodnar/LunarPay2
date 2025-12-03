import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// TEMPORARY ADMIN ENDPOINT - For one-time data migration
// DELETE AFTER USE!

export async function POST(request: Request) {
  try {
    const { adminSecret } = await request.json();

    // Require a secret to prevent abuse
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting data migration for jonathan@apollo.inc...');

    // Read and parse the old SQL dump
    const sqlPath = path.join(process.cwd(), 'old', 'lunarprod202508-29 2.sql');
    const sqlDump = fs.readFileSync(sqlPath, 'utf8');

    const results = {
      user: null as any,
      organization: null as any,
      donors: 0,
      invoices: 0,
      transactions: 0,
      errors: [] as string[],
    };

    // Find user and organization
    const user = await prisma.user.findUnique({
      where: { email: 'jonathan@apollo.inc' },
      include: { organizations: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User jonathan@apollo.inc not found' },
        { status: 404 }
      );
    }

    results.user = { id: user.id, email: user.email };

    const organization = user.organizations[0];
    if (!organization) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 404 }
      );
    }

    results.organization = { id: organization.id, name: organization.name };

    // Parse old organization data to get Fortis IDs
    const churchMatch = sqlDump.match(/INSERT INTO `church_detail` VALUES \(([^)]+\),\(2,2,'Apollo Eleven Inc'[^)]+)\);/);
    if (churchMatch) {
      const orgData = churchMatch[1];
      console.log('Found old organization data');
      
      // Update organization with old token
      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          name: 'Apollo Eleven Inc',
          legalName: 'Apollo Eleven Inc',
          streetAddress: '3316 taunton way',
          token: '1d9973f7f6322e42f5b69c4159282965',
          slug: 'apollo-eleven-inc',
          fortisTemplate: 'lunarpayfr',
        },
      });
      console.log('✅ Updated organization with old data');
    }

    // Extract and import donors (customers)
    const donorMatch = sqlDump.match(/INSERT INTO `account_donor` VALUES ([\s\S]+?);/);
    if (donorMatch) {
      const donorData = donorMatch[1];
      const donorRecords = donorData.split(/\),\(/);
      
      const donorIdMap = new Map(); // Map old donor ID to new donor ID

      for (const record of donorRecords) {
        // Check if donor belongs to church_id=2
        const parts = record.split(',');
        if (parts.length > 5) {
          const churchId = parts[5]?.trim();
          if (churchId === '2') {
            try {
              // Parse donor data
              const idMatch = record.match(/^(\d+),/);
              const oldDonorId = idMatch ? parseInt(idMatch[1]) : null;
              
              const emailMatch = record.match(/'([^']*@[^']*)'/);
              const email = emailMatch ? emailMatch[1] : '';
              
              const firstNameMatch = record.match(/'([^']*)',(?:'[^']*',){50,}'([^']*)','([^']*)',/);
              
              // Create donor in new DB
              const newDonor = await prisma.donor.create({
                data: {
                  userId: user.id,
                  organizationId: organization.id,
                  email: email || `donor${oldDonorId}@example.com`,
                  firstName: 'Customer',
                  lastName: `${oldDonorId}`,
                  phone: null,
                  address: null,
                  city: null,
                  state: null,
                  zip: null,
                  country: 'US',
                },
              });

              if (oldDonorId) {
                donorIdMap.set(oldDonorId, newDonor.id);
              }
              results.donors++;
            } catch (error) {
              results.errors.push(`Donor import error: ${(error as Error).message}`);
            }
          }
        }
      }
      console.log(`✅ Imported ${results.donors} donors`);
    }

    // Extract and import invoices
    const invoiceMatch = sqlDump.match(/INSERT INTO `invoices` VALUES ([\s\S]+?);/);
    if (invoiceMatch) {
      console.log('Importing invoices...');
      // This is very complex - would need careful field mapping
      // For now, log that we found them
      results.errors.push('Invoice import not yet implemented - needs careful schema mapping');
    }

    // Extract and import transactions
    const transMatch = sqlDump.match(/INSERT INTO `epicpay_customer_transactions` VALUES ([\s\S]+?);/);
    if (transMatch) {
      console.log('Importing transactions...');
      // This is very complex - would need careful field mapping
      results.errors.push('Transaction import not yet implemented - needs careful schema mapping');
    }

    return NextResponse.json({
      success: true,
      message: 'Migration partially completed',
      results,
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}

