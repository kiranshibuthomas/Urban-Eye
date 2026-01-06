const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const FundraisingCampaign = require('../models/FundraisingCampaign');
const Donation = require('../models/Donation');
const { authenticateToken: auth } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   POST /api/donations/create-order
// @desc    Create Razorpay order for donation
// @access  Private
router.post('/create-order', [
  auth,
  body('campaignId').isMongoId(),
  body('amount').isFloat({ min: 1 }),
  body('isAnonymous').optional().isBoolean(),
  body('message').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { campaignId, amount, isAnonymous = false, message = '' } = req.body;

    // Verify campaign exists and is active
    const campaign = await FundraisingCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({ message: 'Campaign is not active' });
    }

    // Check if campaign has ended
    if (new Date() > new Date(campaign.endDate)) {
      return res.status(400).json({ message: 'Campaign has ended' });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `DON${Date.now().toString().slice(-8)}${req.user.id.toString().slice(-4)}`, // Max 40 chars
      notes: {
        campaignId: campaignId,
        userId: req.user.id,
        isAnonymous: isAnonymous.toString()
      }
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (razorpayError) {
      console.error('Razorpay order creation error:', razorpayError);
      return res.status(500).json({ 
        message: 'Payment gateway error. Please try again.',
        error: process.env.NODE_ENV === 'development' ? razorpayError.message : undefined
      });
    }

    // Create donation record
    const donation = new Donation({
      campaign: campaignId,
      donor: req.user.id,
      amount: amount,
      razorpayOrderId: order.id,
      isAnonymous,
      message,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await donation.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      donationId: donation._id
    });
  } catch (error) {
    console.error('Error creating donation order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/donations/verify-payment
// @desc    Verify Razorpay payment and update donation
// @access  Private
router.post('/verify-payment', [
  auth,
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
  body('donationId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donationId } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Find and update donation
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (donation.paymentStatus === 'completed') {
      return res.status(400).json({ message: 'Payment already completed' });
    }

    // Update donation status
    donation.paymentStatus = 'completed';
    donation.razorpayPaymentId = razorpay_payment_id;
    donation.razorpaySignature = razorpay_signature;
    donation.transactionId = razorpay_payment_id;

    await donation.save();

    // Update campaign raised amount and donor count
    const campaign = await FundraisingCampaign.findById(donation.campaign);
    if (campaign) {
      campaign.raisedAmount += donation.amount;
      
      // Check if this is a new donor
      const existingDonation = await Donation.findOne({
        campaign: donation.campaign,
        donor: donation.donor,
        paymentStatus: 'completed',
        _id: { $ne: donation._id }
      });

      if (!existingDonation) {
        campaign.donorCount += 1;
      }

      // Auto-complete campaign if target reached
      if (campaign.raisedAmount >= campaign.targetAmount && campaign.status === 'active') {
        campaign.status = 'completed';
      }

      await campaign.save();
    }

    await donation.populate('campaign', 'title');

    res.json({
      message: 'Payment verified successfully',
      donation: {
        id: donation._id,
        amount: donation.amount,
        campaign: donation.campaign.title,
        receiptNumber: donation.receiptNumber,
        createdAt: donation.createdAt
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donations/my-donations
// @desc    Get user's donation history
// @access  Private
router.get('/my-donations', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const donations = await Donation.find({
      donor: req.user.id,
      paymentStatus: 'completed'
    })
      .populate('campaign', 'title status targetAmount raisedAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments({
      donor: req.user.id,
      paymentStatus: 'completed'
    });

    // Calculate total donated amount
    const totalDonated = await Donation.aggregate([
      {
        $match: {
          donor: req.user._id,
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      donations,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      totalDonated: totalDonated.length > 0 ? totalDonated[0].total : 0
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donations/campaign/:campaignId
// @desc    Get donations for a specific campaign (Admin only)
// @access  Private (Admin)
router.get('/campaign/:campaignId', [
  auth,
  param('campaignId').isMongoId()
], async (req, res) => {
  try {
    // Check if user is admin or campaign creator
    const campaign = await FundraisingCampaign.findById(req.params.campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (req.user.role !== 'admin' && campaign.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const donations = await Donation.find({
      campaign: req.params.campaignId,
      paymentStatus: 'completed'
    })
      .populate('donor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments({
      campaign: req.params.campaignId,
      paymentStatus: 'completed'
    });

    // Get donation statistics
    const stats = await Donation.aggregate([
      {
        $match: {
          campaign: campaign._id,
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      donations,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      stats: stats.length > 0 ? stats[0] : {
        totalAmount: 0,
        averageAmount: 0,
        maxAmount: 0,
        minAmount: 0,
        count: 0
      }
    });
  } catch (error) {
    console.error('Error fetching campaign donations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;