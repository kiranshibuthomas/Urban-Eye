const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  // For development, you can use Gmail SMTP or other email services
  // For production, consider using services like SendGrid, Mailgun, or AWS SES
  
  // If using Gmail, uncomment this section:
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password' // Use App Password for Gmail
    }
  });

  // For testing with Ethereal Email (temporary), uncomment this section:
  // return nodemailer.createTransporter({
  //   host: 'smtp.ethereal.email',
  //   port: 587,
  //   auth: {
  //     user: 'ethereal.user@ethereal.email',
  //     pass: 'verysecret'
  //   }
  // });
};

// Email templates
const emailTemplates = {
  complaintSubmitted: (complaint, user) => ({
    subject: `Complaint Submitted Successfully - ${complaint.complaintId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint Submitted</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .complaint-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .status-pending { background: #fff3cd; color: #856404; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 25px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ UrbanEye</h1>
            <h2>Complaint Submitted Successfully</h2>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>Thank you for reporting an issue through UrbanEye. Your complaint has been successfully submitted and is now under review.</p>
            
            <div class="complaint-details">
              <h3>Complaint Details</h3>
              <p><strong>Complaint ID:</strong> ${complaint.complaintId}</p>
              <p><strong>Title:</strong> ${complaint.title}</p>
              <p><strong>Category:</strong> ${complaint.category.replace(/_/g, ' ').toUpperCase()}</p>
              <p><strong>Priority:</strong> ${complaint.priority.toUpperCase()}</p>
              <p><strong>Status:</strong> <span class="status-badge status-pending">${complaint.status.toUpperCase()}</span></p>
              <p><strong>Location:</strong> ${complaint.address}, ${complaint.city}</p>
              <p><strong>Submitted:</strong> ${new Date(complaint.submittedAt).toLocaleString()}</p>
            </div>
            
            <p>We will keep you updated on the progress of your complaint. You can track its status by logging into your UrbanEye account.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Dashboard</a>
            </div>
            
            <p>If you have any questions or need to provide additional information, please don't hesitate to contact us.</p>
            
            <div class="footer">
              <p>Best regards,<br>The UrbanEye Team</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  complaintInProgress: (complaint, user, adminName) => ({
    subject: `Complaint Update - In Progress - ${complaint.complaintId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint In Progress</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .complaint-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4facfe; }
          .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .status-progress { background: #d1ecf1; color: #0c5460; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 25px; background: #4facfe; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ UrbanEye</h1>
            <h2>Complaint Update - In Progress</h2>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>Good news! Your complaint is now being actively worked on by our team.</p>
            
            <div class="complaint-details">
              <h3>Complaint Details</h3>
              <p><strong>Complaint ID:</strong> ${complaint.complaintId}</p>
              <p><strong>Title:</strong> ${complaint.title}</p>
              <p><strong>Status:</strong> <span class="status-badge status-progress">IN PROGRESS</span></p>
              <p><strong>Assigned to:</strong> ${adminName || 'Administrative Team'}</p>
              <p><strong>Location:</strong> ${complaint.address}, ${complaint.city}</p>
              <p><strong>Updated:</strong> ${new Date(complaint.lastUpdated).toLocaleString()}</p>
            </div>
            
            <p>Our team is now working on resolving your issue. We will continue to keep you updated on the progress.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="btn">View Details</a>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>The UrbanEye Team</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  complaintResolved: (complaint, user, resolutionNotes) => ({
    subject: `Complaint Resolved - ${complaint.complaintId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint Resolved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .complaint-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #56ab2f; }
          .resolution-notes { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #56ab2f; }
          .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .status-resolved { background: #d4edda; color: #155724; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 25px; background: #56ab2f; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .rating-section { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ UrbanEye</h1>
            <h2>✅ Complaint Resolved</h2>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>Great news! Your complaint has been successfully resolved.</p>
            
            <div class="complaint-details">
              <h3>Complaint Details</h3>
              <p><strong>Complaint ID:</strong> ${complaint.complaintId}</p>
              <p><strong>Title:</strong> ${complaint.title}</p>
              <p><strong>Status:</strong> <span class="status-badge status-resolved">RESOLVED</span></p>
              <p><strong>Location:</strong> ${complaint.address}, ${complaint.city}</p>
              <p><strong>Resolved on:</strong> ${new Date(complaint.resolvedAt).toLocaleString()}</p>
            </div>
            
            ${resolutionNotes ? `
            <div class="resolution-notes">
              <h3>Resolution Details</h3>
              <p>${resolutionNotes}</p>
            </div>
            ` : ''}
            
            <div class="rating-section">
              <h3>How was our service?</h3>
              <p>We'd love to hear your feedback about how we handled your complaint.</p>
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="btn">Rate & Review</a>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Dashboard</a>
            </div>
            
            <p>Thank you for using UrbanEye to help improve our community!</p>
            
            <div class="footer">
              <p>Best regards,<br>The UrbanEye Team</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  complaintRejected: (complaint, user, reason) => ({
    subject: `Complaint Rejected - ${complaint.complaintId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .complaint-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b; }
          .rejection-reason { background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545; }
          .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .status-rejected { background: #f8d7da; color: #721c24; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 25px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ UrbanEye</h1>
            <h2>Complaint Update</h2>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>We have reviewed your complaint and unfortunately, we are unable to proceed with it at this time.</p>
            
            <div class="complaint-details">
              <h3>Complaint Details</h3>
              <p><strong>Complaint ID:</strong> ${complaint.complaintId}</p>
              <p><strong>Title:</strong> ${complaint.title}</p>
              <p><strong>Status:</strong> <span class="status-badge status-rejected">REJECTED</span></p>
              <p><strong>Location:</strong> ${complaint.address}, ${complaint.city}</p>
              <p><strong>Updated:</strong> ${new Date(complaint.lastUpdated).toLocaleString()}</p>
            </div>
            
            ${reason ? `
            <div class="rejection-reason">
              <h3>Reason for Rejection</h3>
              <p>${reason}</p>
            </div>
            ` : ''}
            
            <p>If you believe this decision was made in error or if you have additional information that might help us reconsider, please feel free to submit a new complaint with more details.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/report-issue" class="btn">Submit New Complaint</a>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>The UrbanEye Team</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordResetOTP: (user, otp) => ({
    subject: 'UrbanEye - Password Reset Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-container { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #ef4444; }
          .otp-code { font-size: 32px; font-weight: bold; color: #ef4444; letter-spacing: 8px; margin: 20px 0; }
          .warning { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ UrbanEye</h1>
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>We received a request to reset your password for your UrbanEye account. Use the code below to verify your identity and reset your password:</p>
            
            <div class="otp-container">
              <h3>Your Password Reset Code</h3>
              <div class="otp-code">${otp}</div>
              <p><strong>This code will expire in 10 minutes.</strong></p>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong></p>
              <ul style="text-align: left; margin: 10px 0;">
                <li>Never share this code with anyone</li>
                <li>UrbanEye will never ask for your password reset code</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Your password will remain unchanged until you complete the reset process</li>
              </ul>
            </div>
            
            <p>Enter this code in the password reset page to create a new password for your account.</p>
            
            <div class="footer">
              <p>Best regards,<br>The UrbanEye Team</p>
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  otpVerification: (user, otp) => ({
    subject: 'UrbanEye - Email Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-container { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #10b981; }
          .otp-code { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ UrbanEye</h1>
            <h2>Email Verification</h2>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>Thank you for registering with UrbanEye! To complete your account setup, please verify your email address using the code below:</p>
            
            <div class="otp-container">
              <h3>Your Verification Code</h3>
              <div class="otp-code">${otp}</div>
              <p><strong>This code will expire in 10 minutes.</strong></p>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong></p>
              <ul style="text-align: left; margin: 10px 0;">
                <li>Never share this code with anyone</li>
                <li>UrbanEye will never ask for your verification code</li>
                <li>If you didn't request this code, please ignore this email</li>
              </ul>
            </div>
            
            <p>Enter this code in the verification page to complete your registration and start using UrbanEye.</p>
            
            <div class="footer">
              <p>Best regards,<br>The UrbanEye Team</p>
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  complaintClosed: (complaint, user) => ({
    subject: `Complaint Closed - ${complaint.complaintId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint Closed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6c757d 0%, #adb5bd 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .complaint-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d; }
          .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .status-closed { background: #e2e3e5; color: #383d41; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 25px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ UrbanEye</h1>
            <h2>Complaint Closed</h2>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>Your complaint has been closed. This typically happens when the issue has been resolved or when no further action is required.</p>
            
            <div class="complaint-details">
              <h3>Complaint Details</h3>
              <p><strong>Complaint ID:</strong> ${complaint.complaintId}</p>
              <p><strong>Title:</strong> ${complaint.title}</p>
              <p><strong>Status:</strong> <span class="status-badge status-closed">CLOSED</span></p>
              <p><strong>Location:</strong> ${complaint.address}, ${complaint.city}</p>
              <p><strong>Closed on:</strong> ${new Date(complaint.lastUpdated).toLocaleString()}</p>
            </div>
            
            <p>If you have any questions about this closure or need to report a new issue, please don't hesitate to contact us.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Dashboard</a>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>The UrbanEye Team</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Email service functions
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'UrbanEye <noreply@urbaneye.com>',
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Specific email notification functions
const sendComplaintSubmittedEmail = async (complaint, user) => {
  if (!user.preferences?.emailNotifications) {
    console.log('Email notifications disabled for user:', user.email);
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.complaintSubmitted(complaint, user);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendComplaintInProgressEmail = async (complaint, user, adminName) => {
  if (!user.preferences?.emailNotifications) {
    console.log('Email notifications disabled for user:', user.email);
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.complaintInProgress(complaint, user, adminName);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendComplaintResolvedEmail = async (complaint, user, resolutionNotes) => {
  if (!user.preferences?.emailNotifications) {
    console.log('Email notifications disabled for user:', user.email);
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.complaintResolved(complaint, user, resolutionNotes);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendComplaintRejectedEmail = async (complaint, user, reason) => {
  if (!user.preferences?.emailNotifications) {
    console.log('Email notifications disabled for user:', user.email);
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.complaintRejected(complaint, user, reason);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendComplaintClosedEmail = async (complaint, user) => {
  if (!user.preferences?.emailNotifications) {
    console.log('Email notifications disabled for user:', user.email);
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.complaintClosed(complaint, user);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendOTPVerificationEmail = async (user, otp) => {
  const template = emailTemplates.otpVerification(user, otp);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendPasswordResetOTPEmail = async (user, otp) => {
  const template = emailTemplates.passwordResetOTP(user, otp);
  return await sendEmail(user.email, template.subject, template.html);
};

module.exports = {
  sendEmail,
  sendComplaintSubmittedEmail,
  sendComplaintInProgressEmail,
  sendComplaintResolvedEmail,
  sendComplaintRejectedEmail,
  sendComplaintClosedEmail,
  sendOTPVerificationEmail,
  sendPasswordResetOTPEmail
};
