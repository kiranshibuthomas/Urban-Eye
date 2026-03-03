/**
 * Script to fix all pending complaints by running auto-assignment
 * Usage: node scripts/fixAllPendingComplaints.js
 */

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

async function fixAllPendingComplaints() {
  try {
    const Complaint = require('../models/Complaint');
    const { autoAssignComplaint } = require('../services/autoAssignmentService');
    
    // Find all pending complaints
    const pendingComplaints = await Complaint.find({
      status: 'pending',
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .populate('citizen', 'name email')
    .select('title category priority status createdAt citizen location');
    
    console.log('\n📋 Processing Pending Complaints:\n');
    console.log('═'.repeat(100));
    
    if (pendingComplaints.length === 0) {
      console.log('\n✅ No pending complaints found. All complaints are already assigned!\n');
      process.exit(0);
    }
    
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < pendingComplaints.length; i++) {
      const complaint = pendingComplaints[i];
      console.log(`\n${i + 1}. Processing: ${complaint.title}`);
      console.log(`   ID: ${complaint._id}`);
      console.log(`   Category: ${complaint.category}`);
      console.log(`   Priority: ${complaint.priority}`);
      console.log(`   Created: ${complaint.createdAt.toLocaleString()}`);
      
      try {
        const result = await autoAssignComplaint(complaint._id);
        console.log(`   ✅ SUCCESS: Assigned to ${result.fieldStaff.name} (${result.fieldStaff.department})`);
        successCount++;
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ❌ FAILED: ${error.message}`);
        failureCount++;
      }
    }
    
    console.log('\n' + '═'.repeat(100));
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Processed: ${pendingComplaints.length}`);
    console.log(`   ✅ Successfully Assigned: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    
    if (successCount > 0) {
      console.log(`\n🎉 Great! ${successCount} complaints have been automatically assigned to field staff.`);
    }
    
    if (failureCount > 0) {
      console.log(`\n⚠️  ${failureCount} complaints could not be auto-assigned and may need manual review.`);
    }
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

console.log('\n🔧 Fixing all pending complaints...\n');
fixAllPendingComplaints();