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

    if (!sessionToken) {
      return null;
    }

    const session = await prisma.customerSession.findUnique({
      where: { token: sessionToken },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      customerId: session.donorId,
      organizationId: session.organizationId,
      customer: session.donor,
    };
  } catch (error) {
    console.error('Get portal session error:', error);
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

