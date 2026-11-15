import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../src/validations/auth.validation.js';
import {
  signToken,
  verifyToken,
  generateSecureRandomToken,
  hashToken,
} from '../src/utils/jwt.js';

describe('Authentication & Security Mechanics Tests', () => {
  it('validates registration schema and rejects mismatched passwords', () => {
    const invalidData = {
      name: 'Sanika',
      email: 'sanika@example.com',
      password: 'Password123',
      confirmPassword: 'MismatchPassword123',
      acceptTerms: true,
    };
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Passwords do not match');
    }
  });

  it('rejects registration when terms are not accepted', () => {
    const invalidData = {
      name: 'Sanika',
      email: 'sanika@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      acceptTerms: false,
    };
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('validates correct registration inputs', () => {
    const validData = {
      name: 'Sanika Patil',
      email: 'sanika@example.com',
      password: 'SecurePassword123',
      confirmPassword: 'SecurePassword123',
      acceptTerms: true,
    };
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('hashes passwords securely with bcrypt salt', async () => {
    const plaintext = 'MySecretPass123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plaintext, salt);

    expect(hash).not.toBe(plaintext);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);

    const isMatch = await bcrypt.compare(plaintext, hash);
    expect(isMatch).toBe(true);

    const wrongMatch = await bcrypt.compare('WrongPassword', hash);
    expect(wrongMatch).toBe(false);
  });

  it('signs and verifies JWT tokens correctly', () => {
    const mockUserId = '654321654321654321654321';
    const token = signToken(mockUserId);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(mockUserId);
  });

  it('generates secure random reset tokens and matching hashes', () => {
    const { rawToken, hashedToken } = generateSecureRandomToken();
    expect(rawToken).toHaveLength(64); // 32 bytes in hex = 64 chars
    expect(hashedToken).toHaveLength(64); // SHA-256 = 64 hex chars

    const computedHash = hashToken(rawToken);
    expect(computedHash).toBe(hashedToken);
  });
});
