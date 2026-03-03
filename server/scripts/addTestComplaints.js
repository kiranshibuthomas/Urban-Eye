const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// Load environment variables
require('dotenv').config({ path: '.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addTestComplaints() {
  try {
    // Find an admin user to use as the citizen
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      return;
    }

    console.log('Found admin user:', adminUser.email);

    // Test complaint data with different priorities and locations around Kanjirapally
    const testComplaints = [
      {
        title: 'Roads & Infrastructure Issue',
        description: 'Large pothole on the main road causing traffic issues and vehicle damage.',
        category: 'public_works',
        priority: 'high',
        status: 'pending',
        citizen: adminUser._id,
        citizenName: adminUser.name,
        citizenEmail: adminUser.email,
        citizenPhone: adminUser.phone,
        location: {
          type: 'Point',
          coordinates: [76.7874, 9.5595] // Kanjirapally center
        },
        address: 'Main Road, Kanjirapally',
        city: 'Kanjirapally',
        pincode: '686507'
      },
      {
        title: 'Water Supply Issue',
        description: 'Water pipe is leaking near the residential complex, wasting water and causing flooding.',
        category: 'water_supply',
        priority: 'urgent',
        status: 'in_progress',
        citizen: adminUser._id,
        citizenName: adminUser.name,
        citizenEmail: adminUser.email,
        citizenPhone: adminUser.phone,
        location: {
          type: 'Point',
          coordinates: [76.7884, 9.5605] // Slightly northeast
        },
        address: 'Residential Area, Kanjirapally',
        city: 'Kanjirapally',
        pincode: '686507'
      },
      {
        title: 'Waste & Sanitation Issue',
        description: 'Garbage is overflowing and not being collected regularly in our area.',
        category: 'sanitation',
        priority: 'medium',
        status: 'pending',
        citizen: adminUser._id,
        citizenName: adminUser.name,
        citizenEmail: adminUser.email,
        citizenPhone: adminUser.phone,
        location: {
          type: 'Point',
          coordinates: [76.7864, 9.5585] // Slightly southwest
        },
        address: 'Market Area, Kanjirapally',
        city: 'Kanjirapally',
        pincode: '686507'
      },
      {
        title: 'Electrical & Lighting Issue',
        description: 'Street light is not working near the main junction, causing safety issues at night.',
        category: 'electricity',
        priority: 'high',
        status: 'assigned',
        citizen: adminUser._id,
        citizenName: adminUser.name,
        citizenEmail: adminUser.email,
        citizenPhone: adminUser.phone,
        location: {
          type: 'Point',
          coordinates: [76.7894, 9.5615] // Further northeast
        },
        address: 'Junction Area, Kanjirapally',
        city: 'Kanjirapally',
        pincode: '686507'
      },
      {
        title: 'Roads & Infrastructure Issue',
        description: 'Drainage system is blocked causing water logging during rains.',
        category: 'public_works',
        priority: 'medium',
        status: 'pending',
        citizen: adminUser._id,
        citizenName: adminUser.name,
        citizenEmail: adminUser.email,
        citizenPhone: adminUser.phone,
        location: {
          type: 'Point',
          coordinates: [76.7854, 9.5575] // Further southwest
        },
        address: 'School Road, Kanjirapally',
        city: 'Kanjirapally',
        pincode: '686507'
      },
      {
        title: 'Water Supply Issue',
        description: 'Low water pressure in the morning hours affecting daily activities.',
        category: 'water_supply',
        priority: 'low',
        status: 'pending',
        citizen: adminUser._id,
        citizenName: adminUser.name,
        citizenEmail: adminUser.email,
        citizenPhone: adminUser.phone,
        location: {
          type: 'Point',
          coordinates: [76.7904, 9.5625] // Further northeast
        },
        address: 'Housing Colony, Kanjirapally',
        city: 'Kanjirapally',
        pincode: '686507'
      }
    ];

    // Clear existing test complaints (optional)
    await Complaint.deleteMany({ citizen: adminUser._id });
    console.log('Cleared existing test complaints');

    // Add test complaints
    const createdComplaints = await Complaint.insertMany(testComplaints);
    console.log(`Successfully added ${createdComplaints.length} test complaints`);

    // Display the created complaints
    createdComplaints.forEach((complaint, index) => {
      console.log(`${index + 1}. ${complaint.title} (${complaint.priority} priority) - ${complaint.status}`);
      console.log(`   Location: ${complaint.location.coordinates[1]}, ${complaint.location.coordinates[0]}`);
    });

    console.log('\nTest complaints added successfully!');
    console.log('You can now test the heatmap feature in the admin dashboard.');

  } catch (error) {
    console.error('Error adding test complaints:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
addTestComplaints();
