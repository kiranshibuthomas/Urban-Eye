/**
 * Script to list all field staff members
 * Usage: node scripts/listFieldStaff.js
 */

require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

async function listFieldStaff() {
  try {
    const User = require('../models/User');
    
    // Find all field staff
    const fieldStaff = await User.find({ role: 'field_staff' }).select('name email department jobRole isActive');
    
    if (fieldStaff.length === 0) {
      console.log('\n❌ No field staff found in the database.\n');
      process.exit(0);
    }
    
    console.log('\n📋 Field Staff Members:\n');
    console.log('═'.repeat(80));
    
    fieldStaff.forEach((staff, index) => {
      console.log(`\n${index + 1}. ${staff.name}`);
      console.log(`   Email: ${staff.email}`);
      console.log(`   Department: ${staff.department || 'N/A'}`);
      console.log(`   Job Role: ${staff.jobRole || 'N/A'}`);
      console.log(`   Status: ${staff.isActive ? '✅ Active' : '❌ Inactive'}`);
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log(`\nTotal: ${fieldStaff.length} field staff member(s)\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

console.log('\n🔍 Fetching field staff from database...\n');
listFieldStaff();


