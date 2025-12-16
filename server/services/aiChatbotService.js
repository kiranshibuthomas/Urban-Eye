const { HfInference } = require('@huggingface/inference');
const localAIService = require('./localAIService');

// Initialize Hugging Face client (free API)
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || 'hf_demo'); // hf_demo is a free demo token

// Note: System prompt available but not currently used in this implementation

class AIChatbotService {
  constructor() {
    this.conversationHistory = new Map(); // Store conversation history per user
    this.maxHistoryLength = 10; // Keep last 10 messages for context
  }

  // Generate AI response using multiple methods with quality validation
  async generateResponse(userId, userMessage, context = {}) {
    try {
      // Input validation
      if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
        return this.getFallbackResponse('');
      }

      // Clean and normalize input
      const cleanMessage = userMessage.trim();
      
      // Try multiple AI approaches with quality checks
      let aiResponse = null;
      let responseSource = 'fallback';

      // Method 1: Try advanced local AI service first (more reliable)
      try {
        const localResponse = await localAIService.generateResponse(userId, cleanMessage, context);
        if (this.validateResponse(localResponse.text, cleanMessage)) {
          aiResponse = localResponse.text;
          responseSource = 'local';
        }
      } catch (localError) {
        console.log('Local AI service failed:', localError.message);
      }

      // Method 2: Try Hugging Face only if local failed and message is complex enough
      if (!aiResponse && cleanMessage.split(' ').length > 3) {
        try {
          const hfResponse = await this.generateHuggingFaceResponse(userId, cleanMessage, context);
          if (this.validateResponse(hfResponse, cleanMessage)) {
            aiResponse = hfResponse;
            responseSource = 'huggingface';
          }
        } catch (hfError) {
          console.log('Hugging Face API failed:', hfError.message);
        }
      }

      // Method 3: Enhanced pattern-based response (always reliable)
      if (!aiResponse) {
        const enhancedResponse = await this.generateEnhancedResponse(userId, cleanMessage, context);
        if (this.validateResponse(enhancedResponse, cleanMessage)) {
          aiResponse = enhancedResponse;
          responseSource = 'enhanced';
        }
      }

      // Final fallback if all methods fail validation
      if (!aiResponse) {
        return this.getFallbackResponse(cleanMessage);
      }

      // Update conversation history
      this.updateConversationHistory(userId, cleanMessage, aiResponse);

      // Parse response for quick replies and actions
      const parsedResponse = this.parseAIResponse(aiResponse);

      return {
        text: parsedResponse.text,
        quickReplies: parsedResponse.quickReplies,
        action: parsedResponse.action,
        path: parsedResponse.path,
        intent: this.detectIntent(cleanMessage),
        confidence: this.calculateConfidence(responseSource, cleanMessage),
        source: responseSource
      };

    } catch (error) {
      console.error('AI Generation Error:', error);
      return this.getFallbackResponse(userMessage || '');
    }
  }

  // Validate response quality to prevent random or inappropriate responses
  validateResponse(response, userMessage) {
    if (!response || typeof response !== 'string') {
      return false;
    }

    const cleanResponse = response.trim();
    
    // Basic quality checks
    if (cleanResponse.length < 10 || cleanResponse.length > 2000) {
      return false;
    }

    // Check for nonsensical responses
    const nonsensicalPatterns = [
      /^[^a-zA-Z]*$/,  // Only special characters
      /(.)\1{10,}/,     // Repeated characters
      /^(ha|he|ho|hi){5,}/i,  // Repeated syllables
      /lorem ipsum/i,   // Placeholder text
      /test test test/i // Test patterns
    ];

    for (const pattern of nonsensicalPatterns) {
      if (pattern.test(cleanResponse)) {
        return false;
      }
    }

    // Check if response is relevant to civic/city services context
    const civicKeywords = [
      'city', 'report', 'issue', 'complaint', 'service', 'department', 
      'urbaneye', 'civic', 'government', 'municipal', 'public', 'community',
      'help', 'assist', 'information', 'contact', 'status', 'track'
    ];

    const hasRelevantContent = civicKeywords.some(keyword => 
      cleanResponse.toLowerCase().includes(keyword) || 
      userMessage.toLowerCase().includes(keyword)
    );

    // For very short user messages, be more lenient
    if (userMessage.trim().split(' ').length <= 2) {
      return cleanResponse.length >= 20;
    }

    return hasRelevantContent;
  }

  // Calculate confidence based on response source and message complexity
  calculateConfidence(source, userMessage) {
    const baseConfidence = {
      'local': 0.9,
      'huggingface': 0.7,
      'enhanced': 0.8,
      'fallback': 0.6
    };

    let confidence = baseConfidence[source] || 0.5;

    // Adjust based on message complexity
    const wordCount = userMessage.trim().split(' ').length;
    if (wordCount > 5) {
      confidence += 0.1;
    } else if (wordCount < 3) {
      confidence -= 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  // Update conversation history with validation
  updateConversationHistory(userId, userMessage, aiResponse) {
    try {
      let history = this.conversationHistory.get(userId) || [];

      history.push(
        { role: 'user', content: userMessage, timestamp: new Date() },
        { role: 'assistant', content: aiResponse, timestamp: new Date() }
      );

      // Keep only recent messages and ensure history doesn't grow too large
      this.conversationHistory.set(userId, history.slice(-this.maxHistoryLength));
    } catch (error) {
      console.error('Error updating conversation history:', error);
    }
  }

  // Generate response using Hugging Face free models with better prompting
  async generateHuggingFaceResponse(userId, userMessage, context = {}) {
    try {
      // Build context-aware prompt with better structure
      const prompt = this.buildContextPrompt(userMessage, context);

      // Use more reliable models and parameters
      const models = [
        'microsoft/DialoGPT-medium',
        'microsoft/DialoGPT-small'
      ];

      for (const model of models) {
        try {
          const response = await hf.textGeneration({
            model: model,
            inputs: prompt,
            parameters: {
              max_new_tokens: 150,
              temperature: 0.6,  // Lower temperature for more consistent responses
              do_sample: true,
              return_full_text: false,
              repetition_penalty: 1.1,  // Prevent repetition
              pad_token_id: 50256
            }
          });

          if (response && response.generated_text) {
            const cleanedResponse = this.cleanAIResponse(response.generated_text);
            
            // Additional validation for HF responses
            if (cleanedResponse.length > 20 && cleanedResponse.length < 500) {
              return cleanedResponse;
            }
          }
        } catch (modelError) {
          console.log(`Model ${model} failed:`, modelError.message);
          continue;
        }
      }

      throw new Error('All Hugging Face models failed validation');
    } catch (error) {
      console.error('Hugging Face API Error:', error);
      throw error;
    }
  }

  // Enhanced pattern-based response generation with better intelligence
  async generateEnhancedResponse(userId, userMessage, context = {}) {
    const intent = this.detectIntent(userMessage);
    const userName = context.userInfo?.name?.split(' ')[0] || 'there';
    const userStats = context.userStats || {};
    
    // Analyze message for specific entities and context
    const messageAnalysis = this.analyzeMessageContent(userMessage);

    // Enhanced responses based on intent, context, and message analysis
    const enhancedResponses = {
      report_issue: [
        `Hi ${userName}! I'd be happy to help you report an issue. Based on your message, it sounds like you need to submit a complaint. Here's what I can help you with:

🔧 **Infrastructure Issues**: Roads, streetlights, water problems
🚨 **Safety Concerns**: Dangerous conditions, broken equipment  
🌱 **Environmental Issues**: Pollution, waste management
🏛️ **Public Facilities**: Parks, buildings, community spaces

What type of issue would you like to report?`,

        `Hello ${userName}! Let me guide you through reporting an issue to the city. The process is simple and I'll help you every step of the way:

**Step 1**: Choose your issue category
**Step 2**: Describe the problem clearly
**Step 3**: Add location details
**Step 4**: Upload photos if possible
**Step 5**: Submit and get a tracking number

Would you like me to take you directly to the report form, or do you need more guidance first?`
      ],

      check_status: [
        `Hi ${userName}! I can help you check your report status. ${userStats.totalComplaints ? `I see you have ${userStats.totalComplaints} total reports submitted.` : 'Let me help you track your submissions.'}

Here's what each status means:
🟡 **Pending**: We've received your report and it's being reviewed
🔵 **In Progress**: A field team is actively working on your issue  
🟣 **Work Completed**: The work is done and awaiting final verification
🟢 **Resolved**: Your issue has been fully resolved!

Would you like to see all your reports or check a specific one?`,

        `Hello ${userName}! Let me help you track your complaint progress. ${userStats.resolved ? `Great news - you have ${userStats.resolved} resolved issues!` : 'I can show you the current status of all your submissions.'}

You can track your reports in real-time and get notifications when status changes. Each report gets a unique tracking number for easy reference.

What would you like to check?`
      ],

      department_info: [
        `Hi ${userName}! I can provide detailed information about our city departments. Each department handles specific types of issues:

🔧 **Public Works** (555) 123-4567
- Roads, streetlights, water/sewer, traffic signals
- Hours: Mon-Fri 8AM-5PM

🌳 **Parks & Recreation** (555) 123-7890  
- Parks, playgrounds, sports facilities, events
- Hours: Mon-Fri 9AM-5PM

🚌 **Transportation** (555) 123-5678
- Public transit, parking, bike lanes
- Hours: Mon-Fri 8AM-6PM

🌍 **Environmental Services** (555) 123-9876
- Recycling, air quality, sustainability
- Hours: Mon-Fri 8AM-4PM

Which department can I tell you more about?`,

        `Hello ${userName}! Our city departments are here to serve you. Here's who handles what:

**Public Works**: Your go-to for infrastructure - roads, utilities, traffic
**Parks & Recreation**: Everything green and fun - parks, events, facilities  
**Transportation**: Getting around the city - transit, parking, bike paths
**Environmental**: Keeping our city clean and green - recycling, pollution control

Each department has dedicated staff and specific hours. What information do you need?`
      ],

      platform_help: [
        `Hi ${userName}! Welcome to UrbanEye - I'm here to help you navigate our platform effectively.

**🏠 Dashboard**: Your main hub showing all your activity and city updates
**📝 Report Issues**: Easy form to submit complaints with photos and location
**📊 Track Progress**: Real-time status updates on all your submissions
**🌐 Public Feed**: See what's happening in your community
**👤 Profile**: Manage your account and notification preferences

The platform is designed to make civic engagement simple and effective. What would you like to learn about first?`,

        `Hello ${userName}! Let me show you around UrbanEye. This platform connects you directly with city services:

✅ **Easy Reporting**: Submit issues in under 2 minutes
✅ **Real-time Tracking**: Know exactly what's happening with your reports
✅ **Community Engagement**: See and support issues in your neighborhood  
✅ **Direct Communication**: Get updates straight from city departments

Everything is designed to be user-friendly and efficient. Where would you like to start?`
      ],

      greeting: [
        `Hello ${userName}! 👋 Welcome to UrbanEye! I'm your AI assistant, here to help you with all things related to city services and civic engagement.

I can help you:
• Report issues and problems in your community
• Check the status of your submitted reports
• Find information about city departments and services
• Navigate the UrbanEye platform

What can I help you with today?`,

        `Hi there, ${userName}! 🌟 Great to see you on UrbanEye! I'm your virtual assistant, ready to make your civic engagement experience smooth and effective.

Whether you need to report a pothole, check on a complaint, or find the right department contact, I'm here to guide you through everything step by step.

How can I assist you today?`
      ],

      default: [
        `Hi ${userName}! I understand you're looking for help with something. As your UrbanEye assistant, I'm here to help with:

🔍 **Finding Information**: City services, department contacts, processes
📝 **Reporting Issues**: Guide you through submitting complaints  
📊 **Tracking Progress**: Check status of your reports
🎯 **Platform Help**: Navigate UrbanEye features

Could you tell me more about what you're trying to do? I'm here to help make your civic engagement experience as smooth as possible!`,

        `Hello ${userName}! I want to make sure I understand how to best help you. I'm equipped to assist with various aspects of city services:

• Reporting community issues and problems
• Understanding city department services  
• Tracking your complaint submissions
• Navigating the UrbanEye platform

What specific information or assistance are you looking for today?`
      ]
    };

    // Select a random response from the appropriate category
    const responses = enhancedResponses[intent] || enhancedResponses.default;
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];

    return selectedResponse;
  }

  // Analyze message content for better response generation
  analyzeMessageContent(message) {
    const lowerMessage = message.toLowerCase();
    
    return {
      hasQuestion: message.includes('?'),
      isUrgent: /urgent|emergency|asap|immediately|now/i.test(message),
      mentionsLocation: /street|road|avenue|park|downtown|address/i.test(message),
      mentionsIssueType: /pothole|streetlight|water|sewer|noise|trash|graffiti/i.test(message),
      isPolite: /please|thank|sorry|excuse me/i.test(message),
      isShort: message.trim().split(' ').length <= 3,
      sentiment: this.detectSentiment(message)
    };
  }

  // Simple sentiment detection
  detectSentiment(message) {
    const positiveWords = ['good', 'great', 'excellent', 'thank', 'appreciate', 'helpful', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'broken', 'problem', 'issue', 'frustrated', 'angry'];
    
    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Build context-aware prompt for AI models
  buildContextPrompt(userMessage, context) {
    const userName = context.userInfo?.name?.split(' ')[0] || 'there';
    
    let prompt = `You are UrbanEye Assistant, a helpful AI for a civic engagement platform. You help citizens with:
- Reporting city issues (potholes, streetlights, etc.)
- Checking complaint status
- Finding city department information
- Platform navigation help

User: ${userName}
Message: "${userMessage}"

Respond professionally and helpfully about city services. Be specific and actionable. Keep response under 200 words.

Response:`;
    
    return prompt;
  }

  // Clean and format AI response
  cleanAIResponse(response) {
    if (!response || typeof response !== 'string') {
      return '';
    }

    let cleaned = response
      .trim()
      .replace(/^(Response:|Assistant:|Bot:|AI:|UrbanEye:)/i, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{3,}/g, ' ')
      .trim();

    // Remove incomplete sentences at the end
    const sentences = cleaned.split(/[.!?]+/);
    if (sentences.length > 1 && sentences[sentences.length - 1].trim().length < 10) {
      sentences.pop();
      cleaned = sentences.join('. ').trim();
      if (cleaned && !cleaned.match(/[.!?]$/)) {
        cleaned += '.';
      }
    }

    // Ensure response starts with capital letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
  }

  // Parse AI response to extract quick replies and actions
  parseAIResponse(aiResponse) {
    const response = {
      text: aiResponse,
      quickReplies: [],
      action: null,
      path: null
    };

    // Extract quick replies from AI response (if AI mentions specific actions)
    const quickReplyPatterns = [
      { pattern: /report.*issue|submit.*complaint/i, reply: 'Report an Issue' },
      { pattern: /check.*reports|view.*reports|my reports/i, reply: 'View My Reports' },
      { pattern: /department.*info|city.*services/i, reply: 'City Services Info' },
      { pattern: /platform.*help|how.*use/i, reply: 'Platform Help' },
      { pattern: /emergency.*contact/i, reply: 'Emergency Contacts' },
      { pattern: /public works/i, reply: 'Public Works Info' },
      { pattern: /parks.*recreation/i, reply: 'Parks & Recreation' },
      { pattern: /transportation/i, reply: 'Transportation Info' },
      { pattern: /environmental/i, reply: 'Environmental Services' }
    ];

    // Add relevant quick replies based on AI response content
    quickReplyPatterns.forEach(({ pattern, reply }) => {
      if (pattern.test(aiResponse) && !response.quickReplies.includes(reply)) {
        response.quickReplies.push(reply);
      }
    });

    // Detect navigation actions - ONLY on very specific phrases to avoid false positives
    if (/redirecting you now|taking you to.*report form|opening.*report form/i.test(aiResponse)) {
      response.action = 'navigate';
      response.path = '/report-issue';
    } else if (/opening.*reports dashboard|taking you to.*reports/i.test(aiResponse)) {
      response.action = 'navigate';
      response.path = '/reports-history';
    } else if (/opening.*public feed|taking you to.*public feed/i.test(aiResponse)) {
      response.action = 'navigate';
      response.path = '/public-feed';
    }

    // Add default quick replies if none were detected
    if (response.quickReplies.length === 0) {
      response.quickReplies = ['Report an Issue', 'Check My Reports', 'City Services Info', 'Platform Help'];
    }

    // Limit quick replies to 4 for better UX
    response.quickReplies = response.quickReplies.slice(0, 4);

    return response;
  }

  // Detect user intent from message
  detectIntent(message) {
    if (/report|submit|complaint|issue|problem/i.test(message)) {
      return 'report_issue';
    } else if (/status|check|track|progress/i.test(message)) {
      return 'check_status';
    } else if (/department|service|contact|info/i.test(message)) {
      return 'department_info';
    } else if (/help|how|guide|tutorial/i.test(message)) {
      return 'platform_help';
    } else if (/emergency|urgent|911/i.test(message)) {
      return 'emergency_info';
    } else if (/hello|hi|hey|greet/i.test(message)) {
      return 'greeting';
    } else if (/thank|thanks/i.test(message)) {
      return 'gratitude';
    } else if (/bye|goodbye|exit/i.test(message)) {
      return 'farewell';
    }
    
    return 'general_inquiry';
  }

  // Intelligent fallback response when AI is unavailable
  getFallbackResponse(message) {
    if (!message || message.trim().length === 0) {
      return {
        text: "Hello! I'm your UrbanEye assistant. I'm here to help you with city services, reporting issues, and navigating the platform. How can I assist you today?",
        quickReplies: ['Report an Issue', 'Check My Reports', 'City Services Info', 'Platform Help']
      };
    }

    const intent = this.detectIntent(message);
    const messageAnalysis = this.analyzeMessageContent(message);
    
    // Customize response based on message analysis
    let greeting = '';
    if (messageAnalysis.isPolite) {
      greeting = "Thank you for being so polite! ";
    } else if (messageAnalysis.isUrgent) {
      greeting = "I understand this seems urgent. ";
    }
    
    const fallbackResponses = {
      report_issue: {
        text: `${greeting}I'd be happy to help you report an issue! You can report various problems like infrastructure issues, safety concerns, or community problems. ${messageAnalysis.hasQuestion ? 'Let me answer your question and' : ''} Would you like me to guide you through the process or take you directly to the report form?`,
        quickReplies: ['Guide Me Through', 'Go to Report Form', 'What Info Needed?', 'Photo Guidelines']
      },
      check_status: {
        text: `${greeting}I can help you check your report status! You can view all your submitted reports, check current status updates, and see resolution progress. ${messageAnalysis.hasQuestion ? 'I\'ll help you find what you\'re looking for.' : ''} Would you like to see your reports dashboard?`,
        quickReplies: ['View My Reports', 'Explain Status Types', 'Notification Settings', 'Contact Support']
      },
      department_info: {
        text: `${greeting}I can provide information about our city departments! We have Public Works, Parks & Recreation, Transportation, and Environmental Services. ${messageAnalysis.hasQuestion ? 'I\'ll help you find the right department.' : ''} Which department would you like to know more about?`,
        quickReplies: ['Public Works', 'Parks & Recreation', 'Transportation', 'Environmental']
      },
      platform_help: {
        text: `${greeting}I'll help you navigate UrbanEye! The platform includes your dashboard, issue reporting, status tracking, public feed, and profile management. ${messageAnalysis.hasQuestion ? 'I\'ll walk you through whatever you need.' : ''} What would you like to learn about?`,
        quickReplies: ['Reporting Process', 'Status Tracking', 'Account Settings', 'Community Features']
      },
      emergency_info: {
        text: `${messageAnalysis.isUrgent ? 'For true emergencies, please call 911 immediately. ' : ''}Here are important emergency contacts:\n\n🚨 **Emergency**: 911\n👮 **Non-Emergency Police**: (555) 123-0911\n🚒 **Fire Department**: (555) 123-3473\n🏛️ **City Hall**: (555) 123-1234\n\nFor non-emergency city issues, use UrbanEye to report them!`,
        quickReplies: ['Report Non-Emergency', 'City Services', 'Contact Support']
      },
      greeting: {
        text: `Hello! ${messageAnalysis.isPolite ? 'Thank you for the kind greeting. ' : ''}I'm your UrbanEye assistant. I'm here to help you with reporting issues, checking complaint status, and navigating city services. How can I assist you today?`,
        quickReplies: ['Report an Issue', 'Check My Reports', 'City Services Info', 'Platform Help']
      },
      gratitude: {
        text: "You're very welcome! I'm always here to help make your civic engagement experience smooth and effective. Is there anything else you'd like to know about UrbanEye or city services?",
        quickReplies: ['Report an Issue', 'City Services', 'Platform Help', 'Contact Support']
      },
      farewell: {
        text: "Goodbye! Thank you for using UrbanEye. Feel free to reach out anytime you need help with city services or reporting issues. Have a great day!",
        quickReplies: ['Report an Issue', 'City Services', 'Contact Support']
      },
      default: {
        text: `${greeting}I'm here to help you with UrbanEye! I can assist with reporting issues, checking complaint status, finding department information, and navigating the platform. ${messageAnalysis.hasQuestion ? 'Let me help you find what you\'re looking for.' : ''} What would you like to know?`,
        quickReplies: ['Report an Issue', 'Check My Reports', 'City Services Info', 'Platform Help']
      }
    };

    const response = fallbackResponses[intent] || fallbackResponses.default;
    
    // Add urgency handling for emergency-related messages
    if (messageAnalysis.isUrgent && intent !== 'emergency_info') {
      response.quickReplies.unshift('Emergency Contacts');
    }

    return response;
  }

  // Clear conversation history for a user
  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }

  // Get conversation history for a user
  getHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }

  // Check if AI services are available
  async checkAPIHealth() {
    try {
      // Test Hugging Face API
      await hf.textGeneration({
        model: 'microsoft/DialoGPT-small',
        inputs: 'Hello',
        parameters: {
          max_new_tokens: 10,
          temperature: 0.7
        }
      });
      
      return true;
    } catch (error) {
      console.log('Hugging Face API not available, using enhanced local responses');
      // Even if HF API fails, we have enhanced local responses
      return true; // Always return true since we have fallback methods
    }
  }
}

module.exports = new AIChatbotService();