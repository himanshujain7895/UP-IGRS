# Email Service Module

A clean and reliable Nodemailer SMTP module for sending emails in the backend.

## Features

- ✅ TypeScript support with full type safety
- ✅ Environment variable configuration
- ✅ Connection pooling for better performance
- ✅ Comprehensive error handling
- ✅ SMTP connection verification
- ✅ Support for plain text and HTML emails
- ✅ Support for CC, BCC, attachments, and reply-to
- ✅ Singleton pattern for efficient resource usage
- ✅ Winston logger integration

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```env
# SMTP Configuration (Required for email functionality)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com  # Optional: defaults to SMTP_USER

# Optional: Connection Pooling (for high-volume email sending)
SMTP_POOL=true  # Enable connection pooling
SMTP_MAX_CONNECTIONS=5  # Maximum connections in pool
SMTP_MAX_MESSAGES=100  # Maximum messages per connection
```

### Common SMTP Providers

#### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password
```

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=your-username
SMTP_PASS=your-password
```

**Note:** Port 465 uses SSL/TLS (secure: true), while port 587 uses STARTTLS (secure: false).

## Usage

### Basic Usage

```typescript
import { emailService } from '../modules/email';

// Send a simple text email
await emailService.sendSimpleEmail(
  'recipient@example.com',
  'Test Subject',
  'This is a test email body'
);

// Send an HTML email
await emailService.sendSimpleEmail(
  'recipient@example.com',
  'Test Subject',
  '<h1>Hello</h1><p>This is an HTML email</p>',
  true  // isHtml = true
);
```

### Advanced Usage

```typescript
import { emailService, EmailOptions } from '../modules/email';

const emailOptions: EmailOptions = {
  to: 'recipient@example.com',
  // or multiple recipients:
  // to: ['user1@example.com', 'user2@example.com'],
  subject: 'Important Notification',
  text: 'Plain text version of the email',
  html: '<h1>Important Notification</h1><p>HTML version of the email</p>',
  cc: 'cc@example.com',  // Optional
  bcc: 'bcc@example.com',  // Optional
  replyTo: 'reply@example.com',  // Optional
  attachments: [  // Optional
    {
      filename: 'document.pdf',
      path: '/path/to/document.pdf',
    },
  ],
};

try {
  const result = await emailService.sendEmail(emailOptions);
  console.log('Email sent:', result.messageId);
} catch (error) {
  console.error('Failed to send email:', error);
}
```

### Verify SMTP Connection

```typescript
import { emailService } from '../modules/email';

// Verify SMTP connection (useful for testing)
const isConnected = await emailService.verifyConnection();
if (isConnected) {
  console.log('SMTP connection verified');
} else {
  console.error('SMTP connection failed');
}
```

### Error Handling

```typescript
import { emailService } from '../modules/email';

try {
  await emailService.sendEmail({
    to: 'recipient@example.com',
    subject: 'Test',
    text: 'Test email',
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('Email error:', error.message);
  }
  // Handle error appropriately
}
```

## API Reference

### `emailService.sendEmail(options: EmailOptions): Promise<EmailResult>`

Sends an email with the provided options.

**Parameters:**
- `options.to`: Recipient email(s) - string or array of strings
- `options.subject`: Email subject (required)
- `options.text`: Plain text body (optional if html is provided)
- `options.html`: HTML body (optional if text is provided)
- `options.cc`: CC recipients (optional)
- `options.bcc`: BCC recipients (optional)
- `options.replyTo`: Reply-to address (optional)
- `options.attachments`: Array of attachment objects (optional)

**Returns:** Promise resolving to `EmailResult` with messageId, response, accepted, and rejected arrays.

### `emailService.sendSimpleEmail(to: string, subject: string, body: string, isHtml?: boolean): Promise<EmailResult>`

Convenience method for sending simple emails.

**Parameters:**
- `to`: Recipient email address
- `subject`: Email subject
- `body`: Email body (text or HTML)
- `isHtml`: Whether body is HTML (default: false)

**Returns:** Promise resolving to `EmailResult`.

### `emailService.verifyConnection(): Promise<boolean>`

Verifies the SMTP connection configuration.

**Returns:** Promise resolving to boolean indicating connection status.

### `emailService.close(): Promise<void>`

Closes the transporter connection pool (if using pooling).

## Type Definitions

```typescript
interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
    contentType?: string;
  }>;
}

interface EmailResult {
  messageId: string;
  response: string;
  accepted: string[];
  rejected: string[];
}
```

## Best Practices

1. **Always use environment variables** for SMTP credentials - never hardcode them
2. **Use App Passwords** for Gmail instead of regular passwords
3. **Enable connection pooling** (`SMTP_POOL=true`) for high-volume email sending
4. **Handle errors gracefully** - email sending can fail due to network issues
5. **Verify connection** during application startup or in a health check endpoint
6. **Use HTML emails** for better formatting, but always provide a text fallback
7. **Validate email addresses** before sending (consider using a validation library)

## Troubleshooting

### Email not sending

1. Check that all SMTP environment variables are set correctly
2. Verify SMTP credentials are correct
3. Check firewall/network settings
4. For Gmail, ensure you're using an App Password, not your regular password
5. Check the logs for detailed error messages

### Connection timeout

1. Verify SMTP_HOST and SMTP_PORT are correct
2. Check if your server allows outbound SMTP connections
3. Try using port 465 with SSL instead of 587 with STARTTLS

### Authentication failed

1. Double-check SMTP_USER and SMTP_PASS
2. For Gmail, ensure 2FA is enabled and you're using an App Password
3. Some providers require specific authentication methods

