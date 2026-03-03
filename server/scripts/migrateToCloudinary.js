// Load environment variables FIRST
require('dotenv').config();

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const { cloudinary } = require('../services/cloudinaryService');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urbaneye', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

/**
 * Migration script to move local files to Cloudinary
 * Run this script after setting up Cloudinary credentials
 */

async function migrateAvatars() {
  console.log('\n📸 Migrating user avatars to Cloudinary...\n');
  
  const users = await User.find({ 
    customAvatar: { $exists: true, $ne: null },
    avatarPublicId: { $exists: false } // Only migrate users without Cloudinary ID
  });

  let migrated = 0;
  let errors = 0;

  for (const user of users) {
    try {
      // Check if avatar is already a Cloudinary URL
      if (user.customAvatar.includes('cloudinary.com')) {
        console.log(`⏭️  Skipping ${user.name} - already using Cloudinary`);
        continue;
      }

      // Construct local file path
      const filename = path.basename(user.customAvatar);
      const localPath = path.join(__dirname, '../uploads/avatars', filename);

      // Check if local file exists
      try {
        await fs.access(localPath);
      } catch (error) {
        console.log(`⚠️  File not found for ${user.name}: ${filename}`);
        continue;
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(localPath, {
        folder: 'urbaneye/avatars',
        public_id: `avatar_${user._id}_${Date.now()}`,
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      // Update user record
      user.customAvatar = result.secure_url;
      user.avatarPublicId = result.public_id;
      await user.save();

      console.log(`✅ Migrated avatar for ${user.name}`);
      migrated++;

      // Optional: Delete local file after successful migration
      // await fs.unlink(localPath);

    } catch (error) {
      console.error(`❌ Error migrating avatar for ${user.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Avatar Migration Summary:`);
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ❌ Errors: ${errors}`);
}

async function migrateGooglePhotos() {
  console.log('\n📸 Backing up Google profile photos to Cloudinary...\n');
  
  const users = await User.find({ 
    googlePhotoUrl: { $exists: true, $ne: null },
    googlePhotoBackup: { $exists: false } // Only migrate users without backup
  });

  let migrated = 0;
  let errors = 0;

  for (const user of users) {
    try {
      // Skip if it's a placeholder URL
      if (user.googlePhotoUrl.includes('default-user') || user.googlePhotoUrl.includes('placeholder')) {
        console.log(`⏭️  Skipping ${user.name} - placeholder Google photo`);
        continue;
      }

      // Upload Google photo to Cloudinary
      const result = await cloudinary.uploader.upload(user.googlePhotoUrl, {
        folder: 'urbaneye/avatars/google',
        public_id: `google_${user._id}_${Date.now()}`,
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ],
        invalidate: true
      });

      // Update user record
      user.googlePhotoBackup = result.secure_url;
      user.googlePhotoPublicId = result.public_id;
      await user.save();

      console.log(`✅ Backed up Google photo for ${user.name}`);
      migrated++;

    } catch (error) {
      console.error(`❌ Error backing up Google photo for ${user.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Google Photo Backup Summary:`);
  console.log(`   ✅ Backed up: ${migrated}`);
  console.log(`   ❌ Errors: ${errors}`);
}

async function migrateComplaintImages() {
  console.log('\n🖼️  Migrating complaint images to Cloudinary...\n');

  const complaints = await Complaint.find({
    $or: [
      { 'images.0': { $exists: true } },
      { 'video': { $exists: true } }
    ]
  });

  let migratedImages = 0;
  let migratedVideos = 0;
  let errors = 0;

  for (const complaint of complaints) {
    try {
      let updated = false;

      // Migrate images
      if (complaint.images && complaint.images.length > 0) {
        for (let i = 0; i < complaint.images.length; i++) {
          const image = complaint.images[i];
          
          // Skip if already Cloudinary URL
          if (image.url.includes('cloudinary.com')) {
            continue;
          }

          const filename = path.basename(image.url);
          const localPath = path.join(__dirname, '../uploads/complaints', filename);

          try {
            await fs.access(localPath);
            
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(localPath, {
              folder: 'urbaneye/complaints/images',
              public_id: `complaint_${complaint._id}_img_${i}_${Date.now()}`,
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' }
              ]
            });

            // Update image record
            complaint.images[i].url = result.secure_url;
            complaint.images[i].publicId = result.public_id;
            updated = true;
            migratedImages++;

          } catch (fileError) {
            console.log(`⚠️  Image file not found: ${filename}`);
          }
        }
      }

      // Migrate video
      if (complaint.video && !complaint.video.url.includes('cloudinary.com')) {
        const filename = path.basename(complaint.video.url);
        const localPath = path.join(__dirname, '../uploads/complaints', filename);

        try {
          await fs.access(localPath);
          
          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(localPath, {
            folder: 'urbaneye/complaints/videos',
            public_id: `complaint_${complaint._id}_video_${Date.now()}`,
            resource_type: 'video',
            transformation: [
              { quality: 'auto', fetch_format: 'auto' }
            ]
          });

          // Update video record
          complaint.video.url = result.secure_url;
          complaint.video.publicId = result.public_id;
          updated = true;
          migratedVideos++;

        } catch (fileError) {
          console.log(`⚠️  Video file not found: ${filename}`);
        }
      }

      // Save complaint if updated
      if (updated) {
        await complaint.save();
        console.log(`✅ Migrated media for complaint: ${complaint.title.substring(0, 50)}...`);
      }

    } catch (error) {
      console.error(`❌ Error migrating complaint ${complaint._id}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Complaint Media Migration Summary:`);
  console.log(`   🖼️  Images migrated: ${migratedImages}`);
  console.log(`   🎥 Videos migrated: ${migratedVideos}`);
  console.log(`   ❌ Errors: ${errors}`);
}

async function checkCloudinaryConfig() {
  console.log('🔧 Checking Cloudinary configuration...\n');
  
  const requiredVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing Cloudinary environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables in your .env file and try again.');
    process.exit(1);
  }

  try {
    // Test Cloudinary connection
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   Status: ${result.status}\n`);
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    console.log('🚀 Starting Cloudinary Migration\n');
    console.log('This script will migrate your local files to Cloudinary.');
    console.log('Make sure you have set up your Cloudinary credentials in .env file.\n');

    // Check configuration
    await checkCloudinaryConfig();

    // Migrate avatars
    await migrateAvatars();

    // Backup Google profile photos
    await migrateGooglePhotos();

    // Migrate complaint images and videos
    await migrateComplaintImages();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test your application to ensure images load correctly');
    console.log('2. Once confirmed, you can safely delete local upload files');
    console.log('3. Deploy your application with Cloudinary integration');

  } catch (error) {
    console.error('\n💥 Migration failed:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

// Handle script arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔄 Cloudinary Migration Script

Usage:
  node scripts/migrateToCloudinary.js [options]

Options:
  --help, -h       Show this help message
  --avatars        Migrate only user avatars
  --google-photos  Backup only Google profile photos
  --complaints     Migrate only complaint media
  --check          Check Cloudinary configuration only

Examples:
  node scripts/migrateToCloudinary.js
  node scripts/migrateToCloudinary.js --avatars
  node scripts/migrateToCloudinary.js --google-photos
  node scripts/migrateToCloudinary.js --check
`);
  process.exit(0);
}

if (args.includes('--check')) {
  checkCloudinaryConfig().then(() => {
    console.log('✅ Configuration check completed');
    process.exit(0);
  });
} else if (args.includes('--avatars')) {
  checkCloudinaryConfig().then(migrateAvatars).then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
} else if (args.includes('--google-photos')) {
  checkCloudinaryConfig().then(migrateGooglePhotos).then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
} else if (args.includes('--complaints')) {
  checkCloudinaryConfig().then(migrateComplaintImages).then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
} else {
  main();
}