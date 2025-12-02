import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST() {
  try {
    const currentUser = await requireAuth();

    // QuickBooks OAuth URL
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/quickbooks/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'QuickBooks integration not configured' },
        { status: 500 }
      );
    }

    const authUrl = `https://appcenter.intuit.com/connect/oauth2?` +
      `client_id=${clientId}&` +
      `scope=com.intuit.quickbooks.accounting&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${currentUser.userId}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('QuickBooks connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


