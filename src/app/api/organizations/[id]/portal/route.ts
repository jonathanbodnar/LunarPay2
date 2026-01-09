import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { addCustomHostname, deleteCustomHostname, getCustomHostnameStatus, getDcvDelegationTarget, getPortalCnameTarget } from '@/lib/cloudflare';
import { addRailwayCustomDomain } from '@/lib/railway';

const portalSettingsSchema = z.object({
  portalSlug: z.string()
    .min(3, 'Portal slug must be at least 3 characters')
    .max(100, 'Portal slug must be 100 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Portal slug can only contain lowercase letters, numbers, and hyphens')
    .transform(val => val || null),
  portalEnabled: z.boolean().optional(),
  portalCustomDomain: z.string().max(255).optional().nullable().transform(val => val?.trim() || null),
  portalTitle: z.string().max(255).optional().nullable().transform(val => val?.trim() || null),
  portalDescription: z.string().max(1000).optional().nullable().transform(val => val?.trim() || null),
});

// GET /api/organizations/:id/portal - Get portal settings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const organizationId = parseInt(id);

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        portalSlug: true,
        portalEnabled: true,
        portalCustomDomain: true,
        portalTitle: true,
        portalDescription: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // If custom domain exists, fetch validation records from Cloudflare
    let customDomain = null;
    if (organization.portalCustomDomain) {
      const cfStatus = await getCustomHostnameStatus(organization.portalCustomDomain);
      customDomain = {
        cnameTarget: getPortalCnameTarget(),
        validationRecords: cfStatus.validationRecords || [],
        status: cfStatus.status,
        sslStatus: cfStatus.sslStatus,
      };
    }

    return NextResponse.json({ organization, customDomain });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get portal settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/:id/portal - Update portal settings
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const organizationId = parseInt(id);
    const body = await request.json();

    const validatedData = portalSettingsSchema.parse(body);

    // Verify organization belongs to user
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      select: {
        id: true,
        portalCustomDomain: true,
        // Note: primaryColor, backgroundColor, buttonTextColor columns don't exist in database
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if portal slug is already taken by another org
    if (validatedData.portalSlug) {
      const existingSlug = await prisma.organization.findFirst({
        where: {
          OR: [
            { portalSlug: validatedData.portalSlug },
            { slug: validatedData.portalSlug },
          ],
          id: { not: organizationId },
        },
        select: {
          id: true,
          // Note: primaryColor, backgroundColor, buttonTextColor columns don't exist in database
        },
      });

      if (existingSlug) {
        return NextResponse.json(
          { error: 'This portal URL is already taken' },
          { status: 400 }
        );
      }
    }

    // Handle custom domain changes with Cloudflare
    let cloudflareResult = null;
    const oldCustomDomain = organization.portalCustomDomain;
    const newCustomDomain = validatedData.portalCustomDomain;

    // If custom domain changed
    if (oldCustomDomain !== newCustomDomain) {
      // Delete old custom hostname from Cloudflare if it existed
      if (oldCustomDomain) {
        console.log('[PORTAL] Removing old custom domain from Cloudflare:', oldCustomDomain);
        await deleteCustomHostname(oldCustomDomain);
      }

      // Add new custom hostname to Cloudflare and Railway if provided
      if (newCustomDomain) {
        console.log('[PORTAL] Adding new custom domain to Cloudflare:', newCustomDomain);
        cloudflareResult = await addCustomHostname(newCustomDomain);
        
        if (!cloudflareResult.success) {
          console.error('[PORTAL] Failed to add custom domain to Cloudflare:', cloudflareResult.error);
          // Don't fail the request, just warn
        }

        // Also add to Railway so it accepts the hostname
        console.log('[PORTAL] Adding new custom domain to Railway:', newCustomDomain);
        const railwayResult = await addRailwayCustomDomain(newCustomDomain);
        
        if (!railwayResult.success) {
          console.error('[PORTAL] Failed to add custom domain to Railway:', railwayResult.error);
          // Don't fail the request, Railway domain can be added later
        } else {
          console.log('[PORTAL] Successfully added custom domain to Railway');
        }
      }
    }

    // Update organization with portal settings
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        portalSlug: validatedData.portalSlug,
        portalEnabled: validatedData.portalEnabled,
        portalCustomDomain: validatedData.portalCustomDomain || null,
        portalTitle: validatedData.portalTitle || null,
        portalDescription: validatedData.portalDescription || null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        portalSlug: true,
        portalEnabled: true,
        portalCustomDomain: true,
        portalTitle: true,
        portalDescription: true,
      },
    });

    // Include DNS instructions in the response if a custom domain was added
    const dnsInstructions = newCustomDomain ? {
      cnameTarget: getPortalCnameTarget(),
      dcvTarget: getDcvDelegationTarget(),
      steps: [
        `Add CNAME record: ${newCustomDomain} → ${getPortalCnameTarget()}`,
        `Add TXT record for hostname validation (value provided by Cloudflare)`,
        `Add DCV CNAME record: _acme-challenge.${newCustomDomain} → ${getDcvDelegationTarget()}`,
      ],
      validationRecords: cloudflareResult?.validationRecords || [],
      cloudflareStatus: cloudflareResult?.success ? 'added' : 'failed',
      cloudflareError: cloudflareResult?.error,
    } : null;

    return NextResponse.json({ 
      organization: updatedOrganization,
      customDomain: dnsInstructions,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update portal settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

