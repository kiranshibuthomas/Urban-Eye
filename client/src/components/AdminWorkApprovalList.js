import React, { useState, useEffect } from 'react';
import { 
  FiCheckCircle,
  FiClock,
  FiEye,
  FiUser,
  FiCalendar,
  FiMapPin,
  FiFlag,
  FiAlertCircle,
  FiRefreshCw,
  FiFilter,
  FiSearch
} from 'react-icons/fi';
import AdminWorkApproval from './AdminWorkApproval';
import toast from 'react-hot-toast';

const AdminWorkApprovalList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWorkCompletedComplaints();
  }, []);

  const fetchWorkCompletedComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/complaints?status=work_completed', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComplaints(data.complaints);
        } else {
          toast.error('Failed to fetch complaints');
        }
      } else {
        toast.error('Failed to fetch complaints');
      }
    } catch (error) {
      console.error('Fetch complaints error:', error);
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWork = async (complaintId, approvalNotes) => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}/approve-work`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          approvalNotes
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Work approved successfully');
          setShowApprovalModal(false);
          fetchWorkCompletedComplaints();
          return data;
        } else {
          throw new Error(data.message || 'Failed to approve work');
        }
      } else {
        throw new Error('Failed to approve work');
      }
    } catch (error) {
      console.error('Approve work error:', error);
      throw error;
    }
  };

  const handleRejectWork = async (complaintId, rejectionReason) => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'in_progress',
          rejectionReason
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Work rejected and returned to field staff');
          setShowApprovalModal(false);
          fetchWorkCompletedComplaints();
          return data;
        } else {
          throw new Error(data.message || 'Failed to reject work');
        }
      } else {
        throw new Error('Failed to reject work');
      }
    } catch (error) {
      console.error('Reject work error:', error);
      throw error;
    }
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setShowApprovalModal(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'urgent') return matchesSearch && complaint.priority === 'urgent';
    if (filter === 'high') return matchesSearch && complaint.priority === 'high';
    if (filter === 'recent') {
      const workCompletedDate = new Date(complaint.workCompletedAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return matchesSearch && workCompletedDate > oneDayAgo;
    }
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading work completed complaints...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Work Approval Queue</h2>
          <p className="text-gray-600">Review and approve completed work by field staff</p>
        </div>
        <button
          onClick={fetchWorkCompletedComplaints}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <FiRefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Complaints</option>
            <option value="urgent">Urgent Priority</option>
            <option value="high">High Priority</option>
            <option value="recent">Recent (24h)</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FiCheckCircle className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Approval</p>
              <p className="text-2xl font-semibold text-gray-900">{complaints.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FiAlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Urgent</p>
              <p className="text-2xl font-semibold text-gray-900">
                {complaints.filter(c => c.priority === 'urgent').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FiClock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">High Priority</p>
              <p className="text-2xl font-semibold text-gray-900">
                {complaints.filter(c => c.priority === 'high').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FiCalendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent (24h)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {complaints.filter(c => {
                  const workCompletedDate = new Date(c.workCompletedAt);
                  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  return workCompletedDate > oneDayAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <div className="text-center py-12">
          <FiCheckCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No work completed complaints</h3>
          <p className="mt-1 text-sm text-gray-500">
            {complaints.length === 0 
              ? "No field staff have completed work yet."
              : "No complaints match your current filters."
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Work Completed Complaints ({filteredComplaints.length})
            </h3>
            
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <div key={complaint._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getCategoryIcon(complaint.category)}</span>
                        <h4 className="text-sm font-medium text-gray-900">{complaint.title}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{complaint.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <FiUser className="h-3 w-3 mr-1" />
                          <span>{complaint.assignedToFieldStaff?.name}</span>
                        </div>
                        <div className="flex items-center">
                          <FiMapPin className="h-3 w-3 mr-1" />
                          <span>{complaint.address}</span>
                        </div>
                        <div className="flex items-center">
                          <FiCalendar className="h-3 w-3 mr-1" />
                          <span>Completed {formatDate(complaint.workCompletedAt)}</span>
                        </div>
                      </div>
                      {complaint.workProofImages && complaint.workProofImages.length > 0 && (
                        <div className="mt-2 text-xs text-green-600">
                          <FiCheckCircle className="h-3 w-3 inline mr-1" />
                          {complaint.workProofImages.length} proof image(s) uploaded
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewComplaint(complaint)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <FiEye className="h-3 w-3 mr-1" />
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedComplaint && (
        <AdminWorkApproval
          complaint={selectedComplaint}
          onApprove={handleApproveWork}
          onReject={handleRejectWork}
          onClose={() => setShowApprovalModal(false)}
        />
      )}
    </div>
  );
};

export default AdminWorkApprovalList;

