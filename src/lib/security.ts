/**
 * Security utilities for input validation and security headers
 */

import { NextResponse } from 'next/server';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Sanitize string input (remove potentially dangerous characters)
 */
export function sanitizeString(input: string, maxLength?: number): string {
  let sanitized = input.trim();
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate amount (must be positive number)
 */
export function isValidAmount(amount: number | string): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0 && num <= 1000000; // Max $1M per transaction
}

/**
 * Validate transaction ID format
 */
export function isValidTransactionId(id: string | number | bigint): boolean {
  try {
    const num = typeof id === 'string' ? BigInt(id) : BigInt(id);
    return num > 0n;
  } catch {
    return false;
  }
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (basic)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  
  return response;
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use Redis or a proper rate limiting service
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // Create new record
    const resetTime = now + windowMs;
    rateLimitMap.set(identifier, { count: 1, resetTime });
    
    // Clean up old entries periodically
    if (rateLimitMap.size > 10000) {
      for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
          rateLimitMap.delete(key);
        }
      }
    }
    
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Validate and sanitize request body
 */
export function validateRequestBody<T extends Record<string, any>>(
  body: any,
  schema: Record<keyof T, (value: any) => boolean>
): { valid: boolean; errors: string[]; sanitized?: T } {
  const errors: string[] = [];

  for (const [key, validator] of Object.entries(schema)) {
    const value = body[key];
    
    if (value === undefined || value === null) {
      errors.push(`Missing required field: ${key}`);
      continue;
    }

    if (!validator(value)) {
      errors.push(`Invalid value for field: ${key}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Sanitize string fields
  const sanitized = { ...body };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]);
    }
  }

  return { valid: true, errors: [], sanitized: sanitized as T };
}

