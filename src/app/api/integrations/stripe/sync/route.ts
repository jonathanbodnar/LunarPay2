import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

async function stripeRequest(apiKey: string, endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`https://api.stripe.com/v1${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Stripe API error: ${response.status}`);
  }
  
  return response.json();
}

export async function POST() {
  try {
    const currentUser = await requireAuth();

    // Get Stripe connection
    const integration = await prisma.integration.findFirst({
      where: {
        userId: currentUser.userId,
        provider: 'stripe',
        status: 'connected',
      },
    });

    if (!integration || !integration.apiKey) {
      return NextResponse.json(
        { error: 'Stripe not connected. Please add your API key first.' },
        { status: 400 }
      );
    }

    const apiKey = integration.apiKey;

    // Get user's organization
    const organization = await prisma.organization.findFirst({
      where: { userId: currentUser.userId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    const summary = {
      customers: { imported: 0, skipped: 0, errors: 0 },
      products: { imported: 0, skipped: 0, errors: 0 },
      subscriptions: { imported: 0, skipped: 0, errors: 0 },
      invoices: { imported: 0, skipped: 0, errors: 0 },
      payments: { imported: 0, skipped: 0, errors: 0 },
      errors: [] as string[],
    };

    // 1. Import Customers
    try {
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const params: Record<string, string> = { limit: '100' };
        if (startingAfter) params.starting_after = startingAfter;

        const customersData = await stripeRequest(apiKey, '/customers', params);

        for (const stripeCustomer of customersData.data) {
          try {
            if (!stripeCustomer.email) {
              summary.customers.skipped++;
              continue;
            }

            // Check if customer exists by Stripe ID or email
            const existing = await prisma.donor.findFirst({
              where: {
                OR: [
                  { stripeCustomerId: stripeCustomer.id },
                  { email: stripeCustomer.email, organizationId: organization.id },
                ],
              },
            });

            if (existing) {
              // Update Stripe ID if missing
              if (!existing.stripeCustomerId) {
                await prisma.donor.update({
                  where: { id: existing.id },
                  data: { stripeCustomerId: stripeCustomer.id },
                });
              }
              summary.customers.skipped++;
              continue;
            }

            // Parse name
            const nameParts = (stripeCustomer.name || '').split(' ');
            const firstName = nameParts[0] || stripeCustomer.email.split('@')[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            await prisma.donor.create({
              data: {
                userId: currentUser.userId,
                organizationId: organization.id,
                firstName,
                lastName,
                email: stripeCustomer.email,
                phone: stripeCustomer.phone || null,
                address: stripeCustomer.address?.line1 || null,
                city: stripeCustomer.address?.city || null,
                state: stripeCustomer.address?.state || null,
                zip: stripeCustomer.address?.postal_code || null,
                country: stripeCustomer.address?.country || null,
                stripeCustomerId: stripeCustomer.id,
                createdFrom: 'stripe_import',
              },
            });
            summary.customers.imported++;
          } catch (e) {
            summary.customers.errors++;
            summary.errors.push(`Customer ${stripeCustomer.id}: ${(e as Error).message}`);
          }
        }

        hasMore = customersData.has_more;
        if (hasMore && customersData.data.length > 0) {
          startingAfter = customersData.data[customersData.data.length - 1].id;
        }
      }
    } catch (error) {
      summary.errors.push(`Customers import failed: ${(error as Error).message}`);
    }

    // 2. Import Products
    try {
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const params: Record<string, string> = { limit: '100', active: 'true' };
        if (startingAfter) params.starting_after = startingAfter;

        const productsData = await stripeRequest(apiKey, '/products', params);

        for (const stripeProduct of productsData.data) {
          try {
            // Check if product exists
            const existing = await prisma.product.findFirst({
              where: {
                OR: [
                  { stripeId: stripeProduct.id },
                  { name: stripeProduct.name, organizationId: organization.id },
                ],
              },
            });

            if (existing) {
              summary.products.skipped++;
              continue;
            }

            // Get prices for this product
            const pricesData = await stripeRequest(apiKey, '/prices', {
              product: stripeProduct.id,
              active: 'true',
              limit: '1',
            });

            let price = 0;
            let isSubscription = false;
            let interval: string | null = null;

            if (pricesData.data.length > 0) {
              const stripePrice = pricesData.data[0];
              price = (stripePrice.unit_amount || 0) / 100;
              isSubscription = stripePrice.type === 'recurring';
              interval = stripePrice.recurring?.interval || null;
            }

            await prisma.product.create({
              data: {
                userId: currentUser.userId,
                organizationId: organization.id,
                name: stripeProduct.name,
                description: stripeProduct.description || null,
                price,
                isSubscription,
                subscriptionInterval: interval,
                stripeId: stripeProduct.id,
              },
            });
            summary.products.imported++;
          } catch (e) {
            summary.products.errors++;
            summary.errors.push(`Product ${stripeProduct.id}: ${(e as Error).message}`);
          }
        }

        hasMore = productsData.has_more;
        if (hasMore && productsData.data.length > 0) {
          startingAfter = productsData.data[productsData.data.length - 1].id;
        }
      }
    } catch (error) {
      summary.errors.push(`Products import failed: ${(error as Error).message}`);
    }

    // 3. Import Subscriptions
    try {
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const params: Record<string, string> = { limit: '100', status: 'all' };
        if (startingAfter) params.starting_after = startingAfter;

        const subsData = await stripeRequest(apiKey, '/subscriptions', params);

        for (const stripeSub of subsData.data) {
          try {
            // Check if subscription exists by Stripe ID (stored in fortisSubscriptionId for imports)
            const existing = await prisma.subscription.findFirst({
              where: { fortisSubscriptionId: stripeSub.id },
            });

            if (existing) {
              summary.subscriptions.skipped++;
              continue;
            }

            // Find customer
            const donor = await prisma.donor.findFirst({
              where: { stripeCustomerId: stripeSub.customer },
            });

            if (!donor) {
              summary.subscriptions.skipped++;
              continue;
            }

            // Get subscription item details
            const item = stripeSub.items?.data?.[0];
            const amount = item?.price?.unit_amount ? item.price.unit_amount / 100 : 0;
            const interval = item?.price?.recurring?.interval || 'month';

            // Map Stripe interval to our frequency
            const frequencyMap: Record<string, string> = {
              day: 'daily',
              week: 'weekly',
              month: 'monthly',
              year: 'yearly',
            };

            await prisma.subscription.create({
              data: {
                donorId: donor.id,
                organizationId: organization.id,
                sourceId: 0, // Placeholder - no payment source from Stripe import
                amount,
                frequency: frequencyMap[interval] || 'monthly',
                status: stripeSub.status === 'active' ? 'A' : 'D',
                firstName: donor.firstName || '',
                lastName: donor.lastName || '',
                email: donor.email || '',
                givingSource: 'stripe_import',
                source: 'CC',
                fortisSubscriptionId: stripeSub.id,
                startOn: new Date(stripeSub.start_date * 1000),
                nextPaymentOn: stripeSub.current_period_end 
                  ? new Date(stripeSub.current_period_end * 1000) 
                  : new Date(),
              },
            });
            summary.subscriptions.imported++;
          } catch (e) {
            summary.subscriptions.errors++;
            summary.errors.push(`Subscription ${stripeSub.id}: ${(e as Error).message}`);
          }
        }

        hasMore = subsData.has_more;
        if (hasMore && subsData.data.length > 0) {
          startingAfter = subsData.data[subsData.data.length - 1].id;
        }
      }
    } catch (error) {
      summary.errors.push(`Subscriptions import failed: ${(error as Error).message}`);
    }

    // 4. Import Invoices (last 90 days)
    try {
      const ninetyDaysAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60);
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const params: Record<string, string> = { 
          limit: '100',
          created: JSON.stringify({ gte: ninetyDaysAgo }),
        };
        if (startingAfter) params.starting_after = startingAfter;

        const invoicesData = await stripeRequest(apiKey, '/invoices', params);

        for (const stripeInvoice of invoicesData.data) {
          try {
            // Check if invoice exists
            const existing = await prisma.invoice.findFirst({
              where: { stripeId: stripeInvoice.id },
            });

            if (existing) {
              summary.invoices.skipped++;
              continue;
            }

            // Find customer
            const donor = await prisma.donor.findFirst({
              where: { stripeCustomerId: stripeInvoice.customer },
            });

            if (!donor) {
              summary.invoices.skipped++;
              continue;
            }

            // Map Stripe status to our status
            const statusMap: Record<string, string> = {
              draft: 'draft',
              open: 'sent',
              paid: 'paid',
              uncollectible: 'archived',
              void: 'archived',
            };

            const hash = crypto.randomBytes(16).toString('hex');

            const invoice = await prisma.invoice.create({
              data: {
                organizationId: organization.id,
                donorId: donor.id,
                status: statusMap[stripeInvoice.status] || 'draft',
                totalAmount: (stripeInvoice.total || 0) / 100,
                paidAmount: (stripeInvoice.amount_paid || 0) / 100,
                dueDate: stripeInvoice.due_date 
                  ? new Date(stripeInvoice.due_date * 1000) 
                  : null,
                reference: stripeInvoice.number || null,
                stripeId: stripeInvoice.id,
                hash,
              },
            });

            // Import line items
            if (stripeInvoice.lines?.data) {
              for (const line of stripeInvoice.lines.data) {
                await prisma.invoiceProduct.create({
                  data: {
                    invoiceId: invoice.id,
                    productName: line.description || 'Item',
                    qty: line.quantity || 1,
                    price: (line.amount || 0) / 100 / (line.quantity || 1),
                    subtotal: (line.amount || 0) / 100,
                  },
                });
              }
            }

            summary.invoices.imported++;
          } catch (e) {
            summary.invoices.errors++;
            summary.errors.push(`Invoice ${stripeInvoice.id}: ${(e as Error).message}`);
          }
        }

        hasMore = invoicesData.has_more;
        if (hasMore && invoicesData.data.length > 0) {
          startingAfter = invoicesData.data[invoicesData.data.length - 1].id;
        }
      }
    } catch (error) {
      summary.errors.push(`Invoices import failed: ${(error as Error).message}`);
    }

    // 5. Import Payments/Charges (last 90 days)
    try {
      const ninetyDaysAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60);
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const params: Record<string, string> = { 
          limit: '100',
          created: JSON.stringify({ gte: ninetyDaysAgo }),
        };
        if (startingAfter) params.starting_after = startingAfter;

        const chargesData = await stripeRequest(apiKey, '/charges', params);

        for (const stripeCharge of chargesData.data) {
          try {
            // Check if transaction exists
            const existing = await prisma.transaction.findFirst({
              where: { fortisTransactionId: stripeCharge.id },
            });

            if (existing) {
              summary.payments.skipped++;
              continue;
            }

            // Find customer
            const donor = await prisma.donor.findFirst({
              where: { stripeCustomerId: stripeCharge.customer },
            });

            if (!donor) {
              summary.payments.skipped++;
              continue;
            }

            // Map status
            const status = stripeCharge.status === 'succeeded' ? 'P' 
              : stripeCharge.status === 'failed' ? 'N' 
              : stripeCharge.refunded ? 'R' : 'P';

            const amount = (stripeCharge.amount || 0) / 100;

            await prisma.transaction.create({
              data: {
                userId: currentUser.userId,
                donorId: donor.id,
                organizationId: organization.id,
                totalAmount: amount,
                subTotalAmount: amount,
                fee: 0,
                firstName: donor.firstName || '',
                lastName: donor.lastName || '',
                email: donor.email || '',
                source: stripeCharge.payment_method_details?.type === 'card' ? 'CC' : 'BNK',
                status,
                givingSource: 'stripe_import',
                fortisTransactionId: stripeCharge.id,
                createdAt: new Date(stripeCharge.created * 1000),
              },
            });
            summary.payments.imported++;
          } catch (e) {
            summary.payments.errors++;
            summary.errors.push(`Payment ${stripeCharge.id}: ${(e as Error).message}`);
          }
        }

        hasMore = chargesData.has_more;
        if (hasMore && chargesData.data.length > 0) {
          startingAfter = chargesData.data[chargesData.data.length - 1].id;
        }
      }
    } catch (error) {
      summary.errors.push(`Payments import failed: ${(error as Error).message}`);
    }

    // Update last sync time and stats
    await prisma.integration.update({
      where: {
        userId_provider: {
          userId: currentUser.userId,
          provider: 'stripe',
        },
      },
      data: {
        lastSync: new Date(),
        metadata: JSON.stringify({
          lastImport: {
            customers: summary.customers,
            products: summary.products,
            subscriptions: summary.subscriptions,
            invoices: summary.invoices,
            payments: summary.payments,
          },
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Stripe import completed',
      summary,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Stripe sync error:', error);
    return NextResponse.json(
      { error: 'Import failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
