/**
 * Email Service Module
 * Handles email sending using Nodemailer SMTP
 */

import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import { env } from '../../config/env';
import logger from '../../config/logger';
import { EmailOptions, EmailResult, SMTPConfig } from './types';

/**
 * Email Service Class
 * Provides methods for sending emails via SMTP
 */
export class EmailService {
  private transporter: Transporter | null = null;
  private isInitialized: boolean = false;
  private readonly fromEmail: string;

  constructor() {
    // Get sender email from environment (fixed sender)
    this.fromEmail = env.SMTP_FROM_EMAIL || env.SMTP_USER || '';
    
    // Initialize transporter if SMTP is configured
    if (this.isSMTPConfigured()) {
      this.initializeTransporter();
    } else {
      logger.warn('⚠️  SMTP not configured. Email service will not be available.');
    }
  }

  /**
   * Check if SMTP is properly configured
   */
  private isSMTPConfigured(): boolean {
    return !!(
      env.SMTP_HOST &&
      env.SMTP_PORT &&
      env.SMTP_USER &&
      env.SMTP_PASS
    );
  }

  /**
   * Initialize the Nodemailer transporter
   */
  private initializeTransporter(): void {
    try {
      const smtpConfig: SMTPConfig = {
        host: env.SMTP_HOST!,
        port: env.SMTP_PORT!,
        secure: env.SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
          user: env.SMTP_USER!,
          pass: env.SMTP_PASS!,
        },
        // Enable connection pooling for better performance
        pool: env.SMTP_POOL || false,
        maxConnections: env.SMTP_MAX_CONNECTIONS || 5,
        maxMessages: env.SMTP_MAX_MESSAGES || 100,
      };

      this.transporter = nodemailer.createTransport(smtpConfig);
      this.isInitialized = true;

      logger.info('✅ Email service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize email service:', error);
      this.transporter = null;
      this.isInitialized = false;
    }
  }

  /**
   * Verify SMTP connection
   * Call this method to test the SMTP configuration
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Email transporter not initialized');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('✅ SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('❌ SMTP connection verification failed:', error);
      return false;
    }
  }

  /**
   * Send an email
   * @param options - Email options (to, subject, text/html, etc.)
   * @returns Promise resolving to email result
   * @throws Error if email sending fails
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.transporter || !this.isInitialized) {
      throw new Error('Email service is not initialized. Please check SMTP configuration.');
    }

    // Validate required fields
    if (!options.to) {
      throw new Error('Recipient email address (to) is required');
    }

    if (!options.subject) {
      throw new Error('Email subject is required');
    }

    if (!options.text && !options.html) {
      throw new Error('Either text or html body is required');
    }

    try {
      const mailOptions = {
        from: this.fromEmail,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        replyTo: options.replyTo,
        attachments: options.attachments,
      };

      // Remove undefined fields
      Object.keys(mailOptions).forEach((key) => {
        if (mailOptions[key as keyof typeof mailOptions] === undefined) {
          delete mailOptions[key as keyof typeof mailOptions];
        }
      });

      logger.debug('Sending email', {
        to: mailOptions.to,
        subject: mailOptions.subject,
      });

      const info: SentMessageInfo = await this.transporter.sendMail(mailOptions);

      const result: EmailResult = {
        messageId: info.messageId || '',
        response: info.response || '',
        accepted: Array.isArray(info.accepted) ? info.accepted : [],
        rejected: Array.isArray(info.rejected) ? info.rejected : [],
      };

      logger.info('✅ Email sent successfully', {
        messageId: result.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });

      return result;
    } catch (error) {
      logger.error('❌ Failed to send email:', {
        error: error instanceof Error ? error.message : String(error),
        to: options.to,
        subject: options.subject,
      });
      throw error;
    }
  }

  /**
   * Send a simple email (convenience method)
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param body - Email body (can be plain text or HTML)
   * @param isHtml - Whether the body is HTML (default: false)
   * @returns Promise resolving to email result
   */
  async sendSimpleEmail(
    to: string,
    subject: string,
    body: string,
    isHtml: boolean = false
  ): Promise<EmailResult> {
    const options: EmailOptions = {
      to,
      subject,
      ...(isHtml ? { html: body } : { text: body }),
    };

    return this.sendEmail(options);
  }

  /**
   * Close the transporter connection pool (if using pooling)
   */
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      logger.info('Email transporter closed');
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Default export for convenience
export default EmailService;

