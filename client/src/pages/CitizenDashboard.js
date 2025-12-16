import React, { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle,
  FiMapPin,
  FiCalendar,
  FiTrendingUp,
  FiBarChart2,
  FiSend,
  FiUsers,
  FiShield,
  FiTarget,
  FiMenu,
  FiX,
  FiLogOut,
  FiUser,
  FiBell,
  FiSettings,
  FiChevronDown,
  FiHome,
  FiMessageSquare,
  FiHeart,
  FiStar,
  FiActivity,
  FiArrowRight,
  FiSearch,
  FiPhone,
  FiMail,
  FiGlobe,
  FiDownload,
  FiInfo,
  FiAward,
  FiZap,
  FiEye,
  FiThumbsUp
} from 'react-icons/fi';
import { FaCity, FaBuilding, FaCog, FaRegSmile, FaHandshake, FaChartLine, FaHeadset, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import CitizenChatbot from '../components/CitizenChatbot';

const CitizenDashboard = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pending: 0,
    inProgress: 0,
    workCompleted: 0,
    resolved: 0
  });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [platformStats, setPlatformStats] = useState({
    resolutionRate: 0,
    responseTime: 0,
    activeCitizens: 0,
    satisfaction: 0
  });
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const { logout: sessionLogout } = useSession();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();


  // Set animation flag after initial render - reduced delay
  useEffect(() => {
    setHasAnimated(true);
  }, []);

  // Fetch user's complaint statistics
  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Set default stats if no token
        setStats({
          totalComplaints: 0,
          pending: 0,
          inProgress: 0,
          workCompleted: 0,
          resolved: 0
        });
        return;
      }

      const response = await fetch('/api/complaints/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {
          totalComplaints: 0,
          pending: 0,
          inProgress: 0,
          resolved: 0
        });
      } else {
        // Set default stats if API fails
        setStats({
          totalComplaints: 0,
          pending: 0,
          inProgress: 0,
          workCompleted: 0,
          resolved: 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Set default stats on error
      setStats({
        totalComplaints: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0
      });
    }
  };

  // Fetch recent complaints
  const fetchRecentComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setRecentComplaints([]);
        return;
      }

      const response = await fetch('/api/complaints/recent?limit=3', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecentComplaints(data.complaints || []);
      } else {
        setRecentComplaints([]);
      }
    } catch (error) {
      console.error('Error fetching recent complaints:', error);
      setRecentComplaints([]);
    }
  };

  // Fetch platform-wide statistics
  const fetchPlatformStats = async () => {
    try {
      const response = await fetch('/api/stats/platform', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPlatformStats(data.stats || {
          resolutionRate: 83,
          responseTime: 24,
          activeCitizens: 5500,
          satisfaction: 92
        });
      } else if (response.status === 401) {
        // Don't fetch data if unauthorized - session will handle logout
        return;
      } else {
        // Set default platform stats if API fails
        setPlatformStats({
          resolutionRate: 83,
          responseTime: 24,
          activeCitizens: 5500,
          satisfaction: 92
        });
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      // Set default platform stats on error
      setPlatformStats({
        resolutionRate: 83,
        responseTime: 24,
        activeCitizens: 5500,
        satisfaction: 92
      });
    }
  };

  // Fetch available services
  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      } else if (response.status === 401) {
        // Don't fetch data if unauthorized - session will handle logout
        return;
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      // Fallback to default services if API fails
      setServices([
        {
          title: "Report Issues",
          description: "Report infrastructure problems, safety concerns, and community issues",
          icon: "FiFileText",
          color: "from-amber-500 to-orange-500",
          bgColor: "from-amber-50 to-orange-50",
          textColor: "text-amber-600",
          action: "navigate('/report-issue')"
        },
        {
          title: "Public Feed",
          description: "View and engage with civic issues reported by your community",
          icon: "FiGlobe",
          color: "from-blue-500 to-indigo-500",
          bgColor: "from-blue-50 to-indigo-50",
          textColor: "text-blue-600",
          action: "navigate('/public-feed')"
        },
        {
          title: "Track Progress",
          description: "Monitor the status of your submitted reports and requests",
          icon: "FiTrendingUp",
          color: "from-emerald-500 to-teal-500",
          bgColor: "from-emerald-50 to-teal-50",
          textColor: "text-emerald-600",
          action: "navigate('/reports-history')"
        },
        {
          title: "City Services",
          description: "Access information about municipal services and departments",
          icon: "FaBuilding",
          color: "from-orange-500 to-red-500",
          bgColor: "from-orange-50 to-red-50",
          textColor: "text-orange-600",
          action: "setActiveSection('services')"
        },
        {
          title: "Community",
          description: "Engage with your neighbors and participate in civic activities",
          icon: "FiUsers",
          color: "from-red-500 to-rose-500",
          bgColor: "from-red-50 to-rose-50",
          textColor: "text-red-600",
          action: "setActiveSection('community')"
        }
      ]);
    }
  };

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchUserStats(),
          fetchRecentComplaints(),
          fetchPlatformStats(),
          fetchServices()
        ]);
      } catch (error) {
        setError('Failed to load data. Please try again.');
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper function to get icon component from string
  const getIconComponent = (iconName) => {
    const iconMap = {
      'FiFileText': FiFileText,
      'FiTrendingUp': FiTrendingUp,
      'FaBuilding': FaBuilding,
      'FiUsers': FiUsers,
      'FiPlus': FiPlus,
      'FiClock': FiClock,
      'FiCheckCircle': FiCheckCircle,
      'FiAlertCircle': FiAlertCircle,
      'FiMapPin': FiMapPin,
      'FiCalendar': FiCalendar,
      'FiBarChart2': FiBarChart2,
      'FiSend': FiSend,
      'FiShield': FiShield,
      'FiTarget': FiTarget,
      'FiHome': FiHome,
      'FiMessageSquare': FiMessageSquare,
      'FiHeart': FiHeart,
      'FiStar': FiStar,
      'FiActivity': FiActivity,
      'FiArrowRight': FiArrowRight,
      'FiSearch': FiSearch,
      'FiPhone': FiPhone,
      'FiMail': FiMail,
      'FiGlobe': FiGlobe,
      'FiDownload': FiDownload,
      'FiInfo': FiInfo,
      'FiAward': FiAward,
      'FiZap': FiZap,
      'FiEye': FiEye,
      'FiThumbsUp': FiThumbsUp
    };
    return iconMap[iconName] || FiFileText;
  };

  // Helper function to execute action from string
  const executeAction = (actionString) => {
    if (actionString === "navigate('/report-issue')") {
      navigate('/report-issue');
    } else if (actionString === "navigate('/reports-history')") {
      navigate('/reports-history');
    } else if (actionString === "setActiveSection('tracking')") {
      setActiveSection('tracking');
    } else if (actionString === "setActiveSection('services')") {
      setActiveSection('services');
    } else if (actionString === "setActiveSection('community')") {
      setActiveSection('community');
    }
  };

  const impactStats = [
    {
      number: `${platformStats.resolutionRate}%`,
      label: "Issues Resolved",
      description: "Average resolution rate for citizen reports",
      icon: FiCheckCircle,
      color: "text-[#52796F]"
    },
    {
      number: `${platformStats.responseTime}h`,
      label: "Response Time",
      description: "Average time to acknowledge reports",
      icon: FiClock,
      color: "text-[#84A98C]"
    },
    {
      number: `${(platformStats.activeCitizens / 1000).toFixed(1)}K`,
      label: "Active Citizens",
      description: "Community members using our platform",
      icon: FiUsers,
      color: "text-[#354F52]"
    },
    {
      number: `${platformStats.satisfaction}%`,
      label: "Satisfaction",
      description: "Citizen satisfaction with our services",
      icon: FiThumbsUp,
      color: "text-[#2F3E46]"
    }
  ];

  const handleLogout = async () => {
    await sessionLogout();
  };

  // Handle hover-based dropdown behavior
  const handleMouseEnter = () => {
    setUserMenuOpen(true);
  };

  const handleMouseLeave = () => {
    setUserMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Refresh data function - memoized
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchUserStats(),
        fetchRecentComplaints(),
        fetchPlatformStats(),
        fetchServices()
      ]);
    } catch (error) {
      setError('Failed to refresh data. Please try again.');
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-white/98 via-[#CAD2C5]/30 to-white/98 backdrop-blur-xl border-b border-[#84A98C]/50 sticky top-0 z-50 shadow-sm">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#84A98C] rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-1/4 w-24 h-24 bg-[#52796F] rounded-full blur-2xl"></div>
        </div>
        <div className="relative w-full px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 py-4">
            {/* Logo */}
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-r from-[#52796F] to-[#354F52] rounded-2xl flex items-center justify-center mr-4">
                <FaCity className="text-white w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">UrbanEye</span>
                <p className="text-sm text-gray-500 -mt-1">Smart Civic Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-10">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
              >
                Services
              </button>
              <button 
                onClick={() => navigate('/public-feed')}
                className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
              >
                Public Feed
              </button>
              <button 
                onClick={() => navigate('/reports-history')}
                className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
              >
                My Reports
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
              >
                FAQ
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-xl text-gray-500 hover:text-[#52796F] hover:bg-[#CAD2C5]/20 transition-all duration-200">
              <FiMenu className="h-6 w-6" />
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-6">
              <button 
                onClick={refreshData}
                className="p-3 rounded-xl text-gray-500 hover:text-[#52796F] hover:bg-[#CAD2C5]/20 transition-all duration-200"
                title="Refresh data"
              >
                <FiActivity className="h-6 w-6" />
              </button>
              <button className="p-3 rounded-xl text-gray-500 hover:text-[#52796F] hover:bg-[#CAD2C5]/20 transition-all duration-200 relative">
                <FiBell className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
          <div 
            className="relative group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-4 p-3 rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200"
                >
                  <img
                    src={user?.avatar}
                    alt={user?.name || 'User'}
                    className="h-10 w-10 rounded-xl object-cover bg-gradient-to-r from-[#84A98C] to-[#52796F]"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden h-10 w-10 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-xl items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-base font-medium text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">Citizen</p>
              </div>
                  <FiChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {userMenuOpen && (
      <motion.div
                      initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
            <button
                        type="button" 
                        onClick={() => navigate('/profile')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
                        <FiUser className="h-4 w-4 mr-3" />
                        Profile
            </button>
                      <button type="button" onClick={() => navigate('/settings')} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                        <FiSettings className="h-4 w-4 mr-3" />
                        Settings
                      </button>
                      <hr className="my-2" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <FiLogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                      </div>
                        </div>
                        </div>
                      </div>
      </header>

      {/* Main Content */}
      <main>
        <EmailVerificationBanner />
        
        {/* Error Message */}
        {error && (
          <div className="w-full px-6 lg:px-8 py-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center">
                <FiAlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="min-h-screen flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your dashboard...</p>
            </motion.div>
          </div>
        )}

        {/* Main Content - Only show when not loading */}
        {!loading && (
          <>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#CAD2C5]/30 via-[#84A98C]/20 to-[#52796F]/30">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-[#84A98C]/30 to-[#52796F]/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-[#52796F]/30 to-[#354F52]/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-[#CAD2C5]/20 to-[#84A98C]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-[#84A98C]/25 to-[#52796F]/25 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-[#CAD2C5]/20 to-[#84A98C]/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '3s' }}></div>
          </div>

          <div className="relative z-10 w-full px-6 lg:px-8 text-center">
      <motion.div
              initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Government Badge */}
              <motion.div
                initial={hasAnimated ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="inline-flex items-center px-6 py-3 bg-[#CAD2C5]/80 backdrop-blur-sm border border-[#84A98C]/50 rounded-full text-[#354F52] text-sm font-medium shadow-lg"
              >
                <FaCity className="w-4 h-4 mr-2" />
                Official Government Portal
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[#2F3E46] leading-tight"
              >
                AI-Driven Support To Boost
                <span className="block bg-gradient-to-r from-[#52796F] to-[#354F52] bg-clip-text text-transparent">
                  Your Community Growth
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-xl sm:text-2xl text-[#354F52] max-w-5xl mx-auto leading-relaxed"
              >
                A platform that helps citizens and government leaders provide efficient, high-quality civic services at scale with AI assistance, improving speed and quality across all channels, 24/7.
              </motion.p>

              {/* CTA Buttons */}
      <motion.div
                initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
              >
                <button
                  onClick={() => navigate('/report-issue')}
                  className="group bg-[#52796F] text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[#354F52] transition-colors duration-200 flex items-center space-x-3 shadow-2xl"
                >
                  <FiPlus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                  <span>Report an Issue</span>
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </button>

                <button
                  onClick={() => scrollToSection('services')}
                  className="group bg-white/80 backdrop-blur-sm border border-[#84A98C] text-[#354F52] px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[#CAD2C5]/30 transition-colors duration-200 flex items-center space-x-3 shadow-lg"
                >
                  <FiEye className="w-5 h-5" />
                  <span>Explore Services</span>
                </button>
              </motion.div>

              {/* Welcome Message */}
              <motion.div
                initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-12 p-6 bg-white/60 backdrop-blur-sm border border-[#84A98C]/50 rounded-3xl max-w-3xl mx-auto shadow-lg"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center mr-4">
                    <FaRegSmile className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-[#2F3E46] font-semibold text-lg">Welcome back, {user?.name?.split(' ')[0]}!</h3>
                    <p className="text-[#354F52] text-sm">Your voice matters in building a smarter city</p>
                  </div>
                </div>
              </motion.div>
      </motion.div>
    </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 border-2 border-[#84A98C]/50 rounded-full flex justify-center"
            >
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-3 bg-[#52796F]/70 rounded-full mt-2"
              />
            </motion.div>
          </motion.div>
        </section>

        {/* Feature Highlights Section */}
        <section id="features" className="py-20 bg-white">
          <div className="w-full px-6 lg:px-8">
            <motion.div
              initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Drive Transformative Impact with AI
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Experience seamless civic engagement with our AI-powered platform designed to make government services more accessible and efficient.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 lg:gap-8">
              {impactStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.3 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-200 group"
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 ${stat.color} bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-200`}>
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                    <div className="text-lg font-semibold text-gray-800 mb-2">{stat.label}</div>
                    <div className="text-sm text-gray-600">{stat.description}</div>
          </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 bg-gradient-to-br from-[#CAD2C5]/30 to-[#84A98C]/30">
          <div className="w-full px-6 lg:px-8">
            <motion.div
              initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-[#2F3E46] mb-6">
                Effortless Onboarding and Rapid Service Access
              </h2>
              <p className="text-xl text-[#354F52] max-w-3xl mx-auto">
                Experience an effortless journey with our user-friendly platform and dedicated support team, all set to help you!
              </p>
      </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 lg:gap-8">
              {services.map((service, index) => {
                const IconComponent = getIconComponent(service.icon);
                return (
                  <motion.div
                    key={service.title}
                    initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.3 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    onClick={() => executeAction(service.action)}
                    className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-200 cursor-pointer group"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    <div className="flex items-center text-sm font-semibold group-hover:translate-x-1 transition-transform duration-200">
                      <span className={service.textColor}>Get Started</span>
                      <FiArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="py-20 bg-white">
          <div className="w-full px-6 lg:px-8">
            <motion.div
              initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-[#2F3E46] mb-6">
                Your Recent Activity
              </h2>
              <p className="text-xl text-[#354F52] max-w-3xl mx-auto">
                Track your civic engagement and see the impact of your contributions to the community.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Stats Summary */}
              <motion.div
                initial={hasAnimated ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="lg:col-span-1 space-y-6"
              >
                <div className="bg-gradient-to-br from-[#52796F] to-[#354F52] rounded-3xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-6">Your Impact</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-100">Total Reports</span>
                      <span className="text-2xl font-bold">{stats.totalComplaints}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-100">Resolved</span>
                      <span className="text-2xl font-bold">{stats.resolved}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-100">In Progress</span>
                      <span className="text-2xl font-bold">{stats.inProgress}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-100">Work Completed</span>
                      <span className="text-2xl font-bold">{stats.workCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-100">Pending</span>
                      <span className="text-2xl font-bold">{stats.pending}</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/report-issue')}
                  className="w-full bg-gradient-to-r from-[#52796F] to-[#354F52] hover:from-[#354F52] hover:to-[#2F3E46] text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3"
                >
                  <FiPlus className="w-5 h-5" />
                  <span>Report New Issue</span>
                </motion.button>
        </motion.div>

              {/* Recent Reports */}
              <motion.div
                initial={hasAnimated ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="lg:col-span-2"
              >
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-gray-900">Recent Reports</h3>
                    <button 
                      onClick={() => navigate('/reports-history')}
                      className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-2"
                    >
                      <span>View All</span>
                      <FiArrowRight className="w-4 h-4" />
                    </button>
          </div>

                  <div className="space-y-4">
                    {recentComplaints.map((complaint, index) => (
                  <motion.div
                        key={complaint.id}
                        initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ y: -2, scale: 1.01 }}
                        className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200 cursor-pointer border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">{complaint.title}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                                complaint.status === 'work_completed' ? 'bg-purple-100 text-purple-800' :
                                complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {complaint.status === 'work_completed' ? 'Work Completed' : complaint.status.replace('-', ' ')}
                              </span>
            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <FiMapPin className="w-4 h-4 mr-1" />
                                {complaint.address || 'Location not specified'}
          </div>
            <div className="flex items-center">
                                <FiCalendar className="w-4 h-4 mr-1" />
                                {complaint.date}
              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                complaint.priority === 'High' ? 'bg-red-100 text-red-800' :
                                complaint.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {complaint.priority}
                              </span>
            </div>
          </div>
                        </div>
                      </motion.div>
              ))}
            </div>
              </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="w-full px-6 lg:px-8">
                <motion.div
              initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                FAQ's: Write in the Citizen's Voice
              </h2>
              <p className="text-xl text-gray-600">
                Common questions about our civic engagement platform
              </p>
                </motion.div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    question: "Do I need to know how to code to use this platform?",
                    answer: "Not at all! Our platform is designed to be user-friendly for all citizens, regardless of technical background."
                  },
                  {
                    question: "I already have a custom domain. Can I use it with UrbanEye?",
                    answer: "Yes, you can integrate UrbanEye with your existing domain and customize it to match your city's branding."
                  },
                  {
                    question: "Does UrbanEye include hosting for my city's website?",
                    answer: "Yes, UrbanEye provides secure, reliable hosting with 99.9% uptime guarantee for all government services."
                  }
                ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                    <FiPlus className="w-5 h-5 text-gray-400" />
                  </div>
                </motion.div>
                ))}
              </div>
            </div>
      </div>
        </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-[#354F52] to-[#2F3E46] text-white">
        <div className="w-full px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-4 gap-6 lg:gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center mr-3">
                  <FaCity className="text-white w-5 h-5" />
                </div>
                <span className="text-2xl font-bold">UrbanEye</span>
              </div>
              <p className="text-[#CAD2C5] mb-6 max-w-md">
                Empowering citizens to build smarter, better communities through civic engagement and digital innovation.
              </p>
              <div className="flex space-x-4">
                <button className="p-3 bg-[#52796F]/50 rounded-xl hover:bg-[#52796F]/70 transition-colors duration-200">
                  <FiMessageSquare className="h-5 w-5" />
                </button>
                <button className="p-3 bg-[#52796F]/50 rounded-xl hover:bg-[#52796F]/70 transition-colors duration-200">
                  <FiHeart className="h-5 w-5" />
                </button>
                <button className="p-3 bg-[#52796F]/50 rounded-xl hover:bg-[#52796F]/70 transition-colors duration-200">
                  <FiStar className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-[#CAD2C5]">
                <li><button className="hover:text-white transition-colors duration-200">About Us</button></li>
                <li><button className="hover:text-white transition-colors duration-200">How It Works</button></li>
                <li><button className="hover:text-white transition-colors duration-200">Success Stories</button></li>
                <li><button className="hover:text-white transition-colors duration-200">Contact Support</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-[#CAD2C5]">
                <li><button className="hover:text-white transition-colors duration-200">Help Center</button></li>
                <li><button className="hover:text-white transition-colors duration-200">Community Guidelines</button></li>
                <li><button className="hover:text-white transition-colors duration-200">Privacy Policy</button></li>
                <li><button className="hover:text-white transition-colors duration-200">Terms of Service</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#52796F] mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-[#CAD2C5] mb-4 md:mb-0">
              © 2024 UrbanEye. All rights reserved. Building better cities together.
            </p>
            <div className="flex items-center space-x-4 text-[#CAD2C5]">
              <span>Made with ❤️ for the community</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Chatbot Component */}
      <CitizenChatbot />
    </div>
  );
};

export default CitizenDashboard;
