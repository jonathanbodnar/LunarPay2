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
 * Supports two modes:
 * 1. ADMIN_PASSWORD_HASH - bcrypt hash (more secure, but $ chars can be mangled by some hosts)
 * 2. ADMIN_PASSWORD - plain text fallback (simpler to configure)
 */
export async function verifySuperAdminCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = getAdminEmail();
  const adminPasswordHash = getAdminPasswordHash();
  const adminPasswordPlain = process.env.ADMIN_PASSWORD;
  
  if (!adminEmail) {
    console.error('[ADMIN AUTH] ADMIN_EMAIL not configured');
    return false;
  }
  
  if (!adminPasswordHash && !adminPasswordPlain) {
    console.error('[ADMIN AUTH] Neither ADMIN_PASSWORD_HASH nor ADMIN_PASSWORD is configured');
    return false;
  }
  
  if (email !== adminEmail) {
    console.error('[ADMIN AUTH] Email mismatch');
    return false;
  }
  
  // Try bcrypt hash first if it looks valid (starts with $2)
  if (adminPasswordHash && adminPasswordHash.startsWith('$2')) {
    const isValid = await bcrypt.compare(password, adminPasswordHash);
    if (isValid) return true;
    console.error('[ADMIN AUTH] Bcrypt hash comparison failed');
  }
  
  // Fallback to plain text comparison
  if (adminPasswordPlain && password === adminPasswordPlain) {
    return true;
  }
  
  if (adminPasswordPlain) {
    console.error('[ADMIN AUTH] Plain text password comparison failed');
  }
  
  return false;
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

