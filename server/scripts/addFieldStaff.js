/**
 * Script to add field staff members to the database
 * Usage: node scripts/addFieldStaff.js
 */

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urbaneye')
  .then(() => {
    // Connected to MongoDB
  })
  .catch(err => console.error('MongoDB connection error:', err));

const fieldStaffData = [
  // Public Works Department (Roads, Infrastructure, Construction, Drainage)
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@urbaneye.gov',
    password: 'fieldstaff123',
    role: 'field_staff',
    department: 'public_works',
    jobRole: 'road_worker',
    experience: 5,
    maxWorkload: 8,
    phone: '9876543210',
    isActive: true,
    isOnLeave: false
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@urbaneye.gov',
    password: 'fieldstaff123',
    role: 'field_staff',
    department: 'public_works',
    jobRole: 'drainage_specialist',
    experience: 3,
    maxWorkload: 10,
    phone: '9876543211',
    isActive: true,
    isOnLeave: false
  },
  {
    name: 'Anand Pillai',
    email: 'anand.pillai@urbaneye.gov',
    password: 'fieldstaff123',
    role: 'field_staff',
    department: 'public_works',
    jobRole: 'general_worker',
    experience: 4,
    maxWorkload: 9,
    phone: '9876543218',
    isActive: true,
    isOnLeave: false
  },
  
  // Water Supply Department
  {
    name: 'Suresh Menon',
    email: 'suresh.menon@urbaneye.gov',
    password: 'fieldstaff123',
    role: 'field_staff',
    department: 'water_supply',
    jobRole: 'water_technician',
    experience: 7,
    maxWorkload: 6,
    phone: '9876543212',
    isActive: true,
    isOnLeave: false
  },
  {
    name: 'Lakshmi Pillai',
    email: 'lakshmi.pillai@urbaneye.gov',
    password: 'fieldstaff123',
    role: 'field_staff',
    department: 'water_supply',
    jobRole: 'plumber',
    experience: 4,
    maxWorkload: 8,
    phone: '9876543213',
    isActive: true,
    isOnLeave: false
  },
  
  // Electricity Department
  {
    name: 'Arun Krishnan',
    email: 'arun.krishnan@urbaneye.gov',
    password: 'fieldstaff123',
    role: 'field_staff',
    department: 'electricity',
    jobRole: 'electrician',
    experience: 6,
    maxWorkload: 7,
    phone: '9876543214',
    isActive: true,
    isOnLeave: false
  },
  {
    name: 'Deepa Thomas',
    email: 'deepa.thomas@urbaneye.gov',
    password: 'fieldstaff123',
    role: 'field_staff',
    department: 'electricity',
    jobRole: 'street_light_specialist',
    experience: 2,
    maxWorkload: 9,
    phone: '9876543215',
    isActive: true,
    isOnLeave: false
  },
  
  // Sanitation Department (Waste Management)
  {
    name: 'Vinod Varma',
    email: 'vinod.varma@urbaneye.gov',
    password: 'fieldstaff123',
    role: 'field_staff',
    department: 'sanitation',
    jobRole: 'sanitation_worker',
    experience: 4,
    maxWorkload: 10,
    phone: '9876543216',
    isActive: true,
    isOnLeave: false
  },
  {
    name: 'Meera Sasi',
    email: 'meera.sasi@urbaneye.gov',
    password: 'fieldstaff123',
    role: 'field_staff',
    department: 'sanitation',
    jobRole: 'waste_collector',
    experience: 3,
    maxWorkload: 8,
    phone: '9876543217',
    isActive: true,
    isOnLeave: false
  }
];

async function addFieldStaff() {
  try {
    console.log('\n🚀 Adding field staff members...\n');

    for (const staffData of fieldStaffData) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: staffData.email });
      
      if (existingUser) {
        console.log(`⚠️  User ${staffData.name} (${staffData.email}) already exists - skipping`);
        continue;
      }

      // Create new field staff member
      const newStaff = new User(staffData);
      await newStaff.save();
      
      console.log(`✅ Added: ${staffData.name} - ${staffData.department} (${staffData.jobRole})`);
    }

    console.log('\n🎉 Field staff addition completed!\n');

    // Show summary
    const totalFieldStaff = await User.countDocuments({ role: 'field_staff' });
    const byDepartment = await User.aggregate([
      { $match: { role: 'field_staff' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('📊 Field Staff Summary:');
    console.log(`   Total: ${totalFieldStaff} field staff members`);
    byDepartment.forEach(dept => {
      console.log(`   ${dept._id}: ${dept.count} members`);
    });

    console.log('\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error adding field staff:', error.message);
    process.exit(1);
  }
}

addFieldStaff();