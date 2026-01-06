const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FundraisingCampaign',
    required: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1 // Minimum ₹1
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'upi', 'card', 'netbanking', 'wallet'],
    default: 'razorpay'
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    maxlength: 500,
    trim: true
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true // Allow multiple null values
  },
  refundDetails: {
    refundId: String,
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceInfo: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
donationSchema.index({ campaign: 1, createdAt: -1 });
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ paymentStatus: 1 });
donationSchema.index({ razorpayOrderId: 1 });
donationSchema.index({ razorpayPaymentId: 1 });

// Pre-save middleware to generate receipt number
donationSchema.pre('save', async function(next) {
  // Generate receipt number when payment is completed and receipt doesn't exist
  if (this.paymentStatus === 'completed' && !this.receiptNumber) {
    try {
      const count = await this.constructor.countDocuments({ 
        paymentStatus: 'completed',
        receiptNumber: { $exists: true, $ne: null }
      });
      this.receiptNumber = `RCP${Date.now().toString().slice(-8)}${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating receipt number:', error);
      // Fallback receipt number
      this.receiptNumber = `RCP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  }
  next();
});

module.exports = mongoose.model('Donation', donationSchema);