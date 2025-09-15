# Email Notifications Setup Guide

This guide will help you set up email notifications for the UrbanEye complaint system.

## Features

The email notification system sends automated emails to users when:

1. **Complaint Submitted** - Confirmation email when a complaint is successfully submitted
2. **Complaint In Progress** - Notification when an admin starts working on the complaint
3. **Complaint Resolved** - Notification when the complaint is marked as resolved
4. **Complaint Rejected** - Notification if the complaint is rejected with reason
5. **Complaint Closed** - Notification when the complaint is closed

## Email Templates

All emails are beautifully designed with:
- Responsive HTML templates
- Professional styling with gradients and modern design
- Complaint details and status information
- Direct links to view the complaint or dashboard
- Rating/review prompts for resolved complaints

## Setup Instructions

### 1. Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Copy the generated password

3. **Update Environment Variables** in `server/config.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_FROM=UrbanEye <noreply@urbaneye.com>
   ```

### 2. Other Email Services

You can also use other email services by modifying the transporter configuration in `server/services/emailService.js`:

#### SendGrid
```javascript
const transporter = nodemailer.createTransporter({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

#### Mailgun
```javascript
const transporter = nodemailer.createTransporter({
  service: 'Mailgun',
  auth: {
    user: process.env.MAILGUN_USERNAME,
    pass: process.env.MAILGUN_PASSWORD
  }
});
```

#### Custom SMTP
```javascript
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

## User Preferences

Users can control their email notification preferences through their profile settings:

- **Email Notifications**: Enable/disable email notifications
- **SMS Notifications**: For future SMS integration
- **Push Notifications**: For future push notification integration

The system respects these preferences and only sends emails when enabled.

## Testing

### Test Email Functionality

1. **Start the server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Submit a test complaint** through the frontend

3. **Check the server logs** for email sending status:
   ```
   Complaint submission email sent to: user@example.com
   ```

4. **Update complaint status** as an admin to test other email types

### Manual Testing

You can test the email service directly by creating a test script:

```javascript
const { sendComplaintSubmittedEmail } = require('./services/emailService');
const Complaint = require('./models/Complaint');
const User = require('./models/User');

// Test email sending
async function testEmail() {
  const user = await User.findOne({ email: 'test@example.com' });
  const complaint = await Complaint.findOne().populate('citizen');
  
  const result = await sendComplaintSubmittedEmail(complaint, user);
  console.log('Email result:', result);
}

testEmail();
```

## Troubleshooting

### Common Issues

1. **"Invalid login" error**:
   - Make sure you're using an App Password, not your regular Gmail password
   - Ensure 2-Factor Authentication is enabled

2. **"Connection timeout" error**:
   - Check your internet connection
   - Verify SMTP settings for custom email services

3. **Emails not being sent**:
   - Check server logs for error messages
   - Verify environment variables are set correctly
   - Ensure user has email notifications enabled

4. **Emails going to spam**:
   - Add your sending email to the recipient's contacts
   - Consider using a professional email service like SendGrid or Mailgun
   - Set up SPF, DKIM, and DMARC records for your domain

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed email sending logs in the console.

## Production Considerations

For production deployment:

1. **Use a professional email service** like SendGrid, Mailgun, or AWS SES
2. **Set up proper DNS records** (SPF, DKIM, DMARC) to prevent emails from going to spam
3. **Monitor email delivery rates** and bounce rates
4. **Implement email queuing** for high-volume applications
5. **Add email templates** for different languages if needed
6. **Set up email analytics** to track open rates and engagement

## Security Notes

- Never commit email credentials to version control
- Use environment variables for all sensitive information
- Consider using OAuth2 for Gmail instead of App Passwords in production
- Implement rate limiting for email sending to prevent abuse
- Validate email addresses before sending

## Customization

### Email Templates

You can customize the email templates in `server/services/emailService.js`:

- Modify the HTML structure and styling
- Add your organization's branding
- Include additional information or links
- Change the email subject lines

### Email Content

The templates include placeholders for:
- User name and email
- Complaint details (ID, title, category, priority, status)
- Location information
- Timestamps
- Admin names (for assignments)
- Resolution notes
- Links to the application

### Adding New Email Types

To add new email notification types:

1. Create a new template in `emailTemplates`
2. Add a new function in the email service
3. Import and use the function in the appropriate route
4. Update this documentation

## Support

If you encounter any issues with the email system:

1. Check the server logs for error messages
2. Verify your email service configuration
3. Test with a simple email first
4. Check your email service provider's documentation
5. Ensure all environment variables are correctly set

The email notification system is designed to be robust and will not fail the main application if email sending fails. All email operations are wrapped in try-catch blocks to ensure the complaint system continues to work even if emails cannot be sent.
