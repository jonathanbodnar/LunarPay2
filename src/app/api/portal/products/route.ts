import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPortalSession } from '@/lib/portal-auth';

// GET /api/portal/products - Get products available on the portal
export async function GET() {
  try {
    const session = await getPortalSession();

    console.log('[PORTAL PRODUCTS] Session:', session ? `orgId=${session.organizationId}` : 'null');

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use raw SQL to avoid any Prisma mapping issues
    const products = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      description: string | null;
      price: string;
      qty: number | null;
      is_subscription: boolean;
      subscription_interval: string | null;
      subscription_interval_count: number | null;
      subscription_trial_days: number | null;
      file_hash: string | null;
    }>>`
      SELECT id, name, description, price, qty, is_subscription, 
             subscription_interval, subscription_interval_count, 
             subscription_trial_days, file_hash
      FROM products
      WHERE church_id = ${session.organizationId}
      AND show_on_portal = true
      AND (trash = false OR trash IS NULL)
      ORDER BY name ASC
    `;

    console.log('[PORTAL PRODUCTS] Found:', products.length, 'products');

    // Transform to camelCase for frontend
    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      qty: p.qty,
      isSubscription: p.is_subscription,
      subscriptionInterval: p.subscription_interval,
      subscriptionIntervalCount: p.subscription_interval_count,
      subscriptionTrialDays: p.subscription_trial_days,
      fileHash: p.file_hash,
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error('Get portal products error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

