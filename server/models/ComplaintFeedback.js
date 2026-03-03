const mongoose = require('mongoose');

const complaintFeedbackSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Satisfaction Ratings (1-5 scale)
  overallSatisfaction: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  responseTime: {
    type: Number,
    min: 1,
    max: 5
  },
  workQuality: {
    type: Number,
    min: 1,
    max: 5
  },
  communication: {
    type: Number,
    min: 1,
    max: 5
  },
  professionalism: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Feedback Text
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  
  // Would recommend?
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  
  // Feedback Images (optional)
  images: [{
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
complaintFeedbackSchema.index({ complaint: 1 });
complaintFeedbackSchema.index({ citizen: 1 });
complaintFeedbackSchema.index({ submittedAt: -1 });
complaintFeedbackSchema.index({ overallSatisfaction: 1 });

module.exports = mongoose.model('ComplaintFeedback', complaintFeedbackSchema);
