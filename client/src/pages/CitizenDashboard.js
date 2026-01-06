import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  FiX,
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
import { FaCity, FaBuilding, FaRegSmile } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import CitizenChatbot from '../components/CitizenChatbot';
import CitizenLayout from '../components/CitizenLayout';
import SidebarDemo from '../components/SidebarDemo';

const CitizenDashboard = () => {
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
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
          titleKey: "services.reportIssues.title",
          descriptionKey: "services.reportIssues.description",
          icon: "FiFileText",
          color: "from-red-500 to-orange-500",
          bgColor: "from-red-50 to-orange-50",
          textColor: "text-red-600",
          action: "navigate('/report-issue')"
        },
        {
          titleKey: "services.communityFeed.title",
          descriptionKey: "services.communityFeed.description",
          icon: "FiUsers",
          color: "from-blue-500 to-indigo-500",
          bgColor: "from-blue-50 to-indigo-50",
          textColor: "text-blue-600",
          action: "navigate('/public-feed')"
        },
        {
          titleKey: "services.fundraising.title",
          descriptionKey: "services.fundraising.description",
          icon: "FiHeart",
          color: "from-pink-500 to-rose-500",
          bgColor: "from-pink-50 to-rose-50",
          textColor: "text-pink-600",
          action: "navigate('/fundraising')"
        },
        {
          titleKey: "services.myReports.title",
          descriptionKey: "services.myReports.description",
          icon: "FiTrendingUp",
          color: "from-emerald-500 to-teal-500",
          bgColor: "from-emerald-50 to-teal-50",
          textColor: "text-emerald-600",
          action: "navigate('/reports-history')"
        },
        {
          titleKey: "services.emergencyServices.title",
          descriptionKey: "services.emergencyServices.description",
          icon: "FiShield",
          color: "from-purple-500 to-pink-500",
          bgColor: "from-purple-50 to-pink-50",
          textColor: "text-purple-600",
          action: "navigate('/emergency')"
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
    } else if (actionString === "navigate('/public-feed')") {
      navigate('/public-feed');
    } else if (actionString === "navigate('/fundraising')") {
      navigate('/fundraising');
    } else if (actionString === "navigate('/emergency')") {
      navigate('/emergency');
    }
  };

  const impactStats = [
    {
      number: `${platformStats.resolutionRate}%`,
      label: t('stats.issuesResolved'),
      description: t('stats.issuesResolvedDesc'),
      icon: FiCheckCircle,
      color: "text-[#52796F]"
    },
    {
      number: `${platformStats.responseTime}h`,
      label: t('stats.responseTime'),
      description: t('stats.responseTimeDesc'),
      icon: FiClock,
      color: "text-[#84A98C]"
    },
    {
      number: `${(platformStats.activeCitizens / 1000).toFixed(1)}K`,
      label: t('stats.activeCitizens'),
      description: t('stats.activeCitizensDesc'),
      icon: FiUsers,
      color: "text-[#354F52]"
    },
    {
      number: `${platformStats.satisfaction}%`,
      label: t('stats.satisfaction'),
      description: t('stats.satisfactionDesc'),
      icon: FiThumbsUp,
      color: "text-[#2F3E46]"
    }
  ];



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
    <CitizenLayout onRefresh={refreshData} showRefresh={true}>
      <div className="min-h-screen bg-white">
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
              <p className="text-gray-600 text-lg">{t('dashboard.loadingDashboard')}</p>
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
                {t('dashboard.governmentPortal')}
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[#2F3E46] leading-tight"
              >
                {t('dashboard.heroTitle')}
                <span className="block bg-gradient-to-r from-[#52796F] to-[#354F52] bg-clip-text text-transparent">
                  {t('dashboard.heroTitleHighlight')}
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-xl sm:text-2xl text-[#354F52] max-w-5xl mx-auto leading-relaxed"
              >
                {t('dashboard.heroSubtitle')}
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
                  <span>{t('dashboard.reportIssueBtn')}</span>
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </button>

                <button
                  onClick={() => navigate('/public-feed')}
                  className="group bg-white/80 backdrop-blur-sm border border-[#84A98C] text-[#354F52] px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[#CAD2C5]/30 transition-colors duration-200 flex items-center space-x-3 shadow-lg"
                >
                  <FiUsers className="w-5 h-5" />
                  <span>{t('dashboard.communityFeedBtn')}</span>
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
                    <h3 className="text-[#2F3E46] font-semibold text-lg">{t('dashboard.welcomeBack', { name: user?.name?.split(' ')[0] })}</h3>
                    <p className="text-[#354F52] text-sm">{t('dashboard.welcomeMessage')}</p>
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
                {t('dashboard.impactTitle')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t('dashboard.impactSubtitle')}
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
                {t('dashboard.servicesTitle')}
              </h2>
              <p className="text-xl text-[#354F52] max-w-3xl mx-auto">
                {t('dashboard.servicesSubtitle')}
              </p>
      </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 lg:gap-8">
              {services.map((service, index) => {
                const IconComponent = getIconComponent(service.icon);
                return (
                  <motion.div
                    key={service.titleKey || service.title}
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
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {service.titleKey ? t(service.titleKey) : service.title}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {service.descriptionKey ? t(service.descriptionKey) : service.description}
                    </p>
                    <div className="flex items-center text-sm font-semibold group-hover:translate-x-1 transition-transform duration-200">
                      <span className={service.textColor}>{t('services.getStarted')}</span>
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
                {t('dashboard.activityTitle')}
              </h2>
              <p className="text-xl text-[#354F52] max-w-3xl mx-auto">
                {t('dashboard.activitySubtitle')}
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
                  <h3 className="text-2xl font-bold mb-6">{t('dashboard.yourImpact')}</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-100">{t('dashboard.totalReports')}</span>
                      <span className="text-2xl font-bold">{stats.totalComplaints}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-100">{t('dashboard.resolved')}</span>
                      <span className="text-2xl font-bold">{stats.resolved}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-100">{t('dashboard.inProgress')}</span>
                      <span className="text-2xl font-bold">{stats.inProgress}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-100">{t('dashboard.workCompleted')}</span>
                      <span className="text-2xl font-bold">{stats.workCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-100">{t('dashboard.pending')}</span>
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
                  <span>{t('dashboard.reportNewIssue')}</span>
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
                    <h3 className="text-2xl font-bold text-gray-900">{t('dashboard.recentReports')}</h3>
                    <button 
                      onClick={() => navigate('/reports-history')}
                      className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-2"
                    >
                      <span>{t('dashboard.viewAll')}</span>
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
                                {complaint.status === 'work_completed' ? t('dashboard.workCompletedStatus') : complaint.status.replace('-', ' ')}
                              </span>
            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <FiMapPin className="w-4 h-4 mr-1" />
                                {complaint.address || t('dashboard.locationNotSpecified')}
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
                {t('dashboard.faqTitle')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('dashboard.faqSubtitle')}
              </p>
                </motion.div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    question: t('faq.howToReport.question'),
                    answer: t('faq.howToReport.answer')
                  },
                  {
                    question: t('faq.trackStatus.question'),
                    answer: t('faq.trackStatus.answer')
                  },
                  {
                    question: t('faq.privacy.question'),
                    answer: t('faq.privacy.answer')
                  },
                  {
                    question: t('faq.resolutionTime.question'),
                    answer: t('faq.resolutionTime.answer')
                  },
                  {
                    question: t('faq.publicFeed.question'),
                    answer: t('faq.publicFeed.answer')
                  },
                  {
                    question: t('faq.issueTypes.question'),
                    answer: t('faq.issueTypes.answer')
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

        {/* Sidebar Demo Section */}
        <section className="py-20 bg-gradient-to-br from-[#CAD2C5]/30 to-[#84A98C]/30">
          <div className="w-full px-6 lg:px-8">
            <motion.div
              initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-[#2F3E46] mb-6">
                New Dynamic Sidebar
              </h2>
              <p className="text-xl text-[#354F52] max-w-3xl mx-auto">
                Experience our new organized navigation system designed to make accessing all features easier and more intuitive.
              </p>
            </motion.div>

            <motion.div
              initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <SidebarDemo />
            </motion.div>
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
                {t('footer.description')}
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
              <h4 className="font-semibold mb-4">{t('footer.getStarted')}</h4>
              <ul className="space-y-2 text-[#CAD2C5]">
                <li><button onClick={() => navigate('/report-issue')} className="hover:text-white transition-colors duration-200">{t('header.reportIssue')}</button></li>
                <li><button onClick={() => navigate('/public-feed')} className="hover:text-white transition-colors duration-200">{t('header.publicFeed')}</button></li>
                <li><button onClick={() => navigate('/reports-history')} className="hover:text-white transition-colors duration-200">{t('header.myReports')}</button></li>
                <li><button onClick={() => navigate('/profile')} className="hover:text-white transition-colors duration-200">{t('header.profile')}</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
              <ul className="space-y-2 text-[#CAD2C5]">
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors duration-200">{t('header.faq')}</button></li>
                <li><button className="hover:text-white transition-colors duration-200">{t('footer.contactCityHall')}</button></li>
                <li><button className="hover:text-white transition-colors duration-200">{t('footer.emergencyServices')}</button></li>
                <li><button className="hover:text-white transition-colors duration-200">{t('footer.accessibility')}</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#52796F] mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-[#CAD2C5] mb-4 md:mb-0">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center space-x-4 text-[#CAD2C5]">
              <span>{t('footer.madeWithLove')}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Chatbot Component */}
      <CitizenChatbot />
      </div>
    </CitizenLayout>
  );
};

export default CitizenDashboard;
