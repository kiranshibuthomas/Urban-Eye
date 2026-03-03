const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  // Basic complaint information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'public_works',
      'water_supply', 
      'sanitation',
      'electricity'
    ],
    default: 'public_works'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'work_completed', 'resolved', 'rejected', 'closed', 'deleted'],
    default: 'pending'
  },

  // User information
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  citizenName: {
    type: String,
    required: true
  },
  citizenEmail: {
    type: String,
    required: true
  },
  citizenPhone: {
    type: String,
    trim: true
  },

  // Location information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates'
      }
    }
  },
  locationMode: {
    type: String,
    enum: ['current', 'manual'],
    default: 'current'
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'City cannot be more than 50 characters']
  },
  pincode: {
    type: String,
    trim: true,
    maxlength: [10, 'Pincode cannot be more than 10 characters']
  },

  // Contact verification for anonymous reports
  verifiedContact: {
    type: String,
    trim: true
  },
  contactType: {
    type: String,
    enum: ['phone', 'email']
  },

  // Privacy settings
  isAnonymous: {
    type: Boolean,
    default: false
  },

  // Media attachments
  images: [{
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
    size: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      default: 'image'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Video attachment (single video)
  video: {
    url: {
      type: String
    },
    filename: {
      type: String
    },
    originalName: {
      type: String
    },
    size: {
      type: Number
    },
    type: {
      type: String,
      default: 'video'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },

  // Admin handling
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Field staff handling
  assignedToFieldStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fieldStaffAssignedAt: {
    type: Date
  },
  fieldStaffAssignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Work tracking fields
  workStartedAt: {
    type: Date
  },
  workCompletedAt: {
    type: Date
  },
  
  // Escalation fields
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: {
    type: Date
  },
  escalatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Escalation reason cannot be more than 500 characters']
  },
  
  // SLA tracking
  slaTarget: {
    type: Number, // hours
    default: 72
  },
  slaStatus: {
    type: String,
    enum: ['on_time', 'at_risk', 'overdue'],
    default: 'on_time'
  },
  slaBreachAt: {
    type: Date
  },
  adminNotes: [{
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Note cannot be more than 500 characters']
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Resolution information
  resolvedAt: {
    type: Date
  },
  resolutionNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Resolution notes cannot be more than 1000 characters']
  },

  // Rejection information
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot be more than 500 characters']
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionImages: [{
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

  // Field staff work completion
  workStartedAt: {
    type: Date
  },
  workCompletedAt: {
    type: Date
  },
  workCompletionNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Work completion notes cannot be more than 1000 characters']
  },
  workProofImages: [{
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
  
  // Field staff progress tracking
  progressNotes: [{
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Progress note cannot be more than 500 characters']
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    }
  }],

  // Field staff location tracking and check-in/check-out
  fieldStaffCheckIns: [{
    checkInTime: {
      type: Date,
      required: true
    },
    checkOutTime: {
      type: Date
    },
    checkInLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    checkOutLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      }
    },
    distanceFromComplaint: {
      type: Number, // meters
      required: true
    },
    isValidLocation: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Check-in notes cannot be more than 500 characters']
    },
    fieldStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],

  // Task pause/resume tracking
  taskPauses: [{
    pausedAt: {
      type: Date,
      required: true
    },
    resumedAt: {
      type: Date
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Pause reason cannot be more than 500 characters']
    },
    pausedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    }
  }],

  // Current task status
  currentTaskStatus: {
    type: String,
    enum: ['not_started', 'checked_in', 'in_progress', 'paused', 'checked_out', 'completed'],
    default: 'not_started'
  },
  
  // Location verification settings
  locationVerificationRequired: {
    type: Boolean,
    default: true
  },
  allowedWorkRadius: {
    type: Number, // meters
    default: 150
  },

  // SLA and Performance Tracking
  slaTarget: {
    type: Number, // hours
    default: function() {
      const slaMap = {
        'urgent': 4,    // 4 hours
        'high': 24,     // 1 day
        'medium': 72,   // 3 days
        'low': 168      // 7 days
      };
      return slaMap[this.priority] || 72;
    }
  },
  slaStatus: {
    type: String,
    enum: ['on_time', 'at_risk', 'overdue'],
    default: 'on_time'
  },
  slaBreachAt: {
    type: Date
  },
  actualCompletionTime: {
    type: Number, // hours
    default: 0
  },
  
  // Escalation tracking
  escalationLevel: {
    type: Number,
    default: 0, // 0 = no escalation, 1 = first escalation, etc.
    min: 0,
    max: 3
  },
  escalatedAt: {
    type: Date
  },
  escalatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Escalation reason cannot be more than 500 characters']
  },
  
  // Work rejection by admin
  workRejectedAt: {
    type: Date
  },
  workRejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  workRejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Work rejection reason cannot be more than 500 characters']
  },
  workRejectionCount: {
    type: Number,
    default: 0
  },

  // Admin approval for completed work
  adminApprovedAt: {
    type: Date
  },
  adminApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminApprovalNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Admin approval notes cannot be more than 500 characters']
  },

  // Citizen feedback
  citizenRating: {
    type: Number,
    min: 1,
    max: 5
  },
  citizenFeedback: {
    type: String,
    trim: true,
    maxlength: [500, 'Feedback cannot be more than 500 characters']
  },

  // Public comments
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isAnonymous: {
      type: Boolean,
      default: false
    }
  }],

  // Work completion rating (for resolved complaints)
  workRating: {
    type: Number,
    min: 1,
    max: 5
  },
  workRatingComment: {
    type: String,
    trim: true,
    maxlength: [500, 'Rating comment cannot be more than 500 characters']
  },
  workRatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  workRatedAt: {
    type: Date
  },

  // AI Analysis
  aiAnalysis: {
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    reasoning: {
      type: String,
      trim: true
    },
    priorityScore: {
      type: Number,
      default: 0
    },
    priorityReasons: [{
      type: String,
      trim: true
    }],
    analyzedAt: {
      type: Date
    }
  },

  // Community Impact Scoring
  communityImpact: {
    score: {
      type: Number,
      default: 0
    },
    upvoteWeight: {
      type: Number,
      default: 0
    },
    locationSensitivity: {
      type: Number,
      default: 0
    },
    affectedPopulation: {
      type: Number,
      default: 0
    },
    lastCalculated: {
      type: Date,
      default: Date.now
    }
  },

  // Combined Priority (System + Community)
  finalPriority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  systemPriority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // System fields
  isPublic: {
    type: Boolean,
    default: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },

