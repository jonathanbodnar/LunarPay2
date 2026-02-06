// Super Admin Authentication
// This is for LunarPay platform administrators only

import { cookies } from 'next/headers';
import { sign, verify } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// SECURITY: All secrets must be set via environment variables
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const ADMIN_COOKIE_NAME = 'lunarpay_admin_token';

// Admin credentials from environment variables
const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// Validate required environment variables at startup
if (!ADMIN_JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('ADMIN_JWT_SECRET environment variable is required in production');
}

export interface AdminJWTPayload {
  email: string;
  isSuperAdmin: true;
  iat?: number;
  exp?: number;
}

/**
 * Verify super admin credentials
 */
export async function verifySuperAdminCredentials(email: string, password: string): Promise<boolean> {
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD_HASH) {
    console.error('[ADMIN AUTH] Admin credentials not configured in environment variables');
    return false;
  }
  
  if (email !== SUPER_ADMIN_EMAIL) {
    return false;
  }
  
  // Compare password against stored hash
  return bcrypt.compare(password, SUPER_ADMIN_PASSWORD_HASH);
}

/**
 * Generate admin JWT token
 */
export function generateAdminToken(email: string): string {
  if (!ADMIN_JWT_SECRET) {
    throw new Error('ADMIN_JWT_SECRET environment variable is required');
  }
  return sign(
    { email, isSuperAdmin: true },
    ADMIN_JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify admin JWT token
 */
export function verifyAdminToken(token: string): AdminJWTPayload | null {
  if (!ADMIN_JWT_SECRET) {
    console.error('[ADMIN AUTH] ADMIN_JWT_SECRET not configured');
    return null;
  }
  try {
    const decoded = verify(token, ADMIN_JWT_SECRET) as AdminJWTPayload;
    if (decoded.isSuperAdmin) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get admin token from cookies (server-side)
 */
export async function getAdminTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME);
  return token?.value || null;
}

/**
 * Get current admin from token (server-side)
 */
export async function getCurrentAdmin(): Promise<AdminJWTPayload | null> {
  const token = await getAdminTokenFromCookies();
  
  if (!token) {
    return null;
  }

  return verifyAdminToken(token);
}

/**
 * Set admin auth cookie (server-side)
 */
export async function setAdminCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

/**
 * Clear admin auth cookie (server-side)
 */
export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

/**
 * Require admin authentication (throws if not authenticated)
 */
export async function requireAdmin(): Promise<AdminJWTPayload> {
  const admin = await getCurrentAdmin();
  
  if (!admin) {
    throw new Error('AdminUnauthorized');
  }

  return admin;
}

