// Local AI Service - No external API required
// Uses advanced pattern matching, context awareness, and template-based responses

class LocalAIService {
  constructor() {
    this.conversationMemory = new Map();
    this.entityExtractor = new EntityExtractor();
    this.responseTemplates = new ResponseTemplates();
  }

  // Generate intelligent response using local processing
  async generateResponse(userId, userMessage, context = {}) {
    try {
      // Extract entities and intent from user message
      const analysis = this.analyzeMessage(userMessage, context);
      
      // Get conversation memory for context
      const memory = this.getConversationMemory(userId);
      
      // Generate contextual response
      const response = this.generateContextualResponse(analysis, memory, context);
      
      // Update conversation memory with response index
      this.updateConversationMemory(userId, userMessage, analysis, response.responseIndex);
      
      return response;
    } catch (error) {
      console.error('Local AI Service Error:', error);
      return this.getDefaultResponse();
    }
  }

  // Analyze user message for intent, entities, and sentiment
  analyzeMessage(message, context) {
    const lowerMessage = message.toLowerCase();
    
    return {
      intent: this.detectIntent(lowerMessage),
      entities: this.entityExtractor.extract(lowerMessage),
      sentiment: this.analyzeSentiment(lowerMessage),
      urgency: this.detectUrgency(lowerMessage),
      keywords: this.extractKeywords(lowerMessage),
      messageLength: message.length,
      hasQuestion: message.includes('?'),
      context: context
    };
  }

  // Advanced intent detection with confidence scoring
  detectIntent(message) {
    const intents = {
      report_issue: {
        keywords: ['report', 'submit', 'complaint', 'issue', 'problem', 'broken', 'damaged', 'pothole', 'streetlight', 'water', 'sewer', 'road', 'sidewalk', 'park', 'noise', 'pollution'],
        phrases: ['i want to report', 'need to submit', 'there is a problem', 'something is broken', 'i found an issue', 'file a complaint'],
        weight: 1.0
      },
      check_status: {
        keywords: ['status', 'check', 'track', 'progress', 'update', 'follow up', 'complaint number', 'ticket', 'reference'],
        phrases: ['check my', 'what is the status', 'track my', 'follow up on', 'any update', 'my reports'],
        weight: 1.0
      },
      department_info: {
        keywords: ['department', 'contact', 'phone', 'email', 'office', 'hours', 'public works', 'parks', 'transportation', 'environmental'],
        phrases: ['contact information', 'department hours', 'who handles', 'which department', 'city services'],
        weight: 0.9
      },
      platform_help: {
        keywords: ['help', 'how', 'guide', 'tutorial', 'navigate', 'use', 'feature', 'account', 'profile', 'settings'],
        phrases: ['how do i', 'how to', 'can you help', 'i need help', 'show me how', 'platform help'],
        weight: 0.8
      },
      emergency_info: {
        keywords: ['emergency', 'urgent', '911', 'police', 'fire', 'ambulance', 'danger', 'safety'],
        phrases: ['this is urgent', 'emergency contact', 'need help now', 'safety issue', 'call 911'],
        weight: 1.2
      },
      greeting: {
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'start', 'begin'],
        phrases: ['hello there', 'good morning', 'hi there', 'hey there'],
        weight: 0.6
      },
      gratitude: {
        keywords: ['thank', 'thanks', 'appreciate', 'grateful', 'helpful'],
        phrases: ['thank you', 'thanks for', 'i appreciate', 'much appreciated'],
        weight: 0.5
      },
      farewell: {
        keywords: ['bye', 'goodbye', 'see you', 'talk later', 'exit', 'quit'],
        phrases: ['goodbye', 'see you later', 'talk to you later', 'have a good day'],
        weight: 0.5
      }
    };

    let bestIntent = 'general_inquiry';
    let bestScore = 0;
    let totalMatches = 0;

