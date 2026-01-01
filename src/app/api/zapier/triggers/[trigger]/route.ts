import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to verify API key and get user
async function verifyApiKey(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return null;
  }

  const apiKey = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  if (!apiKey || !apiKey.startsWith('lp_')) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { apiKey },
    select: {
      id: true,
      organizations: {
        select: { id: true },
        take: 1,
      },
    },
  });

  return user;
}

// GET /api/zapier/triggers/[trigger] - Get sample data for triggers
export async function GET(
  request: Request,
  { params }: { params: Promise<{ trigger: string }> }
) {
  try {
    const { trigger } = await params;
    const user = await verifyApiKey(request);

    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const orgId = user.organizations[0]?.id;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Return sample/recent data based on trigger type
    switch (trigger) {
      case 'new_customer': {
        const customers = await prisma.donor.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            createdAt: true,
          },
        });

        return NextResponse.json(customers.map(c => ({
          id: c.id,
          first_name: c.firstName || '',
          last_name: c.lastName || '',
          email: c.email || '',
          phone: c.phone || '',
          address: c.address || '',
          city: c.city || '',
          state: c.state || '',
          zip: c.zip || '',
          created_at: c.createdAt?.toISOString() || new Date().toISOString(),
        })));
      }

      case 'new_invoice': {
        const invoices = await prisma.invoice.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            donor: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        });

        return NextResponse.json(invoices.map(inv => ({
          id: inv.id,
          reference: inv.reference || `INV-${inv.id}`,
          status: inv.status,
          total_amount: Number(inv.totalAmount),
          paid_amount: Number(inv.paidAmount),
          due_date: inv.dueDate?.toISOString() || null,
          customer_name: `${inv.donor?.firstName || ''} ${inv.donor?.lastName || ''}`.trim(),
          customer_email: inv.donor?.email || '',
          created_at: inv.createdAt?.toISOString() || new Date().toISOString(),
        })));
      }

      case 'new_transaction': {
        const transactions = await prisma.transaction.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            totalAmount: true,
            status: true,
            source: true,
            firstName: true,
            lastName: true,
            email: true,
            fortisTransactionId: true,
            createdAt: true,
          },
        });

        return NextResponse.json(transactions.map(t => ({
          id: Number(t.id),
          amount: Number(t.totalAmount),
          status: t.status === 'P' ? 'success' : t.status === 'N' ? 'failed' : 'refunded',
          payment_method: t.source === 'CC' ? 'card' : 'bank',
          customer_name: `${t.firstName || ''} ${t.lastName || ''}`.trim(),
          customer_email: t.email || '',
          transaction_id: t.fortisTransactionId || null,
          created_at: t.createdAt?.toISOString() || new Date().toISOString(),
        })));
      }

      case 'new_subscription': {
        const subscriptions = await prisma.subscription.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            amount: true,
            frequency: true,
            status: true,
            firstName: true,
            lastName: true,
            email: true,
            startOn: true,
            nextPaymentOn: true,
            createdAt: true,
          },
        });

        return NextResponse.json(subscriptions.map(s => ({
          id: s.id,
          amount: Number(s.amount),
          frequency: s.frequency,
          status: s.status === 'A' ? 'active' : 'cancelled',
          customer_name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          customer_email: s.email || '',
          start_date: s.startOn?.toISOString() || null,
          next_payment_date: s.nextPaymentOn?.toISOString() || null,
          created_at: s.createdAt?.toISOString() || new Date().toISOString(),
        })));
      }

      case 'payment_failed': {
        const failedPayments = await prisma.transaction.findMany({
          where: { 
            organizationId: orgId,
            status: 'N',
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            totalAmount: true,
            firstName: true,
            lastName: true,
            email: true,
            fortisTransactionId: true,
            createdAt: true,
          },
        });

        return NextResponse.json(failedPayments.map(t => ({
          id: Number(t.id),
          amount: Number(t.totalAmount),
          customer_name: `${t.firstName || ''} ${t.lastName || ''}`.trim(),
          customer_email: t.email || '',
          transaction_id: t.fortisTransactionId || null,
          failed_at: t.createdAt?.toISOString() || new Date().toISOString(),
        })));
      }

      default:
        return NextResponse.json({ error: 'Unknown trigger' }, { status: 400 });
    }
  } catch (error) {
    console.error('Zapier trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

