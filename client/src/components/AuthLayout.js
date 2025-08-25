import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCity, FaBuilding, FaCog } from 'react-icons/fa';
import { FiMapPin, FiUsers, FiShield, FiTrendingUp } from 'react-icons/fi';

const AuthLayout = ({ children, isLogin = true }) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with sophisticated city skyline pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-primary-100 to-teal-50">
        {/* City skyline silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary-700/20 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center space-x-2 px-4">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="bg-primary-600/30 rounded-t-sm"
                style={{
                  height: `${Math.random() * 70 + 30}px`,
                  width: `${Math.random() * 18 + 8}px`,
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Floating smart city icons with sophisticated colors */}
        <div className="absolute inset-0">
          <FaCity className="absolute top-20 left-20 text-teal-400 w-8 h-8 animate-pulse" />
          <FiMapPin className="absolute top-32 right-32 text-teal-400 w-6 h-6 animate-bounce" />
          <FaCog className="absolute bottom-40 left-16 text-accent-400 w-7 h-7 animate-spin" style={{ animationDuration: '8s' }} />
          <FaBuilding className="absolute top-40 left-1/2 text-teal-400 w-6 h-6 animate-pulse" />
          <FiShield className="absolute bottom-32 right-20 text-accent-400 w-6 h-6 animate-bounce" />
          <FiUsers className="absolute top-28 right-24 text-accent-400 w-6 h-6 animate-bounce" />
          <FiTrendingUp className="absolute bottom-28 right-16 text-accent-400 w-7 h-7 animate-bounce" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl mx-4 grid grid-cols-1 lg:grid-cols-2 min-h-[600px] lg:min-h-[700px]"
        >
          {/* Form Area - Slides between left and right */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`form-${isLogin ? 'login' : 'register'}`}
              initial={{ 
                x: isLogin ? -100 : 100, 
                opacity: 0,
                position: 'relative'
              }}
              animate={{ 
                x: 0, 
                opacity: 1,
                position: 'relative'
              }}
              exit={{ 
                x: isLogin ? 100 : -100, 
                opacity: 0,
                position: 'absolute'
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.6 
              }}
              className={`p-6 sm:p-8 lg:p-12 flex flex-col justify-center ${
                isLogin ? 'order-1 lg:order-1' : 'order-1 lg:order-2'
              }`}
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {/* Welcome Section - Slides between right and left */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`welcome-${isLogin ? 'login' : 'register'}`}
              initial={{ 
                x: isLogin ? 100 : -100, 
                opacity: 0,
                position: 'relative'
              }}
              animate={{ 
                x: 0, 
                opacity: 1,
                position: 'relative'
              }}
              exit={{ 
                x: isLogin ? -100 : 100, 
                opacity: 0,
                position: 'absolute'
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.6 
              }}
              className={`bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-hidden ${
                isLogin ? 'order-2 lg:order-2' : 'order-2 lg:order-1'
              }`}
            >
              {/* Background city pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-8 left-8">
                  {isLogin ? <FaBuilding className="w-12 h-12" /> : <FiUsers className="w-12 h-12" />}
                </div>
                <div className="absolute top-16 right-12">
                  {isLogin ? <FiMapPin className="w-8 h-8" /> : <FiShield className="w-8 h-8" />}
                </div>
                <div className="absolute bottom-16 left-12">
                  {isLogin ? <FiUsers className="w-10 h-10" /> : <FaBuilding className="w-10 h-10" />}
                </div>
                <div className="absolute bottom-8 right-8">
                  {isLogin ? <FiTrendingUp className="w-10 h-10" /> : <FiMapPin className="w-10 h-10" />}
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <FaCog className="w-20 h-20 animate-spin" style={{ animationDuration: isLogin ? '20s' : '25s' }} />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-center text-white z-10 relative"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mb-6"
                >
                  {isLogin ? (
                    <FaCity className="w-16 h-16 mx-auto mb-4 opacity-80" />
                  ) : (
                    <FiUsers className="w-16 h-16 mx-auto mb-4 opacity-80" />
                  )}
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
                >
                  {isLogin ? 'Hello, Citizen!' : 'Welcome Back!'}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-sm sm:text-base lg:text-lg mb-2 opacity-90 leading-relaxed"
                >
                  {isLogin 
                    ? 'Join our smart city initiative and help build'
                    : 'Already have an account with UrbanEye?'
                  }
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="text-sm sm:text-base lg:text-lg mb-8 opacity-90 leading-relaxed"
                >
                  {isLogin 
                    ? 'a better community together'
                    : 'Sign in to continue managing your city'
                  }
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-block px-8 py-3 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-accent-600 transition-all duration-300"
                    onClick={() => {
                      // Navigate to the other page
                      const targetPath = isLogin ? '/register' : '/login';
                      window.location.href = targetPath;
                    }}
                  >
                    {isLogin ? 'JOIN NOW' : 'SIGN IN'}
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
