import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export interface PortalSession {
  customerId: number;
  organizationId: number;
  customer: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

export async function getPortalSession(): Promise<PortalSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('portal_session')?.value;

    console.log('[PORTAL-AUTH] Session token:', sessionToken ? sessionToken.substring(0, 10) + '...' : 'MISSING');

    if (!sessionToken) {
      return null;
    }

    // Use raw SQL for reliability (Prisma model might not be synced)
    const sessions = await prisma.$queryRaw<Array<{
      id: string;
      donor_id: number;
      organization_id: number;
      expires_at: Date;
    }>>`
      SELECT id, donor_id, organization_id, expires_at
      FROM customer_sessions
      WHERE token = ${sessionToken}
      LIMIT 1
    `;

    console.log('[PORTAL-AUTH] Session query result:', sessions.length > 0 ? 'found' : 'not found');

    if (!sessions || sessions.length === 0) {
      return null;
    }

    const session = sessions[0];

    if (new Date(session.expires_at) < new Date()) {
      console.log('[PORTAL-AUTH] Session expired');
      return null;
    }

    // Get customer info
    const customers = await prisma.$queryRaw<Array<{
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    }>>`
      SELECT id, first_name, last_name, email
      FROM account_donor
      WHERE id = ${session.donor_id}
      LIMIT 1
    `;

    if (!customers || customers.length === 0) {
      console.log('[PORTAL-AUTH] Customer not found for session');
      return null;
    }

    const customer = customers[0];

    console.log('[PORTAL-AUTH] Session valid for customer:', customer.email);

    return {
      customerId: session.donor_id,
      organizationId: session.organization_id,
      customer: {
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
      },
    };
  } catch (error) {
    console.error('[PORTAL-AUTH] Get portal session error:', error);
    return null;
  }
}

export async function requirePortalAuth(): Promise<PortalSession> {
  const session = await getPortalSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

// Redeploy trigger Wed Dec 31 14:57:12 CST 2025
