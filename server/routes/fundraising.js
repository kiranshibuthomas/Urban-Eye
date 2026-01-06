const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const FundraisingCampaign = require('../models/FundraisingCampaign');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { authenticateToken: auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   GET /api/fundraising/campaigns
// @desc    Get all active fundraising campaigns
// @access  Public
router.get('/campaigns', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('category').optional().isIn(['infrastructure', 'education', 'healthcare', 'environment', 'social_welfare', 'emergency', 'other']),
  query('status').optional().isIn(['draft', 'active', 'paused', 'completed', 'cancelled']),
  query('search').optional().isLength({ min: 1, max: 100 }),
  query('admin').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = { visibility: 'public' };
    
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    } else if (!req.query.admin) {
      // Only filter by active/completed for public access
      query.status = { $in: ['active', 'completed'] };
    }
    // If admin=true is passed, show all campaigns regardless of status

    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    const campaigns = await FundraisingCampaign.find(query)
      .populate('createdBy', 'name email')
      .sort({ isUrgent: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await FundraisingCampaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/fundraising/campaigns/:id
// @desc    Get single campaign details
// @access  Public
router.get('/campaigns/:id', [
  param('id').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const campaign = await FundraisingCampaign.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updates.createdBy', 'name');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Get recent donations (non-anonymous only)
    const recentDonations = await Donation.find({
      campaign: req.params.id,
      paymentStatus: 'completed',
      isAnonymous: false
    })
      .populate('donor', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('amount donor message createdAt');

    res.json({
      campaign,
      recentDonations
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fundraising/campaigns
// @desc    Create new fundraising campaign (Admin only)
// @access  Private (Admin)
router.post('/campaigns', [
  auth,
  adminAuth,
  body('title').trim().isLength({ min: 5, max: 200 }),
  body('description').trim().isLength({ min: 20, max: 2000 }),
  body('targetAmount').isFloat({ min: 1000 }),
  body('category').isIn(['infrastructure', 'education', 'healthcare', 'environment', 'social_welfare', 'emergency', 'other']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('images').optional().isArray(),
  body('location.coordinates').optional().isArray({ min: 2, max: 2 }),
  body('location.address').optional().trim().isLength({ max: 500 }),
  body('tags').optional().isArray(),
  body('isUrgent').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, targetAmount, category, startDate, endDate, images, location, tags, isUrgent } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }

    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const campaign = new FundraisingCampaign({
      title,
      description,
      targetAmount,
      category,
      startDate: start,
      endDate: end,
      createdBy: req.user.id,
      images: images || [],
      location: location || { coordinates: [0, 0] },
      tags: tags || [],
      isUrgent: isUrgent || false
    });

    await campaign.save();
    await campaign.populate('createdBy', 'name email');

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/fundraising/campaigns/:id
// @desc    Update campaign (Admin only)
// @access  Private (Admin)
router.put('/campaigns/:id', [
  auth,
  adminAuth,
  param('id').isMongoId(),
  body('title').optional().trim().isLength({ min: 5, max: 200 }),
  body('description').optional().trim().isLength({ min: 20, max: 2000 }),
  body('status').optional().isIn(['draft', 'active', 'paused', 'completed', 'cancelled']),
  body('isUrgent').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const campaign = await FundraisingCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'status', 'isUrgent'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field];
      }
    });

    await campaign.save();
    await campaign.populate('createdBy', 'name email');

    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fundraising/campaigns/:id/updates
// @desc    Add update to campaign (Admin only)
// @access  Private (Admin)
router.post('/campaigns/:id/updates', [
  auth,
  adminAuth,
  param('id').isMongoId(),
  body('title').trim().isLength({ min: 5, max: 200 }),
  body('content').trim().isLength({ min: 10, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const campaign = await FundraisingCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.updates.push({
      title: req.body.title,
      content: req.body.content,
      createdBy: req.user.id
    });

    await campaign.save();
    await campaign.populate('updates.createdBy', 'name');

    res.json(campaign.updates[campaign.updates.length - 1]);
  } catch (error) {
    console.error('Error adding update:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;