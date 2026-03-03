/**
 * Setup script for Team Collaboration feature
 * This script ensures all necessary indexes and configurations are in place
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const WorkTeam = require('../models/WorkTeam');
const User = require('../models/User');

async function setupTeamCollaboration() {
  try {
    console.log('🚀 Setting up Team Collaboration feature...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urbaneye', {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Create indexes for WorkTeam collection
    console.log('📊 Creating indexes for WorkTeam collection...');
    await WorkTeam.collection.createIndexes([
      { key: { complaint: 1 } },
      { key: { teamLeader: 1 } },
      { key: { 'members.fieldStaff': 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } },
      { key: { 'lastKnownLocations.location': '2dsphere' } }
    ]);
    console.log('✅ Indexes created successfully\n');

    // Check if field staff users have necessary fields
    console.log('👥 Checking field staff user configurations...');
    const fieldStaffCount = await User.countDocuments({ role: 'field_staff' });
    console.log(`   Found ${fieldStaffCount} field staff users`);

    // Add skills field to field staff if not present
    const updateResult = await User.updateMany(
      { 
        role: 'field_staff',
        skills: { $exists: false }
      },
      { 
        $set: { 
          skills: [],
          isAvailable: true
        }
      }
    );
    
    if (updateResult.modifiedCount > 0) {
      console.log(`   ✅ Updated ${updateResult.modifiedCount} field staff users with default fields`);
    } else {
      console.log('   ✅ All field staff users already configured');
    }

    // Display statistics
    console.log('\n📈 Current Statistics:');
    const stats = {
      totalFieldStaff: await User.countDocuments({ role: 'field_staff' }),
      availableFieldStaff: await User.countDocuments({ role: 'field_staff', isAvailable: true }),
      totalTeams: await WorkTeam.countDocuments(),
      activeTeams: await WorkTeam.countDocuments({ status: { $in: ['ready', 'active'] } })
    };

    console.log(`   Total Field Staff: ${stats.totalFieldStaff}`);
    console.log(`   Available Field Staff: ${stats.availableFieldStaff}`);
    console.log(`   Total Teams: ${stats.totalTeams}`);
    console.log(`   Active Teams: ${stats.activeTeams}`);

    console.log('\n✨ Team Collaboration feature setup completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Restart your server: npm run dev');
    console.log('   2. Field staff can create teams from their dashboard');
    console.log('   3. Admins can track teams at /admin/live-teams');
    console.log('\n🎉 Happy collaborating!\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run setup
setupTeamCollaboration();
