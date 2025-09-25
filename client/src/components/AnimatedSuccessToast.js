import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiSparkles, FiZap, FiStar, FiHeart } from 'react-icons/fi';

const AnimatedSuccessToast = ({ message, onClose, duration = 4000 }) => {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect theme from DOM since we're outside the ThemeProvider
  useEffect(() => {
    const detectTheme = () => {
      const htmlElement = document.documentElement;
      const hasDarkClass = htmlElement.classList.contains('dark');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(hasDarkClass || prefersDark);
    };

    detectTheme();

    // Listen for theme changes
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', detectTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', detectTheme);
    };
  }, []);

  useEffect(() => {
    // Start progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(progressInterval);
          return 0;
        }
        return prev - (100 / (duration / 50));
      });
    }, 50);

    // Auto close after duration
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 300);
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ 
            opacity: 0, 
            scale: 0.8, 
            y: -50,
            rotateX: -90
          }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            rotateX: 0
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8, 
            y: -50,
            rotateX: 90
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            duration: 0.6
          }}
          className={`fixed top-4 right-4 z-50 max-w-sm w-full mx-4`}
        >
          <motion.div
            className={`
              relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl
              ${isDarkMode 
                ? 'bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-gray-700/50' 
                : 'bg-gradient-to-br from-white/95 to-gray-50/95 border border-gray-200/50'
              }
            `}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {/* Animated background gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-cyan-400/20"
              animate={{
                background: [
                  "linear-gradient(45deg, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2), rgba(6, 182, 212, 0.2))",
                  "linear-gradient(45deg, rgba(6, 182, 212, 0.2), rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2))",
                  "linear-gradient(45deg, rgba(20, 184, 166, 0.2), rgba(6, 182, 212, 0.2), rgba(16, 185, 129, 0.2))"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Progress bar */}
            <motion.div
              className="absolute top-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />

            {/* Content */}
            <div className="relative p-4 flex items-center space-x-3">
              {/* Animated success icon */}
              <motion.div
                className="relative"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 15,
                  delay: 0.2
                }}
              >
                {/* Pulsing ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-emerald-400/30"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Main icon */}
                <motion.div
                  className={`
                    relative w-8 h-8 rounded-full flex items-center justify-center
                    ${isDarkMode ? 'bg-emerald-500' : 'bg-emerald-500'}
                  `}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <FiCheckCircle className="w-5 h-5 text-white" />
                </motion.div>

                {/* Sparkle effects */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                    style={{
                      top: `${20 + i * 15}%`,
                      left: `${30 + i * 20}%`
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>

              {/* Message */}
              <motion.div
                className="flex-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.p
                  className={`
                    font-semibold text-sm
                    ${isDarkMode ? 'text-white' : 'text-gray-800'}
                  `}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {message}
                </motion.p>
              </motion.div>

              {/* Close button */}
              <motion.button
                onClick={handleClose}
                className={`
                  p-1 rounded-full transition-colors duration-200
                  ${isDarkMode 
                    ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-700'
                  }
                `}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <FiZap className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Floating particles with different colors */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-1 h-1 rounded-full ${
                  i % 3 === 0 ? 'bg-emerald-400/60' : 
                  i % 3 === 1 ? 'bg-teal-400/60' : 'bg-cyan-400/60'
                }`}
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${10 + Math.random() * 80}%`
                }}
                animate={{
                  y: [-10, -40, -10],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  rotate: [0, 360, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
              />
            ))}

            {/* Celebration icons */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`icon-${i}`}
                className="absolute text-yellow-400"
                style={{
                  top: `${15 + Math.random() * 70}%`,
                  left: `${5 + Math.random() * 90}%`
                }}
                animate={{
                  y: [-5, -25, -5],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut"
                }}
              >
                {i % 2 === 0 ? (
                  <FiStar className="w-2 h-2" />
                ) : (
                  <FiHeart className="w-2 h-2" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedSuccessToast;
