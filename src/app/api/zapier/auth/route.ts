import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/zapier/auth - Verify API key and return user info (for Zapier authentication test)
export async function GET(request: Request) {
  try {
    // Get API key from header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    // Support both "Bearer <key>" and just "<key>" formats
    const apiKey = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!apiKey || !apiKey.startsWith('lp_')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 401 }
      );
    }

    // Find user by API key
    const user = await prisma.user.findFirst({
      where: { apiKey },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Return user info for Zapier to display
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    });
  } catch (error) {
    console.error('Zapier auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

