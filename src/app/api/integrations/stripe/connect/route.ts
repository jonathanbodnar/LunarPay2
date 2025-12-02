import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST() {
  try {
    const currentUser = await requireAuth();

    // Stripe OAuth URL
    const clientId = process.env.STRIPE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/stripe/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Stripe integration not configured' },
        { status: 500 }
      );
    }

    const authUrl = `https://connect.stripe.com/oauth/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `scope=read_write&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${currentUser.userId}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Stripe connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


