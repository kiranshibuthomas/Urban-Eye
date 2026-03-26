const express = require('express');
const router = express.Router();
const TeamCollaborationService = require('../services/teamCollaborationService');
const { authenticateToken } = require('../middleware/auth');

// Protect all routes
router.use(authenticateToken);

// Create a new team
router.post('/create', async (req, res) => {
  try {
    const { complaintId, teamName, requiredSkills, maxMembers } = req.body;
    
    if (!complaintId) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID is required'
      });
    }
    
    const result = await TeamCollaborationService.createTeam(
      complaintId,
      req.user._id,
      teamName,
      requiredSkills,
      maxMembers
    );
    
    res.status(201).json(result);
    
  } catch (error) {
    console.error('Create team error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get available field staff for team
router.get('/:teamId/available-staff', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { search } = req.query;
    
    const result = await TeamCollaborationService.getAvailableFieldStaff(teamId, search);
    
    res.json(result);
    
  } catch (error) {
    console.error('Get available staff error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Invite member to team
router.post('/:teamId/invite', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { fieldStaffId, role } = req.body;
    
    if (!fieldStaffId) {
      return res.status(400).json({
        success: false,
        message: 'Field staff ID is required'
      });
    }
    
    const result = await TeamCollaborationService.inviteMember(
      teamId,
      fieldStaffId,
      role,
      req.user._id
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Respond to team invitation
router.post('/:teamId/respond', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { accept } = req.body;
    
    if (typeof accept !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Accept parameter is required'
      });
    }
    
    const result = await TeamCollaborationService.respondToInvitation(
      teamId,
      req.user._id,
      accept
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Respond to invitation error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Remove member from team
router.post('/:teamId/remove-member', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { fieldStaffId, reason } = req.body;
    
    if (!fieldStaffId) {
      return res.status(400).json({
        success: false,
        message: 'Field staff ID is required'
      });
    }
    
    const result = await TeamCollaborationService.removeMember(
      teamId,
      fieldStaffId,
      reason,
      req.user._id
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Start team work
router.post('/:teamId/start-work', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { location, notes } = req.body;
    
    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Valid location is required'
      });
    }
    
    const result = await TeamCollaborationService.startTeamWork(
      teamId,
      location,
      notes
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Start team work error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update member location
router.post('/:teamId/update-location', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { location, accuracy, battery, isMoving } = req.body;
    
    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Valid location is required'
      });
    }
    
    const result = await TeamCollaborationService.updateMemberLocation(
      teamId,
      req.user._id,
      location,
      accuracy,
      battery,
      isMoving
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Update location error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Send team message
router.post('/:teamId/message', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    const result = await TeamCollaborationService.sendMessage(
      teamId,
      req.user._id,
      message
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get team details
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    console.log('GET /api/teams/:teamId - teamId:', teamId);
    
    // Validate ObjectId format
    if (!teamId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid team ID format:', teamId);
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID format'
      });
    }
    
    const result = await TeamCollaborationService.getTeamDetails(teamId);
    
    res.json(result);
    
  } catch (error) {
    console.error('Get team details error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get my teams
router.get('/my/teams', async (req, res) => {
  try {
    const { status } = req.query;
    
    const result = await TeamCollaborationService.getMyTeams(req.user._id, status);
    
    res.json(result);
    
  } catch (error) {
    console.error('Get my teams error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all active teams (admin only)
router.get('/admin/active-teams', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const result = await TeamCollaborationService.getAllActiveTeams();
    
    res.json(result);
    
  } catch (error) {
    console.error('Get active teams error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get team statistics
router.get('/:teamId/statistics', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const result = await TeamCollaborationService.getTeamStatistics(teamId);
    
    res.json(result);
    
  } catch (error) {
    console.error('Get team statistics error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
