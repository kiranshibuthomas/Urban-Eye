const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const aiChatbotService = require('../services/aiChatbotService');

// Chatbot conversation handler with AI
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.id;
    const user = req.user;

    // Prepare context for AI
    const aiContext = {
      userInfo: {
        name: user.name,
        email: user.email,
        role: user.role
      },
      ...context
    };

    // Try to get user statistics for context
    try {
      const userStats = await getUserStatistics(userId);
      aiContext.userStats = userStats;
    } catch (error) {
      console.log('Could not fetch user stats for AI context:', error.message);
    }

    // Generate AI response
    const response = await aiChatbotService.generateResponse(userId, message, aiContext);

    res.json({
      success: true,
      response: response,
      aiPowered: true
    });
  } catch (error) {
    console.error('AI Chatbot error:', error);
    
    // Fallback to rule-based response
    try {
      const fallbackResponse = await generateChatbotResponse(message, context, req.user.id);
      res.json({
        success: true,
        response: fallbackResponse,
        aiPowered: false,
        fallback: true
      });
    } catch (fallbackError) {
      console.error('Fallback chatbot error:', fallbackError);
      res.status(500).json({
        success: false,
        message: 'Error processing chatbot request'
      });
    }
  }
});

// Get user's complaint statistics for chatbot
router.get('/user-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getUserStatistics(userId);

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching user stats for chatbot:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
});

// Clear conversation history
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    aiChatbotService.clearHistory(userId);
    
    res.json({
      success: true,
      message: 'Conversation history cleared'
    });
  } catch (error) {
    console.error('Error clearing conversation history:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing conversation history'
    });
  }
});

