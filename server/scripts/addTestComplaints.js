const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

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
        title: 'Broken Street Light on Main Road',
        description: 'Street light is not working near the main junction, causing safety issues at night.',
        category: 'street_lighting',
        priority: 'high',
        status: 'pending',
        citizen: adminUser._id,
        citizenName: adminUser.name,
        citizenEmail: adminUser.email,
        citizenPhone: adminUser.phone,
        location: {
          type: 'Point',
          coordinates: [76.5222, 9.5916] // Kanjirapally center
        },
        address: 'Main Road, Kanjirapally',
        city: 'Kanjirapally',
        pincode: '686507'
      },
      {
        title: 'Water Leakage in Residential Area',
        description: 'Water pipe is leaking near the residential complex, wasting water.',
        category: 'water_supply',
        priority: 'urgent',
        status: 'in_progress',
        citizen: adminUser._id,
        citizenName: adminUser.name,
        citizenEmail: adminUser.email,
        citizenPhone: adminUser.phone,
        location: {
          type: 'Point',
          coordinates: [76.5232, 9.5926] // Slightly north
        },
        address: 'Residential Area, Kanjirapally',
        city: 'Kanjirapally',
        pincode: '686507'
      },
      {
        title: 'Pothole on Highway',
        description: 'Large pothole on the highway causing traffic issues.',
        category: 'road_issues',
        priority: 'medium',
        status: 'resolved',
        citizen: adminUser._id,
        citizenName: adminUser.name,
        citizenEmail: adminUser.email,
        citizenPhone: adminUser.phone,
        location: {
          type: 'Point',
          coordinates: [76.5212, 9.5906] // Slightly south
        },
        address: 'Highway Road, Kanjirapally',
        city: 'Kanjirapally',
        pincode: '686507'
      },
      {
        title: 'Garbage Collection Issue',
        description: 'Garbage is not being collected regularly in our area.',
        category: 'waste_management',
        priority: 'low',
        status: 'pending',
        citizen: adminUser._id,
        citizenName: adminUser.name,
        citizenEmail: adminUser.email,
        citizenPhone: adminUser.phone,
        location: {
          type: 'Point',
          coordinates: [76.5242, 9.5936] // Further north
        },
        address: 'Garbage Collection Area, Kanjirapally',
        city: 'Kanjirapally',
        pincode: '686507'
      },
      {
        title: 'Power Outage in Commercial Area',
        description: 'Frequent power outages in the commercial area affecting businesses.',
        category: 'electricity',
        priority: 'high',
        status: 'assigned',
        citizen: adminUser._id,
        citizenName: adminUser.name,
        citizenEmail: adminUser.email,
        citizenPhone: adminUser.phone,
        location: {
          type: 'Point',
          coordinates: [76.5202, 9.5896] // Further south
        },
        address: 'Commercial Area, Kanjirapally',
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
