import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMap,
  FiSettings,
  FiBell,
  FiShield,
  FiDatabase,
  FiMail,
  FiGlobe,
  FiArrowRight,
  FiRefreshCw,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiArrowLeft
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';

const AdminSettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logout: sessionLogout } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await sessionLogout();
  };

  const settingsSections = [
    {
      id: 'geofence',
      title: 'Geofence Configuration',
      description: 'Configure service area, boundaries, and location settings',
      icon: FiMap,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      route: '/geofence-config',
      items: [
        'Set panchayath boundaries',
        'Configure center coordinates',
        'Adjust coverage radius',
        'Test location validation'
      ]
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Manage email and system notification preferences',
      icon: FiBell,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      route: null,
      comingSoon: true,
      items: [
        'Email notifications',
        'SMS alerts',
        'Push notifications',
        'Notification frequency'
      ]
    },
    {
      id: 'security',
      title: 'Security & Access',
      description: 'Configure security settings and access controls',
      icon: FiShield,
      color: 'from-green-500 to-teal-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      route: null,
      comingSoon: true,
      items: [
        'Password policies',
        'Two-factor authentication',
        'Session management',
        'Role permissions'
      ]
    },
    {
      id: 'system',
      title: 'System Configuration',
      description: 'General system settings and preferences',
      icon: FiSettings,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      route: null,
      comingSoon: true,
      items: [
        'System defaults',
        'Time zone settings',
        'Language preferences',
        'Display options'
      ]
    },
    {
      id: 'database',
      title: 'Database & Backup',
      description: 'Database maintenance and backup settings',
      icon: FiDatabase,
      color: 'from-gray-600 to-gray-800',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      route: null,
      comingSoon: true,
      items: [
        'Automatic backups',
        'Data retention',
        'Database optimization',
        'Export data'
      ]
    },
    {
      id: 'email',
      title: 'Email Configuration',
      description: 'Configure email server and templates',
      icon: FiMail,
      color: 'from-yellow-500 to-orange-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      route: null,
      comingSoon: true,
      items: [
        'SMTP settings',
        'Email templates',
        'Sender information',
        'Test email delivery'
      ]
    },
    {
      id: 'integration',
      title: 'External Integrations',
      description: 'Manage third-party service integrations',
      icon: FiGlobe,
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      route: null,
      comingSoon: true,
      items: [
        'Google Maps API',
        'Payment gateway',
        'SMS provider',
        'Analytics tools'
      ]
    }
  ];

  const handleNavigate = (section) => {
    if (section.route) {
      navigate(section.route);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Matching AdminDashboard */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title and Back Button */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin-dashboard')}
                className="p-3 rounded-xl hover:bg-gray-100 transition-all duration-150"
              >
                <FiArrowLeft className="h-5 w-5 text-gray-600" />
              </motion.button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
                <p className="text-base text-gray-600 mt-1">Configure system-wide settings and preferences</p>
              </div>
            </div>

            {/* Right: User Menu */}
            <div className="relative user-menu-dropdown group" ref={userMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setUserMenuOpen(!userMenuOpen);
                }}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-150"
              >
                <img
                  src={user?.avatar}
                  alt={user?.name || 'User'}
                  className="h-8 w-8 rounded-full object-cover bg-gradient-to-r from-blue-500 to-indigo-500"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full items-center justify-center text-white text-xs font-semibold">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-base font-medium text-gray-900">{user?.name || 'Admin'}</p>
                  <p className="text-sm text-gray-500">Administrator</p>
                </div>
                <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200/50 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-base font-medium text-gray-900">{user?.name || 'Admin'}</p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="w-full px-4 py-2 text-left text-base text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                      >
                        <FiUser className="h-4 w-4 mr-3" />
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/admin-settings')}
                        className="w-full px-4 py-2 text-left text-base text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                      >
                        <FiSettings className="h-4 w-4 mr-3" />
                        Admin Settings
                      </button>
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-base text-red-600 hover:bg-red-50 flex items-center transition-colors duration-200"
                      >
                        <FiLogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {settingsSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => !section.comingSoon && handleNavigate(section)}
              className={`bg-white rounded-xl shadow-md border border-gray-200 p-6 ${
                !section.comingSoon ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02]' : 'cursor-not-allowed opacity-70'
              } transition-all duration-200 relative overflow-hidden group`}
            >
              {/* Coming Soon Badge */}
              {section.comingSoon && (
                <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  Coming Soon
                </div>
              )}

              {/* Icon */}
              <div className={`h-14 w-14 bg-gradient-to-r ${section.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <section.icon className="h-7 w-7 text-white" />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {section.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {section.description}
              </p>

              {/* Features List */}
              <ul className="space-y-2 mb-4">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 mr-2 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {!section.comingSoon && (
                <div className={`flex items-center justify-between mt-4 pt-4 border-t border-gray-100`}>
                  <span className={`text-sm font-medium ${section.textColor}`}>
                    Configure
                  </span>
                  <FiArrowRight className={`h-5 w-5 ${section.textColor} group-hover:translate-x-1 transition-transform duration-200`} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <FiSettings className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                💡 About Admin Settings
              </h3>
              <p className="text-gray-700 mb-3">
                This centralized settings panel allows you to configure various aspects of the UrbanEye system. 
                Each section provides access to specific configuration options that affect how the system operates.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>Changes take effect immediately</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>All changes are audit logged</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>Secure admin-only access</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>More features coming soon</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettingsPage;

