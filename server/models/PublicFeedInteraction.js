const mongoose = require('mongoose');

const publicFeedInteractionSchema = new mongoose.Schema({
  // User who performed the interaction
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Complaint being interacted with
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  
  // Type of interaction
  interactionType: {
    type: String,
    enum: ['upvote', 'downvote'],
    required: true
  },
  
  // IP address for additional fraud detection
  ipAddress: {
    type: String,
    required: false
  },
  
  // User agent for device tracking
  userAgent: {
    type: String,
    required: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one vote per user per complaint
publicFeedInteractionSchema.index({ user: 1, complaint: 1 }, { unique: true });

// Index for better query performance
publicFeedInteractionSchema.index({ complaint: 1 });
publicFeedInteractionSchema.index({ user: 1 });
publicFeedInteractionSchema.index({ interactionType: 1 });
publicFeedInteractionSchema.index({ createdAt: -1 });

// Static method to get user's vote for a complaint
publicFeedInteractionSchema.statics.getUserVote = function(userId, complaintId) {
  return this.findOne({ user: userId, complaint: complaintId });
};

// Static method to get vote counts for a complaint
publicFeedInteractionSchema.statics.getVoteCounts = function(complaintId) {
  return this.aggregate([
    { $match: { complaint: new mongoose.Types.ObjectId(complaintId) } },
    {
      $group: {
        _id: '$interactionType',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get vote statistics for multiple complaints
publicFeedInteractionSchema.statics.getVoteStatistics = function(complaintIds) {
  return this.aggregate([
    { $match: { complaint: { $in: complaintIds.map(id => new mongoose.Types.ObjectId(id)) } } },
    {
      $group: {
        _id: {
          complaint: '$complaint',
          interactionType: '$interactionType'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.complaint',
        votes: {
          $push: {
            type: '$_id.interactionType',
            count: '$count'
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('PublicFeedInteraction', publicFeedInteractionSchema);