const User = require('../models/User');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');

/**
 * Auto-assignment service for field staff
 * Automatically assigns complaints to available field staff based on category/department
 */

/**
 * Find the best available field staff for a complaint
 */
async function findBestFieldStaff(category, priority, location = null) {
  try {
    // Map categories to departments
    const categoryToDepartmentMap = {
      'road_issues': 'public_works',
      'electricity': 'electricity', 
      'water_supply': 'water_supply',
      'waste_management': 'sanitation'
    };

    const requiredDepartment = categoryToDepartmentMap[category] || 'public_works';

    // Build query for field staff
    const query = {
      role: 'field_staff',
      isActive: true,
      department: requiredDepartment
    };

    // Get all eligible field staff
    const fieldStaffList = await User.find(query).select(
      'name email department jobRole experience workload currentAssignments isAvailable lastAssignedAt'
    );

    if (fieldStaffList.length === 0) {
      throw new Error(`No available field staff found for department: ${requiredDepartment}`);
    }

    // Get current workload for each field staff
    const staffWithWorkload = await Promise.all(
      fieldStaffList.map(async (staff) => {
        // Count active assignments
        const activeComplaints = await Complaint.countDocuments({
          assignedToFieldStaff: staff._id,
          status: { $in: ['assigned', 'in_progress'] }
        });

        return {
          ...staff.toObject(),
          activeComplaints,
          workloadScore: calculateWorkloadScore(staff, activeComplaints, priority)
        };
      })
    );

    // Sort by workload score (lower is better)
    staffWithWorkload.sort((a, b) => a.workloadScore - b.workloadScore);

    // Return the best candidate
    return staffWithWorkload[0];

  } catch (error) {
    console.error('Error finding field staff:', error);
    throw error;
  }
}

/**
 * Calculate workload score for field staff selection
 * Lower score = better candidate
 */
function calculateWorkloadScore(staff, activeComplaints, priority) {
  let score = 0;

  // Base score from active complaints
  score += activeComplaints * 10;

  // Experience bonus (more experience = lower score)
  const experienceYears = staff.experience || 0;
  score -= experienceYears * 2;

  // Availability factor
  if (!staff.isAvailable) {
    score += 100; // Heavy penalty for unavailable staff
  }

  // Priority factor - assign high priority to less loaded staff
  if (priority === 'urgent') {
    score += activeComplaints * 5; // Extra penalty for urgent complaints
  } else if (priority === 'high') {
    score += activeComplaints * 3;
  }

  // Time since last assignment (encourage rotation)
  if (staff.lastAssignedAt) {
    const daysSinceLastAssignment = (Date.now() - staff.lastAssignedAt) / (1000 * 60 * 60 * 24);
    score -= daysSinceLastAssignment * 0.5; // Small bonus for staff not recently assigned
  }

  return Math.max(score, 0); // Ensure non-negative score
}

/**
 * Automatically assign complaint to field staff
 */
async function autoAssignComplaint(complaintId, assignedByAdminId = null) {
  try {
    const complaint = await Complaint.findById(complaintId);
    
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    if (complaint.status !== 'pending') {
      throw new Error(`Cannot auto-assign complaint with status: ${complaint.status}`);
    }

    // Find best field staff
    const bestFieldStaff = await findBestFieldStaff(
      complaint.category, 
      complaint.priority, 
      complaint.location
    );

    if (!bestFieldStaff) {
      throw new Error('No suitable field staff found for assignment');
    }

    // Assign the complaint
    complaint.assignedToFieldStaff = bestFieldStaff._id;
    complaint.fieldStaffAssignedAt = new Date();
    complaint.fieldStaffAssignedBy = assignedByAdminId; // System assignment if null
    complaint.status = 'assigned';
    complaint.lastUpdated = new Date();

    await complaint.save();

    // Update field staff's last assigned time and workload
    await User.findByIdAndUpdate(bestFieldStaff._id, {
      lastAssignedAt: new Date(),
      $inc: { currentAssignments: 1 }
    });

    // Log the auto-assignment
    if (assignedByAdminId) {
      await AuditLog.logAction({
        action: 'auto_assign_field_staff',
        entityType: 'complaint',
        entityId: complaint._id,
        performedBy: assignedByAdminId,
        details: {
          complaintTitle: complaint.title,
          complaintCategory: complaint.category,
          complaintPriority: complaint.priority,
          fieldStaffId: bestFieldStaff._id,
          fieldStaffName: bestFieldStaff.name,
          fieldStaffDepartment: bestFieldStaff.department,
          assignmentReason: 'Automatic assignment based on category and workload',
          citizenId: complaint.citizen,
          citizenName: complaint.citizenName
        }
      });
    }

    return {
      success: true,
      fieldStaff: bestFieldStaff,
      complaint: complaint,
      message: `Complaint automatically assigned to ${bestFieldStaff.name} (${bestFieldStaff.department})`
    };

  } catch (error) {
    console.error('Auto-assignment error:', error);
    throw error;
  }
}

