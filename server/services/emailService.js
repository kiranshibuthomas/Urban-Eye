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
  emailVerification: (user, verificationToken) => ({
    subject: 'Verify Your UrbanEye Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .verification-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; text-align: center; }
          .btn { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .btn:hover { background: #5a6fd8; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ UrbanEye</h1>
            <h2>Welcome to UrbanEye!</h2>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>Thank you for registering with UrbanEye! We're excited to have you join our community of engaged citizens.</p>
            
            <div class="verification-box">
              <h3>🔐 Verify Your Email Address</h3>
              <p>To complete your registration and start using UrbanEye, please verify your email address by clicking the button below:</p>
              
              <a href="${process.env.CLIENT_URL}/verify-email/${verificationToken}" class="btn">Verify My Account</a>
              
              <p style="margin-top: 20px; font-size: 14px; color: #666;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${process.env.CLIENT_URL}/verify-email/${verificationToken}" style="color: #667eea; word-break: break-all;">
                  ${process.env.CLIENT_URL}/verify-email/${verificationToken}
                </a>
              </p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you don't verify your account within this time, you'll need to register again.
            </div>
            
            <p>Once verified, you'll be able to:</p>
            <ul>
              <li>📝 Report civic issues in your area</li>
              <li>📊 Track the status of your complaints</li>
              <li>🏆 Contribute to improving your community</li>
              <li>📱 Access all UrbanEye features</li>
            </ul>
            
            <p>If you didn't create an account with UrbanEye, please ignore this email.</p>
            
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

  emailVerified: (user) => ({
    subject: 'Account Verified Successfully - Welcome to UrbanEye!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Verified</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #56ab2f; text-align: center; }
          .btn { display: inline-block; padding: 15px 30px; background: #56ab2f; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .btn:hover { background: #4a9a2a; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ UrbanEye</h1>
            <h2>✅ Account Verified Successfully!</h2>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>Congratulations! Your UrbanEye account has been successfully verified.</p>
            
            <div class="success-box">
              <h3>🎉 Welcome to UrbanEye!</h3>
              <p>Your account is now active and you can start using all the features of UrbanEye.</p>
              
              <a href="${process.env.CLIENT_URL}/citizen-dashboard" class="btn">Go to Dashboard</a>
            </div>
            
            <p>You can now:</p>
            <ul>
              <li>📝 Report civic issues in your area</li>
              <li>📊 Track the status of your complaints</li>
              <li>🏆 Contribute to improving your community</li>
              <li>📱 Access all UrbanEye features</li>
            </ul>
            
            <p>Thank you for joining UrbanEye and helping us build a better community together!</p>
            
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
    subject: `Complaint Update - ${complaint.complaintId}`,
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

const sendEmailVerification = async (user, verificationToken) => {
  const template = emailTemplates.emailVerification(user, verificationToken);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendEmailVerified = async (user) => {
  const template = emailTemplates.emailVerified(user);
  return await sendEmail(user.email, template.subject, template.html);
};

module.exports = {
  sendEmail,
  sendComplaintSubmittedEmail,
  sendComplaintInProgressEmail,
  sendComplaintResolvedEmail,
  sendComplaintRejectedEmail,
  sendComplaintClosedEmail,
  sendEmailVerification,
  sendEmailVerified
};
