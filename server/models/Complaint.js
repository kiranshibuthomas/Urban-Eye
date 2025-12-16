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
      'road_issues',
      'electricity', 
      'water_supply',
      'waste_management'
    ],
    default: 'road_issues'
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
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

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
    analyzedAt: {
      type: Date
    }
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

// Method to assign to field staff
complaintSchema.methods.assignToFieldStaff = function(fieldStaffId, assignedByAdminId) {
  this.assignedToFieldStaff = fieldStaffId;
  this.fieldStaffAssignedAt = new Date();
  this.fieldStaffAssignedBy = assignedByAdminId;
  this.status = 'assigned';
  this.lastUpdated = new Date();
  return this.save();
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

