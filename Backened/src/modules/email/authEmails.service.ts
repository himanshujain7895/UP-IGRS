/**
 * Auth Emails Service
 * Handles sending authentication-related emails by delegating to the existing
 * email service. Keeps auth email content and templates in one place (separation of concerns).
 * Does NOT contain business logic (no DB, no OTP generation); only composes and sends.
 */

import { emailService } from './email.service';
import type { EmailResult } from './types';
import logger from '../../config/logger';

/** Default expiry text shown in email (minutes) */
const DEFAULT_EXPIRY_MINUTES = 15;

/**
 * Send password reset OTP email.
 * Uses the existing email service; this module only builds the content.
 *
 * @param to - Recipient email (already validated by caller)
 * @param otp - 6-digit OTP (plain text for email body)
 * @param expiryMinutes - How long the OTP is valid (for display in email)
 * @returns Result from email service
 */
export async function sendPasswordResetOTP(
  to: string,
  otp: string,
  expiryMinutes: number = DEFAULT_EXPIRY_MINUTES
): Promise<EmailResult> {
  const subject = 'Password reset – verification code';
  const text = [
    'You requested a password reset for your account.',
    '',
    `Your verification code is: ${otp}`,
    '',
    `This code expires in ${expiryMinutes} minutes. Do not share it with anyone.`,
    '',
    'If you did not request this, please ignore this email.',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #333; max-width: 480px; margin: 0 auto; padding: 16px;">
  <p>You requested a password reset for your account.</p>
  <p><strong>Your verification code is: <code style="font-size: 1.25rem; letter-spacing: 0.1em; background: #f0f0f0; padding: 4px 8px;">${escapeHtml(otp)}</code></strong></p>
  <p>This code expires in ${escapeHtml(String(expiryMinutes))} minutes. Do not share it with anyone.</p>
  <p style="color: #666;">If you did not request this, please ignore this email.</p>
</body>
</html>
`.trim();

  const result = await emailService.sendEmail({
    to,
    subject,
    text,
    html,
  });

  logger.info('Password reset OTP email sent', { to: maskEmail(to), messageId: result.messageId });
  return result;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 1) return '***@***';
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = Math.min(2, Math.floor(local.length / 2));
  return local.slice(0, visible) + '***' + domain;
}
