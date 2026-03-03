const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Complaint = require('../models/Complaint');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check specific complaint
const checkComplaint = async (complaintId) => {
  try {
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      console.log(`❌ Complaint ${complaintId} not found`);
      return;
    }

    console.log(`\n📋 Complaint Details for ${complaintId}:`);
    console.log(`   Title: ${complaint.title}`);
    console.log(`   Status: ${complaint.status}`);
    console.log(`   isPublic: ${complaint.isPublic}`);
    console.log(`   isDeleted: ${complaint.isDeleted}`);
    console.log(`   Category: ${complaint.category}`);
    console.log(`   Submitted: ${complaint.submittedAt}`);
    console.log(`   Comments: ${complaint.comments?.length || 0}`);
    console.log(`   Work Rating: ${complaint.workRating || 'Not rated'}`);

  } catch (error) {
    console.error(`❌ Error checking complaint ${complaintId}:`, error.message);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();

    // Get complaint IDs from command line arguments
    const complaintIds = process.argv.slice(2);

    if (complaintIds.length === 0) {
      console.log('Usage: node checkComplaint.js <complaintId1> [complaintId2] ...');
      console.log('\nShowing all complaints instead:\n');

      const complaints = await Complaint.find({})
        .select('title status isPublic isDeleted submittedAt')
        .sort({ submittedAt: -1 })
        .limit(20);

      console.log(`Found ${complaints.length} complaints:\n`);
      complaints.forEach((c, i) => {
        console.log(`${i + 1}. ${c._id}`);
        console.log(`   Title: ${c.title}`);
        console.log(`   Status: ${c.status}`);
        console.log(`   Public: ${c.isPublic}, Deleted: ${c.isDeleted}`);
        console.log('');
      });
    } else {
      for (const id of complaintIds) {
        await checkComplaint(id);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run the script
main();
