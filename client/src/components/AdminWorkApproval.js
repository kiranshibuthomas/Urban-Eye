import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiImage,
  FiUser,
  FiCalendar,
  FiMapPin,
  FiMessageSquare,
  FiThumbsUp,
  FiThumbsDown,
  FiAlertCircle,
  FiClock,
  FiCheck,
  FiX,
  FiDownload,
  FiExternalLink
} from 'react-icons/fi';
import { getBaseURL } from '../utils/apiConfig';
import toast from 'react-hot-toast';

const AdminWorkApproval = ({ complaint, onApprove, onReject, onClose }) => {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = async () => {
    if (!approvalNotes.trim()) {
      toast.error('Please provide approval notes');
      return;
    }

    setIsLoading(true);
    try {
      await onApprove(complaint._id, approvalNotes);
      toast.success('Work approved successfully! ✅');
      onClose();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(`Failed to approve work: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide rejection reason');
      return;
    }

    setIsLoading(true);
    try {
      await onReject(complaint._id, rejectionReason);
      toast.success('Work rejected successfully! ❌');
      onClose();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error(`Failed to reject work: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Work Approval Review</h2>
              <p className="text-gray-600 mt-1">{complaint.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Work Completion Details */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <FiCheckCircle className="h-5 w-5 mr-2" />
                  Work Completion Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">Completion Notes:</h4>
                    <p className="text-green-700 bg-white rounded-lg p-3 border border-green-200 leading-relaxed">
                      {complaint.workCompletionNotes}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">Completed At:</h4>
                      <div className="flex items-center text-green-700">
                        <FiCalendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {formatDate(complaint.workCompletedAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">Completion Time:</h4>
                      <div className="flex items-center text-green-700">
                        <FiClock className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {complaint.fieldStaffAssignedAt 
                            ? `${Math.round((new Date(complaint.workCompletedAt) - new Date(complaint.fieldStaffAssignedAt)) / (1000 * 60 * 60))} hours`
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {complaint.workProofImages && complaint.workProofImages.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">Proof Images:</h4>
                      <p className="text-green-700 text-sm">
                        {complaint.workProofImages.length} image{complaint.workProofImages.length > 1 ? 's' : ''} uploaded as proof of work completion
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Proof Images */}
              {complaint.workProofImages && complaint.workProofImages.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiImage className="h-5 w-5 mr-2 text-blue-600" />
                    Proof Images ({complaint.workProofImages.length})
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {complaint.workProofImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative cursor-pointer group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={`${getBaseURL()}${image.url}`}
                          alt={`Proof image ${index + 1}`}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                          <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <FiEye className="h-4 w-4 text-gray-800" />
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1">
                          <span className="text-xs font-medium text-gray-700">{index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiClock className="h-5 w-5 mr-2 text-blue-600" />
                  Complete Status Timeline
                </h3>
                
                <div className="space-y-4">
                  {/* Complaint Created */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiMessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-blue-800 text-sm font-medium">Complaint Created</p>
                        <p className="text-blue-700 text-sm mt-1">{complaint.description}</p>
                        <div className="flex items-center mt-2 text-xs text-blue-600">
                          <FiCalendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(complaint.createdAt)}</span>
                          <span className="mx-2">•</span>
                          <span>Status: {complaint.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Assignment */}
                  {complaint.assignedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <FiUser className="h-4 w-4 text-orange-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                          <p className="text-orange-800 text-sm font-medium">Assigned to Admin</p>
                          <p className="text-orange-700 text-sm mt-1">Complaint assigned for review and processing</p>
                          <div className="flex items-center mt-2 text-xs text-orange-600">
                            <FiCalendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(complaint.assignedAt)}</span>
                            <span className="mx-2">•</span>
                            <span>Status: assigned</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Field Staff Assignment */}
                  {complaint.fieldStaffAssignedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FiUser className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <p className="text-green-800 text-sm font-medium">Assigned to Field Staff</p>
                          <p className="text-green-700 text-sm mt-1">
                            Assigned to {complaint.assignedToFieldStaff?.name} ({complaint.assignedToFieldStaff?.department})
                          </p>
                          <div className="flex items-center mt-2 text-xs text-green-600">
                            <FiCalendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(complaint.fieldStaffAssignedAt)}</span>
                            <span className="mx-2">•</span>
                            <span>Status: assigned</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Work Started */}
                  {complaint.status === 'in_progress' && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <FiClock className="h-4 w-4 text-yellow-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                          <p className="text-yellow-800 text-sm font-medium">Work Started</p>
                          <p className="text-yellow-700 text-sm mt-1">Field staff has started working on the complaint</p>
                          <div className="flex items-center mt-2 text-xs text-yellow-600">
                            <FiCalendar className="h-3 w-3 mr-1" />
                            <span>Status: in_progress</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Work Completed */}
                  {complaint.workCompletedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <FiCheckCircle className="h-4 w-4 text-purple-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                          <p className="text-purple-800 text-sm font-medium">Work Completed</p>
                          <p className="text-purple-700 text-sm mt-1">{complaint.workCompletionNotes}</p>
                          <div className="flex items-center mt-2 text-xs text-purple-600">
                            <FiCalendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(complaint.workCompletedAt)}</span>
                            <span className="mx-2">•</span>
                            <span>Status: work_completed</span>
                          </div>
                          {complaint.workProofImages && complaint.workProofImages.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-purple-600 font-medium">
                                Proof Images: {complaint.workProofImages.length} uploaded
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Work Rejected (if applicable) */}
                  {complaint.workRejectedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <FiXCircle className="h-4 w-4 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <p className="text-red-800 text-sm font-medium">Work Rejected</p>
                          <p className="text-red-700 text-sm mt-1">{complaint.workRejectionReason}</p>
                          <div className="flex items-center mt-2 text-xs text-red-600">
                            <FiCalendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(complaint.workRejectedAt)}</span>
                            <span className="mx-2">•</span>
                            <span>Status: in_progress (reassigned)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Work Approved (if applicable) */}
                  {complaint.status === 'resolved' && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FiCheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <p className="text-green-800 text-sm font-medium">Work Approved & Resolved</p>
                          <p className="text-green-700 text-sm mt-1">Complaint has been successfully resolved</p>
                          <div className="flex items-center mt-2 text-xs text-green-600">
                            <FiCalendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(complaint.resolvedAt || complaint.lastUpdated)}</span>
                            <span className="mx-2">•</span>
                            <span>Status: resolved</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Notes Timeline */}
                  {complaint.adminNotes && complaint.adminNotes.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Admin Notes & Updates</h4>
                      <div className="space-y-3">
                        {complaint.adminNotes.map((note, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <FiUser className="h-3 w-3 text-gray-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <p className="text-gray-800 text-sm leading-relaxed">{note.note}</p>
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                  <span className="font-medium text-gray-700">{note.addedBy?.name || 'Admin'}</span>
                                  <span className="mx-2">•</span>
                                  <FiCalendar className="h-3 w-3 mr-1" />
                                  <span>{formatDate(note.addedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Original Complaint Details */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiMessageSquare className="h-5 w-5 mr-2 text-gray-600" />
                  Original Complaint Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Description:</h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {complaint.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1">Category:</h4>
                      <p className="text-gray-600 capitalize">{complaint.category?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1">Priority:</h4>
                      <p className="text-gray-600 capitalize">{complaint.priority}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1">Complaint ID:</h4>
                      <p className="text-gray-600 font-mono text-sm">{complaint.complaintId}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1">Created:</h4>
                      <p className="text-gray-600">{formatDate(complaint.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Field Staff Info */}
              {complaint.assignedToFieldStaff && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <FiUser className="h-5 w-5 mr-2" />
                    Field Staff
                  </h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiUser className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900 text-sm">{complaint.assignedToFieldStaff.name}</p>
                      <p className="text-xs text-blue-600">{complaint.assignedToFieldStaff.department}</p>
                      {complaint.fieldStaffAssignedAt && (
                        <p className="text-xs text-blue-500 mt-1">
                          Assigned {formatDate(complaint.fieldStaffAssignedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiMapPin className="h-5 w-5 mr-2 text-red-600" />
                  Location
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-900 font-medium text-sm">{complaint.address}</p>
                  <p className="text-gray-600 text-sm">{complaint.city}</p>
                  {complaint.pincode && (
                    <p className="text-gray-600 text-sm">{complaint.pincode}</p>
                  )}
                </div>
                <button
                  onClick={() => window.open(`https://maps.google.com/?q=${complaint.location.coordinates[1]},${complaint.location.coordinates[0]}`, '_blank')}
                  className="w-full mt-3 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <FiExternalLink className="h-4 w-4 mr-2" />
                  View on Maps
                </button>
              </div>

              {/* Approval Actions */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiCheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Approval Decision
                </h3>
                
                {!showRejectionForm ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approval Notes *
                      </label>
                      <textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Add your approval notes..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={handleApprove}
                        disabled={isLoading || !approvalNotes.trim()}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <FiClock className="h-4 w-4 mr-2 animate-spin" />
                            Approving...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <FiThumbsUp className="h-4 w-4 mr-2" />
                            Approve Work
                          </div>
                        )}
                      </button>
                      
                      <button
                        onClick={() => setShowRejectionForm(true)}
                        disabled={isLoading}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                      >
                        <div className="flex items-center justify-center">
                          <FiThumbsDown className="h-4 w-4 mr-2" />
                          Reject
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason *
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why the work is being rejected..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={handleReject}
                        disabled={isLoading || !rejectionReason.trim()}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <FiClock className="h-4 w-4 mr-2 animate-spin" />
                            Rejecting...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <FiXCircle className="h-4 w-4 mr-2" />
                            Reject Work
                          </div>
                        )}
                      </button>
                      
                      <button
                        onClick={() => setShowRejectionForm(false)}
                        disabled={isLoading}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 z-10"
            >
              <FiX className="h-10 w-10" />
            </button>
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
              <img
                src={`${getBaseURL()}${selectedImage.url}`}
                alt="Proof image"
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkApproval;


