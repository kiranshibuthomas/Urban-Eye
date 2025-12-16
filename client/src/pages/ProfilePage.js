import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiCalendar, 
  FiEdit3, 
  FiSave, 
  FiX
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import toast from 'react-hot-toast';
import ProfileImageUpload from '../components/ProfileImageUpload';
import CitizenHeader from '../components/CitizenHeader';

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const { logout: sessionLogout } = useSession();
  const navigate = useNavigate();

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
      <CitizenHeader />

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
                    <img
                      src={user?.avatar}
                      alt={user?.name || 'User'}
                      className="h-24 w-24 rounded-2xl object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden h-24 w-24 rounded-2xl items-center justify-center text-white text-3xl font-bold">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
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
