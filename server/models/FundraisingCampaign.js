const mongoose = require('mongoose');

const fundraisingCampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 1000 // Minimum ₹1000
  },
  raisedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['infrastructure', 'education', 'healthcare', 'environment', 'social_welfare', 'emergency', 'other']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: String // URLs to campaign images
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String
  },
  donorCount: {
    type: Number,
    default: 0
  },
  updates: [{
    title: String,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  tags: [String],
  isUrgent: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  }
}, {
  timestamps: true
});

// Index for geospatial queries
fundraisingCampaignSchema.index({ location: '2dsphere' });

// Index for efficient queries
fundraisingCampaignSchema.index({ status: 1, createdAt: -1 });
fundraisingCampaignSchema.index({ category: 1, status: 1 });
fundraisingCampaignSchema.index({ endDate: 1, status: 1 });

// Virtual for progress percentage
fundraisingCampaignSchema.virtual('progressPercentage').get(function() {
  return this.targetAmount > 0 ? Math.round((this.raisedAmount / this.targetAmount) * 100) : 0;
});

// Virtual for days remaining
fundraisingCampaignSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Ensure virtuals are included in JSON output
fundraisingCampaignSchema.set('toJSON', { virtuals: true });
fundraisingCampaignSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FundraisingCampaign', fundraisingCampaignSchema);