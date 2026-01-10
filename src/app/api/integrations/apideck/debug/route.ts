import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/integrations/apideck/debug - Debug ApiDeck configuration
export async function GET() {
  try {
    const currentUser = await requireAuth();

    // Get user's organization
    const organization = await prisma.organization.findFirst({
      where: { userId: currentUser.userId },
      select: { id: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const consumerId = `org_${organization.id}`;
    const apiKey = process.env.APIDECK_API_KEY;
    const appId = process.env.APIDECK_APP_ID;

    // Check if env vars are set
    const envCheck = {
      APIDECK_API_KEY: apiKey ? `Set (${apiKey.substring(0, 8)}...)` : 'NOT SET',
      APIDECK_APP_ID: appId ? `Set (${appId})` : 'NOT SET',
    };

    if (!apiKey || !appId) {
      return NextResponse.json({
        status: 'error',
        message: 'ApiDeck environment variables not configured',
        envCheck,
        consumerId,
      });
    }

    // Try to fetch connectors directly
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'x-apideck-app-id': appId,
      'x-apideck-consumer-id': consumerId,
      'Content-Type': 'application/json',
    };

    const connectorsResponse = await fetch('https://unify.apideck.com/vault/connectors?api=accounting', {
      headers,
    });

    const connectorsText = await connectorsResponse.text();
    let connectorsData;
    try {
      connectorsData = JSON.parse(connectorsText);
    } catch {
      connectorsData = connectorsText;
    }

    // Also try to fetch connections
    const connectionsResponse = await fetch('https://unify.apideck.com/vault/connections?api=accounting', {
      headers,
    });

    const connectionsText = await connectionsResponse.text();
    let connectionsData;
    try {
      connectionsData = JSON.parse(connectionsText);
    } catch {
      connectionsData = connectionsText;
    }

    return NextResponse.json({
      status: 'success',
      envCheck,
      consumerId,
      connectors: {
        status: connectorsResponse.status,
        data: connectorsData,
      },
      connections: {
        status: connectionsResponse.status,
        data: connectionsData,
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: (error as Error).message,
    }, { status: 500 });
  }
}

