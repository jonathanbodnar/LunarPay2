import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const currentUser = await requireAuth();

    // Get Stripe connection
    const connection = await prisma.integration.findFirst({
      where: {
        userId: currentUser.userId,
        provider: 'stripe',
        status: 'connected',
      },
    });

    if (!connection || !connection.accessToken) {
      return NextResponse.json(
        { error: 'Stripe not connected' },
        { status: 400 }
      );
    }

    const summary = {
      customersImported: 0,
      productsImported: 0,
      invoicesImported: 0,
      errors: [] as string[],
    };

    // Import customers from Stripe
    try {
      const customersResponse = await fetch('https://api.stripe.com/v1/customers?limit=100', {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
        },
      });

      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        
        for (const stripeCustomer of customersData.data) {
          if (!stripeCustomer.email) continue;

          // Check if customer exists
          const existingCustomer = await prisma.donor.findFirst({
            where: {
              email: stripeCustomer.email,
              userId: currentUser.userId,
            },
          });

          if (!existingCustomer) {
            // Get first organization for this user
            const organization = await prisma.organization.findFirst({
              where: { userId: currentUser.userId },
            });

            if (organization) {
              await prisma.donor.create({
                data: {
                  userId: currentUser.userId,
                  organizationId: organization.id,
                  firstName: stripeCustomer.name || stripeCustomer.email.split('@')[0],
                  lastName: '',
                  email: stripeCustomer.email,
                  phone: stripeCustomer.phone,
                  address: stripeCustomer.address?.line1,
                  city: stripeCustomer.address?.city,
                  state: stripeCustomer.address?.state,
                  zip: stripeCustomer.address?.postal_code,
                  country: stripeCustomer.address?.country,
                  stripeCustomerId: stripeCustomer.id,
                  createdFrom: 'stripe_import',
                  amountAcum: 0,
                  feeAcum: 0,
                  netAcum: 0,
                },
              });
              summary.customersImported++;
            }
          }
        }
      }
    } catch (error) {
      summary.errors.push(`Customers import error: ${(error as Error).message}`);
    }

    // Import products from Stripe
    try {
      const productsResponse = await fetch('https://api.stripe.com/v1/products?limit=100', {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
        },
      });

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        
        for (const stripeProduct of productsData.data) {
          // Check if product exists
          const existingProduct = await prisma.product.findFirst({
            where: {
              userId: currentUser.userId,
              name: stripeProduct.name,
            },
          });

          if (!existingProduct) {
            // Get first organization
            const organization = await prisma.organization.findFirst({
              where: { userId: currentUser.userId },
            });

            if (organization) {
              // Get default price for product
              const pricesResponse = await fetch(
                `https://api.stripe.com/v1/prices?product=${stripeProduct.id}&limit=1`,
                {
                  headers: {
                    'Authorization': `Bearer ${connection.accessToken}`,
                  },
                }
              );

              let price = 0;
              let isSubscription = false;
              let interval = null;

              if (pricesResponse.ok) {
                const pricesData = await pricesResponse.json();
                if (pricesData.data.length > 0) {
                  price = pricesData.data[0].unit_amount / 100; // Convert from cents
                  isSubscription = pricesData.data[0].type === 'recurring';
                  interval = pricesData.data[0].recurring?.interval;
                }
              }

              await prisma.product.create({
                data: {
                  userId: currentUser.userId,
                  organizationId: organization.id,
                  name: stripeProduct.name,
                  description: stripeProduct.description,
                  price,
                  isSubscription,
                  subscriptionInterval: interval,
                  stripeProductId: stripeProduct.id,
                },
              });
              summary.productsImported++;
            }
          }
        }
      }
    } catch (error) {
      summary.errors.push(`Products import error: ${(error as Error).message}`);
    }

    // Update last sync time
    await prisma.integration.update({
      where: { id: connection.id },
      data: { lastSync: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Stripe sync completed',
      summary,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Stripe sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}


