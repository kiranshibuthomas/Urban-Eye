const express = require('express');
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const PublicFeedInteraction = require('../models/PublicFeedInteraction');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/public-feed
// @desc    Get public complaints feed with filtering and pagination
// @access  Public (but requires authentication for voting)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      location,
      priority,
      sortBy = 'recent', // recent, oldest, most_upvoted, most_viewed
      search,
      ward,
      city
    } = req.query;

    // Build filter object - only public complaints that are not deleted
    const filter = {
      isPublic: true,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    };

    // Apply filters
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (ward) filter.address = { $regex: ward, $options: 'i' };

    // Search functionality
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Location-based filtering (if coordinates provided)
    if (location) {
      try {
        const [lng, lat, radius = 5] = location.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          filter.location = {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              $maxDistance: radius * 1000 // Convert km to meters
            }
          };
        }
      } catch (error) {
        console.error('Invalid location format:', error);
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    let sortOptions = {};
    let aggregationPipeline = [];
    
    switch (sortBy) {
      case 'hot':
        // Reddit-style hot algorithm: score / (age_in_hours + 2)^1.8
        aggregationPipeline = [
          { $match: filter },
          {
            $addFields: {
              score: { $subtract: ['$upvotes', '$downvotes'] },
              ageInHours: {
                $divide: [
                  { $subtract: [new Date(), '$submittedAt'] },
                  3600000 // milliseconds in an hour
                ]
              }
            }
          },
          {
            $addFields: {
              hotScore: {
                $divide: [
                  '$score',
                  { $pow: [{ $add: ['$ageInHours', 2] }, 1.8] }
                ]
              }
            }
          },
          { $sort: { hotScore: -1, submittedAt: -1 } }
        ];
        break;
      case 'oldest':
        sortOptions = { submittedAt: 1 };
        break;
      case 'most_upvoted':
        sortOptions = { upvotes: -1, submittedAt: -1 };
        break;
      case 'most_viewed':
        sortOptions = { viewCount: -1, submittedAt: -1 };
        break;
      case 'recent':
      default:
        sortOptions = { submittedAt: -1 };
        break;
    }

    // Execute query
    let complaints;
    if (aggregationPipeline.length > 0) {
      // Use aggregation for hot sorting
      const pipeline = [
        ...aggregationPipeline,
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'users',
            localField: 'citizen',
            foreignField: '_id',
            as: 'citizen',
            pipeline: [{ $project: { name: 1 } }]
          }
        },
        { $unwind: '$citizen' },
        {
          $project: {
            title: 1,
            description: 1,
            category: 1,
            priority: 1,
            status: 1,
            location: 1,
            address: 1,
            city: 1,
            images: 1,
            submittedAt: 1,
            viewCount: 1,
            upvotes: 1,
            downvotes: 1,
            isAnonymous: 1,
            citizenName: 1,
            citizen: 1,
            hotScore: 1
          }
        }
      ];
      complaints = await Complaint.aggregate(pipeline);
    } else {
      // Use regular find for other sorting
      complaints = await Complaint.find(filter)
        .populate('citizen', 'name')
        .select(`
          title description category priority status location address city
          images submittedAt viewCount upvotes downvotes isAnonymous citizenName
        `)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    }

    // Get user's votes if authenticated
    let userVotes = {};
    if (req.user) {
      const complaintIds = complaints.map(c => c._id);
      const votes = await PublicFeedInteraction.find({
        user: req.user._id,
        complaint: { $in: complaintIds }
      }).select('complaint interactionType');
      
      userVotes = votes.reduce((acc, vote) => {
        acc[vote.complaint.toString()] = vote.interactionType;
        return acc;
      }, {});
    }

    // Transform complaints for public feed
    const publicComplaints = complaints.map(complaint => ({
      id: complaint._id,
      title: complaint.title,
      description: complaint.description.length > 200 
        ? complaint.description.substring(0, 200) + '...' 
        : complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
      location: {
        address: complaint.address,
        city: complaint.city,
        coordinates: complaint.location?.coordinates
      },
      images: complaint.images?.slice(0, 1) || [], // Only show first image as thumbnail
      submittedAt: complaint.submittedAt,
      viewCount: complaint.viewCount || 0,
      upvotes: complaint.upvotes || 0,
      downvotes: complaint.downvotes || 0,
      citizenName: complaint.isAnonymous ? 'Anonymous' : complaint.citizenName,
      userVote: userVotes[complaint._id.toString()] || null,
      timeSinceSubmission: getTimeSinceSubmission(complaint.submittedAt)
    }));

    const total = await Complaint.countDocuments(filter);

    res.json({
      success: true,
      complaints: publicComplaints,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      filters: {
        category,
        location,
        priority,
        sortBy,
        search,
        ward,
        city
      }
    });

  } catch (error) {
    console.error('Get public feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching public feed'
    });
  }
});

