import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMessageCircle, 
  FiX, 
  FiSend, 
  FiUser, 
  FiHelpCircle,
  FiMinimize2,
  FiMaximize2,
  FiFileText,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiPhone,
  FiMail
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CitizenChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
  const [isAIPowered, setIsAIPowered] = useState(false);
  const [aiHealthStatus, setAiHealthStatus] = useState(null);
  const [hasBeenRedirected, setHasBeenRedirected] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chatbot with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        text: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your UrbanEye assistant. I'm here to help you with:

• Submitting complaints and reports
• Checking complaint status
• Understanding city services
• Navigating the platform
• General civic information

How can I assist you today?`,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: [
          'Report an Issue',
          'Check My Reports',
          'City Services Info',
          'How to Use Platform'
        ]
      };
      setMessages([welcomeMessage]);
      setHasUnreadMessages(false);
    }
  }, [isOpen, user?.name]);

  // Clear unread messages when chatbot is opened
  useEffect(() => {
    if (isOpen) {
      setHasUnreadMessages(false);
      setHasBeenRedirected(false); // Reset redirect state when chat opens
    }
  }, [isOpen]);

  // Check AI health status when component mounts
  useEffect(() => {
    const checkAIHealth = async () => {
      try {
        const response = await fetch('/api/chatbot/health');
        if (response.ok) {
          const data = await response.json();
          setAiHealthStatus(data);
          setIsAIPowered(data.aiAvailable);
        }
      } catch (error) {
        console.error('Error checking AI health:', error);
        setIsAIPowered(false);
      }
    };

    checkAIHealth();
  }, []);

  // Predefined responses and conversation flow
  const botResponses = {
    'report an issue': {
      text: "I'll help you report an issue! 📝 Here's how our reporting system works:\n\n**🎯 What You Can Report:**\n• Infrastructure issues (potholes, streetlights, water leaks)\n• Safety concerns (broken sidewalks, dangerous conditions)\n• Environmental problems (pollution, illegal dumping)\n• Public facility issues (parks, buildings, equipment)\n• Community concerns (noise, traffic, maintenance)\n\n**📋 How It Works:**\n1. **Choose Category** - Select the type of issue\n2. **Describe Problem** - Tell us what's wrong\n3. **Add Location** - Pin it on the map or enter address\n4. **Upload Photos** - Pictures help us understand better\n5. **Set Priority** - How urgent is it?\n6. **Submit & Track** - Get a tracking number and updates\n\n**⚡ What Happens Next:**\n• You get instant confirmation\n• Issue gets assigned to the right department\n• Field staff investigates and works on it\n• You receive status updates throughout\n\nReady to report your issue?",
      quickReplies: ['Go to Report Form', 'What Info Should I Include?', 'How Long Does It Take?', 'See Example Report']
    },
    'check my reports': {
      text: "I can help you check your report status! 📊 You can:\n\n• View all your submitted reports\n• Check current status updates\n• See resolution progress\n• Get estimated completion times\n\nWould you like to see your reports dashboard or check a specific report?",
      quickReplies: ['View All Reports', 'Check Specific Report', 'Explain Status Types']
    },
    'city services info': {
      text: "Here's information about our city services! 🏛️\n\n• Public Works Department\n• Parks & Recreation\n• Transportation Services\n• Environmental Services\n• Public Safety\n• Community Development\n\nWhich department would you like to know more about?",
      quickReplies: ['Public Works', 'Parks & Recreation', 'Transportation', 'Environmental']
    },
    'how to use platform': {
      text: "I'll walk you through using UrbanEye! 🎯\n\n1. **Dashboard**: Your main hub for all activities\n2. **Report Issues**: Submit new complaints with photos/location\n3. **Track Progress**: Monitor your reports in real-time\n4. **Public Feed**: See community issues and updates\n5. **Profile**: Manage your account settings\n\nWhat would you like to learn more about?",
      quickReplies: ['Reporting Process', 'Status Tracking', 'Account Settings', 'Community Features']
    },
    'guide me through': {
      text: "Perfect! Let me walk you through the reporting process step by step: 📋\n\n**Step 1: Choose Issue Category** 🎯\n• Select from: Infrastructure, Safety, Environment, Parks, etc.\n• This helps route your report to the right department\n\n**Step 2: Describe the Problem** 📝\n• Be specific: size, location, impact\n• Include when you first noticed it\n• Mention any safety concerns\n\n**Step 3: Add Location** 📍\n• Use the interactive map to pin exact spot\n• Or enter the street address\n• Add landmarks to help staff find it\n\n**Step 4: Upload Photos** 📸\n• Take multiple angles\n• Show the problem clearly\n• Include context (surrounding area)\n\n**Step 5: Set Priority Level** ⚡\n• Emergency: Immediate danger\n• High: Safety concern or major impact\n• Medium: Needs attention soon\n• Low: Minor issue, not urgent\n\n**Step 6: Review & Submit** ✅\n• Double-check all information\n• Submit and get your tracking number\n• Start receiving status updates\n\nReady to start your report?",
      quickReplies: ['Go to Report Form', 'See Example Report', 'What Info Should I Include?']
    },
    'go to report form': {
      text: "Perfect! The report form is where you can submit your issue with all the details. Ready to get started?",
      quickReplies: ['Go to Report Form', 'What Info Do I Need?', 'Photo Guidelines']
    },
    'view all reports': {
      text: "Great! Your reports dashboard shows all your submissions and their current status. Ready to take a look?",
      quickReplies: ['View All Reports', 'Explain Status Types', 'Check Specific Report']
    },
    'what info do i need?': {
      text: "Great question! Here's what helps us resolve issues faster: ℹ️\n\n**Required:**\n• Clear description of the problem\n• Location (address or map pin)\n• Issue category\n\n**Helpful to include:**\n• Photos of the issue\n• When you first noticed it\n• Any safety concerns\n• Previous report numbers (if related)\n\n**Tips:**\n• Be specific in descriptions\n• Multiple angles in photos\n• Include landmarks for location",
      quickReplies: ['Go to Report Form', 'Photo Guidelines', 'Location Tips']
    },
    'what info should i include?': {
      text: "Excellent question! Here's what makes a great report: 📝\n\n**🔍 Essential Information:**\n• **Clear Description**: What exactly is the problem?\n• **Exact Location**: Street address or map pin\n• **Issue Category**: Roads, parks, safety, etc.\n\n**📸 Photos That Help:**\n• Close-up of the problem\n• Wide shot showing context\n• Multiple angles if possible\n• Include any safety hazards\n\n**⏰ Additional Details:**\n• When did you first notice it?\n• Is it getting worse?\n• Any immediate safety concerns?\n• Has it been reported before?\n\n**💡 Pro Tips:**\n• Be specific: \"Large pothole, 2 feet wide\" vs \"road damage\"\n• Include landmarks: \"Near the blue mailbox\"\n• Mention if it affects traffic, pedestrians, or safety\n\nReady to create your report?",
      quickReplies: ['Go to Report Form', 'Photo Guidelines', 'See Example Report']
    },
    'how long does it take?': {
      text: "Great question! Here are our response times: ⏰\n\n**📞 Initial Response:**\n• Confirmation within 2 hours\n• Assignment to department within 24 hours\n\n**🚨 By Priority Level:**\n• **Emergency/Safety**: Immediate response (or call 911)\n• **High Priority**: 24-48 hours\n• **Medium Priority**: 3-7 business days\n• **Low Priority**: 1-2 weeks\n\n**📊 What Affects Timeline:**\n• Issue complexity\n• Weather conditions\n• Available resources\n• Permit requirements\n\n**📱 Stay Updated:**\n• Email notifications for status changes\n• Check progress anytime in your dashboard\n• Get estimated completion dates\n\n**💡 Remember:**\n• Complex issues take longer but get proper attention\n• You'll be notified at every step\n• Emergency issues get immediate priority\n\nReady to submit your report?",
      quickReplies: ['Go to Report Form', 'Emergency Contacts', 'Check My Reports']
    },
    'see example report': {
      text: "Here's an example of a great report: 📋\n\n**🎯 Issue Type:** Infrastructure - Roads\n\n**📝 Description:**\n\"Large pothole on Oak Street, approximately 3 feet wide and 8 inches deep. Located in the right lane, 50 feet north of the intersection with Main Street, near the blue mailbox. The pothole is causing cars to swerve into the left lane, creating a safety hazard.\"\n\n**📍 Location:**\n\"123 Oak Street, near intersection with Main Street\"\n\n**📸 Photos:**\n• Close-up showing size and depth\n• Wide shot showing location on street\n• Photo of nearby landmark (blue mailbox)\n\n**⚡ Priority:** High (safety concern)\n\n**📅 Additional Info:**\n\"First noticed 3 days ago, seems to be getting larger after recent rain.\"\n\n**✅ Why This Works:**\n• Specific measurements\n• Clear location with landmarks\n• Safety impact explained\n• Multiple photo angles\n• Timeline provided\n\nReady to create your own detailed report?",
      quickReplies: ['Go to Report Form', 'What Info Should I Include?', 'Photo Guidelines']
    },
    'explain status types': {
      text: "Here are the different status types explained: 📋\n\n🟡 **Pending**: Report received, awaiting review\n🔵 **In Progress**: Assigned to field staff, work started\n🟣 **Work Completed**: Field work done, awaiting verification\n🟢 **Resolved**: Issue fully resolved and verified\n🔴 **Rejected**: Report doesn't meet criteria (with explanation)\n\nYou'll get notifications for each status change!",
      quickReplies: ['Check My Reports', 'Notification Settings', 'Appeal Process']
    },
    'how long for response?': {
      text: "Response times vary by issue type: ⏰\n\n🚨 **Emergency/Safety**: Immediate (call 911 for true emergencies)\n🔴 **High Priority**: 24-48 hours\n🟡 **Medium Priority**: 3-7 days\n🟢 **Low Priority**: 1-2 weeks\n\nYou'll receive confirmation within 2 hours of submission and regular updates throughout the process!",
      quickReplies: ['Start Reporting', 'Emergency Contacts', 'Update Frequency']
    },
    'public works': {
      text: "Public Works Department handles: 🔧\n\n• Road maintenance and repairs\n• Streetlight issues\n• Water and sewer problems\n• Sidewalk repairs\n• Traffic signs and signals\n• Snow removal\n• Waste management\n\n📞 Contact: (555) 123-4567\n📧 Email: publicworks@city.gov\n🕒 Hours: Mon-Fri 8AM-5PM",
      quickReplies: ['Report Road Issue', 'Report Streetlight', 'Water Problem', 'Contact Info']
    },
    'parks & recreation': {
      text: "Parks & Recreation Department manages: 🌳\n\n• Park maintenance and upkeep\n• Playground equipment\n• Sports facilities and courts\n• Community events and programs\n• Tree maintenance and planting\n• Public restrooms in parks\n• Recreation programs\n\n📞 Contact: (555) 123-7890\n📧 Email: parks@city.gov\n🕒 Hours: Mon-Fri 9AM-5PM",
      quickReplies: ['Report Park Issue', 'Event Information', 'Facility Booking', 'Tree Services']
    },
    'transportation': {
      text: "Transportation Department handles: 🚌\n\n• Public transit services\n• Traffic management\n• Parking enforcement\n• Bike lanes and paths\n• Pedestrian safety\n• Transportation planning\n• Bus stops and shelters\n\n📞 Contact: (555) 123-5678\n📧 Email: transportation@city.gov\n🕒 Hours: Mon-Fri 8AM-6PM",
      quickReplies: ['Transit Info', 'Parking Issues', 'Bike Lane Problems', 'Traffic Concerns']
    },
    'environmental': {
      text: "Environmental Services Department manages: 🌍\n\n• Recycling programs\n• Air quality monitoring\n• Environmental compliance\n• Sustainability initiatives\n• Hazardous waste disposal\n• Green building programs\n• Pollution control\n\n📞 Contact: (555) 123-9876\n📧 Email: environmental@city.gov\n🕒 Hours: Mon-Fri 8AM-4PM",
      quickReplies: ['Recycling Info', 'Report Pollution', 'Hazardous Waste', 'Green Programs']
    },
    'start reporting': {
      text: "Perfect! I'll help you get started with reporting. The report form allows you to:\n\n✅ Select the issue type\n✅ Add detailed description\n✅ Pin the exact location\n✅ Upload photos\n✅ Set priority level\n\nClick 'Go to Report Form' below when you're ready!",
      quickReplies: ['Go to Report Form', 'What Info Do I Need?', 'Photo Guidelines']
    },
    'reporting process': {
      text: "Here's the complete reporting process: 📋\n\n**Step 1**: Choose Issue Category\n- Infrastructure, Safety, Environment, etc.\n\n**Step 2**: Describe the Problem\n- Be specific and detailed\n- Include when you first noticed it\n\n**Step 3**: Add Location\n- Use the map to pin exact location\n- Add address or landmarks\n\n**Step 4**: Upload Photos\n- Multiple angles help\n- Show the full context\n\n**Step 5**: Set Priority\n- Emergency, High, Medium, Low\n\n**Step 6**: Submit & Track\n- Get confirmation number\n- Receive status updates",
      quickReplies: ['Start Reporting', 'Photo Tips', 'Priority Guidelines', 'Status Tracking']
    },
    'photo tips': {
      text: "Photo Guidelines for Better Reports: 📸\n\n**Best Practices:**\n• Take multiple angles of the issue\n• Include surrounding context\n• Ensure good lighting\n• Show scale (include objects for size reference)\n• Capture any safety hazards clearly\n\n**What to Include:**\n• Close-up of the problem\n• Wide shot showing location\n• Any relevant signage or landmarks\n• Before/after if applicable\n\n**File Requirements:**\n• Max 5MB per photo\n• JPG, PNG formats accepted\n• Up to 5 photos per report",
      quickReplies: ['Start Reporting', 'Location Tips', 'Reporting Process']
    },
    'learn more about process': {
      text: "Here's a detailed breakdown of our reporting process: 📚\n\n**🔄 Complete Workflow:**\n\n**1. Submission (You)**\n• Fill out the report form\n• Upload photos and location\n• Submit with one click\n\n**2. Processing (Our System)**\n• Auto-assigns to correct department\n• Creates tracking number\n• Sends confirmation email\n\n**3. Review (City Staff)**\n• Department reviews within 24 hours\n• Validates issue and priority\n• Assigns to field team\n\n**4. Action (Field Team)**\n• Investigates on-site\n• Performs necessary work\n• Updates status in real-time\n\n**5. Resolution (Completion)**\n• Work completed and verified\n• Photos of completed work\n• Case closed with final update\n\n**📱 You Stay Informed:**\n• Email notifications at each step\n• Dashboard shows real-time progress\n• Estimated completion dates\n• Direct communication channel\n\nReady to experience this smooth process?",
      quickReplies: ['Yes, Take Me There', 'What Info Do I Need?', 'Response Times', 'See Example']
    },
    'tell me more': {
      text: "Absolutely! Here's what makes UrbanEye special: ✨\n\n**🚀 Smart Features:**\n• **GPS Integration** - Automatically detects your location\n• **Photo Recognition** - AI helps categorize issues\n• **Real-time Tracking** - Like tracking a package delivery\n• **Department Routing** - Goes directly to the right team\n• **Community Feed** - See what's happening in your area\n\n**⏱️ Typical Response Times:**\n• **Emergency Issues**: Immediate response\n• **High Priority**: 24-48 hours\n• **Medium Priority**: 3-7 business days\n• **Low Priority**: 1-2 weeks\n\n**📊 Success Stats:**\n• 95% of reports resolved within promised timeframe\n• Average response time: 2.3 days\n• 4.8/5 citizen satisfaction rating\n• Over 10,000 issues resolved this year\n\n**🎯 Why Citizens Love It:**\n• No more phone tag with departments\n• Visual proof of work completion\n• Transparent process from start to finish\n• Mobile-friendly and easy to use\n\nShall we get your issue reported?",
      quickReplies: ['Yes, Take Me There', 'Photo Guidelines', 'Success Stories', 'Contact Support']
    },
    'response times': {
      text: "Here are our detailed response times: ⏰\n\n**🚨 Emergency/Safety Issues:**\n• **Response**: Immediate (or call 911)\n• **Action**: Within 2 hours\n• **Resolution**: Same day when possible\n\n**🔴 High Priority Issues:**\n• **Response**: Within 24 hours\n• **Action**: 24-48 hours\n• **Resolution**: 2-5 business days\n\n**🟡 Medium Priority Issues:**\n• **Response**: Within 48 hours\n• **Action**: 3-7 business days\n• **Resolution**: 1-2 weeks\n\n**🟢 Low Priority Issues:**\n• **Response**: Within 72 hours\n• **Action**: 1-2 weeks\n• **Resolution**: 2-4 weeks\n\n**📈 What Affects Timeline:**\n• Issue complexity and scope\n• Weather conditions\n• Available resources and materials\n• Permit requirements\n• Contractor availability\n\n**💡 Pro Tip:** Adding clear photos and detailed descriptions helps us respond faster!\n\nReady to submit your report?",
      quickReplies: ['Yes, Take Me There', 'Photo Guidelines', 'Priority Levels', 'Emergency Contacts']
    },
    'contact support': {
      text: "Need additional help? Here are your support options: 🆘\n\n**UrbanEye Support:**\n📞 Phone: (555) 123-HELP (4357)\n📧 Email: support@urbaneye.gov\n💬 Live Chat: Available 9AM-5PM\n\n**City Hall:**\n📞 Main: (555) 123-1234\n🏛️ Address: 123 City Hall Plaza\n🕒 Hours: Mon-Fri 8AM-5PM\n\n**Emergency Services:**\n🚨 Emergency: 911\n👮 Non-Emergency Police: (555) 123-0911\n🚒 Fire Department: (555) 123-3473",
      quickReplies: ['Report an Issue', 'City Services', 'Platform Help', 'Emergency Contacts']
    },
    'no, tell me more': {
      text: "No problem! Let me give you more details about UrbanEye first. 📚\n\n**Why Choose UrbanEye?**\n\n🚀 **Fast & Efficient**\n• Average response time: 2.3 days\n• 95% of issues resolved on time\n• Direct connection to city departments\n\n📱 **User-Friendly**\n• Mobile-optimized interface\n• GPS auto-location detection\n• Photo upload with one tap\n\n📊 **Transparent Process**\n• Real-time status updates\n• Email notifications at each step\n• See before/after photos of completed work\n\n🏆 **Proven Results**\n• Over 10,000 issues resolved this year\n• 4.8/5 citizen satisfaction rating\n• Trusted by thousands of residents\n\nWhat else would you like to know?",
      quickReplies: ['Now Take Me to Form', 'Check My Past Reports', 'City Services Info', 'Contact Support']
    },
    'no, learn more first': {
      text: "Smart choice! Here's what makes reporting through UrbanEye effective: 💡\n\n**🎯 What Happens When You Report:**\n\n**Immediate (0-2 hours):**\n• System assigns to correct department\n• You receive confirmation email\n• Tracking number generated\n\n**Within 24 hours:**\n• Department reviews your report\n• Priority level assigned\n• Field team gets notification\n\n**2-7 days (typical):**\n• On-site investigation\n• Work scheduled and completed\n• Photos of completed work uploaded\n\n**📈 Success Statistics:**\n• 98% of reports get initial response within 24 hours\n• Average resolution time: 4.2 days\n• Citizens rate the process 4.8/5 stars\n\nReady to experience this smooth process?",
      quickReplies: ['Yes, Let\'s Do It', 'Show Me Examples', 'Other Services', 'Contact Someone']
    },
    'now take me to form': {
      text: "Perfect! Taking you to the report form now. You'll be able to describe your issue, add photos, and submit it in just a few minutes. 🚀",
      quickReplies: ['Go to Report Form']
    },
    'yes, let\'s do it': {
      text: "Excellent! Let's get your issue reported. The form is quick and easy - you'll have your tracking number in no time! 🎯",
      quickReplies: ['Yes, Open Form']
    },
    'other services': {
      text: "Of course! Here are other ways I can help you with UrbanEye: 🏛️\n\n**📊 Check Report Status**\n• View all your submitted reports\n• Track progress in real-time\n• See estimated completion dates\n\n**🏢 City Services Information**\n• Department contact details\n• Service hours and locations\n• Frequently asked questions\n\n**🌐 Community Features**\n• Public feed of neighborhood issues\n• See what others are reporting\n• Community engagement tools\n\n**⚙️ Account Management**\n• Update your profile\n• Notification preferences\n• Report history and statistics\n\nWhat would you like to explore?",
      quickReplies: ['Check My Reports', 'City Services Info', 'Community Feed', 'Account Settings']
    },
    'need more info': {
      text: "Of course! Here's what you need to know before reporting: 📋\n\n**📝 What to Include:**\n• Clear description of the problem\n• Exact location (address or nearby landmarks)\n• When you first noticed it\n• Any safety concerns\n\n**📸 Photo Tips:**\n• Take multiple angles\n• Show the full context\n• Include any damage or hazards\n• Good lighting helps\n\n**⏱️ What Happens Next:**\n• Instant confirmation email\n• Assigned to right department within 24 hours\n• Field team investigates and fixes\n• You get updates throughout\n\n**Ready to report now?**",
      quickReplies: ['Yes, Go to Form', 'Show Examples', 'Response Times', 'Other Services']
    },
    'need guidance': {
      text: "Happy to guide you through it! 🎯\n\n**📋 Reporting Made Simple:**\n\n**Step 1:** Choose your issue type from the list\n**Step 2:** Describe what you see (be specific)\n**Step 3:** Add the location (we'll help you pin it)\n**Step 4:** Upload photos (optional but helpful)\n**Step 5:** Submit and get your tracking number\n\n**💡 Pro Tips:**\n• More details = faster resolution\n• Photos help teams understand the issue\n• Include any safety concerns\n• Mention if it's getting worse\n\n**The whole process takes about 2-3 minutes. Ready to start?**",
      quickReplies: ['Yes, Start Now', 'Show Me Examples', 'What Info Needed?', 'Contact Support']
    },
    'emergency contacts': {
      text: "Important emergency contacts: 🚨\n\n**True Emergencies**: 911\n**Non-Emergency Police**: (555) 123-0911\n**Fire Department**: (555) 123-3473\n**Public Works Emergency**: (555) 123-4567\n**City Hall**: (555) 123-1234\n**Animal Control**: (555) 123-7890\n\n⚠️ Use UrbanEye for non-emergency issues only!",
      quickReplies: ['Report Non-Emergency', 'City Services', 'Back to Main Menu']
    }
  };

  // Handle sending messages
  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    // Enhanced duplicate prevention - check last 3 messages for same text
    const recentUserMessages = messages
      .filter(msg => msg.sender === 'user')
      .slice(-3); // Last 3 user messages
    
    const duplicateCount = recentUserMessages.filter(msg => 
      msg.text === messageText.trim()
    ).length;

    // If user has sent the same message 1+ times recently, show redirect message (earlier intervention)
    if (duplicateCount >= 1 && messageText.trim() === 'Report an Issue' && !hasBeenRedirected) {
      const redirectMessage = {
        id: Date.now(),
        text: messageText,
        sender: 'user',
        timestamp: new Date()
      };
      
      const botRedirect = {
        id: Date.now() + 1,
        text: `Perfect! You're ready to report an issue, ${user?.name?.split(' ')[0] || 'there'}! 🚀\n\n**Let's get you started:**\n\n🎯 **Report your issue now** - Quick 2-3 minute form\n📊 **Check existing reports** - See your submission history\n💡 **Need guidance first?** - Get tips and examples\n🏛️ **Other city services** - Explore departments and info\n\nWhat's your next step?`,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: ['Go to Report Form', 'Check My Reports', 'Need Guidance', 'City Services']
      };

      setMessages(prev => [...prev, redirectMessage, botRedirect]);
      setInputMessage('');
      setHasBeenRedirected(true);
      return;
    }

    // If user keeps asking after being redirected, give a gentle nudge
    if (duplicateCount >= 1 && messageText.trim() === 'Report an Issue' && hasBeenRedirected) {
      const nudgeMessage = {
        id: Date.now(),
        text: messageText,
        sender: 'user',
        timestamp: new Date()
      };
      
      const botNudge = {
        id: Date.now() + 1,
        text: `I'm ready to help you report when you are! 😊 Just click one of the buttons above to get started, or try asking about something else I can help with.`,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: ['Go to Report Form', 'Check My Reports', 'City Services Info', 'Platform Help']
      };

      setMessages(prev => [...prev, nudgeMessage, botNudge]);
      setInputMessage('');
      return;
    }

    // Prevent duplicate messages (check if same message was sent in last 3 seconds)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && 
        lastMessage.sender === 'user' && 
        lastMessage.text === messageText.trim() &&
        (Date.now() - new Date(lastMessage.timestamp).getTime()) < 3000) {
      return; // Ignore duplicate message
    }

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Try to get response from backend API first
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/chatbot/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: messageText,
            context: { currentStep, messages: messages.slice(-5) } // Send last 5 messages for context
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Validate response data
          if (data.success && data.response && data.response.text && data.response.text.trim().length > 0) {
            const botMessage = {
              id: Date.now() + 1,
              text: data.response.text,
              sender: 'bot',
              timestamp: new Date(),
              quickReplies: Array.isArray(data.response.quickReplies) ? data.response.quickReplies : [],
              aiPowered: data.aiPowered,
              fallback: data.fallback
            };

            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);

            // Update AI status based on response
            if (data.aiPowered !== undefined) {
              setIsAIPowered(data.aiPowered);
            }

            // Navigation is now handled only through quick reply buttons
            // No automatic navigation from AI responses
            return;
          } else {
            console.warn('Invalid response format from API:', data);
          }
        }
      }
    } catch (error) {
      console.error('Error getting chatbot response from API:', error);
    }

    // Fallback to local responses if API fails
    setTimeout(() => {
      const response = generateBotResponse(messageText.toLowerCase());
      
      // Validate local response
      if (validateBotResponse(response)) {
        const botMessage = {
          id: Date.now() + 1,
          text: response.text,
          sender: 'bot',
          timestamp: new Date(),
          quickReplies: Array.isArray(response.quickReplies) ? response.quickReplies : []
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        // Ultimate fallback if even local response is invalid
        const fallbackMessage = {
          id: Date.now() + 1,
          text: "I apologize, but I'm having trouble processing your request right now. Please try asking about reporting issues, checking complaint status, or city services information.",
          sender: 'bot',
          timestamp: new Date(),
          quickReplies: ['Report an Issue', 'Check My Reports', 'City Services Info', 'Contact Support']
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }
      
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  // Validate bot response to prevent displaying invalid or random messages
  const validateBotResponse = (response) => {
    if (!response || typeof response !== 'object') {
      return false;
    }

    if (!response.text || typeof response.text !== 'string' || response.text.trim().length < 10) {
      return false;
    }

    // Check for nonsensical responses
    const text = response.text.toLowerCase();
    const nonsensicalPatterns = [
      /^[^a-zA-Z]*$/,  // Only special characters
      /(.)\1{10,}/,     // Repeated characters
      /^(ha|he|ho|hi){5,}/i,  // Repeated syllables
      /lorem ipsum/i,   // Placeholder text
      /test test test/i, // Test patterns
      /undefined|null|error/i // Error indicators
    ];

    for (const pattern of nonsensicalPatterns) {
      if (pattern.test(text)) {
        return false;
      }
    }

    // Ensure response is relevant to civic services
    const civicKeywords = [
      'urbaneye', 'city', 'report', 'issue', 'complaint', 'service', 'department',
      'help', 'assist', 'information', 'contact', 'status', 'track', 'civic',
      'government', 'municipal', 'public', 'community', 'platform'
    ];

    const hasRelevantContent = civicKeywords.some(keyword => 
      text.includes(keyword)
    );

    return hasRelevantContent || response.text.length < 100; // Allow short generic responses
  };

  // Generate intelligent bot responses based on user input with better pattern matching
  const generateBotResponse = (input) => {
    // Input validation
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return {
        text: "I'm here to help you with UrbanEye! What would you like to know about?",
        quickReplies: ['Report an Issue', 'Check My Reports', 'City Services Info', 'Platform Help']
      };
    }

    const cleanInput = input.trim().toLowerCase();
    
    // Check for exact matches first (case insensitive)
    const exactMatch = Object.keys(botResponses).find(key => 
      key.toLowerCase() === cleanInput
    );
    if (exactMatch) {
      return botResponses[exactMatch];
    }

    // Enhanced pattern matching with word boundaries
    const patterns = [
      {
        keywords: ['report', 'submit', 'complaint', 'issue', 'problem', 'file'],
        response: 'report an issue',
        navigateKeywords: ['go to', 'take me to', 'open form', 'start report']
      },
      {
        keywords: ['status', 'check', 'track', 'progress', 'my reports'],
        response: 'check my reports',
        navigateKeywords: ['view all', 'show all', 'open dashboard', 'see reports']
      },
      {
        keywords: ['service', 'department', 'contact', 'info', 'city services'],
        response: 'city services info'
      },
      {
        keywords: ['help', 'how', 'guide', 'tutorial', 'navigate', 'use'],
        response: 'how to use platform'
      },
      {
        keywords: ['emergency', 'urgent', '911', 'police', 'fire'],
        response: 'emergency contacts'
      }
    ];

    // Check patterns with word boundaries for better accuracy
    for (const pattern of patterns) {
      const hasKeyword = pattern.keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return regex.test(cleanInput);
      });

      if (hasKeyword) {
        // Check for navigation keywords if pattern supports it
        if (pattern.navigateKeywords) {
          const hasNavigateKeyword = pattern.navigateKeywords.some(navKeyword => 
            cleanInput.includes(navKeyword)
          );
          if (hasNavigateKeyword && pattern.response === 'report an issue') {
            return botResponses['go to report form'];
          } else if (hasNavigateKeyword && pattern.response === 'check my reports') {
            return botResponses['view all reports'];
          }
        }
        return botResponses[pattern.response];
      }
    }

    // Specific department queries with word boundaries
    const departmentPatterns = [
      {
        keywords: ['public works', 'road', 'streetlight', 'water', 'sewer', 'utilities'],
        response: 'public works'
      },
      {
        keywords: ['parks', 'recreation', 'playground', 'tree', 'green space'],
        response: 'parks & recreation'
      },
      {
        keywords: ['transportation', 'transit', 'bus', 'parking', 'traffic'],
        response: 'transportation'
      },
      {
        keywords: ['environmental', 'recycling', 'pollution', 'waste', 'sustainability'],
        response: 'environmental'
      }
    ];

    for (const dept of departmentPatterns) {
      const hasKeyword = dept.keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return regex.test(cleanInput);
      });
      if (hasKeyword) {
        return botResponses[dept.response];
      }
    }

    // Common conversational patterns
    if (/\b(hello|hi|hey|good morning|good afternoon|good evening)\b/i.test(cleanInput)) {
      return {
        text: `Hello! 👋 I'm your UrbanEye assistant. I'm here to help you with reporting issues, checking complaint status, and navigating city services. What can I help you with today?`,
        quickReplies: ['Report an Issue', 'Check My Reports', 'City Services Info', 'Platform Help']
      };
    }

    if (/\b(thank|thanks|appreciate)\b/i.test(cleanInput)) {
      return {
        text: "You're welcome! 😊 I'm always here to help. Is there anything else you'd like to know about UrbanEye or city services?",
        quickReplies: ['Report an Issue', 'City Services', 'Platform Help', 'Contact Support']
      };
    }

    if (/\b(bye|goodbye|see you|farewell)\b/i.test(cleanInput)) {
      return {
        text: "Goodbye! 👋 Feel free to reach out anytime you need help with UrbanEye. Have a great day!",
        quickReplies: ['Report an Issue', 'City Services', 'Contact Support']
      };
    }

    // Handle very short inputs
    if (cleanInput.split(' ').length <= 2) {
      return {
        text: "I'd be happy to help! Could you tell me a bit more about what you're looking for? I can assist with reporting issues, checking complaint status, city services information, or platform navigation.",
        quickReplies: ['Report an Issue', 'Check My Reports', 'City Services Info', 'Platform Help']
      };
    }

    // Default response for unrecognized input - be more helpful
    return {
      text: "I want to make sure I understand how to best help you. I'm equipped to assist with:\n\n• Reporting community issues and problems\n• Checking the status of your reports\n• Finding city department information\n• Navigating the UrbanEye platform\n\nWhat specific information or assistance are you looking for?",
      quickReplies: ['Report an Issue', 'Check My Reports', 'City Services Info', 'Platform Help', 'Contact Support']
    };
  };

  // Handle quick reply clicks
  const handleQuickReply = (reply) => {
    // Prevent rapid clicking by checking if we're already typing
    if (isTyping) return;

    // Handle direct navigation for specific quick replies
    if (reply === 'Go to Report Form' || reply === 'Start Reporting' || reply === 'Yes, Take Me There' || reply === 'Yes, Open Form' || reply === 'Yes, Go to Form' || reply === 'Yes, Start Now') {
      navigate('/report-issue');
      setIsOpen(false);
      return;
    } else if (reply === 'View All Reports' || reply === 'Check My Reports') {
      navigate('/reports-history');
      setIsOpen(false);
      return;
    } else if (reply === 'Check Public Feed') {
      navigate('/public-feed');
      setIsOpen(false);
      return;
    }
    
    // For other quick replies, send as normal message (no navigation)
    handleSendMessage(reply);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#52796F] via-[#4a6b5f] to-[#354F52] text-white p-5 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 border border-white/20 backdrop-blur-sm"
          >
            <div className="flex items-center space-x-2">
              <FiMessageCircle className="w-6 h-6" />
              <span className="font-medium text-sm hidden sm:block">Need Help?</span>
            </div>
            {hasUnreadMessages && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse border-2 border-white shadow-lg"></div>
            )}
            
            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <div className="absolute top-1 right-1 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chatbot Window - New Modern Layout */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 70 : 650,
              width: isMinimized ? 400 : 480
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-4 right-4 z-50 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-xl"
            style={{ 
              maxHeight: '80vh',
              maxWidth: '90vw',
              minWidth: '400px'
            }}
          >
            {/* Modern Header */}
            <div className="bg-gradient-to-r from-[#52796F] via-[#4a6b5f] to-[#354F52] text-white p-5 flex items-center justify-between relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
              </div>
              
              <div className="flex items-center space-x-4 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <FiHelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">UrbanEye Assistant</h3>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 relative z-10">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? <FiMaximize2 className="w-5 h-5" /> : <FiMinimize2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                  title="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            {!isMinimized && (
              <>
                <div className="h-96 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white relative">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-10 right-10 w-20 h-20 bg-[#52796F] rounded-full"></div>
                    <div className="absolute bottom-10 left-10 w-16 h-16 bg-[#84A98C] rounded-full"></div>
                  </div>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.sender === 'user' 
                            ? 'bg-[#52796F] text-white' 
                            : 'bg-white border-2 border-[#84A98C] text-[#52796F]'
                        }`}>
                          {message.sender === 'user' ? <FiUser className="w-4 h-4" /> : <FiHelpCircle className="w-4 h-4" />}
                        </div>
                        <div className={`rounded-2xl p-4 shadow-sm ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-r from-[#52796F] to-[#4a6b5f] text-white shadow-lg'
                            : 'bg-white border border-gray-100 text-gray-800 shadow-md'
                        }`}>
                          <p className="text-base leading-relaxed whitespace-pre-line">{message.text}</p>
                          <p className="text-xs mt-2 opacity-60 flex items-center">
                            <FiClock className="w-3 h-3 mr-1" />
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Quick Replies */}
                  {messages.length > 0 && messages[messages.length - 1].sender === 'bot' && messages[messages.length - 1].quickReplies && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {messages[messages.length - 1].quickReplies.map((reply, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickReply(reply)}
                          className="px-4 py-2 bg-gradient-to-r from-white to-gray-50 border border-[#84A98C]/30 text-[#52796F] rounded-full text-sm font-medium hover:bg-gradient-to-r hover:from-[#CAD2C5]/20 hover:to-[#84A98C]/10 hover:border-[#52796F]/40 transition-all duration-200 hover:scale-105 shadow-sm"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-2 max-w-[80%]">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 border-[#84A98C] text-[#52796F]">
                          <FiHelpCircle className="w-4 h-4" />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-md">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-[#52796F] rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-[#52796F] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-[#52796F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-gray-500 ml-2">Assistant is typing...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Modern Input Area */}
                <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about city services..."
                        className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#52796F]/20 focus:border-[#52796F] transition-all duration-200 text-base bg-white shadow-sm"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <FiMessageCircle className="w-5 h-5" />
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim() || isTyping}
                      className="p-4 bg-gradient-to-r from-[#52796F] to-[#4a6b5f] text-white rounded-2xl hover:from-[#4a6b5f] hover:to-[#354F52] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg disabled:hover:scale-100"
                    >
                      <FiSend className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center justify-center mt-4 space-x-3">
                    <button
                      onClick={() => handleQuickReply('Report an Issue')}
                      className="px-4 py-2 bg-[#52796F]/10 text-[#52796F] rounded-xl text-sm font-medium hover:bg-[#52796F]/20 transition-colors"
                    >
                      📝 Report Issue
                    </button>
                    <button
                      onClick={() => handleQuickReply('Check My Reports')}
                      className="px-4 py-2 bg-[#52796F]/10 text-[#52796F] rounded-xl text-sm font-medium hover:bg-[#52796F]/20 transition-colors"
                    >
                      📊 My Reports
                    </button>
                    <button
                      onClick={() => handleQuickReply('City Services Info')}
                      className="px-4 py-2 bg-[#52796F]/10 text-[#52796F] rounded-xl text-sm font-medium hover:bg-[#52796F]/20 transition-colors"
                    >
                      🏛️ Services
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CitizenChatbot;