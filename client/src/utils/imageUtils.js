/**
 * Utility functions for handling image URLs
 * Supports both local storage and Cloudinary URLs
 */

/**
 * Get the full URL for an image
 * @param {string} imageUrl - The image URL (can be relative or absolute)
 * @returns {string} - Full image URL
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If it's already a full URL (Cloudinary or external), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative URL (local storage), prepend the server URL
  if (imageUrl.startsWith('/uploads/')) {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
    return `${serverUrl}${imageUrl}`;
  }
  
  return imageUrl;
};

/**
 * Get optimized image URL with transformations (for Cloudinary)
 * @param {string} imageUrl - The original image URL
 * @param {Object} options - Transformation options
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (imageUrl, options = {}) => {
  const {
    width = null,
    height = null,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto'
  } = options;
  
  if (!imageUrl) return null;
  
  // If it's a Cloudinary URL, we can add transformations
  if (imageUrl.includes('cloudinary.com')) {
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      
      // Find the upload part
      const uploadIndex = pathParts.findIndex(part => part === 'upload');
      if (uploadIndex === -1) return getImageUrl(imageUrl);
      
      // Build transformation string
      const transformations = [];
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      if (crop) transformations.push(`c_${crop}`);
      if (gravity) transformations.push(`g_${gravity}`);
      if (quality) transformations.push(`q_${quality}`);
      if (format) transformations.push(`f_${format}`);
      
      if (transformations.length > 0) {
        // Insert transformations after 'upload'
        pathParts.splice(uploadIndex + 1, 0, transformations.join(','));
        url.pathname = pathParts.join('/');
        return url.toString();
      }
    } catch (error) {
      console.warn('Error optimizing Cloudinary URL:', error);
    }
  }
  
  // For non-Cloudinary URLs, just return the full URL
  return getImageUrl(imageUrl);
};

/**
 * Get avatar URL with default fallback
 * @param {Object} user - User object
 * @param {Object} options - Options for optimization
 * @returns {string} - Avatar URL
 */
export const getAvatarUrl = (user, options = {}) => {
  if (!user) return getDefaultAvatar();
  
  // Priority 1: Custom uploaded avatar
  if (user.customAvatar) {
    return getOptimizedImageUrl(user.customAvatar, {
      width: 150,
      height: 150,
      crop: 'fill',
      gravity: 'face',
      ...options
    });
  }
  
  // Priority 2: Google photo backup (Cloudinary - more reliable)
  if (user.googlePhotoBackup) {
    return getOptimizedImageUrl(user.googlePhotoBackup, {
      width: 150,
      height: 150,
      crop: 'fill',
      gravity: 'face',
      ...options
    });
  }
  
  // Priority 3: Original Google OAuth photo
  if (user.googlePhotoUrl && user.googlePhotoUrl !== 'https://lh3.googleusercontent.com/a/default-user=s400') {
    return user.googlePhotoUrl;
  }
  
  // Priority 4: Gravatar
  if (user.email) {
    return getGravatarUrl(user.email, options.width || 150);
  }
  
  // Fallback: Default avatar
  return getDefaultAvatar();
};

/**
 * Generate Gravatar URL
 * @param {string} email - User email
 * @param {number} size - Avatar size
 * @returns {string} - Gravatar URL
 */
export const getGravatarUrl = (email, size = 150) => {
  if (!email) return getDefaultAvatar();
  
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
};

/**
 * Get default avatar URL
 * @returns {string} - Default avatar URL
 */
export const getDefaultAvatar = () => {
  return 'https://via.placeholder.com/150x150/6366f1/ffffff?text=User';
};

/**
 * Check if an image URL is from Cloudinary
 * @param {string} imageUrl - Image URL to check
 * @returns {boolean} - True if Cloudinary URL
 */
export const isCloudinaryUrl = (imageUrl) => {
  return imageUrl && imageUrl.includes('cloudinary.com');
};

/**
 * Get thumbnail URL for complaint images
 * @param {string} imageUrl - Original image URL
 * @returns {string} - Thumbnail URL
 */
export const getThumbnailUrl = (imageUrl) => {
  return getOptimizedImageUrl(imageUrl, {
    width: 300,
    height: 200,
    crop: 'fill',
    quality: 'auto'
  });
};

/**
 * Get full-size URL for complaint images
 * @param {string} imageUrl - Original image URL
 * @returns {string} - Full-size URL
 */
export const getFullSizeUrl = (imageUrl) => {
  return getOptimizedImageUrl(imageUrl, {
    width: 1200,
    height: 1200,
    crop: 'limit',
    quality: 'auto'
  });
};