// Check AI service health
router.get('/health', async (req, res) => {
  try {
    const aiAvailable = await aiChatbotService.checkAPIHealth();
    
    res.json({
      success: true,
      aiAvailable: aiAvailable,
      service: 'UrbanEye AI Chatbot',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking AI service health:', error);
    res.json({
      success: true,
      aiAvailable: false,
      service: 'UrbanEye AI Chatbot (Fallback Mode)',
      timestamp: new Date().toISOString()
    });
  }
});

// Get department information
router.get('/departments', async (req, res) => {
  try {
    const departments = [
      {
        name: 'Public Works',
        description: 'Handles road maintenance, streetlights, water/sewer issues, sidewalks, traffic signals, snow removal, and waste management.',
        contact: {
          phone: '(555) 123-4567',
          email: 'publicworks@city.gov',
          hours: 'Mon-Fri 8AM-5PM'
        },
        services: [
          'Road repairs and maintenance',
          'Streetlight issues',
          'Water and sewer problems',
          'Sidewalk repairs',
          'Traffic signs and signals',
          'Snow removal',
          'Waste management'
        ]
      },
      {
        name: 'Parks & Recreation',
        description: 'Maintains parks, recreational facilities, organizes community events, and manages public green spaces.',
        contact: {
          phone: '(555) 123-7890',
          email: 'parks@city.gov',
          hours: 'Mon-Fri 9AM-5PM'
        },
        services: [
          'Park maintenance',
          'Playground equipment',
          'Sports facilities',
          'Community events',
          'Tree maintenance',
          'Public restrooms'
        ]
      },
      {
        name: 'Transportation',
        description: 'Manages public transportation, traffic flow, parking, and transportation infrastructure.',
        contact: {
          phone: '(555) 123-5678',
          email: 'transportation@city.gov',
          hours: 'Mon-Fri 8AM-6PM'
        },
        services: [
          'Public transit',
          'Traffic management',
          'Parking enforcement',
          'Bike lanes',
          'Pedestrian safety',
          'Transportation planning'
        ]
      },
      {
        name: 'Environmental Services',
        description: 'Handles environmental protection, recycling programs, air quality, and sustainability initiatives.',
        contact: {
          phone: '(555) 123-9876',
          email: 'environmental@city.gov',
          hours: 'Mon-Fri 8AM-4PM'
        },
        services: [
          'Recycling programs',
          'Air quality monitoring',
          'Environmental compliance',
          'Sustainability initiatives',
          'Hazardous waste disposal',
          'Green building programs'
        ]
      }
    ];

    res.json({
      success: true,
      departments: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department information'
    });
  }
});

// Helper function to get user statistics
async function getUserStatistics(userId) {
  try {
    // This would typically query your complaints database
    // For now, returning mock data - replace with actual database queries
    const stats = {
      totalComplaints: 0,
      pending: 0,
      inProgress: 0,
      workCompleted: 0,
      resolved: 0,
      recentComplaints: []
    };

    // TODO: Replace with actual database queries
    // Example:
    // const Complaint = require('../models/Complaint');
    // const complaints = await Complaint.find({ userId: userId });
    // stats.totalComplaints = complaints.length;
    // stats.pending = complaints.filter(c => c.status === 'pending').length;
    // etc.

    return stats;
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return {
      totalComplaints: 0,
      pending: 0,
      inProgress: 0,
      workCompleted: 0,
      resolved: 0,
      recentComplaints: []
    };
  }
}

// Fallback chatbot response generation (rule-based)
async function generateChatbotResponse(message, context, userId) {
  const lowerMessage = message.toLowerCase();
  
  // Intent detection and response generation
  if (lowerMessage.includes('report') || lowerMessage.includes('submit') || lowerMessage.includes('complaint')) {
    return {
      text: "I'll help you report an issue! 📝 You can report various types of problems:\n\n• Infrastructure issues (roads, streetlights, etc.)\n• Safety concerns\n• Environmental problems\n• Public facility issues\n• Community concerns\n\nWould you like me to guide you through the reporting process or take you directly to the report form?",
      quickReplies: ['Guide Me Through', 'Go to Report Form', 'What Info Do I Need?'],
      intent: 'report_issue'
    };
  }
  
  if (lowerMessage.includes('status') || lowerMessage.includes('check') || lowerMessage.includes('track')) {
    return {
      text: "I can help you check your report status! 📊 You can:\n\n• View all your submitted reports\n• Check current status updates\n• See resolution progress\n• Get estimated completion times\n\nWould you like to see your reports dashboard or check a specific report?",
      quickReplies: ['View All Reports', 'Check Specific Report', 'Explain Status Types'],
      intent: 'check_status'
    };
  }
  
  if (lowerMessage.includes('department') || lowerMessage.includes('service') || lowerMessage.includes('contact')) {
    return {
      text: "Here's information about our city services! 🏛️\n\n• Public Works Department\n• Parks & Recreation\n• Transportation Services\n• Environmental Services\n• Public Safety\n• Community Development\n\nWhich department would you like to know more about?",
      quickReplies: ['Public Works', 'Parks & Recreation', 'Transportation', 'Environmental'],
      intent: 'department_info'
    };
  }
  
  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('911')) {
    return {
      text: "Important emergency contacts: 🚨\n\n**True Emergencies**: 911\n**Non-Emergency Police**: (555) 123-0911\n**Fire Department**: (555) 123-3473\n**Public Works Emergency**: (555) 123-4567\n**City Hall**: (555) 123-1234\n**Animal Control**: (555) 123-7890\n\n⚠️ Use UrbanEye for non-emergency issues only!",
      quickReplies: ['Report Non-Emergency', 'City Services', 'Back to Main Menu'],
      intent: 'emergency_info'
    };
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('guide')) {
    return {
      text: "I'll walk you through using UrbanEye! 🎯\n\n1. **Dashboard**: Your main hub for all activities\n2. **Report Issues**: Submit new complaints with photos/location\n3. **Track Progress**: Monitor your reports in real-time\n4. **Public Feed**: See community issues and updates\n5. **Profile**: Manage your account settings\n\nWhat would you like to learn more about?",
      quickReplies: ['Reporting Process', 'Status Tracking', 'Account Settings', 'Community Features'],
      intent: 'platform_help'
    };
  }
  
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return {
      text: "You're welcome! 😊 I'm always here to help. Is there anything else you'd like to know about UrbanEye or city services?",
      quickReplies: ['Report an Issue', 'City Services', 'Platform Help', 'Contact Support'],
      intent: 'gratitude'
    };
  }

  // Default response for unrecognized input
  return {
    text: "I'm not sure I understand that completely. Let me help you with some common topics:",
    quickReplies: ['Report an Issue', 'Check My Reports', 'City Services Info', 'Platform Help', 'Contact Support'],
    intent: 'fallback'
  };
}

module.exports = router;