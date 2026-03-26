const mongoose = require('mongoose');

const workTeamSchema = new mongoose.Schema({
  // Team Information
  teamName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Associated Complaint/Task
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  
  // Team Leader (Primary field staff who created the team)
  teamLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Team Members
  members: [{
    fieldStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['leader', 'member', 'specialist', 'trainee'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['invited', 'accepted', 'declined', 'active', 'left'],
      default: 'invited'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date,
    leftAt: Date,
    leaveReason: String
  }],
  
  // Team Status
  status: {
    type: String,
    enum: ['forming', 'ready', 'active', 'paused', 'completed', 'disbanded'],
    default: 'forming'
  },
  
  // Work Session
  workSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkLog'
  },
  
  // Team Configuration
  maxMembers: {
    type: Number,
    default: 5,
    min: 2,
    max: 10
  },
  
  requiredSkills: [{
    type: String,
    trim: true
  }],
  
  // Team Type & Specialization
  teamType: {
    type: String,
    enum: ['standard', 'emergency', 'specialized', 'training'],
    default: 'standard'
  },
  
  specialization: {
    type: String,
    enum: ['general', 'electrical', 'plumbing', 'road_work', 'sanitation', 'emergency_response'],
    default: 'general'
  },
  
  // Task Complexity
  taskComplexity: {
    type: String,
    enum: ['simple', 'moderate', 'complex', 'critical'],
    default: 'moderate'
  },
  
  estimatedDuration: {
    type: Number, // in minutes
    default: 120
  },
  
  // Resource Requirements
  requiredEquipment: [{
    equipment: String,
    quantity: Number,
    critical: Boolean
  }],
  
  requiredMaterials: [{
    material: String,
    quantity: Number,
    unit: String,
    estimated: Boolean
  }],
  
  estimatedBudget: {
    type: Number,
    default: 0
  },
  
  // Location Tracking
  lastKnownLocations: [{
    fieldStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number] // [longitude, latitude]
    },
    accuracy: Number,
    timestamp: {
      type: Date,
      default: Date.now
    },
    battery: Number,
    isMoving: Boolean
  }],
  
  // Team Communication
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: Date
    }]
  }],
  
  // Team Activity Log
  activityLog: [{
    action: {
      type: String,
      enum: ['created', 'member_invited', 'member_joined', 'member_left', 'work_started', 'work_paused', 'work_resumed', 'work_completed', 'disbanded'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Team Statistics
  stats: {
    totalWorkTime: {
      type: Number,
      default: 0
    },
    progressUpdates: {
      type: Number,
      default: 0
    },
    messagesExchanged: {
      type: Number,
      default: 0
    },
    averageResponseTime: Number,
    tasksCompleted: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  },
  
  // Team Performance Metrics
  performance: {
    efficiency: Number, // 0-100
    quality: Number, // 0-100
    collaboration: Number, // 0-100
    communication: Number, // 0-100
    overallScore: Number // 0-100
  },
  
  // Team Roles & Responsibilities
  roleAssignments: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String,
    responsibilities: [String],
    assignedAt: Date
  }],
  
  // Decision Making
  decisions: [{
    decision: String,
    madeBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      vote: String, // approve/reject
      timestamp: Date
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    timestamp: Date
  }],
  
  // Resource Allocation
  allocatedResources: {
    equipment: [{
      equipmentId: String,
      name: String,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      assignedAt: Date
    }],
    materials: [{
      material: String,
      quantity: Number,
      unit: String,
      allocatedAt: Date
    }],
    budget: {
      allocated: Number,
      spent: Number,
      remaining: Number
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date,
  disbandedAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
workTeamSchema.index({ complaint: 1 });
workTeamSchema.index({ teamLeader: 1 });
workTeamSchema.index({ 'members.fieldStaff': 1 });
workTeamSchema.index({ status: 1 });
workTeamSchema.index({ createdAt: -1 });
workTeamSchema.index({ 'lastKnownLocations.location': '2dsphere' });

// Virtual for active members count
workTeamSchema.virtual('activeMembersCount').get(function() {
  return this.members.filter(m => m.status === 'active' || m.status === 'accepted').length;
});

// Virtual for pending invitations count
workTeamSchema.virtual('pendingInvitationsCount').get(function() {
  return this.members.filter(m => m.status === 'invited').length;
});

// Method to add team member
workTeamSchema.methods.addMember = function(fieldStaffId, role, invitedBy) {
  // Check if already a member
  const existingMember = this.members.find(
    m => m.fieldStaff.toString() === fieldStaffId.toString()
  );
  
  if (existingMember) {
    throw new Error('User is already a team member');
  }
  
  // Check max members
  if (this.activeMembersCount >= this.maxMembers) {
    throw new Error('Team is full');
  }
  
  this.members.push({
    fieldStaff: fieldStaffId,
    role: role || 'member',
    status: 'invited',
    invitedBy,
    joinedAt: new Date()
  });
  
  this.activityLog.push({
    action: 'member_invited',
    performedBy: invitedBy,
    targetUser: fieldStaffId,
    description: `Invited to join team as ${role || 'member'}`,
    timestamp: new Date()
  });
  
  this.updatedAt = new Date();
  return this.save();
};

// Method to respond to invitation
workTeamSchema.methods.respondToInvitation = function(fieldStaffId, accept) {
  const member = this.members.find(
    m => m.fieldStaff.toString() === fieldStaffId.toString() && m.status === 'invited'
  );
  
  if (!member) {
    throw new Error('Invitation not found');
  }
  
  member.status = accept ? 'accepted' : 'declined';
  member.respondedAt = new Date();
  
  this.activityLog.push({
    action: accept ? 'member_joined' : 'member_declined',
    performedBy: fieldStaffId,
    targetUser: fieldStaffId,
    description: accept ? 'Accepted team invitation' : 'Declined team invitation',
    timestamp: new Date()
  });
  
  this.updatedAt = new Date();
  return this.save();
};

// Method to remove member
workTeamSchema.methods.removeMember = function(fieldStaffId, reason, removedBy) {
  const member = this.members.find(
    m => m.fieldStaff.toString() === fieldStaffId.toString()
  );
  
  if (!member) {
    throw new Error('Member not found');
  }
  
  member.status = 'left';
  member.leftAt = new Date();
  member.leaveReason = reason;
  
  this.activityLog.push({
    action: 'member_left',
    performedBy: removedBy,
    targetUser: fieldStaffId,
    description: reason || 'Left the team',
    timestamp: new Date()
  });
  
  this.updatedAt = new Date();
  return this.save();
};

// Method to update location
workTeamSchema.methods.updateLocation = function(fieldStaffId, location, accuracy, battery, isMoving) {
  // Remove old location for this user
  this.lastKnownLocations = this.lastKnownLocations.filter(
    loc => loc.fieldStaff.toString() !== fieldStaffId.toString()
  );
  
  // Add new location
  this.lastKnownLocations.push({
    fieldStaff: fieldStaffId,
    location: {
      type: 'Point',
      coordinates: [location.longitude, location.latitude]
    },
    accuracy,
    timestamp: new Date(),
    battery,
    isMoving
  });
  
  this.updatedAt = new Date();
  return this.save();
};

// Method to add message
workTeamSchema.methods.addMessage = function(senderId, message) {
  this.messages.push({
    sender: senderId,
    message,
    timestamp: new Date(),
    readBy: []
  });
  
  this.stats.messagesExchanged += 1;
  this.updatedAt = new Date();
  
  return this.save();
};

// Method to mark message as read
workTeamSchema.methods.markMessageAsRead = function(messageId, userId) {
  const message = this.messages.id(messageId);
  
  if (!message) {
    throw new Error('Message not found');
  }
  
  const alreadyRead = message.readBy.find(
    r => r.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    message.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
  
  return this.save();
};

// Method to start team work
workTeamSchema.methods.startWork = function(workSessionId) {
  if (this.status !== 'ready') {
    throw new Error('Team must be ready to start work');
  }
  
  this.status = 'active';
  this.workSession = workSessionId;
  this.startedAt = new Date();
  
  this.activityLog.push({
    action: 'work_started',
    performedBy: this.teamLeader,
    description: 'Team started working on the task',
    timestamp: new Date()
  });
  
  this.updatedAt = new Date();
  return this.save();
};

// Method to complete team work
workTeamSchema.methods.completeWork = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  
  this.activityLog.push({
    action: 'work_completed',
    performedBy: this.teamLeader,
    description: 'Team completed the task',
    timestamp: new Date()
  });
  
  this.updatedAt = new Date();
  return this.save();
};

// Static method to find available field staff for team
workTeamSchema.statics.findAvailableFieldStaff = async function(excludeIds = [], skills = []) {
  const User = mongoose.model('User');
  
  const query = {
    role: 'field_staff',
    isAvailable: true,
    _id: { $nin: excludeIds }
  };
  
  if (skills.length > 0) {
    query.skills = { $in: skills };
  }
  
  return User.find(query)
    .select('name email department skills currentLocation isAvailable')
    .limit(20);
};

// Ensure virtual fields are serialized
workTeamSchema.set('toJSON', { virtuals: true });
workTeamSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('WorkTeam', workTeamSchema);
