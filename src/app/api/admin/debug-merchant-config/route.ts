import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to check merchant-specific Fortis credentials
 * GET /api/admin/debug-merchant-config?orgId=1
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId parameter required' }, { status: 400 });
    }
    
    const organization = await prisma.organization.findUnique({
      where: { id: parseInt(orgId) },
      include: {
        fortisOnboarding: true,
      },
    });
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    const fortis = organization.fortisOnboarding;
    
    const config = {
      organization: {
        id: organization.id,
        name: organization.name,
      },
      fortisOnboarding: fortis ? {
        id: fortis.id,
        appStatus: fortis.appStatus,
        authUserId: fortis.authUserId ? `${fortis.authUserId.slice(0, 8)}... (len: ${fortis.authUserId.length})` : 'NOT SET',
        authUserApiKey: fortis.authUserApiKey ? `${fortis.authUserApiKey.slice(0, 8)}... (len: ${fortis.authUserApiKey.length})` : 'NOT SET',
        locationId: fortis.locationId || 'NOT SET',
        mpaLink: fortis.mpaLink ? 'SET (hidden)' : 'NOT SET',
        createdAt: fortis.createdAt,
        updatedAt: fortis.updatedAt,
      } : 'No Fortis onboarding record',
      environment: process.env.fortis_environment,
      expectedUserId: '11efc6da833b85e2b082446a', // Apollo's user ID
      expectedApiKey: '11efceca15015690913b3ff5', // Apollo's API key
      expectedLocationId: '11efc6d85288cf1aaa096bfc', // Apollo's location ID
    };
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Debug merchant config error:', error);
    return NextResponse.json({ error: 'Failed to get config' }, { status: 500 });
  }
}

