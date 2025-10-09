const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

class AssignmentService {
  /**
   * Get assignment statistics for field staff
   * @returns {Object} Assignment statistics
   */
  static async getAssignmentStats() {
    try {
      const stats = await Complaint.aggregate([
        {
          $match: {
            assignedToFieldStaff: { $exists: true, $ne: null },
            isDeleted: { $ne: true }
          }
        },
        {
          $group: {
            _id: '$assignedToFieldStaff',
            totalAssigned: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'work_completed'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'staffInfo'
          }
        },
        {
          $unwind: '$staffInfo'
        },
        {
          $project: {
            staffId: '$_id',
            staffName: '$staffInfo.name',
            department: '$staffInfo.department',
            jobRole: '$staffInfo.jobRole',
            experience: '$staffInfo.experience',
            maxWorkload: '$staffInfo.maxWorkload',
            totalAssigned: 1,
            pending: 1,
            inProgress: 1,
            completed: 1,
            resolved: 1,
            currentWorkload: { $add: ['$pending', '$inProgress'] },
            workloadPercentage: {
              $multiply: [
                { $divide: [{ $add: ['$pending', '$inProgress'] }, '$staffInfo.maxWorkload'] },
                100
              ]
            }
          }
        },
        {
          $sort: { currentWorkload: -1 }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return [];
    }
  }

  /**
   * Get workload distribution by department
   * @returns {Object} Department workload statistics
   */
  static async getDepartmentWorkload() {
    try {
      const stats = await Complaint.aggregate([
        {
          $match: {
            assignedToFieldStaff: { $exists: true, $ne: null },
            isDeleted: { $ne: true }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'assignedToFieldStaff',
            foreignField: '_id',
            as: 'staffInfo'
          }
        },
        {
          $unwind: '$staffInfo'
        },
        {
          $group: {
            _id: '$staffInfo.department',
            totalComplaints: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'work_completed'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            staffCount: { $addToSet: '$assignedToFieldStaff' }
          }
        },
        {
          $project: {
            department: '$_id',
            totalComplaints: 1,
            pending: 1,
            inProgress: 1,
            completed: 1,
            resolved: 1,
            activeStaff: { $size: '$staffCount' },
            avgComplaintsPerStaff: { $divide: ['$totalComplaints', { $size: '$staffCount' }] }
          }
        },
        {
          $sort: { totalComplaints: -1 }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error getting department workload:', error);
      return [];
    }
  }

  /**
   * Get assignment history for a specific field staff
   * @param {string} staffId - Field staff ID
   * @returns {Object} Assignment history
   */
  static async getStaffAssignmentHistory(staffId) {
    try {
      const staff = await User.findById(staffId);
      if (!staff || staff.role !== 'field_staff') {
        throw new Error('Invalid field staff ID');
      }

      const assignments = await Complaint.find({
        assignedToFieldStaff: staffId,
        isDeleted: { $ne: true }
      })
      .populate('citizen', 'name email')
      .sort({ fieldStaffAssignedAt: -1 })
      .limit(50);

      const stats = await Complaint.aggregate([
        {
          $match: {
            assignedToFieldStaff: staffId,
            isDeleted: { $ne: true }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'work_completed'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            avgResolutionTime: {
              $avg: {
                $cond: [
                  { $ne: ['$resolvedAt', null] },
                  { $subtract: ['$resolvedAt', '$fieldStaffAssignedAt'] },
                  null
                ]
              }
            }
          }
        }
      ]);

      return {
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          department: staff.department,
          jobRole: staff.jobRole,
          experience: staff.experience,
          maxWorkload: staff.maxWorkload,
          isActive: staff.isActive,
          isOnLeave: staff.isOnLeave
        },
        assignments,
        stats: stats[0] || {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          resolved: 0,
          avgResolutionTime: 0
        }
      };
    } catch (error) {
      console.error('Error getting staff assignment history:', error);
      throw error;
    }
  }

  /**
   * Reassign a complaint to a different field staff
   * @param {string} complaintId - Complaint ID
   * @param {string} newStaffId - New field staff ID
   * @param {string} adminId - Admin performing the reassignment
   * @param {string} reason - Reason for reassignment
   * @returns {Object} Reassignment result
   */
  static async reassignComplaint(complaintId, newStaffId, adminId, reason = '') {
    try {
      const complaint = await Complaint.findById(complaintId);
      if (!complaint) {
        throw new Error('Complaint not found');
      }

      const newStaff = await User.findById(newStaffId);
      if (!newStaff || newStaff.role !== 'field_staff' || !newStaff.isActive) {
        throw new Error('Invalid or inactive field staff');
      }

      const oldStaffId = complaint.assignedToFieldStaff;
      const oldStaff = oldStaffId ? await User.findById(oldStaffId) : null;

      // Check if new staff has capacity
      const newStaffWorkload = await Complaint.countDocuments({
        assignedToFieldStaff: newStaffId,
        status: { $in: ['assigned', 'in_progress'] },
        isDeleted: { $ne: true }
      });

      if (newStaffWorkload >= newStaff.maxWorkload) {
        throw new Error(`Staff ${newStaff.name} has reached maximum workload (${newStaffWorkload}/${newStaff.maxWorkload})`);
      }

      // Update complaint
      complaint.assignedToFieldStaff = newStaffId;
      complaint.fieldStaffAssignedAt = new Date();
      complaint.fieldStaffAssignedBy = adminId;
      complaint.status = 'assigned';
      complaint.lastUpdated = new Date();

      // Add reassignment note
      const reassignmentNote = `Reassigned from ${oldStaff ? oldStaff.name : 'unassigned'} to ${newStaff.name}. Reason: ${reason || 'No reason provided'}`;
      complaint.adminNotes.push({
        note: reassignmentNote,
        addedBy: adminId,
        addedAt: new Date()
      });

      await complaint.save();

      // Log the reassignment
      await AuditLog.logAction({
        action: 'reassign_complaint',
        entityType: 'complaint',
        entityId: complaint._id,
        performedBy: adminId,
        performedByEmail: (await User.findById(adminId)).email,
        reason: reason,
        details: {
          complaintTitle: complaint.title,
          complaintCategory: complaint.category,
          oldStaffId: oldStaffId,
          oldStaffName: oldStaff ? oldStaff.name : 'unassigned',
          newStaffId: newStaffId,
          newStaffName: newStaff.name,
          newStaffDepartment: newStaff.department,
          newStaffJobRole: newStaff.jobRole
        },
        ipAddress: '127.0.0.1',
        userAgent: 'UrbanEye-Admin-Panel'
      });

      return {
        success: true,
        message: `Complaint reassigned from ${oldStaff ? oldStaff.name : 'unassigned'} to ${newStaff.name}`,
        complaint: complaint,
        oldStaff: oldStaff,
        newStaff: newStaff
      };

    } catch (error) {
      console.error('Error reassigning complaint:', error);
      throw error;
    }
  }

  /**
   * Get unassigned complaints that need field staff assignment
   * @returns {Array} Unassigned complaints
   */
  static async getUnassignedComplaints() {
    try {
      const unassignedComplaints = await Complaint.find({
        assignedToFieldStaff: { $exists: false },
        status: 'pending',
        isDeleted: { $ne: true }
      })
      .populate('citizen', 'name email')
      .sort({ submittedAt: -1 });

      return unassignedComplaints;
    } catch (error) {
      console.error('Error getting unassigned complaints:', error);
      return [];
    }
  }

  /**
   * Get overloaded field staff (those exceeding their max workload)
   * @returns {Array} Overloaded staff
   */
  static async getOverloadedStaff() {
    try {
      const staff = await User.find({
        role: 'field_staff',
        isActive: true
      });

      const overloadedStaff = [];

      for (const member of staff) {
        const currentWorkload = await Complaint.countDocuments({
          assignedToFieldStaff: member._id,
          status: { $in: ['assigned', 'in_progress'] },
          isDeleted: { $ne: true }
        });

        if (currentWorkload > member.maxWorkload) {
          overloadedStaff.push({
            staff: member,
            currentWorkload,
            maxWorkload: member.maxWorkload,
            overload: currentWorkload - member.maxWorkload
          });
        }
      }

      return overloadedStaff.sort((a, b) => b.overload - a.overload);
    } catch (error) {
      console.error('Error getting overloaded staff:', error);
      return [];
    }
  }
}

module.exports = AssignmentService;

