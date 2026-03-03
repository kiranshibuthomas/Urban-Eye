const Complaint = require('../models/Complaint');
const User = require('../models/User');
const WorkLog = require('../models/WorkLog');
const ComplaintFeedback = require('../models/ComplaintFeedback');
const mongoose = require('mongoose');

class AnalyticsService {
  // ==================== PREDICTIVE ANALYTICS ====================
  
  /**
   * Predict complaint hotspots based on historical data
   */
  async predictHotspots(options = {}) {
    const {
      timeRange = 30, // days
      minComplaintsThreshold = 5,
      radiusKm = 1
    } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // Get all complaints in the time range
    const complaints = await Complaint.find({
      submittedAt: { $gte: startDate },
      isDeleted: false
    }).select('location category priority submittedAt');

    // Group by location clusters
    const hotspots = await Complaint.aggregate([
      {
        $match: {
          submittedAt: { $gte: startDate },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            // Round coordinates to create clusters
            lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 2] },
            lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 2] },
            category: '$category'
          },
          count: { $sum: 1 },
          avgPriority: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'low'] }, then: 1 },
                  { case: { $eq: ['$priority', 'medium'] }, then: 2 },
                  { case: { $eq: ['$priority', 'high'] }, then: 3 },
                  { case: { $eq: ['$priority', 'urgent'] }, then: 4 }
                ],
                default: 2
              }
            }
          },
          complaints: { $push: '$_id' },
          recentComplaint: { $max: '$submittedAt' }
        }
      },
      {
        $match: {
          count: { $gte: minComplaintsThreshold }
        }
      },
      {
        $project: {
          location: {
            lat: '$_id.lat',
            lng: '$_id.lng'
          },
          category: '$_id.category',
          count: 1,
          avgPriority: 1,
          riskScore: {
            $multiply: ['$count', '$avgPriority']
          },
          complaints: 1,
          recentComplaint: 1
        }
      },
      {
        $sort: { riskScore: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Calculate trend (increasing/decreasing)
    for (const hotspot of hotspots) {
      const halfwayDate = new Date(startDate);
      halfwayDate.setDate(halfwayDate.getDate() + timeRange / 2);

      const recentCount = await Complaint.countDocuments({
        'location.coordinates.0': {
          $gte: hotspot.location.lng - 0.01,
          $lte: hotspot.location.lng + 0.01
        },
        'location.coordinates.1': {
          $gte: hotspot.location.lat - 0.01,
          $lte: hotspot.location.lat + 0.01
        },
        category: hotspot.category,
        submittedAt: { $gte: halfwayDate },
        isDeleted: false
      });

      const olderCount = hotspot.count - recentCount;
      hotspot.trend = recentCount > olderCount ? 'increasing' : 'decreasing';
      hotspot.trendPercentage = olderCount > 0 
        ? Math.round(((recentCount - olderCount) / olderCount) * 100)
        : 100;
    }

    return hotspots;
  }

  /**
   * Get trend analysis for complaints over time
   */
  async getTrendAnalysis(options = {}) {
    const {
      timeRange = 90, // days
      groupBy = 'day', // day, week, month
      category = null,
      priority = null
    } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const matchQuery = {
      submittedAt: { $gte: startDate },
      isDeleted: false
    };

    if (category) matchQuery.category = category;
    if (priority) matchQuery.priority = priority;

    // Determine date grouping format
    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = { $week: '$submittedAt' };
        break;
      case 'month':
        dateFormat = { $month: '$submittedAt' };
        break;
      default: // day
        dateFormat = { $dayOfYear: '$submittedAt' };
    }

    const trends = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$submittedAt' },
            period: dateFormat,
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            period: '$_id.period'
          },
          total: { $sum: '$count' },
          byStatus: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.period': 1 }
      }
    ]);

    // Category breakdown
    const categoryTrends = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$submittedAt' },
            period: dateFormat,
            category: '$category'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            period: '$_id.period'
          },
          byCategory: {
            $push: {
              category: '$_id.category',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.period': 1 }
      }
    ]);

    return {
      overall: trends,
      byCategory: categoryTrends,
      timeRange,
      groupBy
    };
  }

  // ==================== PERFORMANCE METRICS ====================

  /**
   * Get field staff performance metrics
   */
  async getFieldStaffPerformance(fieldStaffId = null, options = {}) {
    const {
      timeRange = 30, // days
      includeDetails = false
    } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const matchQuery = {
      role: 'field_staff',
      isActive: true
    };

    if (fieldStaffId) {
      matchQuery._id = mongoose.Types.ObjectId(fieldStaffId);
    }

    const fieldStaff = await User.find(matchQuery);
    const performanceData = [];

    for (const staff of fieldStaff) {
      // Get assigned complaints
      const assignedComplaints = await Complaint.find({
        assignedToFieldStaff: staff._id,
        fieldStaffAssignedAt: { $gte: startDate },
        isDeleted: false
      });

      const totalAssigned = assignedComplaints.length;
      const completed = assignedComplaints.filter(c => 
        ['resolved', 'work_completed'].includes(c.status)
      ).length;
      const inProgress = assignedComplaints.filter(c => 
        c.status === 'in_progress'
      ).length;
      const pending = assignedComplaints.filter(c => 
        c.status === 'assigned'
      ).length;

      // Calculate average resolution time
      const resolvedComplaints = assignedComplaints.filter(c => c.resolvedAt);
      let avgResolutionTime = 0;
      if (resolvedComplaints.length > 0) {
        const totalTime = resolvedComplaints.reduce((sum, c) => {
          const assignedTime = new Date(c.fieldStaffAssignedAt);
          const resolvedTime = new Date(c.resolvedAt);
          return sum + (resolvedTime - assignedTime);
        }, 0);
        avgResolutionTime = totalTime / resolvedComplaints.length / (1000 * 60 * 60); // hours
      }

      // SLA compliance
      const slaCompliant = assignedComplaints.filter(c => 
        c.slaStatus === 'on_time' && ['resolved', 'work_completed'].includes(c.status)
      ).length;
      const slaComplianceRate = totalAssigned > 0 
        ? (slaCompliant / totalAssigned) * 100 
        : 0;

      // Work quality (based on feedback)
      const feedbacks = await ComplaintFeedback.find({
        complaint: { $in: assignedComplaints.map(c => c._id) }
      });

      let avgWorkQuality = 0;
      if (feedbacks.length > 0) {
        avgWorkQuality = feedbacks.reduce((sum, f) => sum + f.workQuality, 0) / feedbacks.length;
      }

      // Work rejections
      const rejectedWork = assignedComplaints.filter(c => 
        c.workRejectionCount > 0
      ).length;

      const performance = {
        fieldStaff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          department: staff.department,
          experience: staff.experience
        },
        metrics: {
          totalAssigned,
          completed,
          inProgress,
          pending,
          completionRate: totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0,
          avgResolutionTimeHours: Math.round(avgResolutionTime * 10) / 10,
          slaComplianceRate: Math.round(slaComplianceRate * 10) / 10,
          avgWorkQuality: Math.round(avgWorkQuality * 10) / 10,
          rejectedWork,
          rejectionRate: totalAssigned > 0 ? (rejectedWork / totalAssigned) * 100 : 0,
          feedbackCount: feedbacks.length
        },
        performanceScore: this.calculatePerformanceScore({
          completionRate: totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0,
          slaComplianceRate,
          avgWorkQuality,
          rejectionRate: totalAssigned > 0 ? (rejectedWork / totalAssigned) * 100 : 0
        })
      };

      if (includeDetails) {
        performance.recentComplaints = assignedComplaints
          .sort((a, b) => b.fieldStaffAssignedAt - a.fieldStaffAssignedAt)
          .slice(0, 10)
          .map(c => ({
            id: c._id,
            title: c.title,
            category: c.category,
            status: c.status,
            assignedAt: c.fieldStaffAssignedAt,
            completedAt: c.workCompletedAt || c.resolvedAt
          }));
      }

      performanceData.push(performance);
    }

    // Sort by performance score
    performanceData.sort((a, b) => b.performanceScore - a.performanceScore);

    return {
      timeRange,
      totalFieldStaff: performanceData.length,
      performanceData
    };
  }

  /**
   * Calculate overall performance score (0-100)
   */
  calculatePerformanceScore(metrics) {
    const {
      completionRate = 0,
      slaComplianceRate = 0,
      avgWorkQuality = 0,
      rejectionRate = 0
    } = metrics;

    // Weighted scoring
    const score = (
      (completionRate * 0.3) +
      (slaComplianceRate * 0.3) +
      (avgWorkQuality * 20 * 0.25) + // Convert 1-5 to 0-100
      ((100 - rejectionRate) * 0.15)
    );

    return Math.round(score * 10) / 10;
  }

  // ==================== CITIZEN SATISFACTION ====================

  /**
   * Get citizen satisfaction metrics
   */
  async getCitizenSatisfaction(options = {}) {
    const {
      timeRange = 30,
      category = null,
      department = null
    } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const matchQuery = {
      submittedAt: { $gte: startDate }
    };

    if (category) matchQuery.category = category;

    // Get all feedbacks
    const feedbacks = await ComplaintFeedback.find(matchQuery)
      .populate('complaint', 'category status assignedToFieldStaff')
      .populate({
        path: 'complaint',
        populate: {
          path: 'assignedToFieldStaff',
          select: 'department'
        }
      });

    // Filter by department if specified
    let filteredFeedbacks = feedbacks;
    if (department) {
      filteredFeedbacks = feedbacks.filter(f => 
        f.complaint?.assignedToFieldStaff?.department === department
      );
    }

    const totalFeedbacks = filteredFeedbacks.length;

    if (totalFeedbacks === 0) {
      return {
        timeRange,
        totalFeedbacks: 0,
        averageRatings: {},
        satisfactionScore: 0,
        nps: 0
      };
    }

    // Calculate average ratings
    const avgOverall = filteredFeedbacks.reduce((sum, f) => sum + f.overallSatisfaction, 0) / totalFeedbacks;
    const avgResponseTime = filteredFeedbacks.reduce((sum, f) => sum + (f.responseTime || 0), 0) / totalFeedbacks;
    const avgWorkQuality = filteredFeedbacks.reduce((sum, f) => sum + (f.workQuality || 0), 0) / totalFeedbacks;
    const avgCommunication = filteredFeedbacks.reduce((sum, f) => sum + (f.communication || 0), 0) / totalFeedbacks;
    const avgProfessionalism = filteredFeedbacks.reduce((sum, f) => sum + (f.professionalism || 0), 0) / totalFeedbacks;

    // Calculate NPS (Net Promoter Score)
    const promoters = filteredFeedbacks.filter(f => f.overallSatisfaction >= 4).length;
    const detractors = filteredFeedbacks.filter(f => f.overallSatisfaction <= 2).length;
    const nps = ((promoters - detractors) / totalFeedbacks) * 100;

    // Satisfaction distribution
    const distribution = {
      excellent: filteredFeedbacks.filter(f => f.overallSatisfaction === 5).length,
      good: filteredFeedbacks.filter(f => f.overallSatisfaction === 4).length,
      average: filteredFeedbacks.filter(f => f.overallSatisfaction === 3).length,
      poor: filteredFeedbacks.filter(f => f.overallSatisfaction === 2).length,
      veryPoor: filteredFeedbacks.filter(f => f.overallSatisfaction === 1).length
    };

    // Would recommend percentage
    const wouldRecommend = filteredFeedbacks.filter(f => f.wouldRecommend).length;
    const recommendationRate = (wouldRecommend / totalFeedbacks) * 100;

    return {
      timeRange,
      totalFeedbacks,
      averageRatings: {
        overall: Math.round(avgOverall * 10) / 10,
        responseTime: Math.round(avgResponseTime * 10) / 10,
        workQuality: Math.round(avgWorkQuality * 10) / 10,
        communication: Math.round(avgCommunication * 10) / 10,
        professionalism: Math.round(avgProfessionalism * 10) / 10
      },
      satisfactionScore: Math.round((avgOverall / 5) * 100),
      nps: Math.round(nps * 10) / 10,
      distribution,
      recommendationRate: Math.round(recommendationRate * 10) / 10
    };
  }

  // ==================== BUDGET IMPACT ====================

  /**
   * Calculate budget impact for complaints
   */
  async getBudgetImpact(options = {}) {
    const {
      timeRange = 30,
      category = null
    } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const matchQuery = {
      submittedAt: { $gte: startDate },
      isDeleted: false
    };

    if (category) matchQuery.category = category;

    // Get complaints
    const complaints = await Complaint.find(matchQuery);

    // Estimated costs per category (in currency units)
    const costEstimates = {
      public_works: { min: 500, max: 5000, avg: 2000 },
      water_supply: { min: 300, max: 3000, avg: 1200 },
      sanitation: { min: 200, max: 2000, avg: 800 },
      electricity: { min: 400, max: 4000, avg: 1500 }
    };

    let totalEstimatedCost = 0;
    let totalResolvedCost = 0;
    let totalPendingCost = 0;

    const categoryBreakdown = {};

    for (const complaint of complaints) {
      const costEst = costEstimates[complaint.category] || costEstimates.public_works;
      const estimatedCost = costEst.avg;

      totalEstimatedCost += estimatedCost;

      if (['resolved', 'work_completed'].includes(complaint.status)) {
        totalResolvedCost += estimatedCost;
      } else if (['pending', 'assigned', 'in_progress'].includes(complaint.status)) {
        totalPendingCost += estimatedCost;
      }

      // Category breakdown
      if (!categoryBreakdown[complaint.category]) {
        categoryBreakdown[complaint.category] = {
          count: 0,
          estimatedCost: 0,
          resolvedCost: 0,
          pendingCost: 0
        };
      }

      categoryBreakdown[complaint.category].count++;
      categoryBreakdown[complaint.category].estimatedCost += estimatedCost;

      if (['resolved', 'work_completed'].includes(complaint.status)) {
        categoryBreakdown[complaint.category].resolvedCost += estimatedCost;
      } else if (['pending', 'assigned', 'in_progress'].includes(complaint.status)) {
        categoryBreakdown[complaint.category].pendingCost += estimatedCost;
      }
    }

    // Calculate cost efficiency (resolved vs total)
    const costEfficiency = totalEstimatedCost > 0 
      ? (totalResolvedCost / totalEstimatedCost) * 100 
      : 0;

    return {
      timeRange,
      totalComplaints: complaints.length,
      totalEstimatedCost: Math.round(totalEstimatedCost),
      totalResolvedCost: Math.round(totalResolvedCost),
      totalPendingCost: Math.round(totalPendingCost),
      costEfficiency: Math.round(costEfficiency * 10) / 10,
      categoryBreakdown,
      projectedMonthlyCost: Math.round((totalEstimatedCost / timeRange) * 30)
    };
  }

  // ==================== COMPREHENSIVE DASHBOARD ====================

  /**
   * Get comprehensive analytics dashboard data
   */
  async getDashboardAnalytics(options = {}) {
    const {
      timeRange = 30
    } = options;

    const [
      hotspots,
      trends,
      fieldStaffPerformance,
      satisfaction,
      budgetImpact
    ] = await Promise.all([
      this.predictHotspots({ timeRange }),
      this.getTrendAnalysis({ timeRange }),
      this.getFieldStaffPerformance(null, { timeRange }),
      this.getCitizenSatisfaction({ timeRange }),
      this.getBudgetImpact({ timeRange })
    ]);

    // Overall system health score
    const healthScore = this.calculateSystemHealthScore({
      avgPerformanceScore: fieldStaffPerformance.performanceData.length > 0
        ? fieldStaffPerformance.performanceData.reduce((sum, p) => sum + p.performanceScore, 0) / fieldStaffPerformance.performanceData.length
        : 0,
      satisfactionScore: satisfaction.satisfactionScore,
      costEfficiency: budgetImpact.costEfficiency
    });

    return {
      timeRange,
      generatedAt: new Date(),
      systemHealth: {
        score: healthScore,
        status: this.getHealthStatus(healthScore)
      },
      hotspots: hotspots.slice(0, 10),
      trends,
      fieldStaffPerformance: {
        topPerformers: fieldStaffPerformance.performanceData.slice(0, 5),
        avgPerformanceScore: fieldStaffPerformance.performanceData.length > 0
          ? Math.round((fieldStaffPerformance.performanceData.reduce((sum, p) => sum + p.performanceScore, 0) / fieldStaffPerformance.performanceData.length) * 10) / 10
          : 0
      },
      satisfaction,
      budgetImpact
    };
  }

  /**
   * Calculate system health score
   */
  calculateSystemHealthScore(metrics) {
    const {
      avgPerformanceScore = 0,
      satisfactionScore = 0,
      costEfficiency = 0
    } = metrics;

    const score = (
      (avgPerformanceScore * 0.4) +
      (satisfactionScore * 0.4) +
      (costEfficiency * 0.2)
    );

    return Math.round(score * 10) / 10;
  }

  /**
   * Get health status label
   */
  getHealthStatus(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    if (score >= 20) return 'poor';
    return 'critical';
  }
}

module.exports = new AnalyticsService();