// @route   GET /api/public-feed/:id
// @desc    Get a specific public complaint with full details
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name')
      .select(`
        title description category priority status location address city pincode
        images submittedAt viewCount upvotes downvotes isAnonymous citizenName
        resolutionNotes resolvedAt workCompletionNotes workCompletedAt
      `);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if complaint is public and not deleted
    if (!complaint.isPublic || complaint.isDeleted) {
      return res.status(403).json({
        success: false,
        message: 'This complaint is not available in the public feed'
      });
    }

    // Get user's vote if authenticated
    let userVote = null;
    if (req.user) {
      const vote = await PublicFeedInteraction.findOne({
        user: req.user._id,
        complaint: complaint._id
      });
      userVote = vote ? vote.interactionType : null;
    }

    // Increment view count
    await Complaint.findByIdAndUpdate(req.params.id, { 
      $inc: { viewCount: 1 } 
    });

    // Transform complaint for public view
    const publicComplaint = {
      id: complaint._id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
      location: {
        address: complaint.address,
        city: complaint.city,
        pincode: complaint.pincode,
        coordinates: complaint.location?.coordinates
      },
      images: complaint.images || [],
      submittedAt: complaint.submittedAt,
      viewCount: (complaint.viewCount || 0) + 1,
      upvotes: complaint.upvotes || 0,
      downvotes: complaint.downvotes || 0,
      citizenName: complaint.isAnonymous ? 'Anonymous' : complaint.citizenName,
      userVote,
      timeSinceSubmission: getTimeSinceSubmission(complaint.submittedAt),
      resolutionInfo: complaint.status === 'resolved' ? {
        resolvedAt: complaint.resolvedAt,
        resolutionNotes: complaint.resolutionNotes,
        workCompletedAt: complaint.workCompletedAt,
        workCompletionNotes: complaint.workCompletionNotes
      } : null
    };

    res.json({
      success: true,
      complaint: publicComplaint
    });

  } catch (error) {
    console.error('Get public complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaint'
    });
  }
});

// @route   POST /api/public-feed/:id/vote
// @desc    Vote on a public complaint (upvote/downvote)
// @access  Private (Authenticated users only)
router.post('/:id/vote', authenticateToken, async (req, res) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const complaintId = req.params.id;
    const userId = req.user._id;

    // Validate vote type
    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type. Must be "upvote" or "downvote"'
      });
    }

    // Check if complaint exists and is public
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (!complaint.isPublic || complaint.isDeleted) {
      return res.status(403).json({
        success: false,
        message: 'Cannot vote on this complaint'
      });
    }

    // Allow users to vote on their own complaints (like Reddit)

    // Check if user has already voted
    const existingVote = await PublicFeedInteraction.findOne({
      user: userId,
      complaint: complaintId
    });

    let voteChange = { upvotes: 0, downvotes: 0 };

    if (existingVote) {
      // User has already voted
      if (existingVote.interactionType === voteType) {
        // Same vote type - remove the vote (toggle off)
        await PublicFeedInteraction.findByIdAndDelete(existingVote._id);
        
        if (voteType === 'upvote') {
          voteChange.upvotes = -1;
        } else {
          voteChange.downvotes = -1;
        }
      } else {
        // Different vote type - update the vote
        existingVote.interactionType = voteType;
        existingVote.ipAddress = req.ip;
        existingVote.userAgent = req.get('User-Agent');
        await existingVote.save();
        
        if (voteType === 'upvote') {
          voteChange.upvotes = 1;
          voteChange.downvotes = -1;
        } else {
          voteChange.upvotes = -1;
          voteChange.downvotes = 1;
        }
      }
    } else {
      // New vote
      await PublicFeedInteraction.create({
        user: userId,
        complaint: complaintId,
        interactionType: voteType,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      if (voteType === 'upvote') {
        voteChange.upvotes = 1;
      } else {
        voteChange.downvotes = 1;
      }
    }

    // Update complaint vote counts
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      {
        $inc: {
          upvotes: voteChange.upvotes,
          downvotes: voteChange.downvotes
        }
      },
      { new: true }
    ).select('upvotes downvotes');

    // Get user's current vote status
    const currentVote = await PublicFeedInteraction.findOne({
      user: userId,
      complaint: complaintId
    });

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        upvotes: updatedComplaint.upvotes || 0,
        downvotes: updatedComplaint.downvotes || 0,
        userVote: currentVote ? currentVote.interactionType : null
      }
    });

  } catch (error) {
    console.error('Vote error:', error);
    
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Vote already recorded. Please try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while recording vote'
    });
  }
});

