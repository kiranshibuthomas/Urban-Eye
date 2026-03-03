const Complaint = require('../models/Complaint');
const PublicFeedInteraction = require('../models/PublicFeedInteraction');

/**
 * Community Impact Service
 * Calculates community impact scores and adjusts priorities based on public engagement
 */

/**
 * Calculate community impact score for a complaint
 */
async function calculateCommunityImpact(complaintId) {
  try {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Get voting data
    const upvotes = complaint.upvotes || 0;
    const downvotes = complaint.downvotes || 0;
    const viewCount = complaint.viewCount || 0;
    const netVotes = upvotes - downvotes;

    // Base community impact score
    let communityScore = 0;

    // Upvote weight (logarithmic scale to prevent gaming)
    const upvoteWeight = Math.log10(Math.max(upvotes, 1)) * 20;
    communityScore += upvoteWeight;

    // Net vote consideration (positive votes boost, negative votes reduce)
    if (netVotes > 0) {
      communityScore += Math.sqrt(netVotes) * 10;
    } else if (netVotes < 0) {
      communityScore -= Math.sqrt(Math.abs(netVotes)) * 5;
    }

    // View engagement ratio (high views with low votes = less community interest)
    const engagementRatio = viewCount > 0 ? (upvotes / viewCount) : 0;
    communityScore += engagementRatio * 30;

    // Time decay factor (older complaints with sustained interest are more important)
    const ageInDays = (Date.now() - complaint.submittedAt) / (1000 * 60 * 60 * 24);
    if (ageInDays > 1 && upvotes > 5) {
      communityScore += Math.log(ageInDays) * 5; // Sustained interest bonus
    }

    // Location sensitivity scoring
    const locationSensitivity = calculateLocationSensitivity(complaint);
    communityScore += locationSensitivity;

    // Affected population estimate
    const affectedPopulation = estimateAffectedPopulation(complaint, upvotes);
    communityScore += Math.log10(Math.max(affectedPopulation, 1)) * 15;

    // Update complaint with community impact data
    complaint.communityImpact = {
      score: Math.round(communityScore),
      upvoteWeight: Math.round(upvoteWeight),
      locationSensitivity: locationSensitivity,
      affectedPopulation: affectedPopulation,
      lastCalculated: new Date()
    };

    // Calculate final priority
    const finalPriority = calculateFinalPriority(complaint.systemPriority, communityScore);
    complaint.finalPriority = finalPriority;

    await complaint.save();

    return {
      success: true,
      communityScore: Math.round(communityScore),
      finalPriority: finalPriority,
      breakdown: {
        upvoteWeight: Math.round(upvoteWeight),
        netVoteBonus: netVotes > 0 ? Math.round(Math.sqrt(netVotes) * 10) : 0,
        engagementRatio: Math.round(engagementRatio * 30),
        locationSensitivity: locationSensitivity,
        affectedPopulation: affectedPopulation
      }
    };

  } catch (error) {
    console.error('Community impact calculation error:', error);
    throw error;
  }
}

/**
 * Calculate location sensitivity score
 */
function calculateLocationSensitivity(complaint) {
  const address = (complaint.address || '').toLowerCase();
  const description = (complaint.description || '').toLowerCase();
  const text = `${address} ${description}`;

  let sensitivityScore = 0;

  // High sensitivity locations
  const highSensitivityKeywords = [
    'school', 'hospital', 'clinic', 'medical center', 'emergency',
    'playground', 'park', 'children', 'elderly home', 'nursing home'
  ];

  // Medium sensitivity locations
  const mediumSensitivityKeywords = [
    'market', 'shopping', 'bus stop', 'station', 'main road', 'highway',
    'bridge', 'intersection', 'crossing', 'public building', 'office'
  ];

  // Check for high sensitivity locations
  highSensitivityKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      sensitivityScore += 30;
    }
  });

  // Check for medium sensitivity locations
  mediumSensitivityKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      sensitivityScore += 15;
    }
  });

  return Math.min(sensitivityScore, 60); // Cap at 60 points
}

/**
 * Estimate affected population based on issue type and engagement
 */
function estimateAffectedPopulation(complaint, upvotes) {
  const category = complaint.category;
  const description = (complaint.description || '').toLowerCase();

  // Base population estimates by category
  const basePop = {
    public_works: 100,    // Road issues affect many people
    water_supply: 50,     // Water issues affect households
    electricity: 75,      // Power issues affect neighborhoods
    sanitation: 25        // Waste issues affect immediate area
  };

  let estimatedPop = basePop[category] || 50;

  // Scale based on scope indicators
  if (description.includes('main road') || description.includes('highway')) {
    estimatedPop *= 5;
  } else if (description.includes('street') || description.includes('area')) {
    estimatedPop *= 2;
  }

  // Use upvotes as a population indicator (each upvote represents ~10 affected people)
  const upvotePopulation = upvotes * 10;

  // Return the higher of the two estimates
  return Math.max(estimatedPop, upvotePopulation);
}

/**
 * Calculate final priority combining system priority and community impact
 */
function calculateFinalPriority(systemPriority, communityScore) {
  const systemPriorityWeights = {
    'urgent': 100,
    'high': 75,
    'medium': 50,
    'low': 25
  };

  const systemWeight = systemPriorityWeights[systemPriority] || 50;
  
  // System priority has 70% weight, community impact has 30% weight
  const combinedScore = (systemWeight * 0.7) + (Math.min(communityScore, 100) * 0.3);

  // Determine final priority
  if (combinedScore >= 85 || systemPriority === 'urgent') {
    return 'urgent'; // Safety always overrides
  } else if (combinedScore >= 65) {
    return 'high';
  } else if (combinedScore >= 40) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Recalculate community impact for all active complaints
 */
async function recalculateAllCommunityImpacts() {
  try {
    const activeComplaints = await Complaint.find({
      status: { $in: ['pending', 'assigned', 'in_progress'] },
      isPublic: true,
      isDeleted: false
    }).select('_id');

    const results = [];
    
    for (const complaint of activeComplaints) {
      try {
        const result = await calculateCommunityImpact(complaint._id);
        results.push({
          complaintId: complaint._id,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          complaintId: complaint._id,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      processed: results.length,
      results: results
    };

  } catch (error) {
    console.error('Bulk recalculation error:', error);
    throw error;
  }
}

/**
 * Get community impact statistics
 */
async function getCommunityImpactStats() {
  try {
    const stats = await Complaint.aggregate([
      {
        $match: {
          isPublic: true,
          isDeleted: false,
          'communityImpact.score': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$finalPriority',
          count: { $sum: 1 },
          avgCommunityScore: { $avg: '$communityImpact.score' },
          avgUpvotes: { $avg: '$upvotes' },
          totalUpvotes: { $sum: '$upvotes' }
        }
      }
    ]);

    const totalComplaints = await Complaint.countDocuments({
      isPublic: true,
      isDeleted: false
    });

    return {
      success: true,
      totalComplaints,
      priorityBreakdown: stats,
      lastUpdated: new Date()
    };

  } catch (error) {
    console.error('Community impact stats error:', error);
    throw error;
  }
}

module.exports = {
  calculateCommunityImpact,
  recalculateAllCommunityImpacts,
  getCommunityImpactStats,
  calculateLocationSensitivity,
  estimateAffectedPopulation,
  calculateFinalPriority
};