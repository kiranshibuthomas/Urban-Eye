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
    subject: `Your complaint has been submitted - ${complaint.complaintId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint Submitted</title>
        <style>
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            line-height: 1.4; 
            color: #000000; 
            margin: 0; 
            padding: 0; 
            background-color: #f3f2f1;
          }
          .email-container { 
            max-width: 600px; 
            margin: 40px auto; 
            background-color: #ffffff;
            border-radius: 0;
            box-shadow: none;
            overflow: hidden;
          }
          .header { 
            background-color: #9146ff; 
            padding: 40px 24px; 
            text-align: center; 
          }
          .logo-icon { 
            width: 48px; 
            height: 48px; 
            margin: 0 auto 16px auto; 
            background-color: #ffffff; 
            border-radius: 8px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 24px; 
            color: #9146ff; 
            font-weight: bold; 
          }
          .logo { 
            color: #ffffff; 
            font-size: 24px; 
            font-weight: 600; 
            margin: 0; 
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .content { 
            padding: 32px 24px; 
            background-color: #ffffff;
          }
          .greeting { 
            font-size: 16px; 
            margin: 0 0 16px 0; 
            color: #000000;
            font-weight: 400;
          }
          .main-message { 
            font-size: 14px; 
            margin: 0 0 24px 0; 
            color: #000000;
            font-weight: 400;
          }
          .details-section {
            margin: 24px 0;
            text-align: center;
          }
          .detail-item { 
            margin: 8px 0; 
            font-size: 14px; 
            color: #000000;
            font-weight: 400;
          }
          .detail-label { 
            font-weight: 600; 
            color: #000000; 
          }
          .complaint-box { 
            background-color: #ffffff; 
            border: 1px solid #e0e0e0; 
            border-radius: 0; 
            padding: 24px; 
            margin: 24px 0; 
            text-align: center;
          }
          .complaint-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #000000; 
            margin: 0 0 12px 0; 
          }
          .complaint-id { 
            font-size: 12px; 
            color: #666666; 
            margin: 0 0 16px 0; 
            font-weight: 400;
          }
          .complaint-desc { 
            font-size: 14px; 
            color: #000000; 
            margin: 0 0 16px 0; 
            line-height: 1.4; 
            font-weight: 400;
          }
          .complaint-meta { 
            display: block; 
            margin: 16px 0 0 0; 
          }
          .meta-item { 
            margin: 6px 0; 
            font-size: 12px; 
            color: #000000; 
            font-weight: 400;
          }
          .meta-label { 
            font-weight: 600; 
            color: #000000; 
          }
          .cta-section { 
            text-align: center; 
            margin: 32px 0; 
          }
          .cta-button { 
            display: inline-block; 
            background-color: #9146ff; 
            color: #ffffff; 
            text-decoration: none; 
            padding: 14px 28px; 
            border-radius: 0; 
            font-size: 14px; 
            font-weight: 600; 
            margin: 8px; 
          }
          .footer { 
            background-color: #f3f2f1; 
            padding: 24px; 
            text-align: center; 
          }
          .footer-text { 
            font-size: 12px; 
            color: #666666; 
            margin: 0; 
            font-weight: 400;
          }
          .status-badge { 
            display: inline-block; 
            background-color: #ffd700; 
            color: #000000; 
            padding: 4px 8px; 
            border-radius: 0; 
            font-size: 12px; 
            font-weight: 600; 
          }
          @media (max-width: 600px) {
            .email-container { margin: 20px; }
            .content { padding: 24px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo-icon">📝</div>
            <h1 class="logo">UrbanEye</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hey ${user.name},</p>
            
            <p class="main-message">Thank you for submitting your complaint. We have received it and will review it shortly.</p>
            
            <div class="details-section">
              <div class="detail-item">
                <span class="detail-label">Status:</span> <span class="status-badge">Pending</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Submitted:</span> ${new Date(complaint.createdAt).toLocaleDateString()}
              </div>
              <div class="detail-item">
                <span class="detail-label">Reference:</span> ${complaint.complaintId}
              </div>
            </div>
            
            <div class="complaint-box">
              <h3 class="complaint-title">${complaint.title}</h3>
              <p class="complaint-id">Complaint ID: ${complaint.complaintId}</p>
              <p class="complaint-desc">${complaint.description}</p>
              
              <div class="complaint-meta">
                <div class="meta-item">
                  <span class="meta-label">Location:</span><br>
                  ${complaint.address}, ${complaint.city}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Category:</span><br>
                  ${complaint.category.replace('_', ' ')}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Priority:</span><br>
                  ${complaint.priority}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Submitted:</span><br>
                  ${new Date(complaint.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <p style="font-size: 14px; color: #666666; margin: 24px 0; font-weight: 400;">We will review your complaint and take appropriate action. You will receive updates via email.</p>
            
            <div class="cta-section">
              <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="cta-button">View Complaint Details</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">Best regards,<br>The UrbanEye Team</p>
            <p class="footer-text">This is an automated message. Please do not reply to this email.</p>
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
    subject: `Your complaint has been resolved - ${complaint.complaintId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint Resolved</title>
        <style>
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            line-height: 1.4; 
            color: #000000; 
            margin: 0; 
            padding: 0; 
            background-color: #f3f2f1;
          }
          .email-container { 
            max-width: 600px; 
            margin: 40px auto; 
            background-color: #ffffff;
            border-radius: 0;
            box-shadow: none;
            overflow: hidden;
          }
          .header { 
            background-color: #00d4aa; 
            padding: 40px 24px; 
            text-align: center; 
          }
          .logo-icon { 
            width: 48px; 
            height: 48px; 
            margin: 0 auto 16px auto; 
            background-color: #ffffff; 
            border-radius: 8px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 24px; 
            color: #00d4aa; 
            font-weight: bold; 
          }
          .logo { 
            color: #ffffff; 
            font-size: 24px; 
            font-weight: 600; 
            margin: 0; 
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .content { 
            padding: 32px 24px; 
            background-color: #ffffff;
          }
          .greeting { 
            font-size: 16px; 
            margin: 0 0 16px 0; 
            color: #000000;
            font-weight: 400;
          }
          .main-message { 
            font-size: 14px; 
            margin: 0 0 24px 0; 
            color: #000000;
            font-weight: 400;
          }
          .details-section {
            margin: 24px 0;
            text-align: center;
          }
          .detail-item { 
            margin: 8px 0; 
            font-size: 14px; 
            color: #000000;
            font-weight: 400;
          }
          .detail-label { 
            font-weight: 600; 
            color: #000000; 
          }
          .complaint-box { 
            background-color: #ffffff; 
            border: 1px solid #e0e0e0; 
            border-radius: 0; 
            padding: 24px; 
            margin: 24px 0; 
            text-align: center;
          }
          .complaint-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #000000; 
            margin: 0 0 12px 0; 
          }
          .complaint-id { 
            font-size: 12px; 
            color: #666666; 
            margin: 0 0 16px 0; 
            font-weight: 400;
          }
          .complaint-desc { 
            font-size: 14px; 
            color: #000000; 
            margin: 0 0 16px 0; 
            line-height: 1.4; 
            font-weight: 400;
          }
          .complaint-meta { 
            display: block; 
            margin: 16px 0 0 0; 
          }
          .meta-item { 
            margin: 6px 0; 
            font-size: 12px; 
            color: #000000; 
            font-weight: 400;
          }
          .meta-label { 
            font-weight: 600; 
            color: #000000; 
          }
          .cta-section { 
            text-align: center; 
            margin: 32px 0; 
          }
          .cta-button { 
            display: inline-block; 
            background-color: #00d4aa; 
            color: #ffffff; 
            text-decoration: none; 
            padding: 14px 28px; 
            border-radius: 0; 
            font-size: 14px; 
            font-weight: 600; 
            margin: 8px; 
          }
          .footer { 
            background-color: #f3f2f1; 
            padding: 24px; 
            text-align: center; 
          }
          .footer-text { 
            font-size: 12px; 
            color: #666666; 
            margin: 0; 
            font-weight: 400;
          }
          .status-badge { 
            display: inline-block; 
            background-color: #00d4aa; 
            color: #ffffff; 
            padding: 4px 8px; 
            border-radius: 0; 
            font-size: 12px; 
            font-weight: 600; 
          }
          @media (max-width: 600px) {
            .email-container { margin: 20px; }
            .content { padding: 24px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo-icon">✅</div>
            <h1 class="logo">UrbanEye</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hey ${user.name},</p>
            
            <p class="main-message">Great news! Your complaint has been successfully resolved.</p>
            
            <div class="details-section">
              <div class="detail-item">
                <span class="detail-label">Status:</span> <span class="status-badge">Resolved</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Resolved:</span> ${new Date().toLocaleDateString()}
              </div>
              ${resolutionNotes ? `<div class="detail-item"><span class="detail-label">Notes:</span> ${resolutionNotes}</div>` : ''}
            </div>
            
            <div class="complaint-box">
              <h3 class="complaint-title">${complaint.title}</h3>
              <p class="complaint-id">Complaint ID: ${complaint.complaintId}</p>
              <p class="complaint-desc">${complaint.description}</p>
              
              <div class="complaint-meta">
                <div class="meta-item">
                  <span class="meta-label">Location:</span><br>
                  ${complaint.address}, ${complaint.city}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Category:</span><br>
                  ${complaint.category.replace('_', ' ')}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Priority:</span><br>
                  ${complaint.priority}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Submitted:</span><br>
                  ${new Date(complaint.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div class="cta-section">
              <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="cta-button">Rate & Review</a>
            </div>
          </div>
            
            <div class="footer">
            <p class="footer-text">Best regards,<br>The UrbanEye Team</p>
            <p class="footer-text">This is an automated message. Please do not reply to this email.</p>
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
  }),

  complaintAssignedToFieldStaff: (complaint, user, fieldStaffName, department) => ({
    subject: `Your complaint has been assigned to field staff - ${complaint.complaintId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint Assigned to Field Staff</title>
        <style>
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            line-height: 1.4; 
            color: #000000; 
            margin: 0; 
            padding: 0; 
            background-color: #f3f2f1;
          }
          .email-container { 
            max-width: 600px; 
            margin: 40px auto; 
            background-color: #ffffff;
            border-radius: 0;
            box-shadow: none;
            overflow: hidden;
          }
          .header { 
            background-color: #9146ff; 
            padding: 40px 24px; 
            text-align: center; 
          }
          .logo-icon { 
            width: 48px; 
            height: 48px; 
            margin: 0 auto 16px auto; 
            background-color: #ffffff; 
            border-radius: 8px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 24px; 
            color: #9146ff; 
            font-weight: bold; 
          }
          .logo { 
            color: #ffffff; 
            font-size: 24px; 
            font-weight: 600; 
            margin: 0; 
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .content { 
            padding: 32px 24px; 
            background-color: #ffffff;
          }
          .greeting { 
            font-size: 16px; 
            margin: 0 0 16px 0; 
            color: #000000;
            font-weight: 400;
          }
          .main-message { 
            font-size: 14px; 
            margin: 0 0 24px 0; 
            color: #000000;
            font-weight: 400;
          }
          .details-section {
            margin: 24px 0;
            text-align: center;
          }
          .detail-item { 
            margin: 8px 0; 
            font-size: 14px; 
            color: #000000;
            font-weight: 400;
          }
          .detail-label { 
            font-weight: 600; 
            color: #000000; 
          }
          .complaint-box { 
            background-color: #ffffff; 
            border: 1px solid #e0e0e0; 
            border-radius: 0; 
            padding: 24px; 
            margin: 24px 0; 
            text-align: center;
          }
          .complaint-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #000000; 
            margin: 0 0 12px 0; 
          }
          .complaint-id { 
            font-size: 12px; 
            color: #666666; 
            margin: 0 0 16px 0; 
            font-weight: 400;
          }
          .complaint-desc { 
            font-size: 14px; 
            color: #000000; 
            margin: 0 0 16px 0; 
            line-height: 1.4; 
            font-weight: 400;
          }
          .complaint-meta { 
            display: block; 
            margin: 16px 0 0 0; 
          }
          .meta-item { 
            margin: 6px 0; 
            font-size: 12px; 
            color: #000000; 
            font-weight: 400;
          }
          .meta-label { 
            font-weight: 600; 
            color: #000000; 
          }
          .cta-section { 
            text-align: center; 
            margin: 32px 0; 
          }
          .cta-button { 
            display: inline-block; 
            background-color: #9146ff; 
            color: #ffffff; 
            text-decoration: none; 
            padding: 14px 28px; 
            border-radius: 0; 
            font-size: 14px; 
            font-weight: 600; 
            margin: 8px; 
          }
          .footer { 
            background-color: #f3f2f1; 
            padding: 24px; 
            text-align: center; 
          }
          .footer-text { 
            font-size: 12px; 
            color: #666666; 
            margin: 0; 
            font-weight: 400;
          }
          .status-badge { 
            display: inline-block; 
            background-color: #ffd700; 
            color: #000000; 
            padding: 4px 8px; 
            border-radius: 0; 
            font-size: 12px; 
            font-weight: 600; 
          }
          @media (max-width: 600px) {
            .email-container { margin: 20px; }
            .content { padding: 24px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo-icon">👁️</div>
            <h1 class="logo">UrbanEye</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hey ${user.name},</p>
            
            <p class="main-message">Your complaint has been assigned to our field staff team and work will begin soon.</p>
            
            <div class="details-section">
              <div class="detail-item">
                <span class="detail-label">Field Staff:</span> ${fieldStaffName}
              </div>
              <div class="detail-item">
                <span class="detail-label">Department:</span> ${department.replace('_', ' ')}
              </div>
              <div class="detail-item">
                <span class="detail-label">Status:</span> <span class="status-badge">Assigned</span>
              </div>
            </div>
            
            <div class="complaint-box">
              <h3 class="complaint-title">${complaint.title}</h3>
              <p class="complaint-id">Complaint ID: ${complaint.complaintId}</p>
              <p class="complaint-desc">${complaint.description}</p>
              
              <div class="complaint-meta">
                <div class="meta-item">
                  <span class="meta-label">Location:</span><br>
                  ${complaint.address}, ${complaint.city}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Category:</span><br>
                  ${complaint.category.replace('_', ' ')}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Priority:</span><br>
                  ${complaint.priority}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Assigned:</span><br>
                  ${new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div class="cta-section">
              <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="cta-button">View Complaint Details</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">Best regards,<br>The UrbanEye Team</p>
            <p class="footer-text">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  workCompleted: (complaint, user, fieldStaffName, workCompletionNotes) => ({
    subject: `Work completed on your complaint - ${complaint.complaintId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Work Completed</title>
        <style>
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            line-height: 1.4; 
            color: #000000; 
            margin: 0; 
            padding: 0; 
            background-color: #f3f2f1;
          }
          .email-container { 
            max-width: 600px; 
            margin: 40px auto; 
            background-color: #ffffff;
            border-radius: 0;
            box-shadow: none;
            overflow: hidden;
          }
          .header { 
            background-color: #8b5cf6; 
            padding: 40px 24px; 
            text-align: center; 
          }
          .logo-icon { 
            width: 48px; 
            height: 48px; 
            margin: 0 auto 16px auto; 
            background-color: #ffffff; 
            border-radius: 8px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 24px; 
            color: #8b5cf6; 
            font-weight: bold; 
          }
          .logo { 
            color: #ffffff; 
            font-size: 24px; 
            font-weight: 600; 
            margin: 0; 
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .content { 
            padding: 32px 24px; 
            background-color: #ffffff;
          }
          .greeting { 
            font-size: 16px; 
            margin: 0 0 16px 0; 
            color: #000000;
            font-weight: 400;
          }
          .main-message { 
            font-size: 14px; 
            margin: 0 0 24px 0; 
            color: #000000;
            font-weight: 400;
          }
          .work-completion-box { 
            background-color: #f3e8ff; 
            border: 2px solid #8b5cf6; 
            border-radius: 0; 
            padding: 24px; 
            margin: 24px 0; 
            text-align: center;
          }
          .work-completion-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #8b5cf6; 
            margin: 0 0 12px 0; 
          }
          .work-completion-notes { 
            font-size: 14px; 
            color: #000000; 
            margin: 0 0 16px 0; 
            line-height: 1.4; 
            font-weight: 400;
          }
          .details-section {
            margin: 24px 0;
            text-align: center;
          }
          .detail-item { 
            margin: 8px 0; 
            font-size: 14px; 
            color: #000000;
            font-weight: 400;
          }
          .detail-label { 
            font-weight: 600; 
            color: #000000; 
          }
          .complaint-box { 
            background-color: #ffffff; 
            border: 1px solid #e0e0e0; 
            border-radius: 0; 
            padding: 24px; 
            margin: 24px 0; 
            text-align: center;
          }
          .complaint-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #000000; 
            margin: 0 0 12px 0; 
          }
          .complaint-id { 
            font-size: 12px; 
            color: #666666; 
            margin: 0 0 16px 0; 
            font-weight: 400;
          }
          .complaint-desc { 
            font-size: 14px; 
            color: #000000; 
            margin: 0 0 16px 0; 
            line-height: 1.4; 
            font-weight: 400;
          }
          .complaint-meta { 
            display: block; 
            margin: 16px 0 0 0; 
          }
          .meta-item { 
            margin: 6px 0; 
            font-size: 12px; 
            color: #000000; 
            font-weight: 400;
          }
          .meta-label { 
            font-weight: 600; 
            color: #000000; 
          }
          .cta-section { 
            text-align: center; 
            margin: 32px 0; 
          }
          .cta-button { 
            display: inline-block; 
            background-color: #8b5cf6; 
            color: #ffffff; 
            text-decoration: none; 
            padding: 14px 28px; 
            border-radius: 0; 
            font-size: 14px; 
            font-weight: 600; 
            margin: 8px; 
          }
          .footer { 
            background-color: #f3f2f1; 
            padding: 24px; 
            text-align: center; 
          }
          .footer-text { 
            font-size: 12px; 
            color: #666666; 
            margin: 0; 
            font-weight: 400;
          }
          .status-badge { 
            display: inline-block; 
            background-color: #8b5cf6; 
            color: #ffffff; 
            padding: 4px 8px; 
            border-radius: 0; 
            font-size: 12px; 
            font-weight: 600; 
          }
          @media (max-width: 600px) {
            .email-container { margin: 20px; }
            .content { padding: 24px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo-icon">🔧</div>
            <h1 class="logo">UrbanEye</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hey ${user.name},</p>
            
            <p class="main-message">Great news! The field staff has completed work on your complaint and it's now pending admin approval.</p>
            
            <div class="work-completion-box">
              <h3 class="work-completion-title">Work Completion Details</h3>
              <p class="work-completion-notes">${workCompletionNotes}</p>
              <div class="detail-item">
                <span class="detail-label">Completed by:</span> ${fieldStaffName}
              </div>
              <div class="detail-item">
                <span class="detail-label">Status:</span> <span class="status-badge">Work Completed</span>
              </div>
            </div>
            
            <div class="details-section">
              <div class="detail-item">
                <span class="detail-label">Next Step:</span> Admin Review & Approval
              </div>
              <div class="detail-item">
                <span class="detail-label">Completed:</span> ${new Date().toLocaleDateString()}
              </div>
            </div>
            
            <div class="complaint-box">
              <h3 class="complaint-title">${complaint.title}</h3>
              <p class="complaint-id">Complaint ID: ${complaint.complaintId}</p>
              <p class="complaint-desc">${complaint.description}</p>
              
              <div class="complaint-meta">
                <div class="meta-item">
                  <span class="meta-label">Location:</span><br>
                  ${complaint.address}, ${complaint.city}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Category:</span><br>
                  ${complaint.category.replace('_', ' ')}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Priority:</span><br>
                  ${complaint.priority}
                </div>
              </div>
            </div>
            
            <p style="font-size: 14px; color: #666666; margin: 24px 0; font-weight: 400;">Our admin team will now review the completed work and approve it. You'll receive another notification once it's fully resolved.</p>
            
            <div class="cta-section">
              <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="cta-button">View Complaint Details</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">Best regards,<br>The UrbanEye Team</p>
            <p class="footer-text">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  workApproved: (complaint, user, adminName, approvalNotes) => ({
    subject: `Your complaint has been resolved - ${complaint.complaintId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint Resolved</title>
        <style>
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            line-height: 1.4; 
            color: #000000; 
            margin: 0; 
            padding: 0; 
            background-color: #f3f2f1;
          }
          .email-container { 
            max-width: 600px; 
            margin: 40px auto; 
            background-color: #ffffff;
            border-radius: 0;
            box-shadow: none;
            overflow: hidden;
          }
          .header { 
            background-color: #00d4aa; 
            padding: 40px 24px; 
            text-align: center; 
          }
          .logo-icon { 
            width: 48px; 
            height: 48px; 
            margin: 0 auto 16px auto; 
            background-color: #ffffff; 
            border-radius: 8px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 24px; 
            color: #00d4aa; 
            font-weight: bold; 
          }
          .logo { 
            color: #ffffff; 
            font-size: 24px; 
            font-weight: 600; 
            margin: 0; 
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .content { 
            padding: 32px 24px; 
            background-color: #ffffff;
          }
          .greeting { 
            font-size: 16px; 
            margin: 0 0 16px 0; 
            color: #000000;
            font-weight: 400;
          }
          .main-message { 
            font-size: 14px; 
            margin: 0 0 24px 0; 
            color: #000000;
            font-weight: 400;
          }
          .approval-box { 
            background-color: #d1fae5; 
            border: 2px solid #00d4aa; 
            border-radius: 0; 
            padding: 24px; 
            margin: 24px 0; 
            text-align: center;
          }
          .approval-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #00d4aa; 
            margin: 0 0 12px 0; 
          }
          .approval-notes { 
            font-size: 14px; 
            color: #000000; 
            margin: 0 0 16px 0; 
            line-height: 1.4; 
            font-weight: 400;
          }
          .details-section {
            margin: 24px 0;
            text-align: center;
          }
          .detail-item { 
            margin: 8px 0; 
            font-size: 14px; 
            color: #000000;
            font-weight: 400;
          }
          .detail-label { 
            font-weight: 600; 
            color: #000000; 
          }
          .complaint-box { 
            background-color: #ffffff; 
            border: 1px solid #e0e0e0; 
            border-radius: 0; 
            padding: 24px; 
            margin: 24px 0; 
            text-align: center;
          }
          .complaint-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #000000; 
            margin: 0 0 12px 0; 
          }
          .complaint-id { 
            font-size: 12px; 
            color: #666666; 
            margin: 0 0 16px 0; 
            font-weight: 400;
          }
          .complaint-desc { 
            font-size: 14px; 
            color: #000000; 
            margin: 0 0 16px 0; 
            line-height: 1.4; 
            font-weight: 400;
          }
          .complaint-meta { 
            display: block; 
            margin: 16px 0 0 0; 
          }
          .meta-item { 
            margin: 6px 0; 
            font-size: 12px; 
            color: #000000; 
            font-weight: 400;
          }
          .meta-label { 
            font-weight: 600; 
            color: #000000; 
          }
          .cta-section { 
            text-align: center; 
            margin: 32px 0; 
          }
          .cta-button { 
            display: inline-block; 
            background-color: #00d4aa; 
            color: #ffffff; 
            text-decoration: none; 
            padding: 14px 28px; 
            border-radius: 0; 
            font-size: 14px; 
            font-weight: 600; 
            margin: 8px; 
          }
          .footer { 
            background-color: #f3f2f1; 
            padding: 24px; 
            text-align: center; 
          }
          .footer-text { 
            font-size: 12px; 
            color: #666666; 
            margin: 0; 
            font-weight: 400;
          }
          .status-badge { 
            display: inline-block; 
            background-color: #00d4aa; 
            color: #ffffff; 
            padding: 4px 8px; 
            border-radius: 0; 
            font-size: 12px; 
            font-weight: 600; 
          }
          @media (max-width: 600px) {
            .email-container { margin: 20px; }
            .content { padding: 24px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo-icon">✅</div>
            <h1 class="logo">UrbanEye</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hey ${user.name},</p>
            
            <p class="main-message">Excellent news! Your complaint has been successfully resolved and approved by our admin team.</p>
            
            <div class="approval-box">
              <h3 class="approval-title">Work Approved & Resolved</h3>
              ${approvalNotes ? `<p class="approval-notes">${approvalNotes}</p>` : ''}
              <div class="detail-item">
                <span class="detail-label">Approved by:</span> ${adminName}
              </div>
              <div class="detail-item">
                <span class="detail-label">Status:</span> <span class="status-badge">Resolved</span>
              </div>
            </div>
            
            <div class="details-section">
              <div class="detail-item">
                <span class="detail-label">Resolved:</span> ${new Date().toLocaleDateString()}
              </div>
              <div class="detail-item">
                <span class="detail-label">Reference:</span> ${complaint.complaintId}
              </div>
            </div>
            
            <div class="complaint-box">
              <h3 class="complaint-title">${complaint.title}</h3>
              <p class="complaint-id">Complaint ID: ${complaint.complaintId}</p>
              <p class="complaint-desc">${complaint.description}</p>
              
              <div class="complaint-meta">
                <div class="meta-item">
                  <span class="meta-label">Location:</span><br>
                  ${complaint.address}, ${complaint.city}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Category:</span><br>
                  ${complaint.category.replace('_', ' ')}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Priority:</span><br>
                  ${complaint.priority}
                </div>
                <div class="meta-item">
                  <span class="meta-label">Submitted:</span><br>
                  ${new Date(complaint.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div class="cta-section">
              <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="cta-button">Rate & Review</a>
            </div>
          </div>
            
            <div class="footer">
            <p class="footer-text">Best regards,<br>The UrbanEye Team</p>
            <p class="footer-text">This is an automated message. Please do not reply to this email.</p>
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

const sendComplaintAssignedToFieldStaffEmail = async (complaint, user, fieldStaffName, department) => {
  if (!user.preferences?.emailNotifications) {
    console.log('Email notifications disabled for user:', user.email);
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.complaintAssignedToFieldStaff(complaint, user, fieldStaffName, department);
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

const sendWorkCompletedEmail = async (complaint, user, fieldStaffName, workCompletionNotes) => {
  if (!user.preferences?.emailNotifications) {
    console.log('Email notifications disabled for user:', user.email);
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.workCompleted(complaint, user, fieldStaffName, workCompletionNotes);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendWorkApprovedEmail = async (complaint, user, adminName, approvalNotes) => {
  if (!user.preferences?.emailNotifications) {
    console.log('Email notifications disabled for user:', user.email);
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.workApproved(complaint, user, adminName, approvalNotes);
  return await sendEmail(user.email, template.subject, template.html);
};

module.exports = {
  sendEmail,
  sendComplaintSubmittedEmail,
  sendComplaintInProgressEmail,
  sendComplaintAssignedToFieldStaffEmail,
  sendComplaintResolvedEmail,
  sendComplaintRejectedEmail,
  sendComplaintClosedEmail,
  sendOTPVerificationEmail,
  sendPasswordResetOTPEmail,
  sendWorkCompletedEmail,
  sendWorkApprovedEmail
};
