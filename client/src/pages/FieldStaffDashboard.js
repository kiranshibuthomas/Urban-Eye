import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import FieldStaffComplaintDetail from '../components/FieldStaffComplaintDetail';
import {
  FiHome,
  FiMenu,
  FiLogOut,
  FiUser,
  FiSettings,
  FiClipboard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiFilter,
  FiSearch,
  FiMoreVertical,
  FiEye,
  FiRefreshCw,
  FiActivity,
  FiTarget,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiBarChart3,
  FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const FieldStaffDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const { logout: sessionLogout } = useSession();
  const navigate = useNavigate();

  const departmentColors = {
    sanitation: { bg: 'bg-green-100', text: 'text-green-800', icon: '🧹' },
    water_supply: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '💧' },
    electricity: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚡' },
    public_works: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🔧' }
  };

  const departmentNames = {
    sanitation: 'Sanitation',
    water_supply: 'Water Supply',
    electricity: 'Electricity',
    public_works: 'Public Works'
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/field-staff/dashboard', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.dashboard);
        } else {
          toast.error(data.message || 'Failed to fetch dashboard data');
        }
      } else {
        const errorData = await response.json();
        
        // Handle token expiration
        if (response.status === 401 && errorData.message === 'Token has expired.') {
          toast.error('Your session has expired. Please log in again.');
          await sessionLogout();
          return;
        }
        
        toast.error(errorData.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/field-staff/complaints', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComplaints(data.complaints);
        }
      } else if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.message === 'Token has expired.') {
          toast.error('Your session has expired. Please log in again.');
          await sessionLogout();
          return;
        }
      }
    } catch (error) {
      console.error('Complaints fetch error:', error);
      toast.error('Failed to fetch complaints');
    }
  };

  const handleLogout = async () => {
    await sessionLogout();
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setIsComplaintModalOpen(true);
  };

  const handleStatusUpdate = async (complaintId, status, notes) => {
    try {
      const response = await fetch(`/api/field-staff/complaints/${complaintId}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status,
          notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchDashboardData();
          fetchComplaints();
          return data;
        } else {
          throw new Error(data.message || 'Failed to update status');
        }
      } else {
        if (response.status === 401) {
          const errorData = await response.json();
          if (errorData.message === 'Token has expired.') {
            toast.error('Your session has expired. Please log in again.');
            await sessionLogout();
            return;
          }
        }
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      throw error;
    }
  };

  const handleWorkComplete = async (complaintId, completionNotes, proofImages) => {
    try {
      const formData = new FormData();
      formData.append('completionNotes', completionNotes);
      
      // Add proof images
      proofImages.forEach((file, index) => {
        formData.append('proofImages', file);
      });

      const response = await fetch(`/api/field-staff/complaints/${complaintId}/complete-work`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchDashboardData();
          fetchComplaints();
          return data;
        } else {
          throw new Error(data.message || 'Failed to complete work');
        }
      } else {
        if (response.status === 401) {
          const errorData = await response.json();
          if (errorData.message === 'Token has expired.') {
            toast.error('Your session has expired. Please log in again.');
            await sessionLogout();
            return;
          }
        }
        throw new Error('Failed to complete work');
      }
    } catch (error) {
      console.error('Complete work error:', error);
      throw error;
    }
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'assigned': return 'text-orange-600 bg-orange-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'work_completed': return 'text-purple-600 bg-purple-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading Field Staff Dashboard..." />;
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Failed to load dashboard</div>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { fieldStaff, stats, assignedComplaints, recentActivity } = dashboardData;
  const deptColor = departmentColors[fieldStaff.department] || departmentColors.sanitation;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">UrbanEye</h1>
              </div>
              <div className="ml-8">
                <nav className="flex space-x-8">
                  <span className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${deptColor.text}`}>
                    {deptColor.icon} {departmentNames[fieldStaff.department]} Staff
                  </span>
                </nav>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&size=40&background=random`}
                  alt="User avatar"
                  className="h-8 w-8 rounded-full"
                />
                <span className="text-gray-700">{user?.name}</span>
                <FiMoreVertical className="h-4 w-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <FiUser className="mr-3 h-4 w-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <FiSettings className="mr-3 h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <FiLogOut className="mr-3 h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className={`${deptColor.bg} rounded-lg p-6 mb-6`}>
            <h2 className={`text-2xl font-bold ${deptColor.text} mb-2`}>
              Welcome back, {fieldStaff.name}!
            </h2>
            <p className={`${deptColor.text} opacity-80`}>
              You are working in the {departmentNames[fieldStaff.department]} department.
            </p>
          </div>


          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiClipboard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Assigned</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalAssigned}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiClock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Assigned</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.assigned}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiActivity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.inProgress}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiTarget className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Work Completed</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.workCompleted}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiCheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.resolved}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Complaints */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Assigned Complaints
              </h3>
              
              {assignedComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <FiClipboard className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints assigned</h3>
                  <p className="mt-1 text-sm text-gray-500">You don't have any assigned complaints yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedComplaints.map((complaint) => (
                    <div key={complaint._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{complaint.title}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Assigned: {formatDate(complaint.fieldStaffAssignedAt)}</span>
                            <span>Category: {complaint.category}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewComplaint(complaint)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <FiEye className="h-3 w-3 mr-1" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Complaint Detail Modal */}
      {isComplaintModalOpen && selectedComplaint && (
        <FieldStaffComplaintDetail
          complaint={selectedComplaint}
          onClose={() => setIsComplaintModalOpen(false)}
          onStatusUpdate={handleStatusUpdate}
          onWorkComplete={handleWorkComplete}
        />
      )}
    </div>
  );
};

export default FieldStaffDashboard;