// @route   GET /api/public-feed/stats/overview
// @desc    Get public feed statistics
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    // Get public complaints statistics
    const stats = await Complaint.aggregate([
      {
        $match: {
          isPublic: true,
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalComplaints: { $sum: 1 },
          totalUpvotes: { $sum: '$upvotes' },
          totalDownvotes: { $sum: '$downvotes' },
          totalViews: { $sum: '$viewCount' },
          byCategory: {
            $push: {
              category: '$category',
              status: '$status',
              priority: '$priority'
            }
          }
        }
      }
    ]);

    // Process category and status statistics
    const categoryStats = {};
    const statusStats = {};
    const priorityStats = {};

    if (stats.length > 0 && stats[0].byCategory) {
      stats[0].byCategory.forEach(item => {
        categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
        statusStats[item.status] = (statusStats[item.status] || 0) + 1;
        priorityStats[item.priority] = (priorityStats[item.priority] || 0) + 1;
      });
    }

    // Get most active categories
    const topCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    const result = {
      totalComplaints: stats[0]?.totalComplaints || 0,
      totalUpvotes: stats[0]?.totalUpvotes || 0,
      totalDownvotes: stats[0]?.totalDownvotes || 0,
      totalViews: stats[0]?.totalViews || 0,
      categoryStats,
      statusStats,
      priorityStats,
      topCategories
    };

    res.json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error('Get public feed stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// @route   GET /api/public-feed/trending
// @desc    Get trending complaints (most upvoted in last 7 days)
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingComplaints = await Complaint.find({
      isPublic: true,
      submittedAt: { $gte: sevenDaysAgo },
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    })
    .populate('citizen', 'name')
    .select(`
      title description category priority status location address city
      images submittedAt viewCount upvotes downvotes isAnonymous citizenName
    `)
    .sort({ upvotes: -1, viewCount: -1 })
    .limit(parseInt(limit))
    .lean();

    // Transform for public view
    const publicComplaints = trendingComplaints.map(complaint => ({
      id: complaint._id,
      title: complaint.title,
      description: complaint.description.length > 150 
        ? complaint.description.substring(0, 150) + '...' 
        : complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
      location: {
        address: complaint.address,
        city: complaint.city
      },
      images: complaint.images?.slice(0, 1) || [],
      submittedAt: complaint.submittedAt,
      viewCount: complaint.viewCount || 0,
      upvotes: complaint.upvotes || 0,
      downvotes: complaint.downvotes || 0,
      citizenName: complaint.isAnonymous ? 'Anonymous' : complaint.citizenName,
      timeSinceSubmission: getTimeSinceSubmission(complaint.submittedAt)
    }));

    res.json({
      success: true,
      complaints: publicComplaints,
      period: '7 days'
    });

  } catch (error) {
    console.error('Get trending complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trending complaints'
    });
  }
});

// Helper function to calculate time since submission
function getTimeSinceSubmission(submittedAt) {
  const now = new Date();
  const diff = now - submittedAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

module.exports = router;