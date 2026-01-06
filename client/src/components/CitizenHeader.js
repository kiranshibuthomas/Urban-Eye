import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMenu,
  FiX,
  FiBell,
  FiActivity,
  FiUser,
  FiSettings,
  FiLogOut,
  FiChevronDown
} from 'react-icons/fi';
import { FaCity } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import LanguageSwitcher from './LanguageSwitcher';

const CitizenHeader = ({ onRefresh, showRefresh = false, onToggleSidebar, sidebarOpen, onSidebarHover }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { logout: sessionLogout } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If section doesn't exist on current page, navigate to dashboard first
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  return (
    <header className="relative bg-gradient-to-r from-white/98 via-[#CAD2C5]/30 to-white/98 backdrop-blur-xl border-b border-[#84A98C]/50 sticky top-0 z-50 shadow-sm">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#84A98C] rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-1/4 w-24 h-24 bg-[#52796F] rounded-full blur-2xl"></div>
      </div>
      
      <div className="relative w-full px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 py-4">
          {/* Logo and Sidebar Toggle */}
          <div className="flex items-center">
            {/* Sidebar Toggle Button */}
            {onToggleSidebar && (
              <div
                onMouseEnter={() => onSidebarHover && onSidebarHover(true)}
                onMouseLeave={() => onSidebarHover && onSidebarHover(false)}
              >
                <button
                  onClick={onToggleSidebar}
                  className={`mr-4 p-2 rounded-xl transition-all duration-200 ${
                    sidebarOpen 
                      ? 'text-[#52796F] bg-[#CAD2C5]/20' 
                      : 'text-gray-500 hover:text-[#52796F] hover:bg-[#CAD2C5]/20'
                  }`}
                  title="Toggle Sidebar"
                >
                  <FiMenu className="h-6 w-6" />
                </button>
              </div>
            )}
            
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <div className="h-12 w-12 bg-gradient-to-r from-[#52796F] to-[#354F52] rounded-2xl flex items-center justify-center mr-4">
                <FaCity className="text-white w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</span>
                <p className="text-sm text-gray-500 -mt-1">{t('dashboard.subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-10">
            <button 
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
            >
              {t('header.dashboard')}
            </button>
            <button 
              onClick={() => navigate('/public-feed')}
              className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
            >
              {t('header.publicFeed')}
            </button>
            <button 
              onClick={() => navigate('/fundraising')}
              className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
            >
              {t('header.fundraising')}
            </button>
            <button 
              onClick={() => navigate('/report-issue')}
              className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
            >
              {t('header.reportIssue')}
            </button>
            <button 
              onClick={() => navigate('/reports-history')}
              className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
            >
              {t('header.myReports')}
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base"
            >
              {t('header.faq')}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-xl text-gray-500 hover:text-[#52796F] hover:bg-[#CAD2C5]/20 transition-all duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-6">
            {showRefresh && onRefresh && (
              <button 
                onClick={onRefresh}
                className="p-3 rounded-xl text-gray-500 hover:text-[#52796F] hover:bg-[#CAD2C5]/20 transition-all duration-200"
                title={t('common.refresh')}
              >
                <FiActivity className="h-6 w-6" />
              </button>
            )}
            
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            <button className="p-3 rounded-xl text-gray-500 hover:text-[#52796F] hover:bg-[#CAD2C5]/20 transition-all duration-200 relative">
              <FiBell className="h-6 w-6" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div 
              className="relative group"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-4 p-3 rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200"
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
                  <p className="text-sm text-gray-500">{t('header.citizen')}</p>
                </div>
                <FiChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      type="button" 
                      onClick={() => navigate('/profile')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <FiUser className="h-4 w-4 mr-3" />
                      {t('header.profile')}
                    </button>
                    <button
                      type="button" 
                      onClick={() => navigate('/my-donations')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <FiUser className="h-4 w-4 mr-3" />
                      {t('header.myDonations')}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => navigate('/settings')} 
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <FiSettings className="h-4 w-4 mr-3" />
                      {t('header.settings')}
                    </button>
                    <hr className="my-2" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <FiLogOut className="h-4 w-4 mr-3" />
                      {t('header.signOut')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[#84A98C]/50 py-4"
            >
              <nav className="flex flex-col space-y-4">
                <button 
                  onClick={() => {
                    navigate('/');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base py-2"
                >
                  {t('header.dashboard')}
                </button>
                <button 
                  onClick={() => {
                    navigate('/public-feed');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base py-2"
                >
                  {t('header.publicFeed')}
                </button>
                <button 
                  onClick={() => {
                    navigate('/fundraising');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base py-2"
                >
                  {t('header.fundraising')}
                </button>
                <button 
                  onClick={() => {
                    navigate('/report-issue');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base py-2"
                >
                  {t('header.reportIssue')}
                </button>
                <button 
                  onClick={() => {
                    navigate('/reports-history');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base py-2"
                >
                  {t('header.myReports')}
                </button>
                <button 
                  onClick={() => {
                    scrollToSection('faq');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-600 hover:text-[#52796F] font-medium transition-colors duration-200 text-base py-2"
                >
                  {t('header.faq')}
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default CitizenHeader;