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
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Local disk storage for campaign documents
const docsDir = path.join(__dirname, '../uploads/campaign_docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

const campaignDocStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, docsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    cb(null, `doc_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const campaignDocumentUpload = multer({
  storage: campaignDocStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, JPG, PNG, WebP files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 10 } // 10MB per file
});

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
// @desc    Create new fundraising campaign with documentation (Admin only)
// @access  Private (Admin)
router.post('/campaigns', auth, adminAuth, campaignDocumentUpload.array('documents', 10), async (req, res) => {
  try {
    const { title, description, targetAmount, category, startDate, endDate, location, tags, isUrgent, documentTypes, documentNames } = req.body;

    // Basic validation
    const errors = [];
    if (!title || title.trim().length < 5) errors.push('Title must be at least 5 characters');
    if (!description || description.trim().length < 20) errors.push('Description must be at least 20 characters');
    if (!targetAmount || parseFloat(targetAmount) < 1000) errors.push('Target amount must be at least ₹1,000');
    if (!category) errors.push('Category is required');
    if (!startDate || !endDate) errors.push('Start and end dates are required');

    // Require at least 2 documents
    const uploadedFiles = req.files || [];
    if (uploadedFiles.length < 2) {
      errors.push('At least 2 supporting documents are required (e.g., authorization letter and budget breakdown)');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) return res.status(400).json({ message: 'Start date cannot be in the past' });
    if (end <= start) return res.status(400).json({ message: 'End date must be after start date' });

    // Build documents array from uploaded files
    const typesArray = Array.isArray(documentTypes) ? documentTypes : (documentTypes ? [documentTypes] : []);
    const namesArray = Array.isArray(documentNames) ? documentNames : (documentNames ? [documentNames] : []);

    const documents = uploadedFiles.map((file, index) => {
      // Local file — build a server-relative URL served by Express static
      const url = `/uploads/campaign_docs/${file.filename}`;
      return {
        type: typesArray[index] || 'other',
        name: namesArray[index] || file.originalname,
        url,
      };
    });

    const parsedLocation = location ? (typeof location === 'string' ? JSON.parse(location) : location) : { coordinates: [0, 0] };
    const parsedTags = tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags) : [];

    const campaign = new FundraisingCampaign({
      title: title.trim(),
      description: description.trim(),
      targetAmount: parseFloat(targetAmount),
      category,
      startDate: start,
      endDate: end,
      createdBy: req.user.id,
      location: parsedLocation,
      tags: parsedTags,
      isUrgent: isUrgent === 'true' || isUrgent === true,
      documents,
      status: 'draft',
      reviewStatus: 'pending_review'
    });

    await campaign.save();
    await campaign.populate('createdBy', 'name email');

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fundraising/campaigns/:id/review
// @desc    Approve or reject a campaign after document review (Admin only)
// @access  Private (Admin)
router.post('/campaigns/:id/review', [
  auth,
  adminAuth,
  param('id').isMongoId(),
  body('action').isIn(['approve', 'reject']),
  body('note').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const campaign = await FundraisingCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    if (campaign.reviewStatus !== 'pending_review') {
      return res.status(400).json({ message: 'Campaign has already been reviewed' });
    }

    const { action, note } = req.body;
    campaign.reviewStatus = action === 'approve' ? 'approved' : 'rejected';
    campaign.reviewNote = note || '';
    campaign.reviewedBy = req.user.id;
    campaign.reviewedAt = new Date();

    if (action === 'approve') {
      campaign.status = 'active';
    } else {
      campaign.status = 'cancelled';
    }

    await campaign.save();
    await campaign.populate('createdBy', 'name email');
    await campaign.populate('reviewedBy', 'name');

    res.json(campaign);
  } catch (error) {
    console.error('Error reviewing campaign:', error);
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