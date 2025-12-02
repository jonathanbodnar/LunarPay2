import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST() {
  try {
    const currentUser = await requireAuth();

    const clientId = process.env.FRESHBOOKS_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/freshbooks/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'FreshBooks integration not configured' },
        { status: 500 }
      );
    }

    const authUrl = `https://auth.freshbooks.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${currentUser.userId}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('FreshBooks connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