    for (const [intent, config] of Object.entries(intents)) {
      let score = 0;
      let matches = 0;
      
      // Check keywords with word boundaries to avoid partial matches
      config.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(message)) {
          score += config.weight;
          matches++;
        }
      });
      
      // Check phrases (higher weight)
      config.phrases.forEach(phrase => {
        if (message.toLowerCase().includes(phrase.toLowerCase())) {
          score += config.weight * 1.5;
          matches++;
        }
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
        totalMatches = matches;
      }
    }

    // Calculate confidence based on score and number of matches
    let confidence = Math.min(bestScore / 2, 1.0);
    
    // Boost confidence if multiple keywords match
    if (totalMatches > 1) {
      confidence = Math.min(confidence * 1.2, 1.0);
    }
    
    // Lower confidence for very short messages
    if (message.trim().split(' ').length < 2) {
      confidence *= 0.7;
    }

    return { intent: bestIntent, confidence: confidence };
  }

  // Extract entities from message
  extractKeywords(message) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
    
    return message
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5); // Top 5 keywords
  }

  // Analyze sentiment (positive, negative, neutral)
  analyzeSentiment(message) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love', 'like', 'happy', 'satisfied', 'pleased'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'angry', 'frustrated', 'disappointed', 'broken', 'problem', 'issue', 'wrong', 'failed'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (message.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (message.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Detect urgency level
  detectUrgency(message) {
    const urgentWords = ['urgent', 'emergency', 'asap', 'immediately', 'now', 'quickly', 'fast', 'critical', 'serious'];
    const urgentPhrases = ['right away', 'as soon as possible', 'need help now'];
    
    let urgencyScore = 0;
    
    urgentWords.forEach(word => {
      if (message.includes(word)) urgencyScore += 1;
    });
    
    urgentPhrases.forEach(phrase => {
      if (message.includes(phrase)) urgencyScore += 2;
    });
    
    if (urgencyScore >= 3) return 'high';
    if (urgencyScore >= 1) return 'medium';
    return 'low';
  }

  // Generate contextual response based on analysis
  generateContextualResponse(analysis, memory, context) {
    const { intent, sentiment, urgency } = analysis;
    const userName = context.userInfo?.name?.split(' ')[0] || 'there';
    
    // Validate intent confidence - if too low, use general inquiry
    if (intent.confidence < 0.3) {
      intent.intent = 'general_inquiry';
    }

    // SUGGEST REPORT FORM EARLIER: If user asks about reporting even once, be more direct
    if (memory.lastIntent === intent.intent && memory.messageCount > 1) {
      // Count how many times they've asked for the same thing
      const sameIntentCount = memory.recentResponses.filter(r => r === intent.intent).length;
      
      if (sameIntentCount >= 1 && intent.intent === 'report_issue') {
        // User has seen reporting info, now be more direct about taking action
        return {
          text: `You seem ready to report an issue, ${userName}! Let me help you get started quickly. 🚀\n\n**Ready to take action?**\n\n🎯 **Start reporting now** - Go directly to the form (takes 2-3 minutes)\n📊 **Check your reports** - See what you've already submitted\n💬 **Need help first?** - Get more information or talk to support\n🏛️ **Other services** - Explore city departments and services\n\nWhat would work best for you?`,
          quickReplies: ['Go to Report Form', 'Check My Reports', 'Need More Info', 'Other Services'],
          intent: 'direct_action',
          confidence: 0.9
        };
      }
    }
    
    // Get base response template with memory context to avoid repetition
    const responseContext = {
      ...context,
      lastResponseIndex: memory.lastResponseIndex
    };
    let response = this.responseTemplates.getResponse(intent.intent, responseContext);
    
    // Personalize with user name (ensure proper case)
    const properUserName = userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();
    response.text = response.text.replace(/\{userName\}/g, properUserName);
    
    // Add context modifications (only one at a time to avoid stacking)
    let contextAdded = false;
    
    // Priority 1: Handle urgency (highest priority)
    if (urgency === 'high' && intent.intent !== 'emergency_info') {
      response.text = `I understand this is urgent! ${response.text}`;
      response.quickReplies.unshift('Emergency Contacts');
      contextAdded = true;
    }
    // Priority 2: Handle topic transitions (simplified - no prefixes)
    else if (!contextAdded && memory.lastIntent && memory.lastIntent !== intent.intent && memory.messageCount > 1) {
      // Just use the clean response without any prefix
      contextAdded = false;
    }
    // Priority 2.5: Handle repeated same intent (prevent repetition)
    else if (!contextAdded && memory.lastIntent === intent.intent && memory.messageCount > 1) {
      // For repeated intents, just use the alternate response template without awkward prefixes
      // The response cycling will handle showing different content
      contextAdded = false; // Don't add any prefix, let the template variation handle it
    }
    // Priority 3: Skip negative sentiment handling to avoid awkward prefixes
    // Removed: "I'm sorry you're experiencing this issue" prefix
    // Priority 4: Handle positive sentiment (lowest priority)
    else if (!contextAdded && sentiment === 'positive') {
      response.text = response.text.replace(/^Welcome/g, 'Great to hear from you! Welcome');
      response.text = response.text.replace(/^I'm here to help/g, 'Great to hear from you! I\'m here to help');
      response.text = response.text.replace(/^I'll help/g, 'Great to hear from you! I\'ll help');
    }
    
    // Ensure response quality - add fallback if response seems incomplete
    if (!response.text || response.text.length < 20) {
      return this.getDefaultResponse();
    }
    
    return response;
  }

  // Conversation memory management
  getConversationMemory(userId) {
    return this.conversationMemory.get(userId) || {
      lastIntent: null,
      lastMessage: null,
      messageCount: 0,
      topics: [],
      lastResponseIndex: null,
      recentResponses: []
    };
  }

  updateConversationMemory(userId, userMessage, analysis, responseIndex = null) {
    const memory = this.getConversationMemory(userId);
    
    memory.lastIntent = analysis.intent.intent;
    memory.lastMessage = userMessage;
    memory.messageCount += 1;
    
    // Track last response index to avoid repetition
    if (responseIndex !== null) {
      memory.lastResponseIndex = responseIndex;
    }
    
    // Track recent responses to detect loops (keep last 5)
    if (!memory.recentResponses) {
      memory.recentResponses = [];
    }
    memory.recentResponses.push(analysis.intent.intent);
    if (memory.recentResponses.length > 5) {
      memory.recentResponses.shift(); // Remove oldest
    }
    
    // Track topics
    if (!memory.topics.includes(analysis.intent.intent)) {
      memory.topics.push(analysis.intent.intent);
    }
    
    this.conversationMemory.set(userId, memory);
  }

  // Default fallback response
  getDefaultResponse() {
    return {
      text: "I'm here to help you with UrbanEye! I can assist with reporting issues, checking complaint status, finding department information, and navigating the platform. What would you like to know?",
      quickReplies: ['Report an Issue', 'Check My Reports', 'City Services Info', 'Platform Help'],
      intent: 'general_inquiry',
      confidence: 0.5
    };
  }
}

