import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBaseURL } from '../utils/apiConfig';
import toast from 'react-hot-toast';
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
  FiExternalLink
} from 'react-icons/fi';
import GoogleMapModal from '../components/GoogleMapModal';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchComplaint();
    loadGoogleMapsScript();
  }, [id]);

  const loadGoogleMapsScript = () => {
    if (window.google) return; // Already loaded

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    // Only load Google Maps if API key is properly configured
    if (apiKey && apiKey !== 'your_google_maps_api_key_here' && apiKey !== 'YOUR_API_KEY') {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.warn('Failed to load Google Maps API. Interactive maps will not be available.');
      };
      document.head.appendChild(script);
    } else {
      console.warn('Google Maps API key not configured. Interactive maps will not be available.');
    }
  };

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
        navigate('/citizen-dashboard');
      }
    } catch (error) {
      console.error('Fetch complaint error:', error);
      toast.error('Failed to fetch complaint');
      navigate('/citizen-dashboard');
    } finally {
      setLoading(false);
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
            onClick={() => navigate('/citizen-dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate('/citizen-dashboard')}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 group"
              >
                <FiArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
              
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
                <div className="relative">
                  <button className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                    <FiMoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Title and Status */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{getCategoryIcon(complaint.category)}</span>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                      {complaint.title}
                    </h1>
                    <p className="text-gray-500 font-mono text-sm mt-1">
                      ID: {complaint.complaintId}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(complaint.status)}`}>
                  {getStatusIcon(complaint.status)}
                  <span className="ml-2 capitalize">{complaint.status.replace('_', ' ')}</span>
                </div>
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getPriorityColor(complaint.priority)}`}>
                  <FiFlag className="h-4 w-4 mr-2" />
                  <span className="capitalize">{complaint.priority} Priority</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-8">
            {/* Description Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FiMessageSquare className="h-6 w-6 mr-3 text-blue-600" />
                  Description
                </h2>
              </div>
              <div className="p-8">
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>
            </div>

            {/* Images Gallery */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FiImage className="h-6 w-6 mr-3 text-green-600" />
                    Photos ({complaint.images.length})
                  </h2>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {complaint.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative cursor-pointer group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={`${getBaseURL()}${image.url}`}
                          alt={`Complaint image ${index + 1}`}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                          <div className="bg-white bg-opacity-90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <FiEye className="h-6 w-6 text-gray-800" />
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Resolution */}
            {complaint.status === 'resolved' && complaint.resolutionNotes && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FiCheckCircle className="h-6 w-6 mr-3 text-green-600" />
                    Resolution
                  </h2>
                </div>
                <div className="p-8">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                      {complaint.resolutionNotes}
                    </p>
                    {complaint.resolvedAt && (
                      <div className="flex items-center mt-4 text-green-700">
                        <FiCalendar className="h-5 w-5 mr-2" />
                        <span className="font-medium">
                          Resolved on {formatDate(complaint.resolvedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Admin Notes Timeline */}
            {complaint.adminNotes && complaint.adminNotes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FiActivity className="h-6 w-6 mr-3 text-purple-600" />
                    Activity Timeline
                  </h2>
                </div>
                <div className="p-8">
                  <div className="space-y-6">
                    {complaint.adminNotes.map((note, index) => (
                      <div key={index} className="relative">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FiUser className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <p className="text-gray-800 leading-relaxed">{note.note}</p>
                              <div className="flex items-center mt-3 text-sm text-gray-500">
                                <span className="font-medium text-gray-700">{note.addedBy.name}</span>
                                <span className="mx-2">•</span>
                                <FiCalendar className="h-4 w-4 mr-1" />
                                <span>{formatDate(note.addedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < complaint.adminNotes.length - 1 && (
                          <div className="absolute left-5 top-10 w-0.5 h-6 bg-gray-200"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiEye className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Views</span>
                  </div>
                  <span className="font-semibold text-gray-900">{complaint.viewCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Created</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {new Date(complaint.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                {complaint.lastUpdated && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FiTrendingUp className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">Updated</span>
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">
                      {new Date(complaint.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiMapPin className="h-5 w-5 mr-2 text-red-600" />
                  Location
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-900 font-medium">{complaint.address}</p>
                    <p className="text-gray-600">{complaint.city}</p>
                    {complaint.pincode && (
                      <p className="text-gray-600">{complaint.pincode}</p>
                    )}
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <button
                      onClick={() => setShowMap(true)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                    >
                      <FiMap className="h-5 w-5 mr-2" />
                      View on Map
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                    <p><strong>Coordinates:</strong></p>
                    <p className="font-mono">
                      {complaint.location.coordinates[1].toFixed(6)}, {complaint.location.coordinates[0].toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reporter Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiUser className="h-5 w-5 mr-2 text-indigo-600" />
                  Reported By
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <FiUser className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{complaint.citizenName}</p>
                    {!complaint.isAnonymous && (
                      <p className="text-sm text-gray-600">{complaint.citizenEmail}</p>
                    )}
                    {complaint.isAnonymous && (
                      <p className="text-sm text-gray-500 italic">Anonymous Report</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Info */}
            {complaint.assignedTo && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiUser className="h-5 w-5 mr-2 text-green-600" />
                    Assigned To
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <FiUser className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{complaint.assignedTo.name}</p>
                      <p className="text-sm text-gray-600">{complaint.assignedTo.email}</p>
                      {complaint.assignedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned {formatDate(complaint.assignedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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

      {/* Google Maps Modal */}
      {showMap && complaint && (
        <GoogleMapModal
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

export default ComplaintDetail;
