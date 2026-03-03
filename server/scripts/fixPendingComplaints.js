const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const WorkLog = require('../models/WorkLog');
require('dotenv').config({ path: './.env' });

async function fixPendingComplaints() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urbaneye', {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB');

    // Find complaints that are stuck in 'in_progress' status
    const inProgressComplaints = await Complaint.find({
      status: 'in_progress',
      assignedToFieldStaff: { $exists: true, $ne: null }
    });

    console.log(`Found ${inProgressComplaints.length} complaints stuck in 'in_progress' status`);

    let resetCount = 0;
    let keptCount = 0;

    for (const complaint of inProgressComplaints) {
      // Check if there's an active work session for this complaint
      const activeWorkLog = await WorkLog.findOne({
        complaint: complaint._id,
        fieldStaff: complaint.assignedToFieldStaff,
        status: { $in: ['started', 'paused', 'resumed'] }
      });

      if (!activeWorkLog) {
        // No active work session, safe to reset to 'assigned'
        complaint.status = 'assigned';
        complaint.workStartedAt = null;
        await complaint.save();
        resetCount++;
        console.log(`✅ Reset complaint ${complaint._id} (${complaint.title}) from 'in_progress' to 'assigned'`);
      } else {
        keptCount++;
        console.log(`ℹ️  Kept complaint ${complaint._id} (${complaint.title}) in 'in_progress' - has active work session`);
      }
    }

    console.log('\n=== Fix Summary ===');
    console.log(`✅ Reset ${resetCount} complaints from 'in_progress' to 'assigned'`);
    console.log(`ℹ️  Kept ${keptCount} complaints in 'in_progress' (have active work sessions)`);
    console.log('\n=== Fix Complete ===');
    console.log('Field staff should now be able to start work on assigned complaints.');

  } catch (error) {
    console.error('Fix error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run fix if called directly
if (require.main === module) {
  fixPendingComplaints();
}

module.exports = fixPendingComplaints;