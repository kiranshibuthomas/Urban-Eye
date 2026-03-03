const { cloudinary, isCloudinaryConfigured, deleteFromCloudinary } = require('./cloudinaryService');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Avatar Service - Handles all avatar operations including Google photo backup
 */

/**
 * Backup Google profile photo to Cloudinary
 * @param {Object} user - User object
 * @param {string} googlePhotoUrl - Google profile photo URL
 * @returns {Object} - Backup result with Cloudinary URL and public ID
 */
async function backupGooglePhotoToCloudinary(user, googlePhotoUrl) {
  if (!isCloudinaryConfigured() || !googlePhotoUrl) {
    return null;
  }

  try {
    // Skip if it's the default Google placeholder
    if (googlePhotoUrl.includes('default-user') || googlePhotoUrl.includes('placeholder')) {
      return null;
    }

    // Check if we already have a backup of this photo
    if (user.googlePhotoBackup && user.googlePhotoUrl === googlePhotoUrl) {
      return {
        url: user.googlePhotoBackup,
        publicId: user.googlePhotoPublicId,
        alreadyExists: true
      };
    }

    // Delete old Google photo backup if exists
    if (user.googlePhotoPublicId) {
      try {
        await deleteFromCloudinary(user.googlePhotoPublicId, 'image');
      } catch (error) {
        console.error('Error deleting old Google photo backup:', error);
      }
    }

    // Upload Google photo to Cloudinary
    const result = await cloudinary.uploader.upload(googlePhotoUrl, {
      folder: 'urbaneye/avatars/google',
      public_id: `google_${user._id}_${Date.now()}`,
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      // Remove the invalid 'type: fetch' parameter
      invalidate: true
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      alreadyExists: false
    };

  } catch (error) {
    console.error('Error backing up Google photo to Cloudinary:', error);
    return null;
  }
}

/**
 * Get the best available avatar URL for a user
 * @param {Object} user - User object
 * @returns {string} - Best available avatar URL
 */
function getBestAvatarUrl(user) {
  // Priority 1: Custom uploaded avatar
  if (user.customAvatar) {
    return user.customAvatar;
  }

  // Priority 2: Google photo backup (Cloudinary)
  if (user.googlePhotoBackup) {
    return user.googlePhotoBackup;
  }

  // Priority 3: Original Google photo (direct from Google)
  if (user.googlePhotoUrl && !user.googlePhotoUrl.includes('default-user')) {
    return user.googlePhotoUrl;
  }

  // Priority 4: Gravatar
  if (user.email) {
    return getGravatarUrl(user.email);
  }

  // Priority 5: Default avatar
  return getDefaultAvatarUrl();
}

/**
 * Generate Gravatar URL
 * @param {string} email - User email
 * @param {number} size - Avatar size
 * @returns {string} - Gravatar URL
 */
function getGravatarUrl(email, size = 300) {
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
}

/**
 * Get default avatar URL
 * @returns {string} - Default avatar URL
 */
function getDefaultAvatarUrl() {
  return 'https://via.placeholder.com/300x300/6366f1/ffffff?text=User';
}

/**
 * Clean up all avatar files for a user
 * @param {Object} user - User object
 */
async function cleanupUserAvatars(user) {
  const cleanupPromises = [];

  // Delete custom avatar
  if (user.avatarPublicId && isCloudinaryConfigured()) {
    cleanupPromises.push(
      deleteFromCloudinary(user.avatarPublicId, 'image').catch(error => 
        console.error('Error deleting custom avatar:', error)
      )
    );
  }

  // Delete Google photo backup
  if (user.googlePhotoPublicId && isCloudinaryConfigured()) {
    cleanupPromises.push(
      deleteFromCloudinary(user.googlePhotoPublicId, 'image').catch(error => 
        console.error('Error deleting Google photo backup:', error)
      )
    );
  }

  await Promise.all(cleanupPromises);
}

/**
 * Refresh Google photo backup for a user
 * @param {Object} user - User object
 * @returns {Object} - Updated user data
 */
async function refreshGooglePhotoBackup(user) {
  if (!user.googlePhotoUrl || !isCloudinaryConfigured()) {
    return user;
  }

  try {
    const backupResult = await backupGooglePhotoToCloudinary(user, user.googlePhotoUrl);
    
    if (backupResult && !backupResult.alreadyExists) {
      user.googlePhotoBackup = backupResult.url;
      user.googlePhotoPublicId = backupResult.publicId;
      await user.save();
    }

    return user;
  } catch (error) {
    console.error('Error refreshing Google photo backup:', error);
    return user;
  }
}

/**
 * Process avatar after OAuth login
 * @param {Object} user - User object
 * @param {string} googlePhotoUrl - Google profile photo URL
 * @returns {Object} - Updated user data
 */
async function processOAuthAvatar(user, googlePhotoUrl) {
  if (!googlePhotoUrl || !isCloudinaryConfigured()) {
    return user;
  }

  try {
    // Update Google photo URL
    user.googlePhotoUrl = googlePhotoUrl;

    // Backup to Cloudinary
    const backupResult = await backupGooglePhotoToCloudinary(user, googlePhotoUrl);
    
    if (backupResult) {
      user.googlePhotoBackup = backupResult.url;
      user.googlePhotoPublicId = backupResult.publicId;
    }

    await user.save();
    return user;
  } catch (error) {
    console.error('Error processing OAuth avatar:', error);
    return user;
  }
}

/**
 * Get avatar with transformations
 * @param {Object} user - User object
 * @param {Object} options - Transformation options
 * @returns {string} - Avatar URL with transformations
 */
function getAvatarWithTransformations(user, options = {}) {
  const { width = 300, height = 300, crop = 'fill', gravity = 'face' } = options;
  const avatarUrl = getBestAvatarUrl(user);

  // If it's a Cloudinary URL, we can add transformations
  if (avatarUrl && avatarUrl.includes('cloudinary.com')) {
    try {
      const url = new URL(avatarUrl);
      const pathParts = url.pathname.split('/');
      
      // Find the upload part
      const uploadIndex = pathParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1) {
        // Build transformation string
        const transformations = [
          `w_${width}`,
          `h_${height}`,
          `c_${crop}`,
          `g_${gravity}`,
          'q_auto',
          'f_auto'
        ];
        
        // Insert transformations after 'upload'
        pathParts.splice(uploadIndex + 1, 0, transformations.join(','));
        url.pathname = pathParts.join('/');
        return url.toString();
      }
    } catch (error) {
      console.warn('Error adding transformations to avatar URL:', error);
    }
  }

  return avatarUrl;
}

module.exports = {
  backupGooglePhotoToCloudinary,
  getBestAvatarUrl,
  getGravatarUrl,
  getDefaultAvatarUrl,
  cleanupUserAvatars,
  refreshGooglePhotoBackup,
  processOAuthAvatar,
  getAvatarWithTransformations
};