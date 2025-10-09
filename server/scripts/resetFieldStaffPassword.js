/**
 * Script to reset a field staff member's password
 * Usage: node scripts/resetFieldStaffPassword.js <email> <new-password>
 */

require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function resetPassword(email, newPassword) {
  try {
    const User = require('../models/User');
    
    // Find the user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    console.log(`\n📋 User found:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    if (user.department) console.log(`   Department: ${user.department}`);
    if (user.jobRole) console.log(`   Job Role: ${user.jobRole}`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    user.password = hashedPassword;
    await user.save();
    
    console.log(`\n✅ Password updated successfully!`);
    console.log(`\n📝 New credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`\n⚠️  Please keep these credentials secure!\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('\n📘 Usage:');
  console.log('   node scripts/resetFieldStaffPassword.js <email> <new-password>\n');
  console.log('📝 Example:');
  console.log('   node scripts/resetFieldStaffPassword.js kiranrao@urbaneye.com NewPassword123\n');
  process.exit(1);
}

const [email, newPassword] = args;

if (newPassword.length < 6) {
  console.log('❌ Password must be at least 6 characters long');
  process.exit(1);
}

console.log('\n🔄 Resetting password...\n');
resetPassword(email, newPassword);


