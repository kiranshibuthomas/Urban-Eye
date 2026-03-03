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

// Test the filter logic
const testFilter = async () => {
  try {
    console.log('\n🔍 Testing public feed filter logic...\n');

    // This is the filter used in the route
    const filter = {
      $or: [
        { isPublic: true },
        { isPublic: { $exists: false } }
      ],
      $and: [
        {
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        }
      ]
    };

    console.log('Filter:', JSON.stringify(filter, null, 2));

    const complaints = await Complaint.find(filter)
      .select('title status isPublic isDeleted submittedAt')
      .sort({ submittedAt: -1 })
      .limit(10);

    console.log(`\n✅ Found ${complaints.length} complaints matching filter:\n`);

    complaints.forEach((c, i) => {
      console.log(`${i + 1}. ${c._id}`);
      console.log(`   Title: ${c.title}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   isPublic: ${c.isPublic}`);
      console.log(`   isDeleted: ${c.isDeleted}`);
      console.log('');
    });

    // Test specific IDs
    console.log('\n🔍 Testing specific complaint IDs:\n');
    const testIds = ['6982dccff668f8c274e68834', '6982dbd0f668f8c274e6853b'];

    for (const id of testIds) {
      const complaint = await Complaint.findById(id);
      if (complaint) {
        const matchesFilter = await Complaint.findOne({ _id: id, ...filter });
        console.log(`Complaint ${id}:`);
        console.log(`   isPublic: ${complaint.isPublic}`);
        console.log(`   isDeleted: ${complaint.isDeleted}`);
        console.log(`   Matches filter: ${matchesFilter ? 'YES ✅' : 'NO ❌'}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error testing filter:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await testFilter();
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run the script
main();
