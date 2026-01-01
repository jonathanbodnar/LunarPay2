import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomHostnameStatus, getDcvDelegationTarget, getPortalCnameTarget } from '@/lib/cloudflare';

// Debug endpoint to check custom domain configuration
// GET /api/admin/debug-custom-domain?domain=pay.example.com
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    const debug: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      requestedDomain: domain,
      cnameTarget: getPortalCnameTarget(),
      dcvTarget: getDcvDelegationTarget(),
      cloudflareConfigured: !!(process.env.CLOUDFLARE_ZONE_ID && process.env.CLOUDFLARE_API_TOKEN),
    };

    if (domain) {
      // Look up in database
      const org = await prisma.$queryRaw<Array<{
        id: number;
        church_name: string;
        portal_slug: string | null;
        portal_enabled: boolean;
        portal_custom_domain: string | null;
      }>>`
        SELECT id, church_name, portal_slug, portal_enabled, portal_custom_domain
        FROM church_detail
        WHERE LOWER(portal_custom_domain) = ${domain.toLowerCase()}
        LIMIT 1
      `;

      debug.databaseLookup = {
        found: org.length > 0,
        organization: org[0] || null,
      };

      // Check Cloudflare status if configured
      if (process.env.CLOUDFLARE_ZONE_ID && process.env.CLOUDFLARE_API_TOKEN) {
        const cfStatus = await getCustomHostnameStatus(domain);
        debug.cloudflareStatus = cfStatus;
      } else {
        debug.cloudflareStatus = {
          error: 'Cloudflare not configured - missing CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN',
        };
      }
    }

    // List all organizations with custom domains
    const allWithDomains = await prisma.$queryRaw<Array<{
      id: number;
      church_name: string;
      portal_slug: string | null;
      portal_enabled: boolean;
      portal_custom_domain: string | null;
    }>>`
      SELECT id, church_name, portal_slug, portal_enabled, portal_custom_domain
      FROM church_detail
      WHERE portal_custom_domain IS NOT NULL
      AND portal_custom_domain != ''
    `;

    debug.allCustomDomains = allWithDomains;

    return NextResponse.json(debug);
  } catch (error) {
    console.error('Debug custom domain error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

