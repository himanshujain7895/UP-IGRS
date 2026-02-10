/**
 * Password Reset Service
 * OTP-based forgot password for admin/officer users.
 * Handles validation, rate limits (per email), user existence check, and OTP lifecycle.
 * Sends email via auth emails module (separation of concerns).
 */

import { User } from '../models/User';
import { PasswordResetOTP } from '../models/PasswordResetOTP';
import { sendPasswordResetOTP } from '../modules/email/authEmails.service';
import { ValidationError } from '../utils/errors';
import logger from '../config/logger';
import bcrypt from 'bcryptjs';

const OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;
const MAX_REQUESTS_PER_EMAIL_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds between resends for same email
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 128;
const EMAIL_MAX_LENGTH = 254;

/** Allowed roles for password reset (admin/officer only) */
const ALLOWED_ROLES = ['admin', 'officer'] as const;

/** Strict email format (no control chars, reasonable pattern) */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only digits, exactly 6 */
const OTP_REGEX = /^\d{6}$/;

/** Strip control characters and trim */
function sanitizeString(value: unknown, maxLength: number): string {
  if (value === null || value === undefined) return '';
  const s = String(value).replace(/[\x00-\x1f\x7f]/g, '').trim();
  return s.slice(0, maxLength);
}

function validateAndNormalizeEmail(email: unknown): string {
  const raw = sanitizeString(email, EMAIL_MAX_LENGTH);
  if (!raw) throw new ValidationError('Email is required');
  const normalized = raw.toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) throw new ValidationError('Invalid email format');
  return normalized;
}

function validateOTP(otp: unknown): string {
  const s = typeof otp === 'string' ? otp.replace(/\s/g, '') : String(otp);
  if (!OTP_REGEX.test(s)) throw new ValidationError('OTP must be exactly 6 digits');
  return s;
}

function validatePassword(password: unknown): string {
  const s = sanitizeString(password, PASSWORD_MAX_LENGTH);
  if (s.length < PASSWORD_MIN_LENGTH)
    throw new ValidationError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  return s;
}

function generateOTP(): string {
  return Math.floor(Math.pow(10, OTP_LENGTH - 1) + Math.random() * 9 * Math.pow(10, OTP_LENGTH - 1)).toString();
}

/**
 * Internal: create a new OTP, invalidate previous ones for this email, and send email.
 * Assumes email is already validated and normalized. Enforces per-email rate limit.
 * Used by both requestPasswordReset and resendPasswordResetOTP.
 */
async function createAndSendNewOTP(normalizedEmail: string): Promise<void> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentCount = await PasswordResetOTP.countDocuments({
    email: normalizedEmail,
    created_at: { $gte: windowStart },
  });

  if (recentCount >= MAX_REQUESTS_PER_EMAIL_PER_WINDOW) {
    logger.warn('Password reset rate limit exceeded for email', { email: normalizedEmail });
    throw new ValidationError(
      'Too many reset requests for this email. Please try again after 15 minutes.'
    );
  }

  await PasswordResetOTP.updateMany(
    { email: normalizedEmail, used_at: { $exists: false } },
    { $set: { used_at: new Date() } }
  );

  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  await PasswordResetOTP.create({
    email: normalizedEmail,
    otp,
    expires_at: expiresAt,
    attempts: 0,
    max_attempts: 5,
  });

  await sendPasswordResetOTP(normalizedEmail, otp, OTP_EXPIRY_MINUTES);
  logger.info('Password reset OTP sent', { email: normalizedEmail });
}

/**
 * Request a password reset OTP for the given email.
 * - Validates and normalizes email.
 * - Ensures user exists in DB, is active, and has role admin or officer.
 * - Enforces per-email rate limit (max N requests per 15 min).
 * - Invalidates any previous unused OTP for this email, then creates new OTP and sends email.
 * - Returns same message whether or not user exists (no user enumeration).
 */
export async function requestPasswordReset(email: unknown): Promise<{ message: string }> {
  const normalizedEmail = validateAndNormalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
    isActive: true,
    role: { $in: ALLOWED_ROLES },
  }).lean();

  if (!user) {
    logger.warn('Password reset requested for non-existent or ineligible user', { email: normalizedEmail });
    return { message: 'If an account exists with this email, you will receive a verification code shortly.' };
  }

  await createAndSendNewOTP(normalizedEmail);
  return { message: 'If an account exists with this email, you will receive a verification code shortly.' };
}

/**
 * Resend a password reset OTP to the same email.
 * - Only allowed if user already requested at least once (has a recent OTP record).
 * - Enforces same per-email rate limit and a resend cooldown (60s) to avoid burst.
 * - Invalidates previous OTP for this email and sends a new one; verification always uses the most recent.
 */
export async function resendPasswordResetOTP(email: unknown): Promise<{ message: string }> {
  const normalizedEmail = validateAndNormalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
    isActive: true,
    role: { $in: ALLOWED_ROLES },
  }).lean();

  if (!user) {
    throw new ValidationError('Invalid or expired verification. Please request a new code from the forgot password page.');
  }

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentRequest = await PasswordResetOTP.findOne({
    email: normalizedEmail,
    created_at: { $gte: windowStart },
  }).sort({ created_at: -1 });

  if (!recentRequest) {
    throw new ValidationError('Please request a verification code first from the forgot password page.');
  }

  const cooldownEnd = new Date(recentRequest.created_at.getTime() + RESEND_COOLDOWN_MS);
  if (new Date() < cooldownEnd) {
    const waitSeconds = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000);
    throw new ValidationError(`Please wait ${waitSeconds} seconds before requesting another code.`);
  }

  await createAndSendNewOTP(normalizedEmail);
  return { message: 'A new verification code has been sent to your email.' };
}

/**
 * Reset password using email + OTP + new password.
 * - Validates all inputs.
 * - Finds valid OTP record (not expired, not used, attempts under max).
 * - Verifies OTP; on failure increments attempts.
 * - Updates user password (hash) and marks OTP used.
 */
export async function resetPasswordWithOTP(
  email: unknown,
  otp: unknown,
  newPassword: unknown
): Promise<{ message: string }> {
  const normalizedEmail = validateAndNormalizeEmail(email);
  const otpValue = validateOTP(otp);
  const password = validatePassword(newPassword);

  const record = await PasswordResetOTP.findOne({
    email: normalizedEmail,
    used_at: { $exists: false },
    expires_at: { $gt: new Date() },
  }).sort({ created_at: -1 });

  if (!record) {
    throw new ValidationError('Invalid or expired verification code. Please request a new one.');
  }

  if (record.attempts >= record.max_attempts) {
    throw new ValidationError('Maximum verification attempts exceeded. Please request a new code.');
  }

  if (record.otp !== otpValue) {
    await PasswordResetOTP.updateOne(
      { id: record.id },
      { $inc: { attempts: 1 } }
    );
    throw new ValidationError('Invalid or expired verification code. Please request a new one.');
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user || !user.isActive || !ALLOWED_ROLES.includes(user.role as any)) {
    throw new ValidationError('Invalid or expired verification code. Please request a new one.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.updateOne(
    { id: user.id },
    { password: hashedPassword }
  );

  record.used_at = new Date();
  await record.save();

  logger.info('Password reset completed', { email: normalizedEmail });
  return { message: 'Password has been reset successfully. You can now sign in with your new password.' };
}
