require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const WorkTeam = require('../models/WorkTeam');

async function listTeams() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const teams = await WorkTeam.find()
      .populate('complaint', 'title')
      .populate('teamLeader', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`Found ${teams.length} teams:\n`);

    teams.forEach((team, index) => {
      console.log(`${index + 1}. Team ID: ${team._id}`);
      console.log(`   Name: ${team.teamName}`);
      console.log(`   Status: ${team.status}`);
      console.log(`   Leader: ${team.teamLeader?.name || 'N/A'}`);
      console.log(`   Complaint: ${team.complaint?.title || 'N/A'}`);
      console.log(`   Members: ${team.members.length}`);
      console.log(`   Created: ${team.createdAt.toLocaleString()}`);
      console.log('');
    });

    if (teams.length === 0) {
      console.log('No teams found in database.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

listTeams();
