import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  createVaultSession, 
  deleteConnection,
  getAvailableConnectors 
} from '@/lib/apideck';

// GET /api/integrations/apideck - Get available connectors and active connections
export async function GET() {
  try {
    const currentUser = await requireAuth();

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

    // Get available connectors from Apideck (this now uses the connections endpoint)
    const consumerId = `org_${organization.id}`;
    let apideckConfigured = false;
    let allConnectors: Array<{
      id: string;
      name: string;
      icon: string;
      category: string;
      state: string;
      serviceId: string;
    }> = [];

    try {
      const connectorsResult = await getAvailableConnectors(consumerId);
      allConnectors = connectorsResult.connectors;
      apideckConfigured = connectorsResult.configured;
    } catch (error) {
      console.error('[APIDECK] Failed to get connectors:', error);
      // Use fallback connectors
      const { APIDECK_CONNECTORS_FALLBACK } = await import('@/lib/apideck');
      allConnectors = APIDECK_CONNECTORS_FALLBACK.map(c => ({ ...c, state: 'available', serviceId: c.id }));
    }

    // Separate connected vs available connectors
    const activeConnections = allConnectors
      .filter(conn => conn.state === 'callable')
      .map(conn => ({
        id: conn.id,
        serviceId: conn.serviceId,
        name: conn.name,
        icon: conn.icon,
      }));

    // Available connectors are ones not yet connected (state !== 'callable')
    const availableConnectors = allConnectors
      .filter(conn => conn.state !== 'callable')
      .map(conn => ({
        id: conn.serviceId,
        name: conn.name,
        icon: conn.icon,
        category: conn.category,
      }));

    return NextResponse.json({
      connectors: availableConnectors,
      connections: activeConnections,
      apideckConfigured,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get Apideck integrations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/integrations/apideck - Create a Vault session to connect an integration
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const { connectorId } = body;

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

    // Create Vault session
    const consumerId = `org_${organization.id}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com';
    const redirectUri = `${baseUrl}/settings/integrations?connected=true`;

    const session = await createVaultSession(consumerId, redirectUri, connectorId);

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create connection session. Please check Apideck configuration.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionUrl: session.sessionUrl,
      sessionToken: session.sessionToken,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create Apideck session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/apideck - Disconnect an integration
export async function DELETE(request: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

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

    // Delete connection
    const consumerId = `org_${organization.id}`;
    const success = await deleteConnection(consumerId, serviceId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to disconnect integration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete Apideck connection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

