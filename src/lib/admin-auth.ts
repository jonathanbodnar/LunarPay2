// Super Admin Authentication
// This is for LunarPay platform administrators only

import { cookies } from 'next/headers';
import { sign, verify } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const ADMIN_COOKIE_NAME = 'lunarpay_admin_token';

// Helper functions to get env vars at runtime (not module load time)
function getAdminJwtSecret(): string | undefined {
  return process.env.ADMIN_JWT_SECRET;
}

function getAdminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL;
}

function getAdminPasswordHash(): string | undefined {
  return process.env.ADMIN_PASSWORD_HASH;
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
  const adminEmail = getAdminEmail();
  const adminPasswordHash = getAdminPasswordHash();
  
  if (!adminEmail || !adminPasswordHash) {
    console.error('[ADMIN AUTH] Admin credentials not configured. ADMIN_EMAIL:', !!adminEmail, 'ADMIN_PASSWORD_HASH:', !!adminPasswordHash);
    return false;
  }
  
  if (email !== adminEmail) {
    console.error('[ADMIN AUTH] Email mismatch. Expected:', adminEmail, 'Got:', email);
    return false;
  }
  
  // Compare password against stored hash
  const isValid = await bcrypt.compare(password, adminPasswordHash);
  if (!isValid) {
    console.error('[ADMIN AUTH] Password hash comparison failed');
  }
  return isValid;
}

/**
 * Generate admin JWT token
 */
export function generateAdminToken(email: string): string {
  const secret = getAdminJwtSecret();
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET environment variable is required');
  }
  return sign(
    { email, isSuperAdmin: true },
    secret,
    { expiresIn: '24h' }
  );
}

/**
 * Verify admin JWT token
 */
export function verifyAdminToken(token: string): AdminJWTPayload | null {
  const secret = getAdminJwtSecret();
  if (!secret) {
    console.error('[ADMIN AUTH] ADMIN_JWT_SECRET not configured');
    return null;
  }
  try {
    const decoded = verify(token, secret) as AdminJWTPayload;
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