/**
 * Get field staff workload statistics
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

    const fieldStaffList = await User.find(query).select(
      'name email department jobRole experience currentAssignments isAvailable'
    );

    const workloadStats = await Promise.all(
      fieldStaffList.map(async (staff) => {
        const activeComplaints = await Complaint.countDocuments({
          assignedToFieldStaff: staff._id,
          status: { $in: ['assigned', 'in_progress'] }
        });

        const completedThisMonth = await Complaint.countDocuments({
          assignedToFieldStaff: staff._id,
          status: 'work_completed',
          workCompletedAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        });

        return {
          staffId: staff._id,
          name: staff.name,
          department: staff.department,
          experience: staff.experience,
          activeComplaints,
          completedThisMonth,
          isAvailable: staff.isAvailable,
          workloadLevel: getWorkloadLevel(activeComplaints)
        };
      })
    );

    return workloadStats;

  } catch (error) {
    console.error('Error getting workload stats:', error);
    throw error;
  }
}

/**
 * Determine workload level based on active complaints
 */
function getWorkloadLevel(activeComplaints) {
  if (activeComplaints === 0) return 'available';
  if (activeComplaints <= 3) return 'light';
  if (activeComplaints <= 6) return 'moderate';
  if (activeComplaints <= 10) return 'heavy';
  return 'overloaded';
}

/**
 * Balance workload across field staff
 */
async function balanceWorkload(department = null) {
  try {
    const workloadStats = await getFieldStaffWorkload(department);
    
    // Find overloaded staff
    const overloadedStaff = workloadStats.filter(staff => 
      staff.workloadLevel === 'overloaded' || staff.workloadLevel === 'heavy'
    );

    // Find available staff
    const availableStaff = workloadStats.filter(staff => 
      staff.workloadLevel === 'available' || staff.workloadLevel === 'light'
    );

    const rebalanceActions = [];

    for (const overloaded of overloadedStaff) {
      if (availableStaff.length === 0) break;

      // Find pending complaints assigned to overloaded staff
      const pendingComplaints = await Complaint.find({
        assignedToFieldStaff: overloaded.staffId,
        status: 'assigned' // Only reassign if work hasn't started
      }).limit(2); // Limit reassignments

      for (const complaint of pendingComplaints) {
        if (availableStaff.length === 0) break;

        const targetStaff = availableStaff[0];
        
        // Reassign complaint
        complaint.assignedToFieldStaff = targetStaff.staffId;
        complaint.fieldStaffAssignedAt = new Date();
        complaint.lastUpdated = new Date();
        
        await complaint.save();

        // Update workload counts
        overloaded.activeComplaints--;
        targetStaff.activeComplaints++;

        // Update target staff workload level
        targetStaff.workloadLevel = getWorkloadLevel(targetStaff.activeComplaints);

        // Remove from available if no longer light workload
        if (targetStaff.workloadLevel !== 'available' && targetStaff.workloadLevel !== 'light') {
          availableStaff.shift();
        }

        rebalanceActions.push({
          complaintId: complaint._id,
          from: overloaded.name,
          to: targetStaff.name,
          reason: 'Workload balancing'
        });
      }
    }

    return {
      success: true,
      rebalanceActions,
      message: `Rebalanced ${rebalanceActions.length} complaints`
    };

  } catch (error) {
    console.error('Workload balancing error:', error);
    throw error;
  }
}

module.exports = {
  findBestFieldStaff,
  autoAssignComplaint,
  getFieldStaffWorkload,
  balanceWorkload,
  calculateWorkloadScore
};