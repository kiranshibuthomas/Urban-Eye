const mongoose = require('mongoose');

const workLogSchema = new mongoose.Schema({
  // Basic Information
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  fieldStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Work Session Information
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Location Information
  startLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    accuracy: {
      type: Number,
      required: true
    },
    address: String
  },
  
  endLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
    accuracy: Number,
    address: String
  },
  
  // Distance Validation
  distanceFromComplaint: {
    type: Number,
    required: true // Distance in meters when work started
  },
  isValidStartLocation: {
    type: Boolean,
    required: true,
    default: false
  },
  
  // Time Tracking
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  totalDuration: {
    type: Number, // in milliseconds
    default: 0
  },
  
  // Work Status
  status: {
    type: String,
    enum: ['started', 'paused', 'resumed', 'completed', 'submitted'],
    default: 'started'
  },
  
  // Pause/Resume Tracking
  pauseResumeLogs: [{
    action: {
      type: String,
      enum: ['pause', 'resume'],
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    reason: {
      type: String,
      required: function() {
        return this.action === 'pause';
      }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      },
      accuracy: Number
    },
    notes: String
  }],
  
  // Progress Updates
  progressUpdates: [{
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    description: {
      type: String,
      required: true,
      maxlength: 500
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      },
      accuracy: Number
    },
    images: [{
      url: String,
      filename: String,
      originalName: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  
  // Work Completion
  completionNotes: {
    type: String,
    maxlength: 1000
  },
  completionImages: [{
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Admin Review
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_revision'],
    default: 'pending'
  },
  reviewNotes: String,
  
  // Quality Metrics
  qualityScore: {
    type: Number,
    min: 1,
    max: 5
  },
  locationAccuracyScore: {
    type: Number,
    min: 0,
    max: 100
  },
  timeEfficiencyScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Team Work Support
  isTeamWork: {
    type: Boolean,
    default: false
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkTeam'
  },
  
  // System Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
workLogSchema.index({ complaint: 1, fieldStaff: 1 });
workLogSchema.index({ fieldStaff: 1, status: 1 });
workLogSchema.index({ sessionId: 1 });
workLogSchema.index({ startTime: -1 });
workLogSchema.index({ 'startLocation': '2dsphere' });
workLogSchema.index({ reviewStatus: 1 });

// Virtual for work duration in human readable format
workLogSchema.virtual('durationFormatted').get(function() {
  if (!this.totalDuration) return '0 minutes';
  
  const hours = Math.floor(this.totalDuration / (1000 * 60 * 60));
  const minutes = Math.floor((this.totalDuration % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for total pause time
workLogSchema.virtual('totalPauseTime').get(function() {
  let totalPause = 0;
  let lastPauseTime = null;
  
  for (const log of this.pauseResumeLogs) {
    if (log.action === 'pause') {
      lastPauseTime = log.timestamp;
    } else if (log.action === 'resume' && lastPauseTime) {
      totalPause += log.timestamp - lastPauseTime;
      lastPauseTime = null;
    }
  }
  
  // If currently paused
  if (lastPauseTime && this.status === 'paused') {
    totalPause += Date.now() - lastPauseTime;
  }
  
  return totalPause;
});

// Method to calculate actual work time (excluding pauses)
workLogSchema.methods.getActualWorkTime = function() {
  if (!this.endTime) return 0;
  
  const totalTime = this.endTime - this.startTime;
  const pauseTime = this.totalPauseTime;
  
  return Math.max(0, totalTime - pauseTime);
};

// Method to add progress update
workLogSchema.methods.addProgressUpdate = function(description, location, images = []) {
  this.progressUpdates.push({
    description,
    location,
    images,
    timestamp: new Date()
  });
  this.updatedAt = new Date();
  return this.save();
};

// Method to pause work
workLogSchema.methods.pauseWork = function(reason, location, notes = '') {
  if (this.status === 'paused') {
    throw new Error('Work is already paused');
  }
  
  this.pauseResumeLogs.push({
    action: 'pause',
    reason,
    location,
    notes,
    timestamp: new Date()
  });
  
  this.status = 'paused';
  this.updatedAt = new Date();
  
  return this.save();
};

// Method to resume work
workLogSchema.methods.resumeWork = function(location, notes = '') {
  if (this.status !== 'paused') {
    throw new Error('Work is not currently paused');
  }
  
  this.pauseResumeLogs.push({
    action: 'resume',
    location,
    notes,
    timestamp: new Date()
  });
  
  this.status = 'resumed';
  this.updatedAt = new Date();
  
  return this.save();
};

// Method to complete work
workLogSchema.methods.completeWork = function(completionNotes, completionImages, endLocation) {
  this.completionNotes = completionNotes;
  this.completionImages = completionImages;
  this.endLocation = endLocation;
  this.endTime = new Date();
  this.status = 'completed';
  
  // Calculate total duration
  this.totalDuration = this.getActualWorkTime();
  this.updatedAt = new Date();
  
  return this.save();
};

// Method to submit for review
workLogSchema.methods.submitForReview = function() {
  if (this.status !== 'completed') {
    throw new Error('Work must be completed before submission');
  }
  
  this.status = 'submitted';
  this.submittedAt = new Date();
  this.updatedAt = new Date();
  
  return this.save();
};

// Static method to get work statistics
workLogSchema.statics.getWorkStatistics = function(fieldStaffId, startDate, endDate) {
  const matchQuery = { fieldStaff: fieldStaffId };
  
  if (startDate || endDate) {
    matchQuery.startTime = {};
    if (startDate) matchQuery.startTime.$gte = new Date(startDate);
    if (endDate) matchQuery.startTime.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: {
          $sum: { $cond: [{ $in: ['$status', ['completed', 'submitted']] }, 1, 0] }
        },
        totalWorkTime: { $sum: '$totalDuration' },
        averageWorkTime: { $avg: '$totalDuration' },
        totalProgressUpdates: { $sum: { $size: '$progressUpdates' } },
        totalPauses: { $sum: { $size: '$pauseResumeLogs' } }
      }
    }
  ]);
};

// Ensure virtual fields are serialized
workLogSchema.set('toJSON', { virtuals: true });
workLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('WorkLog', workLogSchema);