// Soft delete fields
isDeleted: {
  type: Boolean,
  default: false
},
deletedAt: {
  type: Date
},
deletedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
},
deletionReason: {
  type: String,
  trim: true,
  maxlength: [500, 'Deletion reason cannot be more than 500 characters']
},
originalStatus: {
  type: String,
  enum: ['pending', 'in_progress', 'resolved', 'rejected', 'closed'],
  default: 'pending'
},

  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
complaintSchema.index({ citizen: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ assignedToFieldStaff: 1 });
complaintSchema.index({ submittedAt: -1 });
complaintSchema.index({ location: '2dsphere' }); // Geospatial index
complaintSchema.index({ isDeleted: 1 });
complaintSchema.index({ slaStatus: 1 });
complaintSchema.index({ escalationLevel: 1 });
// Compound indexes for field staff queries
complaintSchema.index({ assignedToFieldStaff: 1, status: 1 });
complaintSchema.index({ assignedToFieldStaff: 1, isDeleted: 1 });
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ slaStatus: 1, priority: 1 });

// Virtual for complaint ID (short format)
complaintSchema.virtual('complaintId').get(function() {
  return `URB-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for time since submission
complaintSchema.virtual('timeSinceSubmission').get(function() {
  const now = new Date();
  const diff = now - this.submittedAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Virtual for status color
complaintSchema.virtual('statusColor').get(function() {
  const colors = {
    pending: 'yellow',
    assigned: 'orange',
    in_progress: 'blue',
    work_completed: 'purple',
    resolved: 'green',
    rejected: 'red',
    closed: 'gray'
  };
  return colors[this.status] || 'gray';
});

// Virtual for priority color
complaintSchema.virtual('priorityColor').get(function() {
  const colors = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    urgent: 'red'
  };
  return colors[this.priority] || 'gray';
});

// Method to update last updated timestamp
complaintSchema.methods.updateTimestamp = function() {
  this.lastUpdated = new Date();
  return this.save();
};

// Method to add admin note
complaintSchema.methods.addAdminNote = function(note, adminId) {
  this.adminNotes.push({
    note,
    addedBy: adminId,
    addedAt: new Date()
  });
  this.lastUpdated = new Date();
  return this.save();
};

// Method to assign to admin
complaintSchema.methods.assignToAdmin = function(adminId) {
  this.assignedTo = adminId;
  this.assignedAt = new Date();
  this.assignedBy = adminId;
  this.status = 'in_progress';
  this.lastUpdated = new Date();
  return this.save();
};

// Method to start work by field staff
complaintSchema.methods.startWork = function(fieldStaffId) {
  this.workStartedAt = new Date();
  this.status = 'in_progress';
  this.lastUpdated = new Date();
  return this.save();
};

// Method to add progress note
complaintSchema.methods.addProgressNote = function(note, fieldStaffId, location = null) {
  this.progressNotes.push({
    note,
    addedBy: fieldStaffId,
    addedAt: new Date(),
    location: location || { type: 'Point', coordinates: [0, 0] }
  });
  this.lastUpdated = new Date();
  return this.save();
};

// Method to escalate complaint
complaintSchema.methods.escalate = function(escalatedBy, reason) {
  this.escalationLevel += 1;
  this.escalatedAt = new Date();
  this.escalatedBy = escalatedBy;
  this.escalationReason = reason;
  this.lastUpdated = new Date();
  return this.save();
};

// Method to reject work by admin
complaintSchema.methods.rejectWork = function(adminId, rejectionReason) {
  this.workRejectedAt = new Date();
  this.workRejectedBy = adminId;
  this.workRejectionReason = rejectionReason;
  this.workRejectionCount += 1;
  this.status = 'assigned'; // Send back to field staff
  this.lastUpdated = new Date();
  return this.save();
};

// Method to calculate SLA status
complaintSchema.methods.updateSLAStatus = function() {
  if (!this.fieldStaffAssignedAt) return;
  
  const now = new Date();
  const assignedTime = new Date(this.fieldStaffAssignedAt);
  const hoursElapsed = (now - assignedTime) / (1000 * 60 * 60);
  const slaHours = this.slaTarget;
  
  if (hoursElapsed >= slaHours) {
    this.slaStatus = 'overdue';
    if (!this.slaBreachAt) {
      this.slaBreachAt = new Date(assignedTime.getTime() + (slaHours * 60 * 60 * 1000));
    }
  } else if (hoursElapsed >= slaHours * 0.8) { // 80% of SLA time
    this.slaStatus = 'at_risk';
  } else {
    this.slaStatus = 'on_time';
  }
  
  return this.save();
};

// Method to calculate actual completion time
complaintSchema.methods.calculateCompletionTime = function() {
  if (this.fieldStaffAssignedAt && this.workCompletedAt) {
    const assignedTime = new Date(this.fieldStaffAssignedAt);
    const completedTime = new Date(this.workCompletedAt);
    this.actualCompletionTime = (completedTime - assignedTime) / (1000 * 60 * 60); // hours
  }
  return this.actualCompletionTime;
};

// Method to check in field staff at location
complaintSchema.methods.checkInFieldStaff = function(fieldStaffId, location, notes = '') {
  const distance = this.calculateDistanceFromComplaint(location.coordinates);
  const isValidLocation = distance <= this.allowedWorkRadius;
  
  // Check if already checked in
  const activeCheckIn = this.fieldStaffCheckIns.find(checkIn => 
    checkIn.fieldStaff.toString() === fieldStaffId.toString() && !checkIn.checkOutTime
  );
  
  if (activeCheckIn) {
    throw new Error('Field staff is already checked in. Please check out first.');
  }
  
  this.fieldStaffCheckIns.push({
    checkInTime: new Date(),
    checkInLocation: {
      type: 'Point',
      coordinates: location.coordinates
    },
    distanceFromComplaint: distance,
    isValidLocation,
    notes,
    fieldStaff: fieldStaffId
  });
  
  this.currentTaskStatus = 'checked_in';
  this.lastUpdated = new Date();
  
  return { distance, isValidLocation };
};

// Method to check out field staff
complaintSchema.methods.checkOutFieldStaff = function(fieldStaffId, location, notes = '') {
  const activeCheckIn = this.fieldStaffCheckIns.find(checkIn => 
    checkIn.fieldStaff.toString() === fieldStaffId.toString() && !checkIn.checkOutTime
  );
  
  if (!activeCheckIn) {
    throw new Error('No active check-in found. Please check in first.');
  }
  
  activeCheckIn.checkOutTime = new Date();
  activeCheckIn.checkOutLocation = {
    type: 'Point',
    coordinates: location.coordinates
  };
  
  if (notes) {
    activeCheckIn.notes = activeCheckIn.notes ? `${activeCheckIn.notes} | Checkout: ${notes}` : `Checkout: ${notes}`;
  }
  
  this.currentTaskStatus = 'checked_out';
  this.lastUpdated = new Date();
  
  return this.save();
};

// Method to pause task
complaintSchema.methods.pauseTask = function(fieldStaffId, reason, location) {
  // Check if task is currently active
  if (!['checked_in', 'in_progress'].includes(this.currentTaskStatus)) {
    throw new Error('Cannot pause task. Task is not currently active.');
  }
  
  // Check if already paused
  const activePause = this.taskPauses.find(pause => !pause.resumedAt);
  if (activePause) {
    throw new Error('Task is already paused.');
  }
  
  this.taskPauses.push({
    pausedAt: new Date(),
    reason,
    pausedBy: fieldStaffId,
    location: {
      type: 'Point',
      coordinates: location.coordinates
    }
  });
  
  this.currentTaskStatus = 'paused';
  this.lastUpdated = new Date();
  
  return this.save();
};

// Method to resume task
complaintSchema.methods.resumeTask = function(fieldStaffId, location) {
  const activePause = this.taskPauses.find(pause => !pause.resumedAt);
  
  if (!activePause) {
    throw new Error('No active pause found. Task is not currently paused.');
  }
  
  activePause.resumedAt = new Date();
  this.currentTaskStatus = 'in_progress';
  this.lastUpdated = new Date();
  
  return this.save();
};

// Method to calculate distance from complaint location
complaintSchema.methods.calculateDistanceFromComplaint = function(coordinates) {
  const [lon1, lat1] = this.location.coordinates;
  const [lon2, lat2] = coordinates;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Method to get current check-in status
complaintSchema.methods.getCurrentCheckInStatus = function(fieldStaffId) {
  const activeCheckIn = this.fieldStaffCheckIns.find(checkIn => 
    checkIn.fieldStaff.toString() === fieldStaffId.toString() && !checkIn.checkOutTime
  );
  
  const activePause = this.taskPauses.find(pause => !pause.resumedAt);
  
  return {
    isCheckedIn: !!activeCheckIn,
    checkInTime: activeCheckIn?.checkInTime,
    isPaused: !!activePause,
    pauseReason: activePause?.reason,
    currentStatus: this.currentTaskStatus,
    totalCheckIns: this.fieldStaffCheckIns.length,
    totalPauses: this.taskPauses.length
  };
};

// Method to mark work as completed by field staff
complaintSchema.methods.markWorkCompleted = function(completionNotes, proofImages = []) {
  this.workCompletedAt = new Date();
  this.workCompletionNotes = completionNotes;
  this.workProofImages = proofImages;
  this.status = 'work_completed';
  this.lastUpdated = new Date();
  return this.save();
};

// Method to approve completed work by admin
complaintSchema.methods.approveWork = function(adminId, approvalNotes = '') {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.adminApprovedAt = new Date();
  this.adminApprovedBy = adminId;
  this.adminApprovalNotes = approvalNotes;
  this.lastUpdated = new Date();
  return this.save();
};

// Method to resolve complaint (legacy method)
complaintSchema.methods.resolveComplaint = function(resolutionNotes, adminId) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolutionNotes = resolutionNotes;
  this.lastUpdated = new Date();
  return this.save();
};

// Method to reject complaint
complaintSchema.methods.rejectComplaint = function(rejectionReason, adminId) {
  this.status = 'rejected';
  this.rejectedAt = new Date();
  this.rejectionReason = rejectionReason;
  this.rejectedBy = adminId;
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get complaints by location
complaintSchema.statics.getComplaintsByLocation = function(longitude, latitude, radiusInKm = 5) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    }
  });
};

// Static method to get statistics
complaintSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        assigned: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        workCompleted: { $sum: { $cond: [{ $eq: ['$status', 'work_completed'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
      }
    }
  ]);
};

// Method to add comment
complaintSchema.methods.addComment = function(userId, userName, text, isAnonymous = false) {
  this.comments.push({
    user: userId,
    userName: isAnonymous ? 'Anonymous' : userName,
    text,
    createdAt: new Date(),
    isAnonymous
  });
  this.lastUpdated = new Date();
  return this.save();
};

// Method to rate completed work
complaintSchema.methods.rateWork = function(userId, rating, comment = '') {
  if (this.status !== 'resolved' && this.status !== 'work_completed') {
    throw new Error('Can only rate completed or resolved work');
  }
  
  this.workRating = rating;
  this.workRatingComment = comment;
  this.workRatedBy = userId;
  this.workRatedAt = new Date();
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method for soft delete
complaintSchema.methods.softDelete = function(deletedBy, reason = '') {
  // Store the original status before archiving
  if (!this.originalStatus || this.originalStatus === 'pending') {
    this.originalStatus = this.status;
  }
  
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deletionReason = reason;
  this.status = 'deleted';
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method for restore
complaintSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  this.deletionReason = undefined;
  // Restore to original status before archiving
  this.status = this.originalStatus || 'pending';
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to find non-deleted complaints
complaintSchema.statics.findActive = function(query = {}) {
  return this.find({ ...query, isDeleted: false });
};

// Static method to find deleted complaints
complaintSchema.statics.findDeleted = function(query = {}) {
  return this.find({ ...query, isDeleted: true });
};

// Ensure virtual fields are serialized
complaintSchema.set('toJSON', { virtuals: true });
complaintSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Complaint', complaintSchema);

