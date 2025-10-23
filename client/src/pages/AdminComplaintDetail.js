import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {
  FiArrowLeft, FiMapPin, FiCalendar, FiUser, FiImage, FiMessageSquare,
  FiCheckCircle, FiClock, FiXCircle, FiMap, FiShare2, FiPrinter,
  FiFlag, FiTrendingUp, FiActivity, FiCopy, FiEdit3, FiSave, FiX,
  FiUsers, FiSend, FiAlertTriangle, FiThumbsUp, FiThumbsDown,
  FiEye, FiDownload, FiExternalLink, FiNavigation, FiMail, FiPhone
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getBaseURL } from '../utils/apiConfig';

const AdminComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [fieldStaff, setFieldStaff] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedFieldStaff, setSelectedFieldStaff] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchComplaint();
    fetchFieldStaff();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/complaints/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setComplaint(data.complaint);
      } else {
        toast.error(data.message || 'Failed to fetch complaint');
        navigate('/admin/complaints');
      }
    } catch (error) {
      console.error('Fetch complaint error:', error);
      toast.error('Failed to fetch complaint');
      navigate('/admin/complaints');
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/field-staff', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setFieldStaff(data.fieldStaff);
      }
    } catch (error) {
      console.error('Fetch field staff error:', error);
    }
  };

  const handleAssignComplaint = async () => {
    if (!selectedFieldStaff) {
      toast.error('Please select a field staff member');
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/complaints/${id}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignedTo: selectedFieldStaff,
          assignedBy: user.id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Complaint assigned successfully');
        setShowAssignModal(false);
        setSelectedFieldStaff('');
        fetchComplaint(); // Refresh complaint data
      } else {
        toast.error(data.message || 'Failed to assign complaint');
      }
    } catch (error) {
      console.error('Assign complaint error:', error);
      toast.error('Failed to assign complaint');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/complaints/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          resolutionNotes: newStatus === 'resolved' ? resolutionNotes : undefined,
          updatedBy: user.id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Status updated successfully');
        setShowStatusModal(false);
        setNewStatus('');
        setResolutionNotes('');
        fetchComplaint(); // Refresh complaint data
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!adminNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/complaints/${id}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          note: adminNote,
          addedBy: user.id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Note added successfully');
        setShowNoteModal(false);
        setAdminNote('');
        fetchComplaint(); // Refresh complaint data
      } else {
        toast.error(data.message || 'Failed to add note');
      }
    } catch (error) {
      console.error('Add note error:', error);
      toast.error('Failed to add note');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyCoordinates = () => {
    if (complaint && complaint.location) {
      const coordinates = `${complaint.location.coordinates[1]}, ${complaint.location.coordinates[0]}`;
      navigator.clipboard.writeText(coordinates).then(() => {
        toast.success('Coordinates copied to clipboard!');
      });
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FiClock className="h-5 w-5" />,
      in_progress: <FiClock className="h-5 w-5" />,
      resolved: <FiCheckCircle className="h-5 w-5" />,
      rejected: <FiXCircle className="h-5 w-5" />,
      closed: <FiXCircle className="h-5 w-5" />
    };
    return icons[status] || <FiClock className="h-5 w-5" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint not found</h2>
          <p className="text-gray-600 mb-4">The complaint you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/admin/complaints')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back to Complaints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/complaints')}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 group mr-6"
              >
                <FiArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="font-medium">Back to Complaints</span>
              </button>
              
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getCategoryIcon(complaint.category)}</span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin - Complaint Details</h1>
                  <p className="text-gray-500 font-mono text-sm">ID: {complaint.complaintId}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied to clipboard!');
                }}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <FiShare2 className="h-4 w-4 mr-2" />
                Share
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <FiPrinter className="h-4 w-4 mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full h-[calc(100vh-80px)] flex">
        {/* Main Content - Left Side */}
        <div className="w-1/2 flex flex-col space-y-3 p-3 overflow-y-auto">
          {/* Title and Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#84A98C]/30 p-4"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(complaint.category)}</span>
                <div className="flex-1">
                  <h1 className="text-lg font-bold text-gray-900 leading-tight">
                    {complaint.title}
                  </h1>
                  <p className="text-gray-500 font-mono text-xs">
                    ID: {complaint.complaintId}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getStatusColor(complaint.status)}`}>
                  {getStatusIcon(complaint.status)}
                  <span className="ml-1.5 capitalize">{complaint.status.replace('_', ' ')}</span>
                </div>
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getPriorityColor(complaint.priority)}`}>
                  <FiFlag className="h-3 w-3 mr-1.5" />
                  <span className="capitalize">{complaint.priority} Priority</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Admin Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#84A98C]/30 p-4"
          >
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2 border-b border-gray-200 -m-4 mb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center">
                <FiEdit3 className="h-4 w-4 mr-2 text-purple-600" />
                Admin Actions
              </h2>
            </div>
            <div className="p-4 -m-4 mt-0">
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowStatusModal(true)}
                  className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                >
                  <FiEdit3 className="h-4 w-4 mr-1" />
                  Update Status
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                >
                  <FiUsers className="h-4 w-4 mr-1" />
                  Assign Staff
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNoteModal(true)}
                  className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
                >
                  <FiMessageSquare className="h-4 w-4 mr-1" />
                  Add Note
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Download complaint as PDF
                    toast.success('Download feature coming soon!');
                  }}
                  className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
                >
                  <FiDownload className="h-4 w-4 mr-1" />
                  Download
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Description Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#84A98C]/30 p-4"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 border-b border-gray-200 -m-4 mb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center">
                <FiMessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                Description
              </h2>
            </div>
            <div className="p-4 -m-4 mt-0">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>
          </motion.div>

          {/* Images Gallery */}
          {complaint.images && complaint.images.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#84A98C]/30 p-4"
            >
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 border-b border-gray-200 -m-4 mb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center">
                  <FiImage className="h-4 w-4 mr-2 text-green-600" />
                  Photos ({complaint.images.length})
                </h2>
              </div>
              <div className="p-4 -m-4 mt-0">
                <div className="grid grid-cols-3 gap-2">
                  {complaint.images.slice(0, 6).map((image, index) => (
                    <div
                      key={index}
                      className="relative cursor-pointer group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={`${getBaseURL()}${image.url}`}
                        alt={`Complaint image ${index + 1}`}
                        className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <FiEye className="h-3 w-3 text-gray-800" />
                        </div>
                      </div>
                      <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  {complaint.images.length > 6 && (
                    <div className="flex items-center justify-center bg-gray-100 rounded-lg h-20">
                      <span className="text-xs text-gray-600 font-medium">+{complaint.images.length - 6}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Info Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#84A98C]/30 p-4"
          >
            <div className="space-y-3">
              {/* Location Info */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 px-3 py-2 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiMapPin className="h-4 w-4 mr-2 text-red-600" />
                    <span className="text-sm font-semibold text-gray-900">Location</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyCoordinates}
                    className="px-2 py-1 bg-white/60 text-gray-700 rounded-lg hover:bg-white/80 transition-colors duration-200 text-xs font-medium flex items-center space-x-1"
                  >
                    <FiCopy className="h-3 w-3" />
                    <span>Copy</span>
                  </motion.button>
                </div>
                <p className="text-gray-900 font-medium text-sm mt-1">{complaint.address}</p>
                <p className="text-gray-600 text-xs">{complaint.city}</p>
                {complaint.pincode && (
                  <p className="text-gray-600 text-xs">{complaint.pincode}</p>
                )}
                <p className="text-xs text-gray-500 font-mono mt-1">
                  {complaint.location.coordinates[1].toFixed(6)}, {complaint.location.coordinates[0].toFixed(6)}
                </p>
              </div>

              {/* Reporter Info */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-2 rounded-lg border border-indigo-200">
                <div className="flex items-center">
                  <FiUser className="h-4 w-4 mr-2 text-indigo-600" />
                  <span className="text-sm font-semibold text-gray-900">Reported By</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm mt-1">{complaint.citizenName}</p>
                {!complaint.isAnonymous && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">{complaint.citizenEmail}</p>
                    {complaint.citizenPhone && (
                      <p className="text-xs text-gray-600">{complaint.citizenPhone}</p>
                    )}
                  </div>
                )}
                {complaint.isAnonymous && (
                  <p className="text-xs text-gray-500 italic">Anonymous Report</p>
                )}
              </div>

              {/* Assignment Info */}
              {complaint.assignedTo && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <FiUser className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-sm font-semibold text-gray-900">Assigned To</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mt-1">{complaint.assignedTo.name}</p>
                  <p className="text-xs text-gray-600">{complaint.assignedTo.email}</p>
                  {complaint.assignedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned {formatDate(complaint.assignedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-3 py-2 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <FiEye className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">Quick Stats</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Views</p>
                    <p className="font-semibold text-gray-900 text-sm">{complaint.viewCount || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Created</p>
                    <p className="font-semibold text-gray-900 text-xs">
                      {new Date(complaint.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Admin Notes Timeline */}
          {complaint.adminNotes && complaint.adminNotes.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#84A98C]/30 p-4"
            >
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2 border-b border-gray-200 -m-4 mb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center">
                  <FiActivity className="h-4 w-4 mr-2 text-purple-600" />
                  Admin Notes & Activity
                </h2>
              </div>
              <div className="p-4 -m-4 mt-0">
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
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
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
                      {index < complaint.adminNotes.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-4 bg-gray-200"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Resolution */}
          {complaint.status === 'resolved' && complaint.resolutionNotes && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#84A98C]/30 p-4"
            >
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 border-b border-gray-200 -m-4 mb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center">
                  <FiCheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Resolution
                </h2>
              </div>
              <div className="p-4 -m-4 mt-0">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                  <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {complaint.resolutionNotes}
                  </p>
                  {complaint.resolvedAt && (
                    <div className="flex items-center mt-3 text-green-700">
                      <FiCalendar className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">
                        Resolved on {formatDate(complaint.resolvedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Large Map - Right Side */}
        <div className="w-1/2 flex flex-col p-3">
          {/* Map Header */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#84A98C]/30 p-4 mb-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiMapPin className="h-5 w-5 mr-2 text-red-600" />
                <h2 className="text-lg font-bold text-gray-900">Location Map</h2>
              </div>
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${complaint.location.coordinates[1]},${complaint.location.coordinates[0]}`, '_blank')}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium flex items-center space-x-1"
                >
                  <FiNavigation className="h-4 w-4" />
                  <span>Google Maps</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open(`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${complaint.location.coordinates[1]},${complaint.location.coordinates[0]}`, '_blank')}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium flex items-center space-x-1"
                >
                  <FiExternalLink className="h-4 w-4" />
                  <span>OSM Directions</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Large Interactive Map */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#84A98C]/30 overflow-hidden"
          >
            <MapContainer
              center={[complaint.location.coordinates[1], complaint.location.coordinates[0]]}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              className="rounded-xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[complaint.location.coordinates[1], complaint.location.coordinates[0]]}>
                <Popup>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {complaint.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {complaint.address}, {complaint.city}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${complaint.location.coordinates[1]},${complaint.location.coordinates[0]}`, '_blank')}
                        className="text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Google Maps
                      </button>
                      <button
                        onClick={() => window.open(`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${complaint.location.coordinates[1]},${complaint.location.coordinates[0]}`, '_blank')}
                        className="text-sm bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        OSM Directions
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 z-10"
            >
              <FiXCircle className="h-10 w-10" />
            </button>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={`${getBaseURL()}${selectedImage.url}`}
                alt="Complaint image"
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Assign Field Staff</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Field Staff
                  </label>
                  <select
                    value={selectedFieldStaff}
                    onChange={(e) => setSelectedFieldStaff(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a field staff member</option>
                    {fieldStaff.map((staff) => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name} - {staff.email}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignComplaint}
                    disabled={isUpdating || !selectedFieldStaff}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUpdating ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                {newStatus === 'resolved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution Notes
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe how the issue was resolved..."
                    />
                  </div>
                )}
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={isUpdating || !newStatus}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUpdating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Admin Note</h3>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add your note about this complaint..."
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowNoteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    disabled={isUpdating || !adminNote.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUpdating ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaintDetail;

