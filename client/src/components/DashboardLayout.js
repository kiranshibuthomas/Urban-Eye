import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiUser, FiBell, FiSettings, FiChevronDown, FiMapPin, FiUsers, FiShield, FiTrendingUp } from 'react-icons/fi';
import { FaCity, FaBuilding, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const DashboardLayout = ({ children, title, actions }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, refreshAvatar } = useAuth();
  const { logout: sessionLogout } = useSession();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  const handleLogout = async () => {
    await sessionLogout();
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
              {/* Smart City Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* City skyline silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-800/10 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center space-x-1 px-4">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-600/20 rounded-t-sm"
                style={{
                  height: `${Math.random() * 40 + 20}px`,
                  width: `${Math.random() * 15 + 8}px`,
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Floating smart city icons */}
        <div className="absolute inset-0 pointer-events-none">
          <FaCity className="absolute top-20 left-20 text-primary-200/40 w-6 h-6 animate-pulse" />
          <FiMapPin className="absolute top-32 right-32 text-primary-200/40 w-5 h-5 animate-bounce" />
          <FaCog className="absolute bottom-40 left-16 text-teal-200/40 w-6 h-6 animate-spin" style={{ animationDuration: '15s' }} />
          <FaBuilding className="absolute top-40 left-1/2 text-primary-200/40 w-5 h-5 animate-pulse" />
          <FiShield className="absolute bottom-32 right-20 text-teal-200/40 w-5 h-5 animate-bounce" />
          <FiUsers className="absolute top-60 right-1/4 text-accent-200/40 w-5 h-5 animate-pulse" />
          <FiTrendingUp className="absolute bottom-60 left-1/3 text-primary-200/40 w-6 h-6 animate-bounce" />
        </div>
      </div>

      {/* Main Dashboard Container */}
      <div className="relative z-10 min-h-screen flex lg:flex-row">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black bg-opacity-60 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-gray-900 shadow-2xl border-r border-gray-200 dark:border-gray-700 lg:relative lg:translate-x-0 lg:flex lg:flex-col"
      >
        {/* Modern Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-gradient-to-r from-primary-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaCity className="text-white w-6 h-6" />
            </div>
            <div className="ml-3">
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">UrbanEye</span>
              <p className="text-xs text-gray-500 -mt-1">Smart Civic Management</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 lg:hidden"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          {/* Modern User Profile Section */}
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center p-4 bg-gradient-to-r from-primary-50 to-teal-50 rounded-2xl">
              <div className="relative">
                <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-teal-500 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg overflow-hidden">
                  <img
                    src={user?.avatar}
                    alt={user?.name || 'User'}
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden h-12 w-12 rounded-full items-center justify-center text-white font-semibold text-lg">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-teal-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600">{user?.email}</p>
                <div className="flex items-center mt-1">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full capitalize">
                    {user?.role}
                  </span>
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={async () => {
                        try {
                          const debugInfo = await refreshAvatar();
                          if (debugInfo) {
                            console.log('Avatar Debug Info:', debugInfo);
                            alert(`Avatar refreshed! Debug info logged to console. Avatar URL: ${debugInfo.generatedAvatarUrl}`);
                          } else {
                            alert('Failed to refresh avatar. Check console for errors.');
                          }
                        } catch (error) {
                          console.error('Debug avatar error:', error);
                          alert('Error refreshing avatar. Check console for details.');
                        }
                      }}
                      className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      Debug Avatar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modern Navigation */}
          <div className="flex-1 p-6">
            <nav className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Navigation</p>
              
              {/* Settings Button */}
              <Link to="/settings">
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gradient-to-r hover:from-primary-50 hover:to-teal-50 hover:text-primary-700 transition-all duration-300 group"
                >
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-primary-100 transition-colors duration-300">
                    <FiSettings className="h-4 w-4" />
                  </div>
                  <span className="ml-3">Settings</span>
                </motion.button>
              </Link>

              {/* Other Actions */}
              {actions && actions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.onClick}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gradient-to-r hover:from-primary-50 hover:to-teal-50 hover:text-primary-700 transition-all duration-300 group"
                >
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-primary-100 transition-colors duration-300">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <span className="ml-3">{action.label}</span>
                </motion.button>
              ))}
            </nav>
          </div>

          {/* Modern Logout Section */}
          <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors duration-300">
                <FiLogOut className="h-4 w-4" />
              </div>
              <span className="ml-3">Sign out</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Modern Top Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
          <div className="px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(true)}
                  className="p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 lg:hidden"
                >
                  <FiMenu className="h-5 w-5" />
                </motion.button>
                <div className="ml-4 lg:ml-0">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {title}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user?.name?.split(' ')[0]}!</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Modern Notifications */}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <FiBell className="h-5 w-5" />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-accent-500 rounded-full animate-pulse"></span>
                </motion.button>

                {/* Modern User Menu Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    <img
                      src={user?.avatar}
                      alt={user?.name || 'User'}
                      className="h-10 w-10 rounded-full object-cover bg-gradient-to-r from-primary-500 to-teal-500 ring-2 ring-primary-100"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden h-10 w-10 bg-gradient-to-r from-primary-500 to-teal-500 rounded-full items-center justify-center ring-2 ring-primary-100 text-white text-sm font-semibold">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                    </div>
                    <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  {/* Modern Dropdown Menu */}
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-50"
                    >
                      {/* User info */}
                      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-teal-500 rounded-full flex items-center justify-center overflow-hidden">
                            <img
                              src={user?.avatar}
                              alt={user?.name || 'User'}
                              className="h-12 w-12 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                            <div className="hidden h-12 w-12 rounded-full items-center justify-center text-white font-semibold text-lg">
                              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                            </div>
                          </div>
                                                      <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                            <span className="inline-flex items-center px-2 py-1 mt-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full capitalize">
                              {user?.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-2">

                        
                        <button 
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-6 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors duration-200"
                        >
                          <FiLogOut className="h-4 w-4 mr-3" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Modern Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="px-6 lg:px-8 py-8 max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-8"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
    </div>
  );
};

export default DashboardLayout;
