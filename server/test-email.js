// Test script for email functionality
// Run with: node test-email.js

require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const { sendComplaintSubmittedEmail } = require('./services/emailService');
const Complaint = require('./models/Complaint');
const User = require('./models/User');

async function testEmailService() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a test user and complaint
    const user = await User.findOne({ email: { $exists: true } });
    const complaint = await Complaint.findOne().populate('citizen');

    if (!user) {
      console.log('No users found in database. Please create a user first.');
      return;
    }

    if (!complaint) {
      console.log('No complaints found in database. Please create a complaint first.');
      return;
    }

    console.log('Testing email service...');
    console.log('User:', user.email);
    console.log('Complaint ID:', complaint.complaintId);

    // Test email sending
    const result = await sendComplaintSubmittedEmail(complaint, user);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
    } else {
      console.log('❌ Email failed:', result.error || result.reason);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Check if email configuration is set
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('❌ Email configuration missing!');
  console.log('Please set EMAIL_USER and EMAIL_PASS in your config.env file');
  console.log('See EMAIL_SETUP_GUIDE.md for setup instructions');
} else {
  testEmailService();
}
