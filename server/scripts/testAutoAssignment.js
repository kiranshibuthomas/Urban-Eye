/**
 * Script to test auto-assignment functionality
 * Usage: node scripts/testAutoAssignment.js
 */

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

async function testAutoAssignment() {
  try {
    const Complaint = require('../models/Complaint');
    const { autoAssignComplaint } = require('../services/autoAssignmentService');
    
    // Find recent pending complaints
    const pendingComplaints = await Complaint.find({
      status: 'pending',
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('citizen', 'name email')
    .select('title category priority status createdAt citizen location');
    
    console.log('\n📋 Recent Pending Complaints:\n');
    console.log('═'.repeat(100));
    
    if (pendingComplaints.length === 0) {
      console.log('\n✅ No pending complaints found. All complaints are assigned!\n');
      process.exit(0);
    }
    
    for (let i = 0; i < pendingComplaints.length; i++) {
      const complaint = pendingComplaints[i];
      console.log(`\n${i + 1}. ${complaint.title}`);
      console.log(`   ID: ${complaint._id}`);
      console.log(`   Category: ${complaint.category}`);
      console.log(`   Priority: ${complaint.priority}`);
      console.log(`   Status: ${complaint.status}`);
      console.log(`   Created: ${complaint.createdAt.toLocaleString()}`);
      console.log(`   Citizen: ${complaint.citizen.name} (${complaint.citizen.email})`);
      console.log(`   Location: [${complaint.location.coordinates[1]}, ${complaint.location.coordinates[0]}]`);
    }
    
    console.log('\n' + '═'.repeat(100));
    
    // Test auto-assignment on the first pending complaint
    if (pendingComplaints.length > 0) {
      const testComplaint = pendingComplaints[0];
      console.log(`\n🧪 Testing auto-assignment for complaint: ${testComplaint.title}`);
      console.log(`   ID: ${testComplaint._id}`);
      console.log(`   Category: ${testComplaint.category}`);
      
      try {
        const result = await autoAssignComplaint(testComplaint._id);
        console.log('\n✅ Auto-assignment successful!');
        console.log(`   Assigned to: ${result.fieldStaff.name} (${result.fieldStaff.department})`);
        console.log(`   Message: ${result.message}`);
        
        // Verify the assignment
        const updatedComplaint = await Complaint.findById(testComplaint._id)
          .populate('assignedToFieldStaff', 'name department');
        
        console.log(`\n📋 Updated Complaint Status:`);
        console.log(`   Status: ${updatedComplaint.status}`);
        console.log(`   Assigned to: ${updatedComplaint.assignedToFieldStaff?.name || 'None'}`);
        console.log(`   Department: ${updatedComplaint.assignedToFieldStaff?.department || 'None'}`);
        
      } catch (error) {
        console.log('\n❌ Auto-assignment failed!');
        console.log(`   Error: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
      }
    }
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

console.log('\n🔍 Testing auto-assignment functionality...\n');
testAutoAssignment();