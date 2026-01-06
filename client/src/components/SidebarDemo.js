import React from 'react';
import { motion } from 'framer-motion';
import { FiSidebar, FiMenu, FiX } from 'react-icons/fi';

const SidebarDemo = () => {
  return (
    <div className="p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dynamic Sidebar Features</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -4 }}
          className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <FiSidebar className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Toggleable Overlay</h3>
          <p className="text-gray-600 text-sm">
            Sidebar appears as an overlay when toggled, keeping the header always visible for easy navigation.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200"
        >
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
            <FiMenu className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Header Integration</h3>
          <p className="text-gray-600 text-sm">
            Toggle button integrated into the header for easy access while maintaining the original header functionality.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200"
        >
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
            <FiX className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Auto-Close</h3>
          <p className="text-gray-600 text-sm">
            Sidebar automatically closes when navigating to keep the interface clean and focused.
          </p>
        </motion.div>
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-[#CAD2C5]/30 to-[#84A98C]/30 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Use:</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-[#52796F] rounded-full mr-3"></span>
            Click the menu button in the header to open the sidebar
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-[#52796F] rounded-full mr-3"></span>
            Navigate to any section and the sidebar will auto-close
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-[#52796F] rounded-full mr-3"></span>
            Press Escape key or click the X button to close manually
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-[#52796F] rounded-full mr-3"></span>
            Access all main features from the organized menu sections
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SidebarDemo;