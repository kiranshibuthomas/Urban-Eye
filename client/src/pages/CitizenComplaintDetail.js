import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBaseURL } from '../utils/apiConfig';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiShare2,
  FiPrinter,
  FiDownload,
  FiEye,
  FiEdit3,
  FiFlag,
  FiTrendingUp,
  FiActivity,
  FiStar,
  FiHeart,
  FiThumbsUp,
  FiThumbsDown,
  FiMoreVertical,
  FiCopy,
  FiExternalLink,
  FiRefreshCw,
  FiAlertCircle,
  FiNavigation
} from 'react-icons/fi';
import { FaCity } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';

// Fix for default markers in react-leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const CitizenComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const response = await fetch(`/api/complaints/${id}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setComplaint(data.complaint);
      } else {
        toast.error(data.message || 'Failed to fetch complaint');
        navigate('/reports-history');
      }
    } catch (error) {
      console.error('Fetch complaint error:', error);
      toast.error('Failed to fetch complaint');
      navigate('/reports-history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FiClock className="h-5 w-5" />,
      in_progress: <FiRefreshCw className="h-5 w-5" />,
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: complaint.title,
        text: `Check out this complaint: ${complaint.title}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleCopyCoordinates = () => {
    const coordinates = `${complaint.location.coordinates[1]}, ${complaint.location.coordinates[0]}`;
    navigator.clipboard.writeText(coordinates);
    toast.success('Coordinates copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#CAD2C5]/30 via-[#84A98C]/20 to-[#52796F]/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#52796F] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading complaint details...</p>
        </motion.div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#CAD2C5]/30 via-[#84A98C]/20 to-[#52796F]/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint not found</h2>
          <p className="text-gray-600 mb-4">The complaint you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/reports-history')}
            className="px-4 py-2 bg-[#52796F] text-white rounded-md hover:bg-[#354F52]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#CAD2C5]/30 via-[#84A98C]/20 to-[#52796F]/30">
      {/* Enhanced Header */}
      <header className="relative bg-gradient-to-r from-white/98 via-[#CAD2C5]/30 to-white/98 backdrop-blur-xl border-b border-[#84A98C]/50 sticky top-0 z-50 shadow-sm">
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 py-3 sm:py-4">
            {/* Left Section - Back Button & Logo */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/reports-history')}
                className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-xl hover:bg-[#CAD2C5]/20 transition-all duration-200 group"
              >
                <FiArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-[#52796F] group-hover:text-[#354F52]" />
                <span className="text-[#52796F] font-medium hidden sm:block group-hover:text-[#354F52]">Back</span>
              </motion.button>
              
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-[#52796F] to-[#354F52] rounded-2xl flex items-center justify-center shadow-lg">
                  <FaCity className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">UrbanEye</h1>
                  <p className="text-xs sm:text-sm text-gray-500 -mt-1">Complaint Details</p>
                </div>
              </div>
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="p-2 sm:p-3 rounded-xl text-gray-500 hover:text-[#52796F] hover:bg-[#CAD2C5]/20 transition-all duration-200"
                title="Share complaint"
              >
                <FiShare2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.print()}
                className="p-2 sm:p-3 rounded-xl text-gray-500 hover:text-[#52796F] hover:bg-[#CAD2C5]/20 transition-all duration-200"
                title="Print complaint"
              >
                <FiPrinter className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.button>
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

          {/* Description Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
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
              transition={{ duration: 0.6, delay: 0.2 }}
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
            transition={{ duration: 0.6, delay: 0.3 }}
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
                  <p className="text-xs text-gray-600">{complaint.citizenEmail}</p>
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
    </div>
  );
};

export default CitizenComplaintDetail;
