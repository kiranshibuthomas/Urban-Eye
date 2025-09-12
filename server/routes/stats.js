const express = require('express');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/stats/platform
// @desc    Get platform-wide statistics
// @access  Private
router.get('/platform', authenticateToken, async (req, res) => {
  try {
    // Get platform statistics
    const totalComplaints = await Complaint.countDocuments();
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const activeCitizens = await User.countDocuments({ role: 'citizen' });
    
    // Calculate resolution rate
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;
    
    // Calculate average response time (mock data for now)
    const responseTime = 24; // hours
    
    // Calculate satisfaction rate (mock data for now)
    const satisfaction = 85; // percentage

    res.json({
      success: true,
      stats: {
        totalComplaints,
        resolvedComplaints,
        activeCitizens,
        resolutionRate,
        responseTime,
        satisfaction
      }
    });

  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching platform statistics'
    });
  }
});

// @route   GET /api/stats/admin
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get complaint statistics
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'in-progress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    
    // Get user statistics
    const totalUsers = await User.countDocuments({ role: 'citizen' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    
    // Calculate average resolution time
    const resolvedComplaintsWithDates = await Complaint.find({ 
      status: 'resolved',
      resolvedAt: { $exists: true }
    }).select('createdAt resolvedAt');
    
    let avgResolutionTime = 0;
    if (resolvedComplaintsWithDates.length > 0) {
      const totalResolutionTime = resolvedComplaintsWithDates.reduce((sum, complaint) => {
        const resolutionTime = new Date(complaint.resolvedAt) - new Date(complaint.createdAt);
        return sum + resolutionTime;
      }, 0);
      avgResolutionTime = Math.round(totalResolutionTime / resolvedComplaintsWithDates.length / (1000 * 60 * 60 * 24)); // in days
    }
    
    // Calculate satisfaction rate (mock data for now - in real app, this would come from feedback)
    const satisfactionRate = resolvedComplaints > 0 ? Math.round((resolvedComplaints * 0.85) / resolvedComplaints * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalComplaints,
        pending: pendingComplaints,
        inProgress: inProgressComplaints,
        resolved: resolvedComplaints,
        totalUsers,
        activeStaff: totalAdmins, // For now, using admin count as staff
        avgResolutionTime: avgResolutionTime > 0 ? `${avgResolutionTime} days` : 'N/A',
        satisfactionRate: `${satisfactionRate}%`
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin statistics'
    });
  }
});

// @route   GET /api/stats/admin/complaints
// @desc    Get all complaints for admin dashboard
// @access  Private (Admin only)
router.get('/admin/complaints', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get all complaints with populated citizen data
    const complaints = await Complaint.find()
      .populate('citizen', 'name email')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to recent 50 complaints for performance

    // Format complaints for frontend
    const formattedComplaints = complaints.map(complaint => ({
      id: complaint._id,
      title: complaint.title,
      description: complaint.description,
      status: complaint.status,
      priority: complaint.priority,
      category: complaint.category,
      location: complaint.location, // Keep the GeoJSON object for potential future use
      address: complaint.address, // Add the human-readable address
      city: complaint.city,
      pincode: complaint.pincode,
      citizen: complaint.citizen?.name || 'Unknown',
      citizenEmail: complaint.citizen?.email || '',
      date: complaint.createdAt,
      images: complaint.images || [],
      assignedTo: complaint.assignedTo || null,
      resolvedAt: complaint.resolvedAt || null
    }));

    res.json({
      success: true,
      complaints: formattedComplaints
    });

  } catch (error) {
    console.error('Get admin complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaints'
    });
  }
});

// @route   GET /api/stats/admin/live
// @desc    Server-Sent Events endpoint for real-time admin stats
// @access  Private (Admin only)
router.get('/admin/live', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection confirmation
    res.write('data: {"type": "connected", "message": "Real-time stats connection established"}\n\n');

    // Function to send stats update
    const sendStatsUpdate = async () => {
      try {
        // Get real-time stats
        const totalComplaints = await Complaint.countDocuments();
        const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
        const inProgressComplaints = await Complaint.countDocuments({ status: 'in-progress' });
        const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
        const totalUsers = await User.countDocuments({ role: 'citizen' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });

        // Calculate average resolution time
        const resolvedComplaintsWithDates = await Complaint.find({ 
          status: 'resolved',
          resolvedAt: { $exists: true }
        }).select('createdAt resolvedAt');
        
        let avgResolutionTime = 0;
        if (resolvedComplaintsWithDates.length > 0) {
          const totalResolutionTime = resolvedComplaintsWithDates.reduce((sum, complaint) => {
            const resolutionTime = new Date(complaint.resolvedAt) - new Date(complaint.createdAt);
            return sum + resolutionTime;
          }, 0);
          avgResolutionTime = Math.round(totalResolutionTime / resolvedComplaintsWithDates.length / (1000 * 60 * 60 * 24));
        }

        const satisfactionRate = resolvedComplaints > 0 ? Math.round((resolvedComplaints * 0.85) / resolvedComplaints * 100) : 0;

        const statsData = {
          type: 'stats_update',
          timestamp: new Date().toISOString(),
          stats: {
            totalComplaints,
            pending: pendingComplaints,
            inProgress: inProgressComplaints,
            resolved: resolvedComplaints,
            totalUsers,
            activeStaff: totalAdmins,
            avgResolutionTime: avgResolutionTime > 0 ? `${avgResolutionTime} days` : 'N/A',
            satisfactionRate: `${satisfactionRate}%`
          }
        };

        res.write(`data: ${JSON.stringify(statsData)}\n\n`);
      } catch (error) {
        console.error('Error sending stats update:', error);
        res.write(`data: {"type": "error", "message": "Failed to fetch stats"}\n\n`);
      }
    };

    // Send initial stats
    await sendStatsUpdate();

    // Set up interval to send updates every 10 seconds
    const interval = setInterval(sendStatsUpdate, 10000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(interval);
      console.log('Admin stats SSE connection closed');
    });

    // Handle errors
    req.on('error', (error) => {
      console.error('SSE connection error:', error);
      clearInterval(interval);
    });

  } catch (error) {
    console.error('SSE setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error setting up real-time stats'
    });
  }
});

module.exports = router;
