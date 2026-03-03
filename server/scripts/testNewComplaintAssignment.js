/**
 * Script to test that new complaints are automatically assigned
 * Usage: node scripts/testNewComplaintAssignment.js
 */

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

async function testNewComplaintAssignment() {
  try {
    const Complaint = require('../models/Complaint');
    const User = require('../models/User');
    const { autoAssignComplaint } = require('../services/autoAssignmentService');
    
    // Find a test citizen
    const testCitizen = await User.findOne({ role: 'citizen' });
    if (!testCitizen) {
      console.log('❌ No citizen found for testing');
      process.exit(1);
    }
    
    console.log('\n🧪 Testing New Complaint Auto-Assignment\n');
    console.log('═'.repeat(80));
    
    // Create a test complaint
    const testComplaint = new Complaint({
      title: 'Test Auto-Assignment - Electricity Issue',
      description: 'Testing if new complaints are automatically assigned to field staff',
      category: 'electricity',
      priority: 'medium',
      citizen: testCitizen._id,
      citizenName: testCitizen.name,
      citizenEmail: testCitizen.email,
      location: {
        type: 'Point',
        coordinates: [76.7874, 9.5595] // Kanjirapally center
      },
      locationMode: 'manual',
      address: 'Test Location, Kanjirapally',
      city: 'Kanjirapally',
      pincode: '686507'
    });
    
    await testComplaint.save();
    console.log(`\n✅ Created test complaint: ${testComplaint.title}`);
    console.log(`   ID: ${testComplaint._id}`);
    console.log(`   Status: ${testComplaint.status}`);
    console.log(`   Category: ${testComplaint.category}`);
    
    // Test auto-assignment
    console.log(`\n🔄 Running auto-assignment...`);
    
    try {
      const result = await autoAssignComplaint(testComplaint._id);
      console.log(`\n✅ Auto-assignment successful!`);
      console.log(`   Assigned to: ${result.fieldStaff.name}`);
      console.log(`   Department: ${result.fieldStaff.department}`);
      console.log(`   Message: ${result.message}`);
      
      // Verify the assignment
      const updatedComplaint = await Complaint.findById(testComplaint._id)
        .populate('assignedToFieldStaff', 'name department');
      
      console.log(`\n📋 Final Status:`);
      console.log(`   Status: ${updatedComplaint.status}`);
      console.log(`   Assigned to: ${updatedComplaint.assignedToFieldStaff?.name || 'None'}`);
      console.log(`   Department: ${updatedComplaint.assignedToFieldStaff?.department || 'None'}`);
      
      console.log(`\n🎉 SUCCESS: New complaints will be automatically assigned!`);
      
    } catch (error) {
      console.log(`\n❌ Auto-assignment failed: ${error.message}`);
    }
    
    // Clean up - delete test complaint
    await Complaint.findByIdAndDelete(testComplaint._id);
    console.log(`\n🧹 Cleaned up test complaint`);
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Test completed successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

console.log('\n🔍 Testing new complaint auto-assignment...\n');
testNewComplaintAssignment();