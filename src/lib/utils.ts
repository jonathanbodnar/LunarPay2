import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date | string | null, format: 'short' | 'long' = 'short'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'long') {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(d);
  }
  
  return new Intl.DateTimeFormat('en-US').format(d);
}

/**
 * Calculate fee based on percentage and fixed amount
 */
export function calculateFee(amount: number, percentage: number, fixed: number): number {
  return Math.round((amount * percentage + fixed) * 100) / 100;
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Generate slug from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Generate cryptographically secure random token
 */
export function generateRandomToken(length: number = 32): string {
  // Use crypto for secure randomness
  if (typeof window === 'undefined') {
    // Server-side: use Node.js crypto
    const crypto = require('crypto');
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  } else {
    // Client-side: use Web Crypto API
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  }
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number = 50): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase();
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phone;
}

/**
 * Get last 4 digits
 */
export function getLast4(value: string): string {
  return value.slice(-4);
}

/**
 * Get subscription frequency display text
 */
export function getSubscriptionFrequencyText(
  frequency: string | null | undefined,
  intervalCount?: number | null
): string {
  if (!frequency) return 'One-time';
  
  const freq = frequency.toLowerCase();
  
  // Handle interval count for custom frequencies
  if (intervalCount && intervalCount > 1) {
    const intervalMap: Record<string, string> = {
      'day': intervalCount === 1 ? 'Daily' : `Every ${intervalCount} days`,
      'daily': intervalCount === 1 ? 'Daily' : `Every ${intervalCount} days`,
      'week': intervalCount === 1 ? 'Weekly' : `Every ${intervalCount} weeks`,
      'weekly': intervalCount === 1 ? 'Weekly' : `Every ${intervalCount} weeks`,
      'month': intervalCount === 1 ? 'Monthly' : `Every ${intervalCount} months`,
      'monthly': intervalCount === 1 ? 'Monthly' : `Every ${intervalCount} months`,
      'year': intervalCount === 1 ? 'Yearly' : `Every ${intervalCount} years`,
      'yearly': intervalCount === 1 ? 'Yearly' : `Every ${intervalCount} years`,
      'annual': intervalCount === 1 ? 'Yearly' : `Every ${intervalCount} years`,
    };
    
    if (intervalMap[freq]) {
      return intervalMap[freq];
    }
  }
  
  const frequencyMap: Record<string, string> = {
    'daily': 'Daily',
    'day': 'Daily',
    'weekly': 'Weekly',
    'week': 'Weekly',
    'biweekly': 'Every 2 Weeks',
    'monthly': 'Monthly',
    'month': 'Monthly',
    'quarterly': 'Quarterly',
    'semiannual': 'Every 6 Months',
    'annual': 'Yearly',
    'yearly': 'Yearly',
    'year': 'Yearly',
    'one-time': 'One-time',
    'onetime': 'One-time',
  };
  
  return frequencyMap[freq] || frequency;
}
