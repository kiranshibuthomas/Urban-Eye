const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'archive', 'restore', 'hard_delete', 'status_change']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['complaint', 'user', 'system']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByEmail: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    maxlength: [500, 'Reason cannot be more than 500 characters']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// Static method to log actions
auditLogSchema.statics.logAction = function(actionData) {
  return this.create(actionData);
};

// Static method to get audit trail for an entity
auditLogSchema.statics.getAuditTrail = function(entityType, entityId) {
  return this.find({ entityType, entityId })
    .populate('performedBy', 'name email')
    .sort({ timestamp: -1 });
};

// Static method to get admin actions
auditLogSchema.statics.getAdminActions = function(adminId, limit = 50) {
  return this.find({ performedBy: adminId })
    .populate('performedBy', 'name email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
