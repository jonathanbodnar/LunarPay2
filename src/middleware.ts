import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

// Routes that are public APIs (invoices, payment links by hash)
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register', 
  '/api/auth/logout',
  '/api/invoices/public',
  '/api/payment-links/public',
  '/api/fortis/webhooks',
  '/api/health',
  '/api/cron'
];

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

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/organizations', '/invoices', '/customers', '/transactions', '/subscriptions', '/funds', '/settings', '/payment-links'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isProtectedApi = pathname.startsWith('/api') && !publicApiRoutes.some(route => pathname.startsWith(route));

  // Check for auth token in cookies
  const token = request.cookies.get('lunarpay_token');

  console.log('[MIDDLEWARE]', pathname, 'Token:', token ? 'Present' : 'Missing');

  // If no token and trying to access protected route, redirect to login
  if (!token && (isProtectedRoute || isProtectedApi)) {
    console.log('[MIDDLEWARE] No token, redirecting to login');
    if (isProtectedApi) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token if present
  if (token && (isProtectedRoute || isProtectedApi)) {
    const payload = verifyToken(token.value);
    
    if (!payload) {
      console.log('[MIDDLEWARE] Invalid token, redirecting to login');
      // Invalid token - clear it and redirect
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('lunarpay_token');
      return response;
    }
    
    console.log('[MIDDLEWARE] Token valid, allowing access');
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

