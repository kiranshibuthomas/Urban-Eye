import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiAlertTriangle, 
  FiTrash2, 
  FiUserX, 
  FiDownload,
  FiLock,
  FiCheck,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const UserDeletionModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onSoftDelete, 
  onHardDelete 
}) => {
  const [step, setStep] = useState(1); // 1: Choose type, 2: Soft delete, 3: Hard delete steps
  const [deletionType, setDeletionType] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [reason, setReason] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportedData, setExportedData] = useState(null);
  const [hardDeleteSteps, setHardDeleteSteps] = useState({
    dataExported: false,
    reasonProvided: false,
    confirmationEntered: false,
    passwordVerified: false
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDeletionType('');
      setConfirmationCode('');
      setReason('');
      setAdminPassword('');
      setShowPassword(false);
      setIsExporting(false);
      setIsDeleting(false);
      setExportedData(null);
      setValidationErrors({});
      setHardDeleteSteps({
        dataExported: false,
        reasonProvided: false,
        confirmationEntered: false,
        passwordVerified: false
      });
    }
  }, [isOpen]);

  // Update hard delete steps (data export is optional)
  useEffect(() => {
    setHardDeleteSteps({
      dataExported: true, // Always true since it's optional
      reasonProvided: reason.trim().length >= 10,
      confirmationEntered: confirmationCode === user?.email,
      passwordVerified: adminPassword.length >= 6
    });
  }, [reason, confirmationCode, adminPassword, user?.email]);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/users/${user._id}/export-data`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setExportedData(data.data);
        
        // Download the data as JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user_data_${user.email}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('User data exported successfully');
      } else {
        toast.error(data.message || 'Failed to export user data');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export user data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSoftDelete = async () => {
    setIsDeleting(true);
    try {
      await onSoftDelete(user._id);
      onClose();
    } catch (error) {
      console.error('Soft delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFieldError = (field) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleHardDelete = async () => {
    // Clear previous errors
    setValidationErrors({});

    if (!Object.values(hardDeleteSteps).every(Boolean)) {
      toast.error('Please complete all required steps');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${user._id}/hard-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          confirmationCode,
          reason,
          adminPassword,
          dataExported: exportedData !== null
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        onClose();
        // Call the parent's onHardDelete for any additional cleanup
        if (onHardDelete) {
          onHardDelete(user._id, { success: true });
        }
      } else {
        // Handle field-specific errors
        if (data.field) {
          setValidationErrors({ [data.field]: data.message });
          
          // Clear specific fields based on error type
          if (data.field === 'adminPassword') {
            setAdminPassword('');
            toast.error('Invalid admin password. Please re-enter your password.');
          } else if (data.field === 'confirmationCode') {
            setConfirmationCode('');
            toast.error('Invalid email confirmation. Please re-enter the user\'s email address.');

          }
        } else {
          toast.error(data.message || 'Failed to delete user permanently');
        }
      }
    } catch (error) {
      console.error('Hard delete error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const canProceedToHardDelete = Object.values(hardDeleteSteps).every(Boolean);

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <FiTrash2 className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Delete User Account
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">Role: {user.role}</p>
                </div>
              </div>
            </div>

            {/* Step 1: Choose Deletion Type */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Choose Deletion Type
                </h3>

                {/* Soft Delete Option */}
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    deletionType === 'soft' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setDeletionType('soft')}
                >
                  <div className="flex items-start">
                    <FiUserX className="h-6 w-6 text-blue-600 mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Soft Delete (Deactivate)
                      </h4>
                      <p className="text-gray-600 text-sm mt-1">
                        Deactivate the user account. The user will be unable to login, 
                        but all data remains in the system and can be restored later.
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Reversible
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hard Delete Option */}
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    deletionType === 'hard' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setDeletionType('hard')}
                >
                  <div className="flex items-start">
                    <FiAlertTriangle className="h-6 w-6 text-red-600 mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Hard Delete (Permanent)
                      </h4>
                      <p className="text-gray-600 text-sm mt-1">
                        Permanently delete the user and all associated data including 
                        complaints, images, and personal information. This action cannot be undone.
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Irreversible
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (deletionType === 'soft') {
                        setStep(2);
                      } else if (deletionType === 'hard') {
                        setStep(3);
                      }
                    }}
                    disabled={!deletionType}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Soft Delete Confirmation */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center">
                  <FiUserX className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Confirm Account Deactivation
                  </h3>
                  <p className="text-gray-600">
                    This will deactivate <strong>{user.name}</strong>'s account. 
                    They will not be able to login, but all data will be preserved 
                    and the account can be reactivated later.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSoftDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? 'Deactivating...' : 'Deactivate User'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Hard Delete Process */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FiAlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Permanent Account Deletion
                  </h3>
                  <p className="text-red-600 font-medium mb-2">
                    ⚠️ This action cannot be undone!
                  </p>
                  <p className="text-sm text-gray-600">
                    Complete the required steps below. Data export is optional but recommended for compliance.
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="space-y-4">
                  {/* Step 1: Export Data (Optional) */}
                  <motion.div 
                    className={`border rounded-lg p-4 transition-all duration-300 ${
                      exportedData ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                    animate={{
                      borderColor: exportedData ? '#10b981' : '#d1d5db',
                      backgroundColor: exportedData ? '#f0fdf4' : '#ffffff'
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <motion.div 
                          className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 ${
                            exportedData ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          animate={{
                            backgroundColor: exportedData ? '#10b981' : '#3b82f6',
                            scale: exportedData ? [1, 1.1, 1] : 1
                          }}
                          transition={{ 
                            backgroundColor: { duration: 0.3 },
                            scale: { duration: 0.4, ease: "easeInOut" }
                          }}
                        >
                          <AnimatePresence mode="wait">
                            {exportedData ? (
                              <motion.div
                                key="check"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ duration: 0.3 }}
                              >
                                <FiCheck className="h-4 w-4 text-white" />
                              </motion.div>
                            ) : (
                              <motion.span
                                key="number"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="text-white text-sm"
                              >
                                1
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Export User Data <span className="text-gray-500">(Optional)</span>
                          </h4>
                          <p className="text-sm text-gray-600">
                            Download user data for compliance or backup purposes
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleExportData}
                        disabled={isExporting}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        <FiDownload className="h-4 w-4 mr-1" />
                        {isExporting ? 'Exporting...' : exportedData ? 'Re-export' : 'Export'}
                      </button>
                    </div>
                  </motion.div>

                  {/* Step 2: Provide Reason */}
                  <motion.div 
                    className={`border rounded-lg p-4 transition-all duration-300 ${
                      validationErrors.reason ? 'border-red-500 bg-red-50' :
                      hardDeleteSteps.reasonProvided ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                    animate={{
                      borderColor: validationErrors.reason ? '#ef4444' :
                                  hardDeleteSteps.reasonProvided ? '#10b981' : '#d1d5db',
                      backgroundColor: validationErrors.reason ? '#fef2f2' :
                                      hardDeleteSteps.reasonProvided ? '#f0fdf4' : '#ffffff'
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="flex items-start">
                      <motion.div 
                        className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 mt-1 ${
                          hardDeleteSteps.reasonProvided ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        animate={{
                          backgroundColor: hardDeleteSteps.reasonProvided ? '#10b981' : '#ef4444',
                          scale: hardDeleteSteps.reasonProvided ? [1, 1.1, 1] : 1
                        }}
                        transition={{ 
                          backgroundColor: { duration: 0.3 },
                          scale: { duration: 0.4, ease: "easeInOut" }
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {hardDeleteSteps.reasonProvided ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ duration: 0.3 }}
                            >
                              <FiCheck className="h-4 w-4 text-white" />
                            </motion.div>
                          ) : (
                            <motion.span
                              key="number"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="text-white text-sm"
                            >
                              2
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Deletion Reason <span className="text-red-500">*</span>
                        </h4>
                        <motion.textarea
                          value={reason}
                          onChange={(e) => {
                            setReason(e.target.value);
                            clearFieldError('reason');
                          }}
                          placeholder="Provide a detailed reason for permanent deletion (minimum 10 characters)..."
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            validationErrors.reason ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          rows={3}
                          animate={{
                            borderColor: validationErrors.reason ? '#ef4444' : '#d1d5db'
                          }}
                          transition={{ duration: 0.2 }}
                        />
                        <div className="flex justify-between items-center mt-1">
                          <motion.p 
                            className={`text-xs transition-colors duration-200 ${
                              reason.length >= 10 ? 'text-green-600' : 'text-gray-500'
                            }`}
                            animate={{
                              color: reason.length >= 10 ? '#16a34a' : '#6b7280'
                            }}
                          >
                            {reason.length}/10 characters minimum
                          </motion.p>
                          <AnimatePresence>
                            {validationErrors.reason && (
                              <motion.p 
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="text-xs text-red-600"
                              >
                                {validationErrors.reason}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Step 3: Confirmation Code */}
                  <motion.div 
                    className={`border rounded-lg p-4 transition-all duration-300 ${
                      validationErrors.confirmationCode ? 'border-red-500 bg-red-50' :
                      hardDeleteSteps.confirmationEntered ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                    animate={{
                      borderColor: validationErrors.confirmationCode ? '#ef4444' :
                                  hardDeleteSteps.confirmationEntered ? '#10b981' : '#d1d5db',
                      backgroundColor: validationErrors.confirmationCode ? '#fef2f2' :
                                      hardDeleteSteps.confirmationEntered ? '#f0fdf4' : '#ffffff'
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="flex items-start">
                      <motion.div 
                        className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 mt-1 ${
                          hardDeleteSteps.confirmationEntered ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        animate={{
                          backgroundColor: hardDeleteSteps.confirmationEntered ? '#10b981' : '#ef4444',
                          scale: hardDeleteSteps.confirmationEntered ? [1, 1.1, 1] : 1
                        }}
                        transition={{ 
                          backgroundColor: { duration: 0.3 },
                          scale: { duration: 0.4, ease: "easeInOut" }
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {hardDeleteSteps.confirmationEntered ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ duration: 0.3 }}
                            >
                              <FiCheck className="h-4 w-4 text-white" />
                            </motion.div>
                          ) : (
                            <motion.span
                              key="number"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="text-white text-sm"
                            >
                              3
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Confirmation Code <span className="text-red-500">*</span>
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Type the user's email address to confirm: <strong>{user.email}</strong>
                        </p>
                        <motion.input
                          type="text"
                          value={confirmationCode}
                          onChange={(e) => {
                            setConfirmationCode(e.target.value);
                            clearFieldError('confirmationCode');
                          }}
                          placeholder="Enter user's email address"
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            validationErrors.confirmationCode ? 'border-red-500 bg-red-50' : 
                            hardDeleteSteps.confirmationEntered ? 'border-green-500 bg-green-50' : 'border-gray-300'
                          }`}
                          animate={{
                            borderColor: validationErrors.confirmationCode ? '#ef4444' :
                                        hardDeleteSteps.confirmationEntered ? '#10b981' : '#d1d5db'
                          }}
                          transition={{ duration: 0.2 }}
                        />
                        <AnimatePresence>
                          {validationErrors.confirmationCode && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="text-sm text-red-600 mt-1"
                            >
                              {validationErrors.confirmationCode}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>

                  {/* Step 4: Admin Password */}
                  <motion.div 
                    className={`border rounded-lg p-4 transition-all duration-300 ${
                      validationErrors.adminPassword ? 'border-red-500 bg-red-50' :
                      hardDeleteSteps.passwordVerified ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                    animate={{
                      borderColor: validationErrors.adminPassword ? '#ef4444' :
                                  hardDeleteSteps.passwordVerified ? '#10b981' : '#d1d5db',
                      backgroundColor: validationErrors.adminPassword ? '#fef2f2' :
                                      hardDeleteSteps.passwordVerified ? '#f0fdf4' : '#ffffff'
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="flex items-start">
                      <motion.div 
                        className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 mt-1 ${
                          hardDeleteSteps.passwordVerified ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        animate={{
                          backgroundColor: hardDeleteSteps.passwordVerified ? '#10b981' : '#ef4444',
                          scale: hardDeleteSteps.passwordVerified ? [1, 1.1, 1] : 1
                        }}
                        transition={{ 
                          backgroundColor: { duration: 0.3 },
                          scale: { duration: 0.4, ease: "easeInOut" }
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {hardDeleteSteps.passwordVerified ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ duration: 0.3 }}
                            >
                              <FiCheck className="h-4 w-4 text-white" />
                            </motion.div>
                          ) : (
                            <motion.span
                              key="number"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="text-white text-sm"
                            >
                              4
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Admin Password Verification <span className="text-red-500">*</span>
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Enter your admin password to authorize this deletion
                        </p>
                        <div className="relative">
                          <motion.input
                            type={showPassword ? 'text' : 'password'}
                            value={adminPassword}
                            onChange={(e) => {
                              setAdminPassword(e.target.value);
                              clearFieldError('adminPassword');
                            }}
                            placeholder="Enter your admin password"
                            className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                              validationErrors.adminPassword ? 'border-red-500 bg-red-50' : 
                              hardDeleteSteps.passwordVerified ? 'border-green-500 bg-green-50' : 'border-gray-300'
                            }`}
                            animate={{
                              borderColor: validationErrors.adminPassword ? '#ef4444' :
                                          hardDeleteSteps.passwordVerified ? '#10b981' : '#d1d5db'
                            }}
                            transition={{ duration: 0.2 }}
                          />
                          <motion.button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <AnimatePresence mode="wait">
                              {showPassword ? (
                                <motion.div
                                  key="hide"
                                  initial={{ rotate: -90, opacity: 0 }}
                                  animate={{ rotate: 0, opacity: 1 }}
                                  exit={{ rotate: 90, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <FiEyeOff className="h-5 w-5" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="show"
                                  initial={{ rotate: 90, opacity: 0 }}
                                  animate={{ rotate: 0, opacity: 1 }}
                                  exit={{ rotate: -90, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <FiEye className="h-5 w-5" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </div>
                        <AnimatePresence>
                          {validationErrors.adminPassword && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="text-sm text-red-600 mt-1"
                            >
                              {validationErrors.adminPassword}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Final Warning */}
                <AnimatePresence>
                  {canProceedToHardDelete && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="bg-red-50 border border-red-200 rounded-lg p-4"
                    >
                      <motion.div 
                        className="flex items-start"
                        initial={{ x: -10 }}
                        animate={{ x: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        <motion.div
                          animate={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            rotate: { duration: 0.6, delay: 0.3 },
                            scale: { duration: 0.3, delay: 0.3 }
                          }}
                        >
                          <FiAlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                        </motion.div>
                        <div>
                          <motion.h4 
                            className="font-medium text-red-900"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            Final Warning
                          </motion.h4>
                          <motion.p 
                            className="text-red-700 text-sm mt-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            You are about to permanently delete <strong>{user.name}</strong> and all associated data. 
                            This includes all complaints, images, and personal information. This action cannot be undone.
                          </motion.p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <motion.div 
                  className="flex justify-end space-x-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <motion.button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={handleHardDelete}
                    disabled={!canProceedToHardDelete || isDeleting}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      canProceedToHardDelete && !isDeleting
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    whileHover={canProceedToHardDelete && !isDeleting ? { scale: 1.02 } : {}}
                    whileTap={canProceedToHardDelete && !isDeleting ? { scale: 0.98 } : {}}
                    animate={{
                      backgroundColor: canProceedToHardDelete && !isDeleting ? '#dc2626' : '#d1d5db'
                    }}
                  >
                    <motion.span
                      animate={isDeleting ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                      transition={isDeleting ? { repeat: Infinity, duration: 1 } : {}}
                    >
                      {isDeleting ? 'Deleting...' : 'Permanently Delete User'}
                    </motion.span>
                  </motion.button>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserDeletionModal;