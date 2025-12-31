import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  listCustomers, 
  createCustomer,
  createInvoice,
  createPayment,
  getCompanyInfo,
} from '@/lib/apideck';

// POST /api/integrations/apideck/sync - Sync data with accounting software
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const { serviceId, action, data } = body;

    if (!serviceId || !action) {
      return NextResponse.json(
        { error: 'Service ID and action are required' },
        { status: 400 }
      );
    }

    // Get user's organization
    const organization = await prisma.organization.findFirst({
      where: { userId: currentUser.userId },
      select: { id: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    const consumerId = `org_${organization.id}`;

    switch (action) {
      case 'sync-customers': {
        // Sync customers from LunarPay to accounting software
        const customers = await prisma.donor.findMany({
          where: { organizationId: organization.id },
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
            country: true,
          },
        });

        const results = [];
        for (const customer of customers) {
          const result = await createCustomer(consumerId, serviceId, {
            display_name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || 'Unknown',
            first_name: customer.firstName || undefined,
            last_name: customer.lastName || undefined,
            email: customer.email || undefined,
            phone: customer.phone || undefined,
            addresses: customer.address ? [{
              type: 'primary',
              line1: customer.address,
              city: customer.city || undefined,
              state: customer.state || undefined,
              postal_code: customer.zip || undefined,
              country: customer.country || undefined,
            }] : undefined,
          });
          results.push({ customerId: customer.id, externalId: result?.id, success: !!result });
        }

        return NextResponse.json({ 
          action: 'sync-customers',
          total: customers.length,
          synced: results.filter(r => r.success).length,
          results,
        });
      }

      case 'sync-invoice': {
        // Sync a specific invoice to accounting software
        const { invoiceId, externalCustomerId } = data || {};
        
        if (!invoiceId) {
          return NextResponse.json(
            { error: 'Invoice ID is required' },
            { status: 400 }
          );
        }

        const invoice = await prisma.invoice.findFirst({
          where: { 
            id: invoiceId,
            organizationId: organization.id,
          },
          include: {
            products: true,
            donor: true,
          },
        });

        if (!invoice) {
          return NextResponse.json(
            { error: 'Invoice not found' },
            { status: 404 }
          );
        }

        const result = await createInvoice(consumerId, serviceId, {
          customer_id: externalCustomerId,
          invoice_date: invoice.createdAt?.toISOString().split('T')[0],
          due_date: invoice.dueDate?.toISOString().split('T')[0],
          currency: 'USD',
          line_items: invoice.products.map(item => ({
            description: item.productName || 'Item',
            quantity: item.qty || 1,
            unit_price: item.price ? Number(item.price) : 0,
            total_amount: item.subtotal ? Number(item.subtotal) : 0,
          })),
          memo: invoice.memo || undefined,
        });

        return NextResponse.json({
          action: 'sync-invoice',
          invoiceId,
          externalId: result?.id,
          success: !!result,
        });
      }

      case 'sync-payment': {
        // Sync a payment to accounting software
        const { transactionId, externalCustomerId, externalInvoiceId } = data || {};
        
        if (!transactionId) {
          return NextResponse.json(
            { error: 'Transaction ID is required' },
            { status: 400 }
          );
        }

        const transaction = await prisma.transaction.findFirst({
          where: { 
            id: transactionId,
            organizationId: organization.id,
          },
        });

        if (!transaction) {
          return NextResponse.json(
            { error: 'Transaction not found' },
            { status: 404 }
          );
        }

        const result = await createPayment(consumerId, serviceId, {
          customer_id: externalCustomerId,
          total_amount: transaction.totalAmount ? Number(transaction.totalAmount) : 0,
          transaction_date: transaction.createdAt?.toISOString().split('T')[0],
          currency: 'USD',
          reference: transaction.fortisTransactionId || `LUNAR-${transaction.id}`,
          allocations: externalInvoiceId ? [{
            id: externalInvoiceId,
            type: 'invoice',
            amount: transaction.totalAmount ? Number(transaction.totalAmount) : 0,
          }] : undefined,
        });

        return NextResponse.json({
          action: 'sync-payment',
          transactionId,
          externalId: result?.id,
          success: !!result,
        });
      }

      case 'get-company-info': {
        const companyInfo = await getCompanyInfo(consumerId, serviceId);
        return NextResponse.json({
          action: 'get-company-info',
          data: companyInfo,
        });
      }

      case 'import-customers': {
        // Import customers from accounting software to LunarPay
        const { customers: externalCustomers } = await listCustomers(consumerId, serviceId);
        
        const results = [];
        for (const extCustomer of externalCustomers) {
          // Check if customer already exists by email
          const email = (extCustomer.email as string) || (extCustomer.emails as Array<{ email: string }>)?.[0]?.email;
          
          if (email) {
            const existing = await prisma.donor.findFirst({
              where: { 
                email,
                organizationId: organization.id,
              },
            });

            if (!existing) {
              const newCustomer = await prisma.donor.create({
                data: {
                  userId: currentUser.userId,
                  organizationId: organization.id,
                  firstName: (extCustomer.first_name as string) || (extCustomer.display_name as string)?.split(' ')[0] || null,
                  lastName: (extCustomer.last_name as string) || (extCustomer.display_name as string)?.split(' ').slice(1).join(' ') || null,
                  email,
                  phone: (extCustomer.phone_numbers as Array<{ number: string }>)?.[0]?.number || null,
                },
              });
              results.push({ externalId: extCustomer.id, customerId: newCustomer.id, action: 'created' });
            } else {
              results.push({ externalId: extCustomer.id, customerId: existing.id, action: 'skipped' });
            }
          }
        }

        return NextResponse.json({
          action: 'import-customers',
          total: externalCustomers.length,
          imported: results.filter(r => r.action === 'created').length,
          skipped: results.filter(r => r.action === 'skipped').length,
          results,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Apideck sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

