const User = require('../models/User');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');

/**
 * Enterprise-grade Auto-assignment service for field staff
 * Implements intelligent workload balancing, SLA tracking, and performance optimization
 */

/**
 * Find the best available field staff for a complaint using advanced algorithms
 */
async function findBestFieldStaff(category, priority, location = null) {
  try {
    // Direct category to department mapping
    const categoryToDepartmentMap = {
      'public_works': 'public_works',
      'water_supply': 'water_supply', 
      'sanitation': 'sanitation',
      'electricity': 'electricity'
    };

    const requiredDepartment = categoryToDepartmentMap[category];
    
    if (!requiredDepartment) {
      throw new Error(`Invalid category: ${category}`);
    }

    // Get all eligible field staff with enhanced query
    const fieldStaffList = await User.find({
      role: 'field_staff',
      isActive: true,
      department: requiredDepartment,
      isAvailable: true, // Only available staff
      isOnLeave: false   // Not on leave
    }).select(
      'name email department jobRole experience maxWorkload currentWorkload ' +
      'currentLocation averageCompletionTime completionRate shiftStart shiftEnd workingDays'
    );

    if (fieldStaffList.length === 0) {
      // Try fallback with relaxed constraints
      const fallbackStaff = await User.find({
        role: 'field_staff',
        isActive: true,
        isOnLeave: false,
        isAvailable: true
      }).select(
        'name email department jobRole experience maxWorkload currentWorkload ' +
        'currentLocation averageCompletionTime completionRate'
      );

      if (fallbackStaff.length === 0) {
        throw new Error('No available field staff found');
      }

      return await selectBestStaffAdvanced(fallbackStaff, priority, location, true);
    }

    return await selectBestStaffAdvanced(fieldStaffList, priority, location, false);

  } catch (error) {
    console.error('Error finding field staff:', error);
    throw error;
  }
}

/**
 * Advanced staff selection algorithm with multiple criteria
 */
