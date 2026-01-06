import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome,
  FiFileText,
  FiUsers,
  FiHeart,
  FiTrendingUp,
  FiSettings,
  FiUser,
  FiLogOut,
  FiActivity,
  FiX
} from 'react-icons/fi';
import { FaCity } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';

const CitizenSidebar = ({ isOpen, onToggle, onRefresh, onMouseEnter, onMouseLeave, onClick, isPinned }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { logout: sessionLogout } = useSession();

  const handleLogout = async () => {
    await sessionLogout();
  };

  // Main navigation items
  const navigationItems = [
    {
      id: 'dashboard',
      label: t('sidebar.dashboard'),
      icon: FiHome,
      path: '/citizen-dashboard',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'report-issue',
      label: t('sidebar.reportIssue'),
      icon: FiFileText,
      path: '/report-issue',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 'my-reports',
      label: t('sidebar.myReports'),
      icon: FiTrendingUp,
      path: '/reports-history',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      id: 'public-feed',
      label: t('sidebar.publicFeed'),
      icon: FiUsers,
      path: '/public-feed',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: 'fundraising',
      label: t('sidebar.fundraising'),
      icon: FiHeart,
      path: '/fundraising',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      id: 'my-donations',
      label: t('sidebar.myDonations'),
      icon: FiHeart,
      path: '/my-donations',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50'
    }
  ];

  // Secondary navigation items
  const secondaryItems = [
    // Commenting out items that don't have routes yet
    // {
    //   id: 'notifications',
    //   label: t('sidebar.notifications'),
    //   icon: FiBell,
    //   path: '/notifications',
    //   color: 'text-orange-600',
    //   bgColor: 'bg-orange-50'
    // },
    // {
    //   id: 'messages',
    //   label: t('sidebar.messages'),
    //   icon: FiMessageSquare,
    //   path: '/messages',
    //   color: 'text-purple-600',
    //   bgColor: 'bg-purple-50'
    // },
    // {
    //   id: 'analytics',
    //   label: t('sidebar.analytics'),
    //   icon: FiBarChart2,
    //   path: '/analytics',
    //   color: 'text-teal-600',
    //   bgColor: 'bg-teal-50'
    // }
  ];

  // Account items
  const accountItems = [
    {
      id: 'profile',
      label: t('sidebar.profile'),
      icon: FiUser,
      path: '/profile',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      id: 'settings',
      label: t('sidebar.settings'),
      icon: FiSettings,
      path: '/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  // Emergency items
  const emergencyItems = [
    // Commenting out items that don't have routes yet
    // {
    //   id: 'emergency',
    //   label: t('sidebar.emergency'),
    //   icon: FiShield,
    //   path: '/emergency',
    //   color: 'text-red-600',
    //   bgColor: 'bg-red-50'
    // },
    // {
    //   id: 'emergency-contacts',
    //   label: t('sidebar.emergencyContacts'),
    //   icon: FiPhone,
    //   path: '/emergency-contacts',
    //   color: 'text-red-600',
    //   bgColor: 'bg-red-50'
    // }
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const handleNavigation = (path) => {
    console.log('Navigating to:', path);
    try {
      navigate(path);
      console.log('Navigation successful');
      // Only close sidebar if it's not pinned
      if (!isPinned) {
        onToggle();
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const SidebarItem = ({ item, isActive }) => {
    console.log('SidebarItem rendered:', item.label, item.path);
    
    const handleClick = () => {
      console.log('Button clicked for:', item.label, 'Path:', item.path);
      console.log('Navigate function:', typeof navigate);
      handleNavigation(item.path);
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`
          w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative cursor-pointer
          ${isActive 
            ? `${item.bgColor} ${item.color} shadow-sm` 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }
          justify-start
        `}
        style={{ 
          pointerEvents: 'auto',
          zIndex: 10,
          position: 'relative'
        }}
      >
        <item.icon className={`
          w-5 h-5 flex-shrink-0 mr-3
          ${isActive ? item.color : 'text-gray-500 group-hover:text-gray-700'}
        `} />
        
        <span className="font-medium text-sm whitespace-nowrap overflow-hidden">
          {item.label}
        </span>
      </button>
    );
  };

  const SectionDivider = ({ title }) => (
    <div className="px-3 py-2">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {title}
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick();
            }}
            className="fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 flex flex-col shadow-xl w-80"
            style={{ 
              pointerEvents: 'auto',
              zIndex: 9999
            }}
          >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center cursor-pointer"
              onClick={() => navigate('/citizen-dashboard')}
            >
              <div className="h-10 w-10 bg-gradient-to-r from-[#52796F] to-[#354F52] rounded-xl flex items-center justify-center mr-3">
                <FaCity className="text-white w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">UrbanEye</span>
                <p className="text-xs text-gray-500 -mt-1">{t('dashboard.subtitle')}</p>
              </div>
            </motion.div>
            
            {/* Pin indicator */}
            {isPinned && (
              <div className="text-xs text-[#52796F] bg-[#CAD2C5]/20 px-2 py-1 rounded-full">
                Pinned
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* Test Button */}
          <button
            onClick={() => console.log('TEST BUTTON CLICKED!')}
            className="w-full p-2 bg-red-100 text-red-600 rounded-lg mb-4"
            style={{ pointerEvents: 'auto', zIndex: 100 }}
          >
            TEST CLICK
          </button>

          {/* Debug: Show navigation items count */}
          <div className="text-xs text-gray-500 mb-2">
            Navigation items: {navigationItems.length}
          </div>

          {/* Main Navigation */}
          <div className="space-y-1">
            {navigationItems.map((item, index) => {
              console.log('Rendering nav item:', item.label, item.path);
              return (
                <SidebarItem 
                  key={item.id} 
                  item={item} 
                  isActive={isActiveRoute(item.path)} 
                />
              );
            })}
          </div>

          {/* Secondary Navigation - Only show if there are items */}
          {secondaryItems.length > 0 && (
            <>
              <SectionDivider title={t('sidebar.tools')} />
              <div className="space-y-1">
                {secondaryItems.map((item) => (
                  <SidebarItem 
                    key={item.id} 
                    item={item} 
                    isActive={isActiveRoute(item.path)} 
                  />
                ))}
              </div>
            </>
          )}

          {/* Emergency Items - Only show if there are items */}
          {emergencyItems.length > 0 && (
            <>
              <SectionDivider title={t('sidebar.emergency')} />
              <div className="space-y-1">
                {emergencyItems.map((item) => (
                  <SidebarItem 
                    key={item.id} 
                    item={item} 
                    isActive={isActiveRoute(item.path)} 
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* User Profile & Account */}
        <div className="border-t border-gray-200 p-3 space-y-1">
          {accountItems.map((item) => (
            <SidebarItem 
              key={item.id} 
              item={item} 
              isActive={isActiveRoute(item.path)} 
            />
          ))}
          
          {/* User Info */}
          <div className="mt-4 p-3 bg-gradient-to-r from-[#CAD2C5]/30 to-[#84A98C]/30 rounded-xl">
            <div className="flex items-center mb-3">
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
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500">{t('sidebar.citizen')}</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
            >
              <FiLogOut className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{t('sidebar.signOut')}</span>
            </motion.button>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="border-t border-gray-200 p-3 flex items-center justify-between">
          {onRefresh && (
            <motion.button
              onClick={onRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
              title="Refresh"
            >
              <FiActivity className="w-5 h-5" />
            </motion.button>
          )}
          
          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <FiX className="w-5 h-5" />
          </motion.button>
        </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default CitizenSidebar;