const mongoose = require('mongoose');

const geofenceConfigSchema = new mongoose.Schema({
  // Panchayath details
  panchayathName: {
    type: String,
    required: [true, 'Panchayath name is required'],
    trim: true,
    maxlength: [100, 'Panchayath name cannot exceed 100 characters']
  },
  
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
    default: 'Kottayam'
  },
  
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    default: 'Kerala'
  },
  
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    default: 'India'
  },
  
  // Center coordinates
  centerLatitude: {
    type: Number,
    required: [true, 'Center latitude is required'],
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  
  centerLongitude: {
    type: Number,
    required: [true, 'Center longitude is required'],
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  },
  
  // Radius configuration
  radiusKm: {
    type: Number,
    required: [true, 'Radius is required'],
    min: [0.1, 'Radius must be at least 0.1 km'],
    max: [100, 'Radius cannot exceed 100 km'],
    default: 18
  },
  
  // Boundary buffer (for bounding box)
  bufferKm: {
    type: Number,
    default: 2,
    min: [0, 'Buffer must be positive'],
    max: [10, 'Buffer cannot exceed 10 km']
  },
  
  // System settings
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Auto-calculated boundary points (stored for performance)
  boundaryPoints: [{
    direction: String,
    latitude: Number,
    longitude: Number,
    _id: false
  }],
  
  // Bounding box (auto-calculated)
  boundingBox: {
    minLat: Number,
    maxLat: Number,
    minLng: Number,
    maxLng: Number
  },
  
  // Additional configuration
  strictMode: {
    type: Boolean,
    default: true,
    description: 'If true, complaints outside geofence are rejected. If false, only warnings are shown.'
  },
  
  warningMessage: {
    type: String,
    default: 'Your location is outside {panchayath}. This service is only available for residents within {panchayath} area.',
    maxlength: [500, 'Warning message cannot exceed 500 characters']
  },
  
  successMessage: {
    type: String,
    default: 'Your location is verified within {panchayath}.',
    maxlength: [500, 'Success message cannot exceed 500 characters']
  },
  
  // Audit fields
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate boundary points based on center and radius
geofenceConfigSchema.methods.calculateBoundaryPoints = function() {
  const lat = this.centerLatitude;
  const lng = this.centerLongitude;
  const radiusKm = this.radiusKm;
  
  // 1 degree latitude ≈ 111 km
  const latOffset = radiusKm / 111;
  
  // 1 degree longitude varies by latitude
  const lngOffset = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  
  // Calculate 8-point octagonal boundary
  this.boundaryPoints = [
    { direction: 'North', latitude: lat + latOffset, longitude: lng },
    { direction: 'Northeast', latitude: lat + (latOffset * 0.707), longitude: lng + (lngOffset * 0.707) },
    { direction: 'East', latitude: lat, longitude: lng + lngOffset },
    { direction: 'Southeast', latitude: lat - (latOffset * 0.707), longitude: lng + (lngOffset * 0.707) },
    { direction: 'South', latitude: lat - latOffset, longitude: lng },
    { direction: 'Southwest', latitude: lat - (latOffset * 0.707), longitude: lng - (lngOffset * 0.707) },
    { direction: 'West', latitude: lat, longitude: lng - lngOffset },
    { direction: 'Northwest', latitude: lat + (latOffset * 0.707), longitude: lng - (lngOffset * 0.707) }
  ];
  
  return this.boundaryPoints;
};

// Calculate bounding box with buffer
geofenceConfigSchema.methods.calculateBoundingBox = function() {
  const lat = this.centerLatitude;
  const lng = this.centerLongitude;
  const totalRadiusKm = this.radiusKm + this.bufferKm;
  
  const latOffset = totalRadiusKm / 111;
  const lngOffset = totalRadiusKm / (111 * Math.cos(lat * Math.PI / 180));
  
  this.boundingBox = {
    minLat: lat - latOffset,
    maxLat: lat + latOffset,
    minLng: lng - lngOffset,
    maxLng: lng + lngOffset
  };
  
  return this.boundingBox;
};

// Pre-save middleware to auto-calculate boundaries
geofenceConfigSchema.pre('save', function(next) {
  this.calculateBoundaryPoints();
  this.calculateBoundingBox();
  this.updatedAt = new Date();
  next();
});

// Static method to get active configuration
geofenceConfigSchema.statics.getActiveConfig = async function() {
  let config = await this.findOne({ isActive: true });
  
  // If no config exists, create default
  if (!config) {
    config = await this.create({
      panchayathName: 'Kanjirapally',
      district: 'Kottayam',
      state: 'Kerala',
      country: 'India',
      centerLatitude: 9.5595,
      centerLongitude: 76.7874,
      radiusKm: 18,
      bufferKm: 2,
      isActive: true
    });
  }
  
  return config;
};

// Method to get configuration for frontend
geofenceConfigSchema.methods.toClientConfig = function() {
  return {
    panchayathName: this.panchayathName,
    district: this.district,
    state: this.state,
    country: this.country,
    center: {
      latitude: this.centerLatitude,
      longitude: this.centerLongitude
    },
    radiusKm: this.radiusKm,
    bufferKm: this.bufferKm,
    boundaryPoints: this.boundaryPoints,
    boundingBox: this.boundingBox,
    strictMode: this.strictMode,
    warningMessage: this.warningMessage.replace(/{panchayath}/g, this.panchayathName),
    successMessage: this.successMessage.replace(/{panchayath}/g, this.panchayathName),
    isActive: this.isActive,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('GeofenceConfig', geofenceConfigSchema);