// Entity extraction helper
class EntityExtractor {
  extract(message) {
    const entities = {
      locations: this.extractLocations(message),
      departments: this.extractDepartments(message),
      issueTypes: this.extractIssueTypes(message),
      timeReferences: this.extractTimeReferences(message)
    };
    
    return entities;
  }

  extractLocations(message) {
    const locationPatterns = [
      /(\d+\s+\w+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr))/gi,
      /(main\s+street|downtown|city\s+center|park|school|library|hospital)/gi
    ];
    
    const locations = [];
    locationPatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) locations.push(...matches);
    });
    
    return locations;
  }

  extractDepartments(message) {
    const departments = [];
    const deptPatterns = {
      'public_works': /public\s*works|roads|streets|water|sewer|utilities/gi,
      'parks': /parks?|recreation|playground|sports/gi,
      'transportation': /transportation|transit|bus|parking|traffic/gi,
      'environmental': /environmental|recycling|waste|pollution/gi
    };
    
    for (const [dept, pattern] of Object.entries(deptPatterns)) {
      if (pattern.test(message)) {
        departments.push(dept);
      }
    }
    
    return departments;
  }

  extractIssueTypes(message) {
    const issueTypes = [];
    const issuePatterns = {
      'pothole': /pothole|hole\s+in\s+road/gi,
      'streetlight': /street\s*light|lamp|lighting/gi,
      'water_leak': /water\s+leak|pipe\s+burst|flooding/gi,
      'noise': /noise|loud|sound/gi,
      'trash': /trash|garbage|litter|waste/gi,
      'graffiti': /graffiti|vandalism|spray\s+paint/gi
    };
    
    for (const [type, pattern] of Object.entries(issuePatterns)) {
      if (pattern.test(message)) {
        issueTypes.push(type);
      }
    }
    
    return issueTypes;
  }

  extractTimeReferences(message) {
    const timePatterns = [
      /today|yesterday|tomorrow/gi,
      /this\s+(morning|afternoon|evening|week|month)/gi,
      /last\s+(week|month|year)/gi,
      /\d+\s+(days?|weeks?|months?)\s+ago/gi
    ];
    
    const timeRefs = [];
    timePatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) timeRefs.push(...matches);
    });
    
    return timeRefs;
  }
}

