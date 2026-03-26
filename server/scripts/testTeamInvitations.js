require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const WorkTeam = require('../models/WorkTeam');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

async function testTeamInvitations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find all field staff
    const fieldStaff = await User.find({ role: 'field_staff' })
      .select('name email')
      .limit(5);
    
    console.log('Field Staff:');
    fieldStaff.forEach((staff, i) => {
      console.log(`${i + 1}. ${staff.name} (${staff.email}) - ID: ${staff._id}`);
    });
    console.log('');

    // Find all teams
    const teams = await WorkTeam.find()
      .populate('teamLeader', 'name email')
      .populate('members.fieldStaff', 'name email')
      .populate('complaint', 'title');
    
    console.log(`\nFound ${teams.length} teams:\n`);
    
    teams.forEach((team, i) => {
      console.log(`${i + 1}. Team: ${team.teamName}`);
      console.log(`   ID: ${team._id}`);
      console.log(`   Status: ${team.status}`);
      console.log(`   Complaint: ${team.complaint?.title || 'N/A'}`);
      console.log(`   Leader: ${team.teamLeader?.name || 'N/A'}`);
      console.log(`   Members (${team.members.length}):`);
      
      team.members.forEach((member, j) => {
        console.log(`     ${j + 1}. ${member.fieldStaff?.name || 'Unknown'} - Status: ${member.status} - Role: ${member.role}`);
        console.log(`        Field Staff ID: ${member.fieldStaff?._id}`);
      });
      console.log('');
    });

    // Test query for a specific field staff
    if (fieldStaff.length > 0) {
      const testStaffId = fieldStaff[0]._id;
      console.log(`\nTesting query for field staff: ${fieldStaff[0].name} (${testStaffId})`);
      
      const myTeams = await WorkTeam.find({
        'members.fieldStaff': testStaffId
      })
        .populate('complaint', 'title')
        .populate('members.fieldStaff', 'name');
      
      console.log(`Found ${myTeams.length} teams for this staff member:`);
      myTeams.forEach(team => {
        const myMembership = team.members.find(
          m => m.fieldStaff._id.toString() === testStaffId.toString()
        );
        console.log(`  - ${team.teamName} (Status: ${team.status}, My Status: ${myMembership?.status})`);
      });

      // Test with status filter
      const formingTeams = await WorkTeam.find({
        'members.fieldStaff': testStaffId,
        status: 'forming'
      })
        .populate('complaint', 'title')
        .populate('members.fieldStaff', 'name');
      
      console.log(`\nForming teams with invitations: ${formingTeams.length}`);
      formingTeams.forEach(team => {
        const myMembership = team.members.find(
          m => m.fieldStaff._id.toString() === testStaffId.toString()
        );
        console.log(`  - ${team.teamName} (My Status: ${myMembership?.status})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testTeamInvitations();
