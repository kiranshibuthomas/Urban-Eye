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

// Set isPublic to true for all complaints that don't have it set
const setPublicComplaints = async () => {
  try {
    console.log('\n🔄 Setting isPublic field for complaints...\n');

    // Find all complaints where isPublic is not set or is undefined
    const result = await Complaint.updateMany(
      {
        $or: [
          { isPublic: { $exists: false } },
          { isPublic: null }
        ]
      },
      {
        $set: { isPublic: true }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} complaints to be public`);

    // Get statistics
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          public: {
            $sum: {
              $cond: [{ $eq: ['$isPublic', true] }, 1, 0]
            }
          },
          private: {
            $sum: {
              $cond: [{ $eq: ['$isPublic', false] }, 1, 0]
            }
          },
          deleted: {
            $sum: {
              $cond: [{ $eq: ['$isDeleted', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    if (stats.length > 0) {
      console.log('\n📊 Complaint Statistics:');
      console.log(`   Total complaints: ${stats[0].total}`);
      console.log(`   Public complaints: ${stats[0].public}`);
      console.log(`   Private complaints: ${stats[0].private}`);
      console.log(`   Deleted complaints: ${stats[0].deleted}`);
    }

    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Error setting public complaints:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await setPublicComplaints();
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run the script
main();