// Response templates with variations
class ResponseTemplates {
  constructor() {
    this.templates = {
      report_issue: [
        {
          text: "Let's get your issue reported, {userName}! 🚀\n\n**Quick & Easy Process:**\n✅ **2-3 minute form** - Simple questions about your issue\n✅ **Add photos** - Help our teams see the problem\n✅ **Get tracking number** - Follow progress in real-time\n✅ **Receive updates** - Email notifications at each step\n\n**We handle:** Potholes, streetlights, water leaks, park maintenance, noise complaints, safety concerns, and more.\n\n**Ready to start?** The form is quick and you'll have your tracking number right away!",
          quickReplies: ['Yes, Go to Form', 'Tell Me More First', 'What Can I Report?', 'How Long Takes?']
        },
        {
          text: "Perfect timing to report your issue, {userName}! 🎯\n\n**Why UrbanEye Works:**\n🔹 **Direct to departments** - No phone tag or transfers\n🔹 **Photo evidence** - Teams see exactly what needs fixing\n🔹 **Real-time tracking** - Like following a package delivery\n🔹 **Fast response** - Most issues resolved within 3-7 days\n\n**The process is simple:** Describe → Photo → Submit → Track\n\n**Shall I take you to the report form now?**",
          quickReplies: ['Yes, Take Me There', 'Learn More First', 'See Examples', 'Other Options']
        }
      ],
      check_status: [
        {
          text: "I can help you track your complaint status, {userName}. You can check the progress of all your submitted reports and see real-time updates.\n\nWould you like to see all your reports or check a specific one?",
          quickReplies: ['View All Reports', 'Check Specific Report', 'Explain Status Types', 'Notification Settings']
        }
      ],
      department_info: [
        {
          text: "I'd be happy to help you find the right department, {userName}. Here's who handles what:\n\n🔧 **Public Works**: Roads, utilities, traffic\n🌳 **Parks & Recreation**: Parks, events, facilities\n🚌 **Transportation**: Transit, parking, bike lanes\n🌍 **Environmental**: Recycling, sustainability\n\nWhich department would you like to know more about?",
          quickReplies: ['Public Works', 'Parks & Recreation', 'Transportation', 'Environmental']
        }
      ],
      platform_help: [
        {
          text: "Welcome to UrbanEye, {userName}! I'll help you navigate the platform:\n\n📊 **Dashboard**: Your activity hub\n� **Report Issues**: Submit complaints easily\n📈 **Track Progress**: Monitor your reports\n🌐 **Public Feed**: Community updates\n\nWhat would you like to learn about?",
          quickReplies: ['Reporting Process', 'Status Tracking', 'Account Settings', 'Community Features']
        }
      ],
      emergency_info: [
        {
          text: "Important emergency contacts:\n\n🚨 **True Emergencies**: 911\n👮 **Non-Emergency Police**: (555) 123-0911\n🚒 **Fire Department**: (555) 123-3473\n🏛️ **City Hall**: (555) 123-1234\n\n⚠️ For non-emergency city issues, use UrbanEye to report them!",
          quickReplies: ['Report Non-Emergency', 'City Services', 'Contact Support']
        }
      ],
      greeting: [
        {
          text: "Welcome to UrbanEye, {userName}! 👋 I'm here to help you with city services, reporting issues, and navigating the platform.\n\nWhat can I help you with today?",
          quickReplies: ['Report an Issue', 'Check My Reports', 'City Services Info', 'Platform Help']
        }
      ],
      gratitude: [
        {
          text: "You're very welcome, {userName}! 😊 I'm always here to help make your civic engagement experience smooth and effective.\n\nIs there anything else you'd like to know?",
          quickReplies: ['Report an Issue', 'City Services', 'Platform Help', 'Contact Support']
        }
      ],
      farewell: [
        {
          text: "Goodbye, {userName}! 👋 Thanks for using UrbanEye. Feel free to reach out anytime you need help with city services or reporting issues.\n\nHave a great day!",
          quickReplies: ['Report an Issue', 'City Services', 'Contact Support']
        }
      ],
      general_inquiry: [
        {
          text: "I'm here to help you with UrbanEye and city services, {userName}. I can assist with:\n\n• Reporting community issues\n• Checking complaint status\n• Finding department information\n• Navigating the platform\n\nWhat would you like to know?",
          quickReplies: ['Report an Issue', 'Check My Reports', 'City Services Info', 'Platform Help']
        }
      ]
    };
  }

  getResponse(intent, context = {}) {
    const templates = this.templates[intent] || this.templates.general_inquiry;
    
    // Use context to avoid repetitive responses
    let selectedIndex = 0;
    if (context.lastResponseIndex !== undefined && templates.length > 1) {
      // Select a different response than the last one
      selectedIndex = (context.lastResponseIndex + 1) % templates.length;
    } else {
      selectedIndex = Math.floor(Math.random() * templates.length);
    }
    
    const selectedTemplate = templates[selectedIndex];
    
    return {
      text: selectedTemplate.text,
      quickReplies: selectedTemplate.quickReplies,
      intent: intent,
      confidence: 0.9,
      responseIndex: selectedIndex
    };
  }
}

module.exports = new LocalAIService();
