const WorkLog = require('../models/WorkLog');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class FieldWorkService {
  
  // Calculate distance between two coordinates
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Validate if location is within allowed radius
  static validateLocation(currentLocation, complaintLocation, allowedRadius = 150) {
    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      complaintLocation.coordinates[1], // lat
      complaintLocation.coordinates[0]  // lng
    );

    return {
      distance: Math.round(distance),
      isValid: distance <= allowedRadius,
      allowedRadius
    };
  }

  // Start work session
  static async startWork(complaintId, fieldStaffId, location, notes = '') {
    try {
      // Get complaint details
      const complaint = await Complaint.findById(complaintId);
      if (!complaint) {
        throw new Error('Complaint not found');
      }

      // Check if complaint is assigned to this field staff
      if (complaint.assignedToFieldStaff.toString() !== fieldStaffId.toString()) {
        throw new Error('Complaint not assigned to this field staff');
      }

      // Check if complaint is in correct status
      if (complaint.status !== 'assigned') {
        throw new Error('Complaint must be in assigned status to start work');
      }

      // Check if there's already an active work session
      const existingSession = await WorkLog.findOne({
        complaint: complaintId,
        fieldStaff: fieldStaffId,
        status: { $in: ['started', 'paused', 'resumed'] }
      });

      if (existingSession) {
        throw new Error('There is already an active work session for this complaint');
      }

      // Validate location
      const locationValidation = this.validateLocation(location, complaint.location);
      
      if (!locationValidation.isValid) {
        throw new Error(`You must be within ${locationValidation.allowedRadius}m of the complaint location. You are currently ${locationValidation.distance}m away.`);
      }

      // Create new work session
      const sessionId = uuidv4();
      const workLog = new WorkLog({
        complaint: complaintId,
        fieldStaff: fieldStaffId,
        sessionId,
        startLocation: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
          accuracy: location.accuracy,
          address: location.address
        },
        distanceFromComplaint: locationValidation.distance,
        isValidStartLocation: true,
        status: 'started'
      });

      await workLog.save();

      // Update complaint status
      complaint.status = 'in_progress';
      complaint.workStartedAt = new Date();
      await complaint.save();

      return {
        success: true,
        workLog,
        message: 'Work started successfully',
        sessionId,
        locationValidation
      };

    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Add progress update
  static async addProgressUpdate(sessionId, fieldStaffId, description, location, images = []) {
    try {
      const workLog = await WorkLog.findOne({
        sessionId,
        fieldStaff: fieldStaffId,
        status: { $in: ['started', 'resumed'] }
      });

      if (!workLog) {
        throw new Error('No active work session found');
      }

      await workLog.addProgressUpdate(description, {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        accuracy: location.accuracy
      }, images);

      return {
        success: true,
        message: 'Progress updated successfully',
        workLog
      };

    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Pause work
  static async pauseWork(sessionId, fieldStaffId, reason, location, notes = '') {
    try {
      const workLog = await WorkLog.findOne({
        sessionId,
        fieldStaff: fieldStaffId,
        status: { $in: ['started', 'resumed'] }
      });

      if (!workLog) {
        throw new Error('No active work session found');
      }

      await workLog.pauseWork(reason, {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        accuracy: location.accuracy
      }, notes);

      return {
        success: true,
        message: 'Work paused successfully',
        workLog
      };

    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Resume work
  static async resumeWork(sessionId, fieldStaffId, location, notes = '') {
    try {
      const workLog = await WorkLog.findOne({
        sessionId,
        fieldStaff: fieldStaffId,
        status: 'paused'
      });

      if (!workLog) {
        throw new Error('No paused work session found');
      }

      // Validate location again
      const complaint = await Complaint.findById(workLog.complaint);
      const locationValidation = this.validateLocation(location, complaint.location);
      
      if (!locationValidation.isValid) {
        throw new Error(`You must be within ${locationValidation.allowedRadius}m of the complaint location to resume work. You are currently ${locationValidation.distance}m away.`);
      }

      await workLog.resumeWork({
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        accuracy: location.accuracy
      }, notes);

      return {
        success: true,
        message: 'Work resumed successfully',
        workLog,
        locationValidation
      };

    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Complete work
  static async completeWork(sessionId, fieldStaffId, completionNotes, completionImages, location) {
    try {
      const workLog = await WorkLog.findOne({
        sessionId,
        fieldStaff: fieldStaffId,
        status: { $in: ['started', 'resumed'] }
      }).populate('complaint');

      if (!workLog) {
        throw new Error('No active work session found');
      }

      if (!completionNotes || completionNotes.trim().length === 0) {
        throw new Error('Completion notes are required');
      }

      // For team work, images are optional; for solo work, at least one is required
      if (!workLog.isTeamWork && (!completionImages || completionImages.length === 0)) {
        throw new Error('At least one completion image is required');
      }

      // Validate location
      const locationValidation = this.validateLocation(location, workLog.complaint.location);
      
      if (!locationValidation.isValid) {
        throw new Error(`You must be within ${locationValidation.allowedRadius}m of the complaint location to complete work. You are currently ${locationValidation.distance}m away.`);
      }

      await workLog.completeWork(
        completionNotes,
        completionImages || [],
        {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
          accuracy: location.accuracy,
          address: location.address
        }
      );

      // Update complaint status
      const complaint = await Complaint.findById(workLog.complaint._id);
      complaint.status = 'work_completed';
      complaint.workCompletedAt = new Date();
      complaint.workCompletionNotes = completionNotes;
      complaint.workProofImages = completionImages || [];
      await complaint.save();

      return {
        success: true,
        message: 'Work completed successfully',
        workLog,
        locationValidation
      };

    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Submit work for admin review
  static async submitForReview(sessionId, fieldStaffId) {
    try {
      const workLog = await WorkLog.findOne({
        sessionId,
        fieldStaff: fieldStaffId,
        status: 'completed'
      }).populate('complaint');

      if (!workLog) {
        throw new Error('No completed work session found');
      }

      await workLog.submitForReview();

      return {
        success: true,
        message: 'Work submitted for admin review',
        workLog
      };

    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get active work session
  static async getActiveSession(fieldStaffId) {
    try {
      const workLog = await WorkLog.findOne({
        fieldStaff: fieldStaffId,
        status: { $in: ['started', 'paused', 'resumed', 'completed'] }
      }).populate('complaint', 'title description location address category priority');

      return workLog;

    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get work history
  static async getWorkHistory(fieldStaffId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const workLogs = await WorkLog.find({
        fieldStaff: fieldStaffId
      })
      .populate('complaint', 'title description location address category priority')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

      // Filter out orphaned logs where the complaint was deleted
      const validLogs = workLogs.filter(log => log.complaint !== null);

      const total = await WorkLog.countDocuments({
        fieldStaff: fieldStaffId,
        complaint: { $ne: null }
      });

      return {
        workLogs: validLogs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };

    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get work statistics
  static async getWorkStatistics(fieldStaffId, startDate, endDate) {
    try {
      const stats = await WorkLog.getWorkStatistics(fieldStaffId, startDate, endDate);
      
      return stats[0] || {
        totalSessions: 0,
        completedSessions: 0,
        totalWorkTime: 0,
        averageWorkTime: 0,
        totalProgressUpdates: 0,
        totalPauses: 0
      };

    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get detailed work log for admin review
  static async getWorkLogForReview(workLogId) {
    try {
      const workLog = await WorkLog.findById(workLogId)
        .populate({
          path: 'complaint',
          populate: { path: 'citizen', select: 'name email phone' }
        })
        .populate('fieldStaff', 'name email department')
        .populate('reviewedBy', 'name email');

      if (!workLog) {
        throw new Error('Work log not found');
      }

      return workLog;

    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Admin review work
  static async reviewWork(workLogId, adminId, reviewStatus, reviewNotes, qualityScore) {
    try {
      const workLog = await WorkLog.findById(workLogId).populate('complaint');
      
      if (!workLog) {
        throw new Error('Work log not found');
      }

      // Accept both 'submitted' and 'completed' to be safe
      if (!['submitted', 'completed'].includes(workLog.status)) {
        throw new Error(`Work log cannot be reviewed in its current status: ${workLog.status}`);
      }

      workLog.reviewStatus = reviewStatus;
      workLog.reviewNotes = reviewNotes || '';
      workLog.reviewedBy = adminId;
      workLog.reviewedAt = new Date();
      
      if (qualityScore) {
        workLog.qualityScore = qualityScore;
      }

      await workLog.save();

      // Update complaint status based on review
      const complaint = await Complaint.findById(workLog.complaint._id);
      
      if (!complaint) {
        throw new Error('Associated complaint not found');
      }

      if (reviewStatus === 'approved') {
        complaint.status = 'resolved';
        complaint.resolvedAt = new Date();
      } else if (reviewStatus === 'rejected' || reviewStatus === 'needs_revision') {
        // Use the model's rejectWork method which handles all the fields
        complaint.rejectWork(adminId, reviewNotes || `Work ${reviewStatus} by admin`);
        // rejectWork already sets status = 'assigned', workRejectionReason, workRejectedAt, etc.
      }
      
      await complaint.save();

      return {
        success: true,
        message: `Work ${reviewStatus} successfully`,
        workLog,
        complaint
      };

    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = FieldWorkService;