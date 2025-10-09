import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon, FiSettings, FiArrowLeft, FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { FaCity } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';

const SettingsPage = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { user, logout } = useAuth();
  const { logout: sessionLogout } = useSession();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  const ThemeToggle = ({ isDark, onToggle }) => {
    return (
      <motion.button
        onClick={onToggle}
        className={`relative w-16 h-8 rounded-full p-1 transition-colors duration-300 ${
          isDark 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
            : 'bg-gradient-to-r from-yellow-400 to-orange-400'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
          animate={{
            x: isDark ? 32 : 0,
            rotate: isDark ? 180 : 0
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiMoon className="w-3 h-3 text-blue-600" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiSun className="w-3 h-3 text-yellow-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Background animation */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-20"
          animate={{
            background: isDark 
              ? 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.3) 100%)'
              : 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, rgba(249, 115, 22, 0.3) 100%)'
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#CAD2C5]/30 via-[#84A98C]/20 to-[#52796F]/30">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-white/98 via-[#CAD2C5]/30 to-white/98 backdrop-blur-xl border-b border-[#84A98C]/50 sticky top-0 z-50 shadow-sm">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#84A98C] rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-1/4 w-24 h-24 bg-[#52796F] rounded-full blur-2xl"></div>
        </div>
        <div className="relative w-full px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 py-4">
            {/* Back Button & Logo */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/citizen-dashboard')}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200"
              >
                <FiArrowLeft className="h-6 w-6 text-[#52796F]" />
                <span className="text-[#52796F] font-medium hidden sm:block">Back</span>
              </motion.button>
              
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-r from-[#52796F] to-[#354F52] rounded-2xl flex items-center justify-center mr-4">
                  <FaCity className="text-white w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900">UrbanEye</span>
                  <p className="text-sm text-gray-500 -mt-1">Settings</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-10">
              <button 
                onClick={() => navigate('/citizen-dashboard')}
                className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate('/report-issue')}
                className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
              >
                Report Issue
              </button>
              <button 
                onClick={() => navigate('/reports-history')}
                className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
              >
                My Reports
              </button>
            </nav>

            {/* User Menu Dropdown */}
            <div 
              className="relative user-menu-dropdown group"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200"
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
              </motion.button>
              
              {/* Dropdown Menu */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-200/50 py-2 z-50"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    </div>
                    
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => navigate('/settings')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                      >
                        <FiUser className="h-4 w-4 mr-3" />
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/settings')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                      >
                        <FiSettings className="h-4 w-4 mr-3" />
                        Settings
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors duration-200"
                      >
                        <FiLogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-4">
                <FiSettings className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Settings
              </h1>
              <p className="text-gray-500">
                Customize your UrbanEye experience
              </p>
            </motion.div>

             {/* Theme Toggle Section */}
       <motion.div
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: 0.5, delay: 0.2 }}
         className="bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-dark-700/50 shadow-xl"
       >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Dark Mode
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {theme === 'dark' 
                ? 'Enjoy a comfortable dark interface' 
                : 'Experience a clean, bright interface'
              }
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isDarkMode ? 'Dark' : 'Light'}
            </span>
          </div>
        </div>
      </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
