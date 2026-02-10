/**
 * Email Module
 * Main export file for email functionality
 */

export { emailService, EmailService } from './email.service';
export { sendPasswordResetOTP } from './authEmails.service';
export type { EmailOptions, EmailResult, SMTPConfig } from './types';

