/**
 * Email Module Types
 * Type definitions for email service
 */

/**
 * Email sending options
 */
export interface EmailOptions {
  /** Recipient email address(es) - can be a single email or comma-separated string */
  to: string | string[];
  /** Email subject */
  subject: string;
  /** Plain text body of the email */
  text?: string;
  /** HTML body of the email */
  html?: string;
  /** CC recipients (optional) */
  cc?: string | string[];
  /** BCC recipients (optional) */
  bcc?: string | string[];
  /** Reply-to address (optional) */
  replyTo?: string;
  /** Email attachments (optional) */
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
    contentType?: string;
  }>;
}

/**
 * Email sending result
 */
export interface EmailResult {
  /** Message ID from the email server */
  messageId: string;
  /** Response from the email server */
  response: string;
  /** Whether the email was accepted by the server */
  accepted: string[];
  /** Rejected recipients (if any) */
  rejected: string[];
}

/**
 * SMTP configuration interface
 */
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  /** Connection pool option for better performance */
  pool?: boolean;
  /** Maximum number of connections in the pool */
  maxConnections?: number;
  /** Maximum number of messages per connection */
  maxMessages?: number;
}
