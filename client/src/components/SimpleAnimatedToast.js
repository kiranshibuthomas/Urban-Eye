import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX } from 'react-icons/fi';

const SimpleAnimatedToast = ({ message, onClose, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto close after duration
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 300);
    }, duration);

    return () => {
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
            y: -30,
            x: 20
          }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            x: 0
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8, 
            y: -30,
            x: 20
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            duration: 0.4
          }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full mx-4"
        >
          <motion.div
            className="relative overflow-hidden rounded-2xl shadow-xl bg-white border border-gray-100 backdrop-blur-sm"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-teal-50/50" />
            
            {/* Content */}
            <div className="relative p-5 flex items-center space-x-4">
              {/* Enhanced animated success icon */}
              <motion.div
                className="relative"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  delay: 0.1
                }}
              >
                {/* Animated pulsing ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-emerald-400/30"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.4, 0.1, 0.4]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Main icon container */}
                <motion.div 
                  className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {/* Animated checkmark icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 600,
                      damping: 15,
                      delay: 0.3
                    }}
                  >
                    <FiCheck className="w-6 h-6 text-white" />
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Enhanced message */}
              <motion.div
                className="flex-1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <p className="font-semibold text-base text-gray-800 leading-relaxed">
                  {message}
                </p>
              </motion.div>

              {/* Enhanced close button */}
              <motion.button
                onClick={handleClose}
                className="p-2 rounded-full transition-all duration-200 hover:bg-gray-100 text-gray-400 hover:text-gray-600 hover:scale-110"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
              >
                <FiX className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SimpleAnimatedToast;
