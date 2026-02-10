import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/leads - Get all leads for admin panel
 */
export async function GET() {
  try {
    await requireAdmin();

    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Get total counts
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.converted).length;
    const unconvertedLeads = totalLeads - convertedLeads;

    return NextResponse.json({
      leads,
      stats: {
        total: totalLeads,
        converted: convertedLeads,
        unconverted: unconvertedLeads,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Admin Leads] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/leads - Delete a lead
 */
export async function DELETE(request: Request) {
  try {
    await requireAdmin();

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    await prisma.lead.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Admin Leads] Error deleting:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