async function selectBestStaffAdvanced(staffList, priority, location, isFallback = false) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Get real-time workload for each staff member
  const staffWithMetrics = await Promise.all(
    staffList.map(async (staff) => {
      // Get actual current workload from database
      const activeComplaints = await Complaint.countDocuments({
        assignedToFieldStaff: staff._id,
        status: { $in: ['assigned', 'in_progress'] },
        isDeleted: false
      });

      // Check if staff exceeds capacity
      if (activeComplaints >= staff.maxWorkload) {
        return null; // Skip overloaded staff
      }

      // Calculate performance metrics
      const completedLast30Days = await Complaint.countDocuments({
        assignedToFieldStaff: staff._id,
        status: { $in: ['work_completed', 'resolved'] },
        workCompletedAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        isDeleted: false
      });

      // Calculate average completion time for this staff
      const avgCompletionResult = await Complaint.aggregate([
        {
          $match: {
            assignedToFieldStaff: staff._id,
            status: { $in: ['work_completed', 'resolved'] },
            fieldStaffAssignedAt: { $exists: true },
            workCompletedAt: { $exists: true },
            isDeleted: false
          }
        },
        {
          $project: {
            completionTime: {
              $divide: [
                { $subtract: ['$workCompletedAt', '$fieldStaffAssignedAt'] },
                1000 * 60 * 60 // Convert to hours
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgCompletionTime: { $avg: '$completionTime' }
          }
        }
      ]);

      const avgCompletionTime = avgCompletionResult[0]?.avgCompletionTime || 24;

      // Check if staff is currently in working hours
      const shiftStart = parseInt(staff.shiftStart?.split(':')[0] || '9');
      const shiftEnd = parseInt(staff.shiftEnd?.split(':')[0] || '17');
      const isInShift = currentHour >= shiftStart && currentHour <= shiftEnd;
      const isWorkingDay = staff.workingDays?.includes(currentDay) !== false;

      // Calculate proximity score if location is provided
      let proximityScore = 0;
      if (location && staff.currentLocation?.coordinates) {
        const distance = calculateDistance(
          location.coordinates,
          staff.currentLocation.coordinates
        );
        proximityScore = Math.max(0, 10 - distance); // Closer = higher score
      }

      return {
        ...staff.toObject(),
        actualWorkload: activeComplaints,
        utilizationRate: (activeComplaints / staff.maxWorkload) * 100,
        recentPerformance: completedLast30Days,
        avgCompletionTime,
        isInShift,
        isWorkingDay,
        proximityScore,
        overallScore: calculateAdvancedScore({
          staff,
          activeComplaints,
          priority,
          avgCompletionTime,
          completedLast30Days,
          isInShift,
          isWorkingDay,
          proximityScore,
          isFallback
        })
      };
    })
  );

  // Filter out null entries (overloaded staff)
  const eligibleStaff = staffWithMetrics.filter(staff => staff !== null);

  if (eligibleStaff.length === 0) {
    throw new Error('All field staff are at maximum capacity');
  }

  // Sort by overall score (lower is better)
  eligibleStaff.sort((a, b) => a.overallScore - b.overallScore);

  return eligibleStaff[0];
}

/**
 * Advanced scoring algorithm for staff selection
 */
function calculateAdvancedScore(params) {
  const {
    staff,
    activeComplaints,
    priority,
    avgCompletionTime,
    completedLast30Days,
    isInShift,
    isWorkingDay,
    proximityScore,
    isFallback
  } = params;

  let score = 0;

  // 1. Workload factor (40% weight) - heavily favor less loaded staff
  const workloadFactor = (activeComplaints / staff.maxWorkload) * 100;
  score += workloadFactor * 4;

  // 2. Performance factor (25% weight) - favor high performers
  const performanceFactor = Math.max(0, 50 - avgCompletionTime); // Lower completion time = higher score
  score -= performanceFactor * 0.5;

  // 3. Recent activity factor (15% weight)
  score -= completedLast30Days * 2;

  // 4. Experience factor (10% weight)
  const experienceYears = staff.experience || 0;
  score -= experienceYears * 1.5;

  // 5. Availability factor (5% weight)
  if (!isWorkingDay) score += 20;
  if (!isInShift) score += 10;

  // 6. Proximity factor (5% weight)
  score -= proximityScore;

  // 7. Priority adjustments
  if (priority === 'urgent') {
    score += activeComplaints * 8; // Heavily penalize loaded staff for urgent complaints
  } else if (priority === 'high') {
    score += activeComplaints * 4;
  }

  // 8. Fallback penalty
  if (isFallback) {
    score += 25; // Penalty for cross-department assignment
  }

  return Math.max(score, 0);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Enterprise-grade auto-assignment with transaction support
 */
async function autoAssignComplaint(complaintId, assignedByAdminId = null) {
  const session = await Complaint.startSession();
  let assignmentResult;
  
  try {
    await session.withTransaction(async () => {
      const complaint = await Complaint.findById(complaintId).session(session);
      
      if (!complaint) {
        throw new Error('Complaint not found');
      }

      if (complaint.status !== 'pending') {
        throw new Error(`Cannot auto-assign complaint with status: ${complaint.status}`);
      }

      try {
        // Find best field staff
        const bestFieldStaff = await findBestFieldStaff(
          complaint.category, 
          complaint.priority, 
          complaint.location
        );

        if (bestFieldStaff) {
          // Update complaint
          complaint.assignedToFieldStaff = bestFieldStaff._id;
          complaint.fieldStaffAssignedAt = new Date();
          complaint.fieldStaffAssignedBy = assignedByAdminId;
          complaint.status = 'assigned';
          complaint.lastUpdated = new Date();
          
          // Set SLA target based on priority
          const slaMap = {
            'urgent': 4,    // 4 hours
            'high': 24,     // 1 day
            'medium': 72,   // 3 days
            'low': 168      // 7 days
          };
          complaint.slaTarget = slaMap[complaint.priority] || 72;

          await complaint.save({ session });

          // Update field staff workload atomically
          await User.findByIdAndUpdate(
            bestFieldStaff._id,
            { 
              $inc: { currentWorkload: 1 },
              $set: { lastLocationUpdate: new Date() }
            },
            { session }
          );

          assignmentResult = {
            success: true,
            assignedTo: 'field_staff',
            fieldStaff: bestFieldStaff,
            complaint: complaint,
            message: `Complaint assigned to ${bestFieldStaff.name} (${bestFieldStaff.department})`,
            slaTarget: complaint.slaTarget
          };
        } else {
          throw new Error('No available field staff found');
        }

      } catch (fieldStaffError) {
        // Fallback to admin assignment
        const availableAdmin = await User.findOne({
          role: 'admin',
          isActive: true
        }).select('name email').session(session);

        if (availableAdmin) {
          complaint.assignedTo = availableAdmin._id;
          complaint.assignedAt = new Date();
          complaint.assignedBy = assignedByAdminId;
          complaint.status = 'pending';
          complaint.lastUpdated = new Date();

          // Add admin note
          complaint.adminNotes = complaint.adminNotes || [];
          complaint.adminNotes.push({
            note: `Auto-assignment failed: ${fieldStaffError.message}. Manual assignment required.`,
            addedBy: availableAdmin._id,
            addedAt: new Date()
          });

          await complaint.save({ session });

          assignmentResult = {
            success: true,
            assignedTo: 'admin',
            admin: availableAdmin,
            complaint: complaint,
            message: `Assigned to admin ${availableAdmin.name} for manual review`,
            reason: fieldStaffError.message
          };
        } else {
          throw new Error(`Auto-assignment failed: ${fieldStaffError.message}`);
        }
      }

      // Log assignment
      if (assignedByAdminId && assignmentResult && assignmentResult.success) {
        await AuditLog.logAction({
          action: assignmentResult.assignedTo === 'field_staff' ? 'auto_assign_field_staff' : 'auto_assign_admin',
          entityType: 'complaint',
          entityId: complaint._id,
          performedBy: assignedByAdminId,
          details: {
            complaintTitle: complaint.title,
            complaintCategory: complaint.category,
            complaintPriority: complaint.priority,
            assignedToType: assignmentResult.assignedTo,
            assignedToId: assignmentResult.assignedTo === 'field_staff' ? assignmentResult.fieldStaff._id : assignmentResult.admin._id,
            assignedToName: assignmentResult.assignedTo === 'field_staff' ? assignmentResult.fieldStaff.name : assignmentResult.admin.name,
            slaTarget: assignmentResult.slaTarget,
            citizenId: complaint.citizen,
            citizenName: complaint.citizenName
          }
        });
      }
    });

    return assignmentResult;

  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Get comprehensive field staff workload statistics
 */
async function getFieldStaffWorkload(department = null) {
  try {
    const query = {
      role: 'field_staff',
      isActive: true
    };

    if (department) {
      query.department = department;
    }

    // Use aggregation for better performance
    const workloadStats = await User.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'complaints',
          let: { staffId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$assignedToFieldStaff', '$$staffId'] },
                    { $in: ['$status', ['assigned', 'in_progress']] },
                    { $eq: ['$isDeleted', false] }
                  ]
                }
              }
            }
          ],
          as: 'activeComplaints'
        }
      },
      {
        $lookup: {
          from: 'complaints',
          let: { staffId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$assignedToFieldStaff', '$$staffId'] },
                    { $in: ['$status', ['work_completed', 'resolved']] },
                    { $gte: ['$workCompletedAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                    { $eq: ['$isDeleted', false] }
                  ]
                }
              }
            }
          ],
          as: 'completedLast30Days'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          department: 1,
          experience: 1,
          maxWorkload: 1,
          currentWorkload: 1,
          isAvailable: 1,
          isOnLeave: 1,
          activeComplaints: { $size: '$activeComplaints' },
          completedLast30Days: { $size: '$completedLast30Days' },
          utilizationRate: {
            $multiply: [
              { $divide: [{ $size: '$activeComplaints' }, { $ifNull: ['$maxWorkload', 10] }] },
              100
            ]
          }
        }
      },
      {
        $addFields: {
          workloadLevel: {
            $switch: {
              branches: [
                { case: { $eq: ['$activeComplaints', 0] }, then: 'available' },
                { case: { $lte: ['$activeComplaints', 3] }, then: 'light' },
                { case: { $lte: ['$activeComplaints', 6] }, then: 'moderate' },
                { case: { $lte: ['$activeComplaints', 10] }, then: 'heavy' }
              ],
              default: 'overloaded'
            }
          }
        }
      }
    ]);

    return workloadStats;

  } catch (error) {
    console.error('Error getting workload stats:', error);
    throw error;
  }
}

