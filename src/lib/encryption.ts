/**
 * Encryption utilities for sensitive data like bank account numbers
 * Using AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';

// Lazy-loaded encryption key to avoid build-time errors
let _encryptionKey: string | null = null;

const getEncryptionKey = (): string => {
  if (_encryptionKey) return _encryptionKey;
  
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // Allow build to complete, but warn
    if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
      // During build, return a dummy key (won't be used for actual encryption)
      return crypto.randomBytes(32).toString('hex');
    }
    console.warn('WARNING: ENCRYPTION_KEY not set in environment. Using temporary key. This is not secure for production!');
    _encryptionKey = crypto.randomBytes(32).toString('hex');
    return _encryptionKey;
  }
  // Ensure key is 64 hex characters (32 bytes)
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  _encryptionKey = key;
  return _encryptionKey;
};
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Derive key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
}

/**
 * Encrypt sensitive data (e.g., bank account numbers)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(getEncryptionKey(), salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Return: salt:iv:tag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';
  
  const parts = encryptedData.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }
  
  const [saltHex, ivHex, tagHex, encrypted] = parts;
  
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const key = deriveKey(getEncryptionKey(), salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Get last 4 digits of a number (for display purposes)
 */
export function getLast4Digits(value: string): string {
  if (!value || value.length < 4) return '';
  return value.slice(-4);
}

