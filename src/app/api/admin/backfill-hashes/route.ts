import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateHash } from '@/lib/auth';

// POST /api/admin/backfill-hashes - Backfill missing hashes for invoices and payment links
// TEMPORARY ADMIN ENDPOINT - DELETE AFTER USE!
export async function POST() {
  try {
    // Find invoices without hash
    const invoicesWithoutHash = await prisma.invoice.findMany({
      where: {
        OR: [
          { hash: null as any },
          { hash: '' },
        ],
      },
      select: { id: true },
    });

    // Update each invoice with a unique hash
    let invoicesUpdated = 0;
    for (const invoice of invoicesWithoutHash) {
      let hash = generateHash();
      // Ensure uniqueness
      while (await prisma.invoice.findFirst({ where: { hash, id: { not: invoice.id } } })) {
        hash = generateHash();
      }
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { hash },
      });
      invoicesUpdated++;
    }

    // Find payment links without hash
    const linksWithoutHash = await prisma.paymentLink.findMany({
      where: {
        OR: [
          { hash: null as any },
          { hash: '' },
        ],
      },
      select: { id: true },
    });

    // Update each payment link with a unique hash
    let linksUpdated = 0;
    for (const link of linksWithoutHash) {
      let hash = generateHash();
      // Ensure uniqueness
      while (await prisma.paymentLink.findFirst({ where: { hash, id: { not: link.id } } })) {
        hash = generateHash();
      }
      
      await prisma.paymentLink.update({
        where: { id: link.id },
        data: { hash },
      });
      linksUpdated++;
    }

    return NextResponse.json({
      success: true,
      invoicesUpdated,
      linksUpdated,
    });
  } catch (error) {
    console.error('Backfill hashes error:', error);
    return NextResponse.json(
      { error: 'Failed to backfill hashes', details: (error as Error).message },
      { status: 500 }
    );
  }
}

