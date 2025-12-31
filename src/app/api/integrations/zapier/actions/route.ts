import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCustomerSchema = z.object({
  action: z.literal('create_customer'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

const createInvoiceSchema = z.object({
  action: z.literal('create_invoice'),
  customer_email: z.string().email(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().default(1),
    price: z.number(), // In cents
  })),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

const createProductSchema = z.object({
  action: z.literal('create_product'),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(), // In cents
  is_subscription: z.boolean().default(false),
  subscription_interval: z.string().optional(),
});

// POST /api/integrations/zapier/actions - Execute a Zapier action
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

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

    const { action } = body;

    switch (action) {
      case 'create_customer': {
        const validation = createCustomerSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Invalid request', details: validation.error.issues },
            { status: 400 }
          );
        }

        const data = validation.data;

        // Check if customer already exists by email
        if (data.email) {
          const existing = await prisma.donor.findFirst({
            where: {
              email: data.email,
              organizationId: organization.id,
            },
          });

          if (existing) {
            return NextResponse.json({
              success: true,
              action: 'create_customer',
              customer_id: existing.id,
              message: 'Customer already exists',
            });
          }
        }

        const customer = await prisma.donor.create({
          data: {
            organizationId: organization.id,
            firstName: data.first_name || null,
            lastName: data.last_name || null,
            email: data.email || null,
            phone: data.phone || null,
            address1: data.address || null,
            city: data.city || null,
            state: data.state || null,
            zip: data.zip || null,
          },
        });

        return NextResponse.json({
          success: true,
          action: 'create_customer',
          customer_id: customer.id,
          message: 'Customer created successfully',
        });
      }

      case 'create_invoice': {
        const validation = createInvoiceSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Invalid request', details: validation.error.issues },
            { status: 400 }
          );
        }

        const data = validation.data;

        // Find or create customer by email
        let customer = await prisma.donor.findFirst({
          where: {
            email: data.customer_email,
            organizationId: organization.id,
          },
        });

        if (!customer) {
          customer = await prisma.donor.create({
            data: {
              organizationId: organization.id,
              email: data.customer_email,
            },
          });
        }

        // Calculate total
        const total = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create invoice
        const invoice = await prisma.invoice.create({
          data: {
            organizationId: organization.id,
            donorId: customer.id,
            status: 'draft',
            total,
            dueDate: data.due_date ? new Date(data.due_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            notes: data.notes || null,
            items: {
              create: data.items.map(item => ({
                description: item.description,
                qty: item.quantity,
                price: item.price,
              })),
            },
          },
        });

        return NextResponse.json({
          success: true,
          action: 'create_invoice',
          invoice_id: invoice.id,
          customer_id: customer.id,
          total,
          message: 'Invoice created successfully',
        });
      }

      case 'create_product': {
        const validation = createProductSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Invalid request', details: validation.error.issues },
            { status: 400 }
          );
        }

        const data = validation.data;

        const product = await prisma.product.create({
          data: {
            organizationId: organization.id,
            name: data.name,
            description: data.description || null,
            price: data.price,
            isSubscription: data.is_subscription,
            subscriptionInterval: data.subscription_interval || null,
          },
        });

        return NextResponse.json({
          success: true,
          action: 'create_product',
          product_id: product.id,
          message: 'Product created successfully',
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
    console.error('Zapier action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

