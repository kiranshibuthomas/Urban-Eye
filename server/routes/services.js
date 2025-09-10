const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/services
// @desc    Get available government services
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const services = [
      {
        id: 1,
        title: "Report Issues",
        description: "Report civic issues like potholes, broken streetlights, or waste management problems",
        icon: "FiAlertTriangle",
        color: "from-emerald-500 to-teal-500",
        textColor: "text-emerald-600",
        action: "navigate('/report-issue')"
      },
      {
        id: 2,
        title: "Track Reports",
        description: "Monitor the status of your submitted reports and see real-time updates",
        icon: "FiBarChart2",
        color: "from-teal-500 to-cyan-500",
        textColor: "text-teal-600",
        action: "navigate('/reports-history')"
      },
      {
        id: 3,
        title: "Community Forum",
        description: "Engage with your neighbors and discuss local community matters",
        icon: "FiMessageSquare",
        color: "from-green-500 to-emerald-500",
        textColor: "text-green-600",
        action: "setActiveSection('community')"
      },
      {
        id: 4,
        title: "Emergency Services",
        description: "Quick access to emergency contacts and urgent reporting",
        icon: "FiPhone",
        color: "from-red-500 to-pink-500",
        textColor: "text-red-600",
        action: "navigate('/emergency')"
      },
      {
        id: 5,
        title: "City Information",
        description: "Access city announcements, events, and important updates",
        icon: "FiInfo",
        color: "from-blue-500 to-indigo-500",
        textColor: "text-blue-600",
        action: "setActiveSection('info')"
      },
      {
        id: 6,
        title: "Permits & Licenses",
        description: "Apply for various permits and licenses online",
        icon: "FiFileText",
        color: "from-purple-500 to-violet-500",
        textColor: "text-purple-600",
        action: "navigate('/permits')"
      },
      {
        id: 7,
        title: "Public Transport",
        description: "Check bus schedules, routes, and public transportation updates",
        icon: "FiTruck",
        color: "from-orange-500 to-amber-500",
        textColor: "text-orange-600",
        action: "navigate('/transport')"
      },
      {
        id: 8,
        title: "Health Services",
        description: "Find nearby health centers, clinics, and medical services",
        icon: "FiHeart",
        color: "from-pink-500 to-rose-500",
        textColor: "text-pink-600",
        action: "navigate('/health')"
      }
    ];

    res.json({
      success: true,
      services
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching services'
    });
  }
});

module.exports = router;
