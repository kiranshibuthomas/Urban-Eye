import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon, FiSettings } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const SettingsPage = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();

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
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-4">
          <FiSettings className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
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
  );
};

export default SettingsPage;
