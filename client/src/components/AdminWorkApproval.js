import React, { useState } from 'react';
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
  FiEdit3,
  FiFlag,
  FiActivity,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminWorkApproval = ({ complaint, onApprove, onReject, onClose }) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      assigned: 'bg-orange-100 text-orange-800 border-orange-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      work_completed: 'bg-purple-100 text-purple-800 border-purple-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      road_issues: '🛣️',
      water_supply: '💧',
      electricity: '⚡',
      waste_management: '🗑️',
      public_transport: '🚌',
      parks_recreation: '🌳',
      street_lighting: '💡',
      drainage: '🌊',
      noise_pollution: '🔊',
      air_pollution: '🌫️',
      safety_security: '🛡️',
      other: '📋'
    };
    return icons[category] || '📋';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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

    setIsApproving(true);
    try {
      await onApprove(complaint._id, approvalNotes);
      toast.success('Work approved successfully');
    } catch (error) {
      toast.error('Failed to approve work');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide rejection reason');
      return;
    }

    setIsRejecting(true);
    try {
      await onReject(complaint._id, rejectionReason);
      toast.success('Work rejected');
    } catch (error) {
      toast.error('Failed to reject work');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{getCategoryIcon(complaint.category)}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Review Completed Work</h2>
              <p className="text-gray-500 font-mono text-sm">ID: {complaint.complaintId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiXCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Status and Priority Badges */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(complaint.status)}`}>
            <FiCheckCircle className="h-4 w-4 mr-2" />
            <span className="capitalize">{complaint.status.replace('_', ' ')}</span>
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getPriorityColor(complaint.priority)}`}>
            <FiFlag className="h-4 w-4 mr-2" />
            <span className="capitalize">{complaint.priority} Priority</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Original Complaint */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FiMessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                Original Complaint
              </h3>
              <div className="mb-3">
                <h4 className="font-semibold text-gray-900">{complaint.title}</h4>
                <p className="text-gray-700 text-sm mt-1">{complaint.description}</p>
              </div>
              <div className="text-xs text-gray-500">
                <p><strong>Location:</strong> {complaint.address}, {complaint.city}</p>
                <p><strong>Submitted:</strong> {formatDate(complaint.submittedAt)}</p>
              </div>
            </div>

            {/* Work Completion Details */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                <FiCheckCircle className="h-5 w-5 mr-2" />
                Work Completion Details
              </h3>
              {complaint.workCompletionNotes ? (
                <div className="mb-4">
                  <p className="text-green-800 leading-relaxed whitespace-pre-wrap">
                    {complaint.workCompletionNotes}
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-green-700 italic">No completion notes provided by field staff.</p>
                </div>
              )}
              <div className="text-sm text-green-700">
                <p><strong>Completed by:</strong> {complaint.assignedToFieldStaff?.name || 'Unknown'}</p>
                <p><strong>Department:</strong> {complaint.assignedToFieldStaff?.department || 'Unknown'}</p>
                <p><strong>Completed on:</strong> {complaint.workCompletedAt ? formatDate(complaint.workCompletedAt) : 'Not specified'}</p>
              </div>
            </div>

            {/* Work Proof Images */}
            {complaint.workProofImages && complaint.workProofImages.length > 0 ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <FiImage className="h-5 w-5 mr-2 text-blue-600" />
                  Work Proof Images ({complaint.workProofImages.length})
                </h3>
                <p className="text-blue-700 text-sm mb-4">
                  These images show the completed work as submitted by the field staff. Click on any image to view it in full size.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {complaint.workProofImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative cursor-pointer group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={`http://localhost:5000${image.url}`}
                        alt={`Work proof ${index + 1}`}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <FiEye className="h-4 w-4 text-gray-800" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Proof Image {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
                  <FiAlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                  No Proof Images Provided
                </h3>
                <p className="text-yellow-700 text-sm">
                  The field staff did not upload any proof images for this completed work. You may want to request additional documentation before approving.
                </p>
              </div>
            )}

            {/* Original Images for Reference */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiImage className="h-5 w-5 mr-2 text-blue-600" />
                  Original Complaint Images ({complaint.images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {complaint.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative cursor-pointer group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={`http://localhost:5000${image.url}`}
                        alt={`Original image ${index + 1}`}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <FiEye className="h-4 w-4 text-gray-800" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            {complaint.adminNotes && complaint.adminNotes.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiActivity className="h-5 w-5 mr-2 text-purple-600" />
                  Activity Timeline
                </h3>
                <div className="space-y-4">
                  {complaint.adminNotes.map((note, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <FiUser className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-gray-800 text-sm leading-relaxed">{note.note}</p>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <span className="font-medium text-gray-700">{note.addedBy.name}</span>
                              <span className="mx-2">•</span>
                              <FiCalendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(note.addedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Field Staff Info */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiUser className="h-5 w-5 mr-2 text-green-600" />
                Field Staff
              </h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiUser className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{complaint.assignedToFieldStaff?.name}</p>
                  <p className="text-sm text-gray-600">{complaint.assignedToFieldStaff?.department}</p>
                  <p className="text-xs text-gray-500">
                    Assigned {formatDate(complaint.fieldStaffAssignedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Reporter Info */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiUser className="h-5 w-5 mr-2 text-indigo-600" />
                Reporter
              </h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <FiUser className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{complaint.citizenName}</p>
                  {!complaint.isAnonymous && (
                    <p className="text-xs text-gray-600">{complaint.citizenEmail}</p>
                  )}
                  {complaint.isAnonymous && (
                    <p className="text-xs text-gray-500 italic">Anonymous Report</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Info */}
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
            </div>

            {/* Approval Actions */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiCheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                Review Actions
              </h3>
              
              {/* Review Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Review Guidelines:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Verify that the work completion notes are detailed and accurate</li>
                  <li>• Check proof images to ensure work quality meets standards</li>
                  <li>• Confirm that the work addresses the original complaint</li>
                  <li>• Provide clear approval notes for the citizen</li>
                </ul>
              </div>

              <div className="space-y-4">
                {/* Approval Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Notes *
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Add notes about the work quality, completion status, and any feedback for the citizen..."
                  />
                  <p className="text-xs text-gray-500 mt-1">These notes will be included in the email notification to the citizen.</p>
                </div>

                {/* Rejection Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Explain why the work is being rejected and what needs to be improved..."
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be sent to the field staff for corrections.</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting || !approvalNotes.trim()}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                  >
                    <FiThumbsUp className="h-4 w-4 mr-2" />
                    {isApproving ? 'Approving...' : 'Approve Work & Notify Citizen'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isApproving || isRejecting || !rejectionReason.trim()}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                  >
                    <FiThumbsDown className="h-4 w-4 mr-2" />
                    {isRejecting ? 'Rejecting...' : 'Reject Work & Return to Field Staff'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-70 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 z-10"
            >
              <FiXCircle className="h-10 w-10" />
            </button>
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
              <img
                src={`http://localhost:5000${selectedImage.url}`}
                alt="Work proof"
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

