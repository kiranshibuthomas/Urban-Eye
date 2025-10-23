import React, { useState, useEffect } from 'react';
import { getBaseURL } from '../utils/apiConfig';
import { 
  FiMapPin, 
  FiCalendar, 
  FiUser,
  FiImage,
  FiMessageSquare,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiMap,
  FiEye,
  FiEdit3,
  FiFlag,
  FiActivity,
  FiStar,
  FiThumbsUp,
  FiThumbsDown,
  FiMoreVertical,
  FiCopy,
  FiExternalLink,
  FiPlay,
  FiPause,
  FiCheck,
  FiUpload,
  FiFileText,
  FiCamera,
  FiNavigation
} from 'react-icons/fi';
import LeafletMapModal from './LeafletMapModal';
import toast from 'react-hot-toast';

const FieldStaffComplaintDetail = ({ complaint, onClose, onStatusUpdate, onWorkComplete }) => {
  const [showMap, setShowMap] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCompletingWork, setIsCompletingWork] = useState(false);
  const [showWorkCompletionForm, setShowWorkCompletionForm] = useState(false);
  const [workCompletionNotes, setWorkCompletionNotes] = useState('');
  const [selectedProofImages, setSelectedProofImages] = useState([]);
  const [progressNotes, setProgressNotes] = useState('');
  const [showProgressForm, setShowProgressForm] = useState(false);

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FiClock className="h-5 w-5" />,
      assigned: <FiPlay className="h-5 w-5" />,
      in_progress: <FiActivity className="h-5 w-5" />,
      work_completed: <FiCheckCircle className="h-5 w-5" />,
      resolved: <FiCheckCircle className="h-5 w-5" />,
      rejected: <FiXCircle className="h-5 w-5" />,
      closed: <FiXCircle className="h-5 w-5" />
    };
    return icons[status] || <FiClock className="h-5 w-5" />;
  };

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

  const handleStartWork = async () => {
    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(complaint._id, 'in_progress', 'Started working on the complaint');
      toast.success('Work started successfully');
    } catch (error) {
      toast.error('Failed to start work');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!progressNotes.trim()) {
      toast.error('Please provide progress notes');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(complaint._id, 'in_progress', progressNotes);
      toast.success('Progress updated successfully');
      setProgressNotes('');
      setShowProgressForm(false);
    } catch (error) {
      toast.error('Failed to update progress');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCompleteWork = async () => {
    if (!workCompletionNotes.trim()) {
      toast.error('Please provide completion notes');
      return;
    }

    setIsCompletingWork(true);
    try {
      await onWorkComplete(complaint._id, workCompletionNotes, selectedProofImages);
      toast.success('Work completed successfully');
      setWorkCompletionNotes('');
      setSelectedProofImages([]);
      setShowWorkCompletionForm(false);
    } catch (error) {
      toast.error('Failed to complete work');
    } finally {
      setIsCompletingWork(false);
    }
  };

  const handleProofImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedProofImages(files);
  };

  const copyCoordinates = () => {
    const coords = `${complaint.location.coordinates[1]}, ${complaint.location.coordinates[0]}`;
    navigator.clipboard.writeText(coords);
    toast.success('Coordinates copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{getCategoryIcon(complaint.category)}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{complaint.title}</h2>
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
            {getStatusIcon(complaint.status)}
            <span className="ml-2 capitalize">{complaint.status.replace('_', ' ')}</span>
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getPriorityColor(complaint.priority)}`}>
            <FiFlag className="h-4 w-4 mr-2" />
            <span className="capitalize">{complaint.priority} Priority</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FiMessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                Description
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>

            {/* Images Gallery */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiImage className="h-5 w-5 mr-2 text-green-600" />
                  Photos ({complaint.images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {complaint.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative cursor-pointer group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={`${getBaseURL()}${image.url}`}
                        alt={`Complaint image ${index + 1}`}
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

            {/* Work Proof Images */}
            {complaint.workProofImages && complaint.workProofImages.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiCheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Work Proof Images ({complaint.workProofImages.length})
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
                        alt={`Work proof ${index + 1}`}
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

            {/* Work Completion Notes */}
            {complaint.workCompletionNotes && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                  <FiCheckCircle className="h-5 w-5 mr-2" />
                  Work Completion Notes
                </h3>
                <p className="text-green-800 leading-relaxed whitespace-pre-wrap">
                  {complaint.workCompletionNotes}
                </p>
                {complaint.workCompletedAt && (
                  <div className="flex items-center mt-4 text-green-700">
                    <FiCalendar className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">
                      Completed on {formatDate(complaint.workCompletedAt)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Admin Notes Timeline */}
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
            {/* Location Card */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiMapPin className="h-5 w-5 mr-2 text-red-600" />
                Location
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-900 font-medium text-sm">{complaint.address}</p>
                  <p className="text-gray-600 text-sm">{complaint.city}</p>
                  {complaint.pincode && (
                    <p className="text-gray-600 text-sm">{complaint.pincode}</p>
                  )}
                </div>
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <button
                    onClick={() => setShowMap(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                  >
                    <FiMap className="h-4 w-4 mr-2" />
                    View on Map
                  </button>
                  <button
                    onClick={copyCoordinates}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
                  >
                    <FiCopy className="h-4 w-4 mr-2" />
                    Copy Coordinates
                  </button>
                </div>
                <div className="text-xs text-gray-500 bg-white rounded-lg p-3 border">
                  <p><strong>Coordinates:</strong></p>
                  <p className="font-mono">
                    {complaint.location.coordinates[1].toFixed(6)}, {complaint.location.coordinates[0].toFixed(6)}
                  </p>
                </div>
              </div>
            </div>

            {/* Reporter Info */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiUser className="h-5 w-5 mr-2 text-indigo-600" />
                Reported By
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

            {/* Assignment Info */}
            {complaint.assignedToFieldStaff && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiUser className="h-5 w-5 mr-2 text-green-600" />
                  Assigned To
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FiUser className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{complaint.assignedToFieldStaff.name}</p>
                    <p className="text-xs text-gray-600">{complaint.assignedToFieldStaff.department}</p>
                    {complaint.fieldStaffAssignedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Assigned {formatDate(complaint.fieldStaffAssignedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiActivity className="h-5 w-5 mr-2 text-blue-600" />
                Actions
              </h3>
              <div className="space-y-3">
                {complaint.status === 'assigned' && (
                  <button
                    onClick={handleStartWork}
                    disabled={isUpdatingStatus}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 text-sm font-medium"
                  >
                    <FiPlay className="h-4 w-4 mr-2" />
                    {isUpdatingStatus ? 'Starting...' : 'Start Work'}
                  </button>
                )}

                {complaint.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => setShowProgressForm(true)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-sm font-medium"
                    >
                      <FiEdit3 className="h-4 w-4 mr-2" />
                      Update Progress
                    </button>
                    <button
                      onClick={() => setShowWorkCompletionForm(true)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                    >
                      <FiCheck className="h-4 w-4 mr-2" />
                      Complete Work
                    </button>
                  </>
                )}

                {complaint.status === 'work_completed' && (
                  <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <FiCheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-purple-800">Work Completed</p>
                    <p className="text-xs text-purple-600">Waiting for admin approval</p>
                  </div>
                )}

                {complaint.status === 'resolved' && (
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <FiCheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-800">Work Approved</p>
                    <p className="text-xs text-green-600">Complaint resolved</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Update Form */}
        {showProgressForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Progress</h3>
              <textarea
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
                placeholder="Describe the progress made on this complaint..."
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowProgressForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProgress}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Update Progress'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Work Completion Form */}
        {showWorkCompletionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Work</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Completion Notes *
                </label>
                <textarea
                  value={workCompletionNotes}
                  onChange={(e) => setWorkCompletionNotes(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Describe what work was completed, materials used, time taken, etc..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof Images (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleProofImageChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                {selectedProofImages.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedProofImages.length} image(s) selected
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowWorkCompletionForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteWork}
                  disabled={isCompletingWork}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isCompletingWork ? 'Completing...' : 'Complete Work'}
                </button>
              </div>
            </div>
          </div>
        )}
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
                src={`${getBaseURL()}${selectedImage.url}`}
                alt="Complaint image"
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Leaflet Map Modal */}
      {showMap && complaint && (
        <LeafletMapModal
          isOpen={showMap}
          onClose={() => setShowMap(false)}
          latitude={complaint.location.coordinates[1]}
          longitude={complaint.location.coordinates[0]}
          address={`${complaint.address}, ${complaint.city}`}
          title={complaint.title}
        />
      )}
    </div>
  );
};

export default FieldStaffComplaintDetail;

