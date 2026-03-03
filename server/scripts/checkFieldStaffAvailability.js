/**
 * Script to check field staff availability for auto-assignment
 * Usage: node scripts/checkFieldStaffAvailability.js
 */

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

async function checkFieldStaffAvailability() {
  try {
    const User = require('../models/User');
    const Complaint = require('../models/Complaint');
    
    // Find all field staff with detailed info
    const fieldStaff = await User.find({ role: 'field_staff' }).select(
      'name email department jobRole isActive isAvailable isOnLeave ' +
      'maxWorkload currentWorkload experience shiftStart shiftEnd workingDays'
    );
    
    if (fieldStaff.length === 0) {
      console.log('\n❌ No field staff found in the database.\n');
      process.exit(0);
    }
    
    console.log('\n📋 Field Staff Availability Analysis:\n');
    console.log('═'.repeat(100));
    
    for (let i = 0; i < fieldStaff.length; i++) {
      const staff = fieldStaff[i];
      
      // Get actual current workload from complaints
      const activeComplaints = await Complaint.countDocuments({
        assignedToFieldStaff: staff._id,
        status: { $in: ['assigned', 'in_progress'] },
        isDeleted: false
      });
      
      console.log(`\n${i + 1}. ${staff.name} (${staff.department})`);
      console.log(`   Email: ${staff.email}`);
      console.log(`   Job Role: ${staff.jobRole || 'N/A'}`);
      console.log(`   Status: ${staff.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Available: ${staff.isAvailable !== false ? '✅ Yes' : '❌ No'}`);
      console.log(`   On Leave: ${staff.isOnLeave ? '❌ Yes' : '✅ No'}`);
      console.log(`   Experience: ${staff.experience || 0} years`);
      console.log(`   Max Workload: ${staff.maxWorkload || 10}`);
      console.log(`   Current Workload (DB): ${staff.currentWorkload || 0}`);
      console.log(`   Actual Active Complaints: ${activeComplaints}`);
      console.log(`   Shift: ${staff.shiftStart || '09:00'} - ${staff.shiftEnd || '17:00'}`);
      console.log(`   Working Days: ${staff.workingDays ? staff.workingDays.join(', ') : 'Mon-Fri'}`);
      
      // Check if eligible for assignment
      const isEligible = staff.isActive && 
                        (staff.isAvailable !== false) && 
                        !staff.isOnLeave && 
                        activeComplaints < (staff.maxWorkload || 10);
      
      console.log(`   🎯 Eligible for Assignment: ${isEligible ? '✅ YES' : '❌ NO'}`);
      
      if (!isEligible) {
        const reasons = [];
        if (!staff.isActive) reasons.push('Not active');
        if (staff.isAvailable === false) reasons.push('Not available');
        if (staff.isOnLeave) reasons.push('On leave');
        if (activeComplaints >= (staff.maxWorkload || 10)) reasons.push('At max workload');
        console.log(`   ❌ Reasons: ${reasons.join(', ')}`);
      }
    }
    
    console.log('\n' + '═'.repeat(100));
    
    // Summary
    const eligibleStaff = await User.find({
      role: 'field_staff',
      isActive: true,
      isAvailable: { $ne: false },
      isOnLeave: false
    });
    
    console.log(`\nSUMMARY:`);
    console.log(`Total Field Staff: ${fieldStaff.length}`);
    console.log(`Eligible for Assignment: ${eligibleStaff.length}`);
    
    if (eligibleStaff.length === 0) {
      console.log('\n🚨 CRITICAL ISSUE: No field staff are eligible for auto-assignment!');
      console.log('   This is why complaints remain in "pending" status.');
    }
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

console.log('\n🔍 Analyzing field staff availability...\n');
checkFieldStaffAvailability();