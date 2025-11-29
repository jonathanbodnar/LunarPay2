import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

// Routes that are public APIs (invoices, payment links by hash)
const publicApiRoutes = ['/api/invoices/public', '/api/payment-links/public', '/api/fortis/webhooks', '/api/health', '/api/cron'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow widget routes
  if (pathname.startsWith('/widget') || pathname.startsWith('/w/')) {
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const token = request.cookies.get('lunarpay_token');

  // If no token and trying to access protected route, redirect to login
  if (!token && (pathname.startsWith('/api') || pathname.startsWith('/(dashboard)'))) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  if (token) {
    const payload = verifyToken(token.value);
    
    if (!payload) {
      // Invalid token - clear it and redirect
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('lunarpay_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};

