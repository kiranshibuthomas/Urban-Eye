require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const WorkTeam = require('../models/WorkTeam');
const Complaint = require('../models/Complaint');

async function cleanupOrphanedTeams() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find all teams
    const allTeams = await WorkTeam.find();
    console.log(`Found ${allTeams.length} total teams\n`);

    let orphanedCount = 0;
    let disbandedCount = 0;
    let deletedCount = 0;

    for (const team of allTeams) {
      // Check if complaint exists
      const complaint = await Complaint.findById(team.complaint);
      
      if (!complaint) {
        console.log(`❌ Team "${team.teamName}" (${team._id}) - Complaint not found`);
        console.log(`   Status: ${team.status}, Created: ${team.createdAt}`);
        
        if (team.status === 'disbanded') {
          // Already disbanded, just delete it
          await WorkTeam.findByIdAndDelete(team._id);
          deletedCount++;
          console.log(`   ✅ Deleted disbanded team\n`);
        } else {
          // Disband first, then delete
          team.status = 'disbanded';
          team.disbandedAt = new Date();
          team.activityLog.push({
            action: 'disbanded',
            description: 'Team disbanded due to missing complaint (cleanup script)',
            timestamp: new Date()
          });
          await team.save();
          disbandedCount++;
          console.log(`   ✅ Disbanded team\n`);
          
          // Then delete
          await WorkTeam.findByIdAndDelete(team._id);
          deletedCount++;
          console.log(`   ✅ Deleted team\n`);
        }
        
        orphanedCount++;
      } else if (complaint.isDeleted) {
        console.log(`⚠️  Team "${team.teamName}" (${team._id}) - Complaint is deleted`);
        console.log(`   Status: ${team.status}`);
        
        if (team.status !== 'disbanded') {
          team.status = 'disbanded';
          team.disbandedAt = new Date();
          team.activityLog.push({
            action: 'disbanded',
            description: 'Team disbanded due to deleted complaint (cleanup script)',
            timestamp: new Date()
          });
          await team.save();
          disbandedCount++;
          console.log(`   ✅ Disbanded team\n`);
        } else {
          console.log(`   Already disbanded\n`);
        }
      }
    }

    console.log('\n=== Cleanup Summary ===');
    console.log(`Total teams checked: ${allTeams.length}`);
    console.log(`Orphaned teams found: ${orphanedCount}`);
    console.log(`Teams disbanded: ${disbandedCount}`);
    console.log(`Teams deleted: ${deletedCount}`);
    console.log(`Active teams remaining: ${allTeams.length - deletedCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

cleanupOrphanedTeams();