/**
 * Intelligent workload balancing with transaction support
 */
async function balanceWorkload(department = null) {
  const session = await User.startSession();
  
  try {
    return await session.withTransaction(async () => {
      const workloadStats = await getFieldStaffWorkload(department);
      
      // Find overloaded and available staff
      const overloadedStaff = workloadStats.filter(staff => 
        staff.workloadLevel === 'overloaded' && staff.activeComplaints > 0
      );

      const availableStaff = workloadStats.filter(staff => 
        (staff.workloadLevel === 'available' || staff.workloadLevel === 'light') &&
        staff.isAvailable && !staff.isOnLeave
      );

      if (overloadedStaff.length === 0 || availableStaff.length === 0) {
        return {
          success: true,
          rebalanceActions: [],
          message: 'No rebalancing needed'
        };
      }

      const rebalanceActions = [];

      for (const overloaded of overloadedStaff) {
        if (availableStaff.length === 0) break;

        // Find pending complaints (not yet started)
        const pendingComplaints = await Complaint.find({
          assignedToFieldStaff: overloaded._id,
          status: 'assigned',
          isDeleted: false
        }).limit(Math.min(2, overloaded.activeComplaints - overloaded.maxWorkload))
          .session(session);

        for (const complaint of pendingComplaints) {
          if (availableStaff.length === 0) break;

          const targetStaff = availableStaff[0];
          
          // Reassign complaint
          await Complaint.findByIdAndUpdate(
            complaint._id,
            {
              assignedToFieldStaff: targetStaff._id,
              fieldStaffAssignedAt: new Date(),
              lastUpdated: new Date()
            },
            { session }
          );

          // Update workload counters
          await User.findByIdAndUpdate(
            overloaded._id,
            { $inc: { currentWorkload: -1 } },
            { session }
          );

          await User.findByIdAndUpdate(
            targetStaff._id,
            { $inc: { currentWorkload: 1 } },
            { session }
          );

          // Update local tracking
          targetStaff.activeComplaints++;
          if (targetStaff.activeComplaints >= 3) {
            availableStaff.shift(); // Remove from available list
          }

          rebalanceActions.push({
            complaintId: complaint._id,
            complaintTitle: complaint.title,
            fromStaff: overloaded.name,
            toStaff: targetStaff.name,
            reason: 'Workload balancing - overload relief'
          });
        }
      }

      return {
        success: true,
        rebalanceActions,
        message: `Successfully rebalanced ${rebalanceActions.length} complaints`
      };
    });

  } catch (error) {
    console.error('Workload balancing error:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Update SLA status for all active complaints
 */
async function updateSLAStatus() {
  try {
    const activeComplaints = await Complaint.find({
      status: { $in: ['assigned', 'in_progress'] },
      fieldStaffAssignedAt: { $exists: true },
      isDeleted: false
    });

    const updates = [];
    const now = new Date();

    for (const complaint of activeComplaints) {
      const assignedTime = new Date(complaint.fieldStaffAssignedAt);
      const hoursElapsed = (now - assignedTime) / (1000 * 60 * 60);
      const slaHours = complaint.slaTarget || 72;
      
      let newSlaStatus = complaint.slaStatus;
      let slaBreachAt = complaint.slaBreachAt;

      if (hoursElapsed >= slaHours) {
        newSlaStatus = 'overdue';
        if (!slaBreachAt) {
          slaBreachAt = new Date(assignedTime.getTime() + (slaHours * 60 * 60 * 1000));
        }
      } else if (hoursElapsed >= slaHours * 0.8) {
        newSlaStatus = 'at_risk';
      } else {
        newSlaStatus = 'on_time';
      }

      if (newSlaStatus !== complaint.slaStatus || (!complaint.slaBreachAt && slaBreachAt)) {
        updates.push({
          updateOne: {
            filter: { _id: complaint._id },
            update: { 
              slaStatus: newSlaStatus,
              ...(slaBreachAt && { slaBreachAt })
            }
          }
        });
      }
    }

    if (updates.length > 0) {
      await Complaint.bulkWrite(updates);
    }

    return {
      success: true,
      updatedCount: updates.length,
      message: `Updated SLA status for ${updates.length} complaints`
    };

  } catch (error) {
    console.error('SLA update error:', error);
    throw error;
  }
}

module.exports = {
  findBestFieldStaff,
  autoAssignComplaint,
  getFieldStaffWorkload,
  balanceWorkload,
  updateSLAStatus,
  calculateAdvancedScore
};