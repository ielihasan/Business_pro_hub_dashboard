import crypto from 'crypto';

/**
 * Generate a secure random verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get token expiration date (24 hours from now)
 */
export function getTokenExpirationDate(): Date {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 24);
  return expirationDate;
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expirationDate: Date | string): boolean {
  const expDate = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
  return new Date() > expDate;
}
