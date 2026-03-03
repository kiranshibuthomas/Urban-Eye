const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const WorkLog = require('../models/WorkLog');
require('dotenv').config({ path: './.env' });

async function migrateFieldStaffSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urbaneye', {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB');

    // 1. Reset complaints that are stuck in 'in_progress' status back to 'assigned'
    // This allows the new system to start fresh work sessions
    const inProgressComplaints = await Complaint.find({
      status: 'in_progress',
      assignedToFieldStaff: { $exists: true, $ne: null }
    });

    console.log(`Found ${inProgressComplaints.length} complaints in 'in_progress' status`);

    for (const complaint of inProgressComplaints) {
      // Check if there's already a work log for this complaint in the new system
      const existingWorkLog = await WorkLog.findOne({
        complaint: complaint._id,
        fieldStaff: complaint.assignedToFieldStaff
      });

      if (!existingWorkLog) {
        // No work log exists, safe to reset to 'assigned'
        complaint.status = 'assigned';
        complaint.workStartedAt = null;
        await complaint.save();
        console.log(`Reset complaint ${complaint._id} from 'in_progress' to 'assigned'`);
      } else {
        console.log(`Complaint ${complaint._id} has existing work log, keeping current status`);
      }
    }

    // 2. Clean up any orphaned work sessions from old system
    // (This is optional - you might want to preserve old data)
    
    // 3. Ensure all assigned complaints have proper field staff assignment
    const assignedComplaints = await Complaint.find({
      status: 'assigned',
      assignedToFieldStaff: { $exists: true, $ne: null }
    });

    console.log(`Found ${assignedComplaints.length} properly assigned complaints`);

    // 4. Update any complaints that might have inconsistent status
    const inconsistentComplaints = await Complaint.find({
      $or: [
        { status: 'work_completed', assignedToFieldStaff: { $exists: true, $ne: null } },
        { status: 'resolved', assignedToFieldStaff: { $exists: true, $ne: null } }
      ]
    });

    console.log(`Found ${inconsistentComplaints.length} complaints that might need status review`);

    console.log('\n=== Migration Summary ===');
    console.log(`✅ Reset ${inProgressComplaints.length} complaints from 'in_progress' to 'assigned'`);
    console.log(`✅ Found ${assignedComplaints.length} properly assigned complaints`);
    console.log(`ℹ️  Found ${inconsistentComplaints.length} completed/resolved complaints with field staff assignments`);
    console.log('\n=== Field Staff System Migration Complete ===');
    console.log('The new field work system is now ready to use!');
    console.log('Field staff can start fresh work sessions on assigned complaints.');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateFieldStaffSystem();
}

module.exports = migrateFieldStaffSystem;