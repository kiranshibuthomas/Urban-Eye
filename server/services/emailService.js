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

// Base email template with clean, sharp UI
const baseEmailTemplate = (content, themeColor = '#2563eb') => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UrbanEye</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        line-height: 1.6; 
        color: #1f2937; 
        margin: 0; 
        padding: 0; 
        background: #f8fafc;
        min-height: 100vh;
      }
      
      .email-wrapper {
        padding: 40px 20px;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .email-container { 
        max-width: 600px; 
        width: 100%;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        overflow: hidden;
        border: 1px solid #e5e7eb;
      }
      
      .header { 
        background: ${themeColor};
        padding: 40px 32px; 
        text-align: center; 
      }
      
      .logo { 
        color: #ffffff; 
        font-size: 28px; 
        font-weight: 700; 
        margin: 0; 
        letter-spacing: -0.5px;
      }
      
      .content { 
        padding: 40px 32px; 
        background: #ffffff;
      }
      
      .greeting { 
        font-size: 20px; 
        margin: 0 0 20px 0; 
        color: #111827;
        font-weight: 600;
      }
      
      .main-message { 
        font-size: 16px; 
        margin: 0 0 32px 0; 
        color: #4b5563;
        font-weight: 400;
        line-height: 1.6;
      }
      
      .details-section {
        margin: 24px 0;
        display: grid;
        gap: 12px;
      }
      
      .detail-item { 
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      
      .detail-label { 
        font-weight: 600; 
        color: #374151;
        font-size: 14px;
      }
      
      .detail-value {
        font-weight: 500;
        color: #6b7280;
        font-size: 14px;
      }
      
      .complaint-box { 
        background: #f8fafc;
        border: 1px solid #e2e8f0; 
        border-radius: 12px; 
        padding: 24px; 
        margin: 24px 0; 
        border-left: 4px solid ${themeColor};
      }
      
      .complaint-title { 
        font-size: 18px; 
        font-weight: 600; 
        color: #111827; 
        margin: 0 0 8px 0; 
        line-height: 1.4;
      }
      
      .complaint-id { 
        font-size: 12px; 
        color: #6b7280; 
        margin: 0 0 16px 0; 
        font-weight: 500;
        font-family: 'Monaco', 'Menlo', monospace;
        background: #e5e7eb;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
      }
      
      .complaint-desc { 
        font-size: 15px; 
        color: #4b5563; 
        margin: 0 0 20px 0; 
        line-height: 1.5; 
        font-weight: 400;
      }
      
      .complaint-meta { 
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin: 20px 0 0 0; 
      }
      
      .meta-item { 
        padding: 12px 16px;
        background: #ffffff;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }
      
      .meta-label { 
        font-weight: 600; 
        color: #374151;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
        display: block;
      }
      
      .meta-value {
        color: #6b7280;
        font-size: 14px;
        font-weight: 500;
      }
      
      .cta-section { 
        text-align: center; 
        margin: 32px 0; 
      }
      
      .cta-button { 
        display: inline-block; 
        background: ${themeColor};
        color: #ffffff; 
        text-decoration: none; 
        padding: 14px 28px; 
        border-radius: 8px; 
        font-size: 15px; 
        font-weight: 600; 
        margin: 8px; 
        transition: all 0.2s ease;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .cta-button:hover {
        background: ${themeColor}dd;
        transform: translateY(-1px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }
      
      .footer { 
        background: #f8fafc;
        padding: 24px 32px; 
        text-align: center; 
        border-top: 1px solid #e5e7eb;
      }
      
      .footer-text { 
        font-size: 13px; 
        color: #6b7280; 
        margin: 0 0 6px 0; 
        font-weight: 400;
        line-height: 1.4;
      }
      
      .status-badge { 
        display: inline-block; 
        background: #fbbf24;
        color: #ffffff; 
        padding: 4px 12px; 
        border-radius: 12px; 
        font-size: 11px; 
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .status-badge.resolved {
        background: #10b981;
      }
      
      .status-badge.in-progress {
        background: #3b82f6;
      }
      
      .status-badge.rejected {
        background: #ef4444;
      }
      
      .divider {
        height: 1px;
        background: #e5e7eb;
        margin: 20px 0;
      }
      
      .info-box {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        padding: 16px;
        margin: 20px 0;
      }
      
      .info-box h3 {
        color: #0369a1;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 8px 0;
      }
      
      .info-box p {
        color: #0c4a6e;
        font-size: 14px;
        margin: 0;
        line-height: 1.5;
      }
      
      .otp-code {
        font-size: 32px;
        font-weight: 700;
        color: ${themeColor};
        letter-spacing: 8px;
        margin: 16px 0;
        font-family: 'Monaco', 'Menlo', monospace;
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        border: 2px solid #e5e7eb;
        text-align: center;
      }
      
      @media (max-width: 600px) {
        .email-wrapper { padding: 20px 10px; }
        .email-container { border-radius: 12px; }
        .header { padding: 32px 24px; }
        .content { padding: 32px 24px; }
        .footer { padding: 20px 24px; }
        .complaint-meta { grid-template-columns: 1fr; }
        .greeting { font-size: 18px; }
        .logo { font-size: 24px; }
        .otp-code { font-size: 24px; letter-spacing: 4px; }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <div class="header">
          <h1 class="logo">UrbanEye</h1>
        </div>
        
        <div class="content">
          ${content}
        </div>
        
        <div class="footer">
          <p class="footer-text">Best regards,<br><strong>The UrbanEye Team</strong></p>
          <div class="divider"></div>
          <p class="footer-text">This is an automated message. Please do not reply to this email.</p>
          <p class="footer-text">UrbanEye - Smart City Management System</p>
        </div>
      </div>
    </div>
  </body>
  </html>
`;

// Email templates
const emailTemplates = {
  complaintSubmitted: (complaint, user) => ({
    subject: `Complaint Submitted - ${complaint.complaintId}`,
    html: baseEmailTemplate(`
      <p class="greeting">Hello ${user.name},</p>
      
      <p class="main-message">Thank you for submitting your complaint. We have received it and our team will review it shortly. You can track the progress using your complaint reference number.</p>
      
      <div class="details-section">
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span class="status-badge">Pending Review</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Submitted</span>
          <span class="detail-value">${new Date(complaint.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Reference</span>
          <span class="detail-value">${complaint.complaintId}</span>
        </div>
      </div>
      
      <div class="complaint-box">
        <h3 class="complaint-title">${complaint.title}</h3>
        <p class="complaint-id">${complaint.complaintId}</p>
        <p class="complaint-desc">${complaint.description}</p>
        
        <div class="complaint-meta">
          <div class="meta-item">
            <span class="meta-label">Location</span>
            <span class="meta-value">${complaint.address}, ${complaint.city}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Category</span>
            <span class="meta-value">${complaint.category.replace('_', ' ')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="meta-value">${complaint.priority}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Submitted</span>
            <span class="meta-value">${new Date(complaint.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <p style="font-size: 15px; color: #6b7280; margin: 32px 0; font-weight: 400; text-align: center;">We will review your complaint and take appropriate action. You will receive updates via email as we progress.</p>
      
      <div class="cta-section">
        <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="cta-button">View Complaint Details</a>
      </div>
    `, '#2563eb')
  }),

  complaintInProgress: (complaint, user, adminName) => ({
    subject: `Complaint Update - In Progress - ${complaint.complaintId}`,
    html: baseEmailTemplate(`
      <p class="greeting">Hello ${user.name},</p>
      
      <p class="main-message">Great news! Your complaint is now being actively worked on by our team. We're making progress and will keep you updated throughout the process.</p>
      
      <div class="details-section">
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span class="status-badge in-progress">In Progress</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Assigned to</span>
          <span class="detail-value">${adminName || 'Administrative Team'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Updated</span>
          <span class="detail-value">${new Date(complaint.lastUpdated).toLocaleString()}</span>
        </div>
      </div>
      
      <div class="complaint-box">
        <h3 class="complaint-title">${complaint.title}</h3>
        <p class="complaint-id">${complaint.complaintId}</p>
        <p class="complaint-desc">${complaint.description}</p>
        
        <div class="complaint-meta">
          <div class="meta-item">
            <span class="meta-label">Location</span>
            <span class="meta-value">${complaint.address}, ${complaint.city}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Category</span>
            <span class="meta-value">${complaint.category.replace('_', ' ')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="meta-value">${complaint.priority}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Started</span>
            <span class="meta-value">${new Date(complaint.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <p style="font-size: 15px; color: #6b7280; margin: 32px 0; font-weight: 400; text-align: center;">Our team is now working on resolving your issue. We will continue to keep you updated on the progress.</p>
      
      <div class="cta-section">
        <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="cta-button">View Details</a>
      </div>
    `, '#3b82f6')
  }),

  complaintResolved: (complaint, user, resolutionNotes) => ({
    subject: `Complaint Resolved - ${complaint.complaintId}`,
    html: baseEmailTemplate(`
      <p class="greeting">Hello ${user.name},</p>
      
      <p class="main-message">Excellent news! Your complaint has been successfully resolved. We appreciate your patience and feedback in helping us improve our city services.</p>
      
      <div class="details-section">
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span class="status-badge resolved">Resolved</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Resolved</span>
          <span class="detail-value">${new Date().toLocaleDateString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Reference</span>
          <span class="detail-value">${complaint.complaintId}</span>
        </div>
      </div>
      
      ${resolutionNotes ? `
      <div class="info-box" style="background: #f0fdf4; border-color: #bbf7d0;">
        <h3 style="color: #166534;">Resolution Notes</h3>
        <p style="color: #15803d;">${resolutionNotes}</p>
      </div>
      ` : ''}
      
      <div class="complaint-box">
        <h3 class="complaint-title">${complaint.title}</h3>
        <p class="complaint-id">${complaint.complaintId}</p>
        <p class="complaint-desc">${complaint.description}</p>
        
        <div class="complaint-meta">
          <div class="meta-item">
            <span class="meta-label">Location</span>
            <span class="meta-value">${complaint.address}, ${complaint.city}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Category</span>
            <span class="meta-value">${complaint.category.replace('_', ' ')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="meta-value">${complaint.priority}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Submitted</span>
            <span class="meta-value">${new Date(complaint.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <p style="font-size: 15px; color: #6b7280; margin: 32px 0; font-weight: 400; text-align: center;">Thank you for using UrbanEye. Your feedback helps us maintain and improve our city infrastructure.</p>
      
      <div class="cta-section">
        <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="cta-button">Rate & Review</a>
      </div>
    `, '#10b981')
  }),

  complaintRejected: (complaint, user, reason) => ({
    subject: `Complaint Rejected - ${complaint.complaintId}`,
    html: baseEmailTemplate(`
      <p class="greeting">Hello ${user.name},</p>
      
      <p class="main-message">We have reviewed your complaint and unfortunately, we are unable to proceed with it at this time. Please see the details below for more information.</p>
      
      <div class="details-section">
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span class="status-badge rejected">Rejected</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Updated</span>
          <span class="detail-value">${new Date(complaint.lastUpdated).toLocaleString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Reference</span>
          <span class="detail-value">${complaint.complaintId}</span>
        </div>
      </div>
      
      ${reason ? `
      <div class="info-box" style="background: #fef2f2; border-color: #fecaca;">
        <h3 style="color: #dc2626;">Reason for Rejection</h3>
        <p style="color: #991b1b;">${reason}</p>
      </div>
      ` : ''}
      
      <div class="complaint-box">
        <h3 class="complaint-title">${complaint.title}</h3>
        <p class="complaint-id">${complaint.complaintId}</p>
        <p class="complaint-desc">${complaint.description}</p>
        
        <div class="complaint-meta">
          <div class="meta-item">
            <span class="meta-label">Location</span>
            <span class="meta-value">${complaint.address}, ${complaint.city}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Category</span>
            <span class="meta-value">${complaint.category.replace('_', ' ')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="meta-value">${complaint.priority}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Submitted</span>
            <span class="meta-value">${new Date(complaint.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <p style="font-size: 15px; color: #6b7280; margin: 32px 0; font-weight: 400; text-align: center;">If you believe this decision was made in error or have additional information, please feel free to submit a new complaint with more details.</p>
      
      <div class="cta-section">
        <a href="${process.env.CLIENT_URL}/report-issue" class="cta-button">Submit New Complaint</a>
      </div>
    `, '#ef4444')
  }),

  passwordResetOTP: (user, otp) => ({
    subject: 'UrbanEye - Password Reset Code',
    html: baseEmailTemplate(`
      <p class="greeting">Hello ${user.name},</p>
      
      <p class="main-message">We received a request to reset your password for your UrbanEye account. Use the code below to verify your identity and reset your password.</p>
      
      <div class="info-box" style="background: #fef2f2; border-color: #fecaca; text-align: center;">
        <h3 style="color: #dc2626;">Your Password Reset Code</h3>
        <div class="otp-code" style="color: #dc2626; border-color: #fca5a5;">${otp}</div>
        <p style="color: #991b1b; font-size: 14px; font-weight: 600; margin: 0;">This code will expire in 10 minutes</p>
      </div>
      
      <div class="info-box" style="background: #fffbeb; border-color: #fed7aa;">
        <h3 style="color: #d97706;">Security Notice</h3>
        <ul style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px; text-align: left;">
          <li>Never share this code with anyone</li>
          <li>UrbanEye will never ask for your password reset code</li>
          <li>If you didn't request this password reset, please ignore this email</li>
          <li>Your password will remain unchanged until you complete the reset process</li>
        </ul>
      </div>
      
      <p style="font-size: 15px; color: #6b7280; margin: 32px 0; font-weight: 400; text-align: center;">Enter this code in the password reset page to create a new password for your account.</p>
    `, '#ef4444')
  }),

  otpVerification: (user, otp) => ({
    subject: 'UrbanEye - Email Verification Code',
    html: baseEmailTemplate(`
      <p class="greeting">Hello ${user.name},</p>
      
      <p class="main-message">Thank you for registering with UrbanEye! To complete your account setup, please verify your email address using the code below.</p>
      
      <div class="info-box" style="background: #f0fdf4; border-color: #bbf7d0; text-align: center;">
        <h3 style="color: #166534;">Your Verification Code</h3>
        <div class="otp-code" style="color: #166534; border-color: #86efac;">${otp}</div>
        <p style="color: #15803d; font-size: 14px; font-weight: 600; margin: 0;">This code will expire in 10 minutes</p>
      </div>
      
      <div class="info-box" style="background: #fffbeb; border-color: #fed7aa;">
        <h3 style="color: #d97706;">Security Notice</h3>
        <ul style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px; text-align: left;">
          <li>Never share this code with anyone</li>
          <li>UrbanEye will never ask for your verification code</li>
          <li>If you didn't request this code, please ignore this email</li>
        </ul>
      </div>
      
      <p style="font-size: 15px; color: #6b7280; margin: 32px 0; font-weight: 400; text-align: center;">Enter this code in the verification page to complete your registration and start using UrbanEye.</p>
    `, '#10b981')
  }),

  complaintClosed: (complaint, user) => ({
    subject: `Complaint Closed - ${complaint.complaintId}`,
    html: baseEmailTemplate(`
      <p class="greeting">Hello ${user.name},</p>
      
      <p class="main-message">Your complaint has been closed. This typically happens when the issue has been resolved or when no further action is required.</p>
      
      <div class="details-section">
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span class="status-badge" style="background: #6b7280;">Closed</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Closed on</span>
          <span class="detail-value">${new Date(complaint.lastUpdated).toLocaleString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Reference</span>
          <span class="detail-value">${complaint.complaintId}</span>
        </div>
      </div>
      
      <div class="complaint-box">
        <h3 class="complaint-title">${complaint.title}</h3>
        <p class="complaint-id">${complaint.complaintId}</p>
        <p class="complaint-desc">${complaint.description}</p>
        
        <div class="complaint-meta">
          <div class="meta-item">
            <span class="meta-label">Location</span>
            <span class="meta-value">${complaint.address}, ${complaint.city}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Category</span>
            <span class="meta-value">${complaint.category.replace('_', ' ')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="meta-value">${complaint.priority}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Submitted</span>
            <span class="meta-value">${new Date(complaint.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <p style="font-size: 15px; color: #6b7280; margin: 32px 0; font-weight: 400; text-align: center;">If you have any questions about this closure or need to report a new issue, please don't hesitate to contact us.</p>
      
      <div class="cta-section">
        <a href="${process.env.CLIENT_URL}/dashboard" class="cta-button">View Dashboard</a>
      </div>
    `, '#6b7280')
  }),

  complaintAssignedToFieldStaff: (complaint, user, fieldStaffName, department) => ({
    subject: `Complaint Assigned to Field Staff - ${complaint.complaintId}`,
    html: baseEmailTemplate(`
      <p class="greeting">Hello ${user.name},</p>
      
      <p class="main-message">Your complaint has been assigned to our field staff team and work will begin soon. Our dedicated team will handle your request professionally and efficiently.</p>
      
      <div class="details-section">
        <div class="detail-item">
          <span class="detail-label">Field Staff</span>
          <span class="detail-value">${fieldStaffName}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Department</span>
          <span class="detail-value">${department.replace('_', ' ')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span class="status-badge" style="background: #8b5cf6;">Assigned</span>
        </div>
      </div>
      
      <div class="complaint-box">
        <h3 class="complaint-title">${complaint.title}</h3>
        <p class="complaint-id">${complaint.complaintId}</p>
        <p class="complaint-desc">${complaint.description}</p>
        
        <div class="complaint-meta">
          <div class="meta-item">
            <span class="meta-label">Location</span>
            <span class="meta-value">${complaint.address}, ${complaint.city}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Category</span>
            <span class="meta-value">${complaint.category.replace('_', ' ')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="meta-value">${complaint.priority}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Assigned</span>
            <span class="meta-value">${new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <p style="font-size: 15px; color: #6b7280; margin: 32px 0; font-weight: 400; text-align: center;">Our field staff will begin work on your complaint and keep you updated on the progress.</p>
      
      <div class="cta-section">
        <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="cta-button">View Complaint Details</a>
      </div>
    `, '#8b5cf6')
  }),

  workCompleted: (complaint, user, fieldStaffName, workCompletionNotes) => ({
    subject: `Work Completed - ${complaint.complaintId}`,
    html: baseEmailTemplate(`
      <p class="greeting">Hello ${user.name},</p>
      
      <p class="main-message">Great news! The field staff has completed work on your complaint and it's now pending admin approval. Our team has finished the necessary repairs and improvements.</p>
      
      <div class="info-box" style="background: #faf5ff; border-color: #d8b4fe;">
        <h3 style="color: #7c3aed;">Work Completion Details</h3>
        <p style="color: #581c87;">${workCompletionNotes}</p>
        <div class="details-section" style="margin: 16px 0 0 0;">
          <div class="detail-item" style="margin: 8px 0;">
            <span class="detail-label">Completed by</span>
            <span class="detail-value">${fieldStaffName}</span>
          </div>
          <div class="detail-item" style="margin: 8px 0;">
            <span class="detail-label">Status</span>
            <span class="status-badge" style="background: #8b5cf6;">Work Completed</span>
          </div>
        </div>
      </div>
      
      <div class="details-section">
        <div class="detail-item">
          <span class="detail-label">Next Step</span>
          <span class="detail-value">Admin Review & Approval</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Completed</span>
          <span class="detail-value">${new Date().toLocaleDateString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Reference</span>
          <span class="detail-value">${complaint.complaintId}</span>
        </div>
      </div>
      
      <div class="complaint-box">
        <h3 class="complaint-title">${complaint.title}</h3>
        <p class="complaint-id">${complaint.complaintId}</p>
        <p class="complaint-desc">${complaint.description}</p>
        
        <div class="complaint-meta">
          <div class="meta-item">
            <span class="meta-label">Location</span>
            <span class="meta-value">${complaint.address}, ${complaint.city}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Category</span>
            <span class="meta-value">${complaint.category.replace('_', ' ')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="meta-value">${complaint.priority}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Submitted</span>
            <span class="meta-value">${new Date(complaint.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <p style="font-size: 15px; color: #6b7280; margin: 32px 0; font-weight: 400; text-align: center;">Our admin team will now review the completed work and approve it. You'll receive another notification once it's fully resolved.</p>
      
      <div class="cta-section">
        <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="cta-button">View Complaint Details</a>
      </div>
    `, '#8b5cf6')
  }),

  workApproved: (complaint, user, adminName, approvalNotes) => ({
    subject: `Complaint Resolved - ${complaint.complaintId}`,
    html: baseEmailTemplate(`
      <p class="greeting">Hello ${user.name},</p>
      
      <p class="main-message">Excellent news! Your complaint has been successfully resolved and approved by our admin team. Thank you for your patience and for helping us improve our city services.</p>
      
      <div class="info-box" style="background: #f0fdf4; border-color: #bbf7d0;">
        <h3 style="color: #166534;">Work Approved & Resolved</h3>
        ${approvalNotes ? `<p style="color: #15803d;">${approvalNotes}</p>` : ''}
        <div class="details-section" style="margin: 16px 0 0 0;">
          <div class="detail-item" style="margin: 8px 0;">
            <span class="detail-label">Approved by</span>
            <span class="detail-value">${adminName}</span>
          </div>
          <div class="detail-item" style="margin: 8px 0;">
            <span class="detail-label">Status</span>
            <span class="status-badge resolved">Resolved</span>
          </div>
        </div>
      </div>
      
      ${complaint.workCompletionNotes ? `
      <div class="info-box" style="background: #f0f9ff; border-color: #bae6fd;">
        <h3 style="color: #0369a1;">Work Completion Details</h3>
        <p style="color: #0c4a6e;">${complaint.workCompletionNotes}</p>
        <div class="details-section" style="margin: 16px 0 0 0;">
          <div class="detail-item" style="margin: 8px 0;">
            <span class="detail-label">Completed by</span>
            <span class="detail-value">${complaint.assignedToFieldStaff?.name || 'Field Staff'}</span>
          </div>
          <div class="detail-item" style="margin: 8px 0;">
            <span class="detail-label">Completed on</span>
            <span class="detail-value">${new Date(complaint.workCompletedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      ` : ''}
      
      ${complaint.workProofImages && complaint.workProofImages.length > 0 ? `
      <div style="margin: 32px 0; text-align: center;">
        <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Work Proof Images</h3>
        <p style="font-size: 15px; color: #6b7280; margin: 0 0 20px 0;">Here are the proof images showing the completed work:</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin: 20px 0;">
          ${complaint.workProofImages.map(image => `
            <img src="${process.env.SERVER_URL || 'http://localhost:5000'}${image.url}" 
                 alt="Work proof" 
                 style="width: 100%; height: 120px; object-fit: cover; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: transform 0.2s ease;"
                 onclick="window.open('${process.env.SERVER_URL || 'http://localhost:5000'}${image.url}', '_blank')"
                 onmouseover="this.style.transform='scale(1.05)'"
                 onmouseout="this.style.transform='scale(1)'">
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      <div class="details-section">
        <div class="detail-item">
          <span class="detail-label">Resolved</span>
          <span class="detail-value">${new Date().toLocaleDateString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Reference</span>
          <span class="detail-value">${complaint.complaintId}</span>
        </div>
      </div>
      
      <div class="complaint-box">
        <h3 class="complaint-title">${complaint.title}</h3>
        <p class="complaint-id">${complaint.complaintId}</p>
        <p class="complaint-desc">${complaint.description}</p>
        
        <div class="complaint-meta">
          <div class="meta-item">
            <span class="meta-label">Location</span>
            <span class="meta-value">${complaint.address}, ${complaint.city}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Category</span>
            <span class="meta-value">${complaint.category.replace('_', ' ')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="meta-value">${complaint.priority}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Submitted</span>
            <span class="meta-value">${new Date(complaint.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <p style="font-size: 15px; color: #6b7280; margin: 32px 0; font-weight: 400; text-align: center;">Thank you for using UrbanEye. Your feedback helps us maintain and improve our city infrastructure.</p>
      
      <div class="cta-section">
        <a href="${process.env.CLIENT_URL}/complaint/${complaint._id}" class="cta-button">Rate & Review</a>
      </div>
    `, '#10b981')
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
    // Email sent successfully
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Specific email notification functions
const sendComplaintSubmittedEmail = async (complaint, user) => {
  if (!user.preferences?.emailNotifications) {
    // Email notifications disabled for user
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.complaintSubmitted(complaint, user);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendComplaintInProgressEmail = async (complaint, user, adminName) => {
  if (!user.preferences?.emailNotifications) {
    // Email notifications disabled for user
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.complaintInProgress(complaint, user, adminName);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendComplaintAssignedToFieldStaffEmail = async (complaint, user, fieldStaffName, department) => {
  if (!user.preferences?.emailNotifications) {
    // Email notifications disabled for user
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.complaintAssignedToFieldStaff(complaint, user, fieldStaffName, department);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendComplaintResolvedEmail = async (complaint, user, resolutionNotes) => {
  if (!user.preferences?.emailNotifications) {
    // Email notifications disabled for user
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.complaintResolved(complaint, user, resolutionNotes);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendComplaintRejectedEmail = async (complaint, user, reason) => {
  if (!user.preferences?.emailNotifications) {
    // Email notifications disabled for user
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.complaintRejected(complaint, user, reason);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendComplaintClosedEmail = async (complaint, user) => {
  if (!user.preferences?.emailNotifications) {
    // Email notifications disabled for user
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
    // Email notifications disabled for user
    return { success: false, reason: 'Email notifications disabled' };
  }

  const template = emailTemplates.workCompleted(complaint, user, fieldStaffName, workCompletionNotes);
  return await sendEmail(user.email, template.subject, template.html);
};

const sendWorkApprovedEmail = async (complaint, user, adminName, approvalNotes) => {
  if (!user.preferences?.emailNotifications) {
    // Email notifications disabled for user
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
