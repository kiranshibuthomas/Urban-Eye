import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiCalendar, 
  FiEdit3, 
  FiSave, 
  FiX,
  FiSettings,
  FiLogOut,
  FiChevronDown
} from 'react-icons/fi';
import { FaCity } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ProfileImageUpload from '../components/ProfileImageUpload';

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const profileImageRef = useRef(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    zipCode: user?.zipCode || ''
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true, state: {} });
  };

  // Update form data when user data changes
  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      zipCode: user?.zipCode || ''
    });
  }, [user]);

  // Handle hover-based dropdown behavior
  const handleMouseEnter = () => {
    setUserMenuOpen(true);
  };

  const handleMouseLeave = () => {
    setUserMenuOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First, handle avatar upload if there's a new image
      let updatedUser = user;
      if (profileImageRef.current && profileImageRef.current.hasChanges()) {
        const avatarResult = await profileImageRef.current.uploadAvatar();
        if (avatarResult.success) {
          updatedUser = avatarResult.user;
        } else {
          toast.error(avatarResult.message || 'Failed to upload avatar');
          setIsSaving(false);
          return;
        }
      }

      // Then update profile data
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update user context with new data
        updateUser(data.user);
        
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      zipCode: user?.zipCode || ''
    });
    
    // Reset profile image component if it exists
    if (profileImageRef.current) {
      profileImageRef.current.handleCancel();
    }
    
    setIsEditing(false);
  };

  // For admin users, show read-only profile (no editing)
  const isAdmin = user?.role === 'admin';


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
                  <p className="text-sm text-gray-500 -mt-1">Profile</p>
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
                <div className="h-10 w-10 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-xl flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-10 w-10 rounded-xl object-cover"
                      onError={(e) => {
                        console.error('Profile header avatar failed to load:', user.avatar);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      onLoad={() => {
                        console.log('Profile header avatar loaded successfully:', user.avatar);
                      }}
                    />
                  ) : null}
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${user?.avatar ? 'hidden' : 'flex'}`}>
                    <FiUser className="h-5 w-5 text-white" />
                  </div>
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
                        onClick={() => navigate('/profile')}
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
          <div className="space-y-8">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-6">
                  <div className="h-24 w-24 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-2xl flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-24 w-24 rounded-2xl object-cover"
                        onError={(e) => {
                          console.error('Profile main avatar failed to load:', user.avatar);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={() => {
                          console.log('Profile main avatar loaded successfully:', user.avatar);
                        }}
                      />
                    ) : null}
                    <div className={`h-24 w-24 rounded-2xl flex items-center justify-center ${user?.avatar ? 'hidden' : 'flex'}`}>
                      <FiUser className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-[#2F3E46] mb-2">
                      {user?.name || 'User Profile'}
                    </h1>
                    <p className="text-[#354F52] text-lg">{user?.email}</p>
                    <span className="inline-flex items-center px-3 py-1 mt-2 text-sm font-medium bg-[#CAD2C5]/30 text-[#354F52] rounded-full capitalize">
                      {user?.role || 'Citizen'}
                    </span>
                  </div>
                </div>
                {!isAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#52796F] text-white rounded-xl hover:bg-[#354F52] transition-all duration-200 font-medium"
                  >
                    <FiEdit3 className="h-4 w-4" />
                    <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Profile Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-8"
            >
              <h2 className="text-2xl font-bold text-[#2F3E46] mb-6">Personal Information</h2>
              
              {/* Profile Image Upload - Only show in edit mode */}
              {isEditing && !isAdmin && (
                <div className="mb-8 pb-6 border-b border-gray-200">
                  <ProfileImageUpload 
                    ref={profileImageRef}
                    user={user} 
                    onAvatarUpdate={(updatedUser) => {
                      updateUser(updatedUser);
                    }}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#354F52] mb-3">
                    Full Name
                  </label>
                  {isEditing && !isAdmin ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200"
                    />
                  ) : (
                    <p className="text-[#2F3E46] font-medium py-3">{user?.name || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#354F52] mb-3">
                    Email Address
                    {user?.googleId && (
                      <span className="ml-2 text-xs text-gray-500">(Linked to Google Account)</span>
                    )}
                  </label>
                  {isEditing && !isAdmin ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={user?.googleId} // Disable for Google OAuth users
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200 ${
                        user?.googleId ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      title={user?.googleId ? 'Email cannot be changed for Google accounts' : ''}
                    />
                  ) : (
                    <p className="text-[#2F3E46] font-medium py-3">{user?.email || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#354F52] mb-3">
                    Phone Number
                  </label>
                  {isEditing && !isAdmin ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200"
                    />
                  ) : (
                    <p className="text-[#2F3E46] font-medium py-3">{user?.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#354F52] mb-3">
                    Address
                  </label>
                  {isEditing && !isAdmin ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200"
                    />
                  ) : (
                    <p className="text-[#2F3E46] font-medium py-3">{user?.address || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#354F52] mb-3">
                    City
                  </label>
                  {isEditing && !isAdmin ? (
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200"
                    />
                  ) : (
                    <p className="text-[#2F3E46] font-medium py-3">{user?.city || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#354F52] mb-3">
                    ZIP Code
                  </label>
                  {isEditing && !isAdmin ? (
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all duration-200"
                    />
                  ) : (
                    <p className="text-[#2F3E46] font-medium py-3">{user?.zipCode || 'Not provided'}</p>
                  )}
                </div>
              </div>

              {isEditing && !isAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                  >
                    <FiX className="h-4 w-4" />
                    <span>Cancel</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-6 py-3 bg-[#52796F] text-white rounded-xl hover:bg-[#354F52] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FiSave className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>

            {/* Account Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#84A98C]/30 p-8"
            >
              <h2 className="text-2xl font-bold text-[#2F3E46] mb-6">Account Statistics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-r from-[#CAD2C5]/20 to-[#84A98C]/20 rounded-xl">
                  <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FiCalendar className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#2F3E46] mb-2">Member Since</h3>
                  <p className="text-[#354F52]">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-r from-[#CAD2C5]/20 to-[#84A98C]/20 rounded-xl">
                  <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FiUser className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#2F3E46] mb-2">Account Type</h3>
                  <p className="text-[#354F52] capitalize">{user?.role || 'Citizen'}</p>
                </div>

                <div className="text-center p-6 bg-gradient-to-r from-[#CAD2C5]/20 to-[#84A98C]/20 rounded-xl">
                  <div className="h-12 w-12 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FiMail className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#2F3E46] mb-2">Email Status</h3>
                  <p className="text-[#354F52]">
                    {user?.isEmailVerified ? 'Verified' : 'Pending Verification'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
