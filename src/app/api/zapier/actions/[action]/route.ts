import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

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

// POST /api/zapier/actions/[action] - Execute Zapier actions
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await params;
    const user = await verifyApiKey(request);

    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const orgId = user.organizations[0]?.id;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();

    switch (action) {
      case 'create_customer': {
        const { first_name, last_name, email, phone, address, city, state, zip } = body;

        if (!email) {
          return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if customer exists
        const existing = await prisma.donor.findFirst({
          where: { email, organizationId: orgId },
        });

        if (existing) {
          return NextResponse.json({
            id: existing.id,
            message: 'Customer already exists',
          });
        }

        const customer = await prisma.donor.create({
          data: {
            userId: user.id,
            organizationId: orgId,
            firstName: first_name || null,
            lastName: last_name || null,
            email,
            phone: phone || null,
            address: address || null,
            city: city || null,
            state: state || null,
            zip: zip || null,
          },
        });

        return NextResponse.json({
          id: customer.id,
          first_name: customer.firstName,
          last_name: customer.lastName,
          email: customer.email,
          message: 'Customer created successfully',
        });
      }

      case 'create_invoice': {
        const { customer_email, items, due_date, memo } = body;

        if (!customer_email) {
          return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
        }

        // Find or create customer
        let customer = await prisma.donor.findFirst({
          where: { email: customer_email, organizationId: orgId },
        });

        if (!customer) {
          customer = await prisma.donor.create({
            data: {
              userId: user.id,
              organizationId: orgId,
              email: customer_email,
            },
          });
        }

        // Parse items
        const invoiceItems = Array.isArray(items) ? items : [];
        const totalAmount = invoiceItems.reduce((sum: number, item: { price?: number; quantity?: number }) => {
          return sum + ((item.price || 0) * (item.quantity || 1));
        }, 0);

        const hash = crypto.randomBytes(16).toString('hex');

        const invoice = await prisma.invoice.create({
          data: {
            organizationId: orgId,
            donorId: customer.id,
            status: 'draft',
            totalAmount,
            dueDate: due_date ? new Date(due_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            memo: memo || null,
            hash,
            products: invoiceItems.length > 0 ? {
              create: invoiceItems.map((item: { description?: string; quantity?: number; price?: number }) => ({
                productName: item.description || 'Item',
                qty: item.quantity || 1,
                price: item.price || 0,
                subtotal: (item.price || 0) * (item.quantity || 1),
              })),
            } : undefined,
          },
        });

        return NextResponse.json({
          id: invoice.id,
          reference: invoice.reference || `INV-${invoice.id}`,
          total_amount: Number(invoice.totalAmount),
          status: invoice.status,
          customer_id: customer.id,
          message: 'Invoice created successfully',
        });
      }

      case 'create_product': {
        const { name, description, price, is_subscription, subscription_interval } = body;

        if (!name) {
          return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
        }

        const product = await prisma.product.create({
          data: {
            userId: user.id,
            organizationId: orgId,
            name,
            description: description || null,
            price: price || 0,
            isSubscription: is_subscription || false,
            subscriptionInterval: subscription_interval || null,
          },
        });

        return NextResponse.json({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          message: 'Product created successfully',
        });
      }

      case 'find_customer': {
        const { email } = body;

        if (!email) {
          return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const customer = await prisma.donor.findFirst({
          where: { email, organizationId: orgId },
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
          },
        });

        if (!customer) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json({
          id: customer.id,
          first_name: customer.firstName,
          last_name: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          zip: customer.zip,
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Zapier action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

