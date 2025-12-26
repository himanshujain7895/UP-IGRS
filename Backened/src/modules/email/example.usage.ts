/**
 * Email Service Usage Examples
 * 
 * This file demonstrates how to use the email service module.
 * DO NOT import this file in production code - it's for reference only.
 */

import { emailService } from './index';

/**
 * Example 1: Send a simple text email
 */
export async function exampleSimpleTextEmail() {
  try {
    const result = await emailService.sendSimpleEmail(
      'recipient@example.com',
      'Welcome to Our Service',
      'Thank you for joining our service!'
    );
    console.log('Email sent successfully:', result.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

/**
 * Example 2: Send an HTML email
 */
export async function exampleHtmlEmail() {
  try {
    const htmlBody = `
      <html>
        <body>
          <h1>Welcome!</h1>
          <p>Thank you for joining our service.</p>
          <p>Best regards,<br>The Team</p>
        </body>
      </html>
    `;
    
    const result = await emailService.sendSimpleEmail(
      'recipient@example.com',
      'Welcome Email',
      htmlBody,
      true  // isHtml = true
    );
    console.log('HTML email sent:', result.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

/**
 * Example 3: Send email with full options
 */
export async function exampleFullEmailOptions() {
  try {
    const result = await emailService.sendEmail({
      to: ['user1@example.com', 'user2@example.com'],  // Multiple recipients
      subject: 'Important Notification',
      text: 'This is the plain text version of the email.',
      html: `
        <html>
          <body>
            <h1>Important Notification</h1>
            <p>This is the HTML version of the email.</p>
          </body>
        </html>
      `,
      cc: 'manager@example.com',
      bcc: 'archive@example.com',
      replyTo: 'support@example.com',
    });
    console.log('Email sent:', result.messageId);
    console.log('Accepted recipients:', result.accepted);
    console.log('Rejected recipients:', result.rejected);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

/**
 * Example 4: Send email with attachment
 */
export async function exampleEmailWithAttachment() {
  try {
    const result = await emailService.sendEmail({
      to: 'recipient@example.com',
      subject: 'Document Attached',
      text: 'Please find the attached document.',
      html: '<p>Please find the attached document.</p>',
      attachments: [
        {
          filename: 'document.pdf',
          path: '/path/to/document.pdf',  // File path
        },
        {
          filename: 'report.txt',
          content: 'This is the content of the report',  // Direct content
        },
      ],
    });
    console.log('Email with attachment sent:', result.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

/**
 * Example 5: Verify SMTP connection
 */
export async function exampleVerifyConnection() {
  try {
    const isConnected = await emailService.verifyConnection();
    if (isConnected) {
      console.log('✅ SMTP connection verified successfully');
    } else {
      console.error('❌ SMTP connection verification failed');
    }
  } catch (error) {
    console.error('Error verifying connection:', error);
  }
}

/**
 * Example 6: Error handling with specific error types
 */
export async function exampleErrorHandling() {
  try {
    await emailService.sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Email',
      text: 'This is a test email',
    });
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('not initialized')) {
        console.error('Email service is not configured. Please check SMTP settings.');
      } else if (error.message.includes('authentication')) {
        console.error('SMTP authentication failed. Please check credentials.');
      } else if (error.message.includes('timeout')) {
        console.error('SMTP connection timeout. Please check network settings.');
      } else {
        console.error('Email sending failed:', error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }
  }
}

/**
 * Example 7: Using in an Express route handler
 */
/*
import { Request, Response } from 'express';
import { emailService } from '../modules/email';

export async function sendNotificationEmail(req: Request, res: Response) {
  try {
    const { recipientEmail, subject, message } = req.body;

    // Validate input
    if (!recipientEmail || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recipientEmail, subject, message',
      });
    }

    // Send email
    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject,
      html: message,
    });

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
*/

