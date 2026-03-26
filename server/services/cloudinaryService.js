const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Avatar storage configuration
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'urbaneye/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    public_id: (req, file) => {
      // Generate unique public ID for avatar
      const userId = req.user?._id || 'anonymous';
      const timestamp = Date.now();
      return `avatar_${userId}_${timestamp}`;
    },
  },
});

// Complaint media storage configuration
const complaintStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    const timestamp = Date.now();
    const randomId = Math.round(Math.random() * 1E9);
    
    return {
      folder: isVideo ? 'urbaneye/complaints/videos' : 'urbaneye/complaints/images',
      allowed_formats: isVideo 
        ? ['mp4', 'mov', 'avi', 'mkv', 'webm'] 
        : ['jpg', 'jpeg', 'png', 'webp'],
      resource_type: isVideo ? 'video' : 'image',
      transformation: isVideo ? [
        { quality: 'auto', fetch_format: 'auto' }
      ] : [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      public_id: `complaint_${timestamp}_${randomId}`,
    };
  },
});

// Campaign image storage configuration
const campaignStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'urbaneye/campaigns',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const randomId = Math.round(Math.random() * 1E9);
      return `campaign_${timestamp}_${randomId}`;
    },
  },
});

// Campaign document storage (PDFs, images for proofs)
const campaignDocumentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === 'application/pdf';
    const timestamp = Date.now();
    const randomId = Math.round(Math.random() * 1E9);
    return {
      folder: 'urbaneye/campaign_documents',
      resource_type: isPdf ? 'raw' : 'image',
      allowed_formats: isPdf ? ['pdf'] : ['jpg', 'jpeg', 'png', 'webp'],
      public_id: `campaign_doc_${timestamp}_${randomId}`,
    };
  },
});

// File filters
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const mediaFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

const documentFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image and PDF files are allowed for documents!'), false);
  }
};

// Multer configurations
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for images
  }
});

const complaintUpload = multer({
  storage: complaintStorage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: (req, file, cb) => {
      // Different size limits for images and videos
      if (file.mimetype.startsWith('image/')) {
        return 5 * 1024 * 1024; // 5MB for images
      } else if (file.mimetype.startsWith('video/')) {
        return 50 * 1024 * 1024; // 50MB for videos
      }
      return 5 * 1024 * 1024; // Default 5MB
    },
    files: 4 // Maximum 3 images + 1 video
  }
});

const campaignUpload = multer({
  storage: campaignStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for images
  }
});

const campaignDocumentUpload = multer({
  storage: campaignDocumentStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per document
    files: 10
  }
});

// Helper functions
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

const extractPublicId = (cloudinaryUrl) => {
  try {
    // Extract public ID from Cloudinary URL
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
    const parts = cloudinaryUrl.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    
    // Handle versioned URLs (remove version number)
    if (parts.includes('upload')) {
      const uploadIndex = parts.indexOf('upload');
      const pathAfterUpload = parts.slice(uploadIndex + 1);
      
      // Remove version if present (starts with 'v' followed by numbers)
      if (pathAfterUpload[0] && pathAfterUpload[0].match(/^v\d+$/)) {
        pathAfterUpload.shift();
      }
      
      // Reconstruct path and remove extension
      const fullPath = pathAfterUpload.join('/');
      return fullPath.replace(/\.[^/.]+$/, '');
    }
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID from URL:', cloudinaryUrl, error);
    return null;
  }
};

const getResourceType = (url) => {
  if (url.includes('/video/')) return 'video';
  if (url.includes('/image/')) return 'image';
  return 'image'; // default
};

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  const configured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  
  if (!configured) {
    console.error('Missing environment variables:');
    console.error('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing');
    console.error('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing');
    console.error('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing');
    throw new Error('Cloudinary configuration is required. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
  }
  
  return configured;
};

module.exports = {
  cloudinary,
  avatarUpload,
  complaintUpload,
  campaignUpload,
  campaignDocumentUpload,
  deleteFromCloudinary,
  extractPublicId,
  getResourceType,
  isCloudinaryConfigured
};