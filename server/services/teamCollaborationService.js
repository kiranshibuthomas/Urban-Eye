const WorkTeam = require('../models/WorkTeam');
const WorkLog = require('../models/WorkLog');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

class TeamCollaborationService {
  
  // Create a new team
  static async createTeam(complaintId, teamLeaderId, teamName, requiredSkills = [], maxMembers = 5) {
    try {
      // Verify complaint exists and is assigned to team leader
      const complaint = await Complaint.findById(complaintId);
      if (!complaint) {
        throw new Error('Complaint not found');
      }
      
      if (complaint.assignedToFieldStaff.toString() !== teamLeaderId.toString()) {
        throw new Error('Only the assigned field staff can create a team for this complaint');
      }
      
      // Check if team already exists for this complaint
      const existingTeam = await WorkTeam.findOne({
        complaint: complaintId,
        status: { $in: ['forming', 'ready', 'active'] }
      });
      
      if (existingTeam) {
        throw new Error('An active team already exists for this complaint');
      }
      
      // Create team
      const team = new WorkTeam({
        teamName: teamName || `Team for ${complaint.title}`,
        complaint: complaintId,
        teamLeader: teamLeaderId,
        requiredSkills,
        maxMembers,
        members: [{
          fieldStaff: teamLeaderId,
          role: 'leader',
          status: 'active',
          joinedAt: new Date()
        }],
        activityLog: [{
          action: 'created',
          performedBy: teamLeaderId,
          description: 'Team created',
          timestamp: new Date()
        }]
      });
      
      await team.save();
      
      return {
        success: true,
        team,
        message: 'Team created successfully'
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Get available field staff for team invitation
  static async getAvailableFieldStaff(teamId, searchQuery = '') {
    try {
      const team = await WorkTeam.findById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      
      // Get IDs of current team members
      const memberIds = team.members.map(m => m.fieldStaff);
      
      // Build query
      const query = {
        role: 'field_staff',
        _id: { $nin: memberIds }
      };
      
      if (searchQuery) {
        query.$or = [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { department: { $regex: searchQuery, $options: 'i' } }
        ];
      }
      
      // Find available staff
      const availableStaff = await User.find(query)
        .select('name email department skills currentLocation isAvailable avatar')
        .limit(50);
      
      // Calculate distance from complaint location if location available
      const complaint = await Complaint.findById(team.complaint);
      const staffWithDistance = availableStaff.map(staff => {
        let distance = null;
        
        if (staff.currentLocation && complaint.location) {
          distance = this.calculateDistance(
            staff.currentLocation.coordinates[1],
            staff.currentLocation.coordinates[0],
            complaint.location.coordinates[1],
            complaint.location.coordinates[0]
          );
        }
        
        return {
          ...staff.toObject(),
          distanceFromTask: distance ? Math.round(distance) : null
        };
      });
      
      // Sort by distance (closest first)
      staffWithDistance.sort((a, b) => {
        if (a.distanceFromTask === null) return 1;
        if (b.distanceFromTask === null) return -1;
        return a.distanceFromTask - b.distanceFromTask;
      });
      
      return {
        success: true,
        availableStaff: staffWithDistance
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Invite member to team
  static async inviteMember(teamId, fieldStaffId, role, invitedBy) {
    try {
      const team = await WorkTeam.findById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      
      // Verify inviter is team leader
      if (team.teamLeader.toString() !== invitedBy.toString()) {
        throw new Error('Only team leader can invite members');
      }
      
      // Verify field staff exists
      const fieldStaff = await User.findById(fieldStaffId);
      if (!fieldStaff || fieldStaff.role !== 'field_staff') {
        throw new Error('Field staff not found');
      }
      
      await team.addMember(fieldStaffId, role, invitedBy);
      
      // TODO: Send notification to invited field staff
      
      return {
        success: true,
        team,
        message: `${fieldStaff.name} invited to team`
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Respond to team invitation
  static async respondToInvitation(teamId, fieldStaffId, accept) {
    try {
      const team = await WorkTeam.findById(teamId).populate('complaint', 'title description location');
      if (!team) {
        throw new Error('Team not found');
      }
      
      await team.respondToInvitation(fieldStaffId, accept);
      
      // If all invited members have responded and at least 2 accepted, mark team as ready
      const allResponded = team.members.every(m => m.status !== 'invited');
      const acceptedCount = team.members.filter(m => m.status === 'accepted' || m.status === 'active').length;
      
      if (allResponded && acceptedCount >= 2 && team.status === 'forming') {
        team.status = 'ready';
        await team.save();
      }
      
      return {
        success: true,
        team,
        message: accept ? 'Invitation accepted' : 'Invitation declined'
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Remove member from team
  static async removeMember(teamId, fieldStaffId, reason, removedBy) {
    try {
      const team = await WorkTeam.findById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      
      // Verify remover is team leader or the member themselves
      if (team.teamLeader.toString() !== removedBy.toString() && 
          fieldStaffId.toString() !== removedBy.toString()) {
        throw new Error('Only team leader or the member can remove from team');
      }
      
      // Cannot remove team leader
      if (fieldStaffId.toString() === team.teamLeader.toString()) {
        throw new Error('Team leader cannot be removed');
      }
      
      await team.removeMember(fieldStaffId, reason, removedBy);
      
      return {
        success: true,
        team,
        message: 'Member removed from team'
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Start team work
  static async startTeamWork(teamId, location, notes = '') {
    try {
      const team = await WorkTeam.findById(teamId).populate('complaint');
      if (!team) {
        throw new Error('Team not found');
      }
      
      if (team.status !== 'ready') {
        throw new Error('Team must be ready to start work');
      }
      
      // Validate location for team leader
      const locationValidation = this.validateLocation(location, team.complaint.location);
      if (!locationValidation.isValid) {
        throw new Error(`Team leader must be within ${locationValidation.allowedRadius}m of the task location`);
      }
      
      // Create work log for team
      const workLog = new WorkLog({
        complaint: team.complaint._id,
        fieldStaff: team.teamLeader,
        sessionId: `team-${team._id}-${Date.now()}`,
        startLocation: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
          accuracy: location.accuracy,
          address: location.address
        },
        distanceFromComplaint: locationValidation.distance,
        isValidStartLocation: true,
        status: 'started',
        isTeamWork: true,
        teamId: team._id
      });
      
      await workLog.save();
      
      // Update team status
      await team.startWork(workLog._id);
      
      // Update complaint status
      team.complaint.status = 'in_progress';
      team.complaint.workStartedAt = new Date();
      await team.complaint.save();
      
      return {
        success: true,
        team,
        workLog,
        message: 'Team work started successfully'
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Update team member location
  static async updateMemberLocation(teamId, fieldStaffId, location, accuracy, battery, isMoving) {
    try {
      const team = await WorkTeam.findById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      
      // Verify member is part of team
      const member = team.members.find(
        m => m.fieldStaff.toString() === fieldStaffId.toString() && 
             (m.status === 'active' || m.status === 'accepted')
      );
      
      if (!member) {
        throw new Error('Not a team member');
      }
      
      await team.updateLocation(fieldStaffId, location, accuracy, battery, isMoving);
      
      return {
        success: true,
        message: 'Location updated'
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Send team message
  static async sendMessage(teamId, senderId, message) {
    try {
      const team = await WorkTeam.findById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      
      // Verify sender is team member
      const member = team.members.find(
        m => m.fieldStaff.toString() === senderId.toString() && 
             (m.status === 'active' || m.status === 'accepted')
      );
      
      if (!member) {
        throw new Error('Not a team member');
      }
      
      await team.addMessage(senderId, message);
      
      // TODO: Send push notifications to other team members
      
      return {
        success: true,
        message: 'Message sent'
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Get team details
  static async getTeamDetails(teamId) {
    try {
      const team = await WorkTeam.findById(teamId)
        .populate('complaint', 'title description location address category priority')
        .populate('teamLeader', 'name email department avatar')
        .populate('members.fieldStaff', 'name email department avatar skills')
        .populate('messages.sender', 'name avatar')
        .populate('workSession');
      
      if (!team) {
        throw new Error('Team not found');
      }
      
      return {
        success: true,
        team
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Get teams for field staff
  static async getMyTeams(fieldStaffId, status = null) {
    try {
      const query = {
        'members.fieldStaff': fieldStaffId
      };
      
      if (status) {
        query.status = status;
      }
      
      const teams = await WorkTeam.find(query)
        .populate('complaint', 'title description location address category priority')
        .populate('teamLeader', 'name email avatar')
        .populate('members.fieldStaff', 'name email avatar')
        .sort({ createdAt: -1 });
      
      return {
        success: true,
        teams
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Get all active teams (for admin)
  static async getAllActiveTeams() {
    try {
      const teams = await WorkTeam.find({
        status: { $in: ['ready', 'active'] }
      })
        .populate('complaint', 'title description location address category priority')
        .populate('teamLeader', 'name email department avatar')
        .populate('members.fieldStaff', 'name email department avatar')
        .populate('lastKnownLocations.fieldStaff', 'name avatar')
        .sort({ startedAt: -1 });
      
      return {
        success: true,
        teams
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Get team statistics
  static async getTeamStatistics(teamId) {
    try {
      const team = await WorkTeam.findById(teamId).populate('workSession');
      if (!team) {
        throw new Error('Team not found');
      }
      
      const stats = {
        teamSize: team.activeMembersCount,
        workDuration: team.workSession ? team.workSession.totalDuration : 0,
        messagesExchanged: team.stats.messagesExchanged,
        progressUpdates: team.stats.progressUpdates,
        status: team.status,
        startedAt: team.startedAt,
        completedAt: team.completedAt
      };
      
      return {
        success: true,
        stats
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Helper: Calculate distance
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
  
  // Helper: Validate location
  static validateLocation(currentLocation, complaintLocation, allowedRadius = 150) {
    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      complaintLocation.coordinates[1],
      complaintLocation.coordinates[0]
    );

    return {
      distance: Math.round(distance),
      isValid: distance <= allowedRadius,
      allowedRadius
    };
  }
}

module.exports = TeamCollaborationService;
