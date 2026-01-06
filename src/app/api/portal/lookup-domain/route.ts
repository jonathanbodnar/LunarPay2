import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/portal/lookup-domain?domain=pay.example.com
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter required' },
        { status: 400 }
      );
    }

    // Clean the domain (remove port if present for local testing)
    const cleanDomain = domain.split(':')[0].toLowerCase();

    console.log('[PORTAL] Looking up custom domain:', cleanDomain);

    // Look up organization by custom domain
    const org = await prisma.$queryRaw<Array<{
      ch_id: number;
      portal_slug: string | null;
      portal_enabled: boolean;
      portal_custom_domain: string | null;
    }>>`
      SELECT ch_id, portal_slug, portal_enabled, portal_custom_domain
      FROM church_detail
      WHERE LOWER(portal_custom_domain) = ${cleanDomain}
      AND portal_enabled = true
      LIMIT 1
    `;

    if (!org || org.length === 0) {
      console.log('[PORTAL] No organization found for domain:', cleanDomain);
      return NextResponse.json(
        { error: 'Portal not found for this domain' },
        { status: 404 }
      );
    }

    const organization = org[0];

    if (!organization.portal_slug) {
      return NextResponse.json(
        { error: 'Portal not configured' },
        { status: 404 }
      );
    }

    console.log('[PORTAL] Found portal for domain:', cleanDomain, '-> slug:', organization.portal_slug);

    return NextResponse.json({
      portalSlug: organization.portal_slug,
      organizationId: organization.ch_id,
    });
  } catch (error) {
    console.error('Domain lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup domain' },
      { status: 500 }
    );
  }
}

