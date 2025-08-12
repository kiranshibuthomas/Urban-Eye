import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUsers, 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle,
  FiMapPin,
  FiCalendar,
  FiEye,
  FiSend,
  FiUserCheck,
  FiTrendingUp,
  FiFilter,
  FiUser
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const stats = {
    totalComplaints: 156,
    pending: 23,
    inProgress: 45,
    resolved: 88,
    totalUsers: 1240,
    activeStaff: 12
  };

  const allComplaints = [
    {
      id: 1,
      title: "Broken streetlight on Main St",
      status: "pending",
      date: "2024-01-15",
      category: "Infrastructure",
      location: "Main Street, Block A",
      citizen: "John Doe",
      priority: "medium",
      assignedTo: null
    },
    {
      id: 2,
      title: "Pothole near city center",
      status: "in-progress",
      date: "2024-01-12",
      category: "Roads",
      location: "City Center Avenue",
      citizen: "Jane Smith",
      priority: "high",
      assignedTo: "Mike Johnson"
    },
    {
      id: 3,
      title: "Garbage collection missed",
      status: "resolved",
      date: "2024-01-10",
      category: "Sanitation",
      location: "Residential Area B",
      citizen: "Bob Wilson",
      priority: "low",
      assignedTo: "Sarah Davis"
    },
    {
      id: 4,
      title: "Water leak in public park",
      status: "pending",
      date: "2024-01-14",
      category: "Utilities",
      location: "Central Park",
      citizen: "Alice Brown",
      priority: "urgent",
      assignedTo: null
    }
  ];

  const staffMembers = [
    { id: 1, name: "Mike Johnson", role: "Field Engineer", active: true, assignments: 5 },
    { id: 2, name: "Sarah Davis", role: "Sanitation Supervisor", active: true, assignments: 3 },
    { id: 3, name: "Tom Wilson", role: "Infrastructure Specialist", active: false, assignments: 0 },
    { id: 4, name: "Lisa Chen", role: "Environmental Officer", active: true, assignments: 2 }
  ];

  const sidebarActions = [
    {
      label: 'Overview',
      icon: FiTrendingUp,
      onClick: () => setActiveTab('overview')
    },
    {
      label: 'All Complaints',
      icon: FiFileText,
      onClick: () => setActiveTab('complaints')
    },
    {
      label: 'Manage Staff',
      icon: FiUsers,
      onClick: () => setActiveTab('staff')
    },
    {
      label: 'Send Alerts',
      icon: FiSend,
      onClick: () => setActiveTab('alerts')
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="h-4 w-4" />;
      case 'in-progress':
        return <FiAlertCircle className="h-4 w-4" />;
      case 'resolved':
        return <FiCheckCircle className="h-4 w-4" />;
      default:
        return <FiFileText className="h-4 w-4" />;
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FiFileText className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Complaints</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalComplaints}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiClock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiAlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiUsers className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FiUserCheck className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeStaff}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Priority Complaints */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">High Priority Complaints</h3>
        <div className="space-y-4">
          {allComplaints.filter(c => c.priority === 'urgent' || c.priority === 'high').map((complaint, index) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{complaint.title}</h4>
                <div className="flex items-center mt-1 text-sm text-gray-600">
                  <FiMapPin className="h-4 w-4 mr-1" />
                  <span className="mr-4">{complaint.location}</span>
                  <span className="mr-4">By: {complaint.citizen}</span>
                  <FiCalendar className="h-4 w-4 mr-1" />
                  <span>{new Date(complaint.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                  {complaint.priority.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                  {complaint.status.replace('-', ' ').toUpperCase()}
                </span>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Assign
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const ComplaintsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">All Complaints</h3>
        <div className="flex space-x-2">
          <select className="form-input w-auto">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select className="form-input w-auto">
            <option value="">All Categories</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="roads">Roads</option>
            <option value="sanitation">Sanitation</option>
            <option value="utilities">Utilities</option>
          </select>
          <button className="btn-secondary flex items-center">
            <FiFilter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {allComplaints.map((complaint, index) => (
          <motion.div
            key={complaint.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-medium text-gray-900">{complaint.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <FiMapPin className="h-4 w-4 mr-1" />
                  <span className="mr-4">{complaint.location}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium mr-4">
                    {complaint.category}
                  </span>
                  <span className="text-gray-500">By: {complaint.citizen}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <FiCalendar className="h-4 w-4 mr-1" />
                  <span className="mr-4">Submitted: {new Date(complaint.date).toLocaleDateString()}</span>
                  {complaint.assignedTo && (
                    <span>Assigned to: {complaint.assignedTo}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                  {getStatusIcon(complaint.status)}
                  <span className="ml-1 capitalize">{complaint.status.replace('-', ' ')}</span>
                </span>
                <div className="flex space-x-2">
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    View
                  </button>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Assign
                  </button>
                  <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                    Update
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const StaffTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Staff Management</h3>
        <button className="btn-primary">
          Add New Staff
        </button>
      </div>

      <div className="grid gap-6">
        {staffMembers.map((staff, index) => (
          <motion.div
            key={staff.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <FiUser className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900">{staff.name}</h4>
                  <p className="text-sm text-gray-600">{staff.role}</p>
                  <p className="text-sm text-gray-500">Active assignments: {staff.assignments}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  staff.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {staff.active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex space-x-2">
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    View
                  </button>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Edit
                  </button>
                  <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                    {staff.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const AlertsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card max-w-2xl"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Send Emergency Alert</h3>
      <form className="space-y-6">
        <div>
          <label className="form-label">Alert Type</label>
          <select className="form-input">
            <option value="">Select alert type</option>
            <option value="emergency">Emergency</option>
            <option value="maintenance">Maintenance</option>
            <option value="announcement">General Announcement</option>
            <option value="weather">Weather Warning</option>
          </select>
        </div>

        <div>
          <label className="form-label">Alert Title</label>
          <input
            type="text"
            className="form-input"
            placeholder="Brief title for the alert"
          />
        </div>

        <div>
          <label className="form-label">Message</label>
          <textarea
            rows={4}
            className="form-input"
            placeholder="Enter the alert message..."
          />
        </div>

        <div>
          <label className="form-label">Target Audience</label>
          <select className="form-input">
            <option value="all">All Citizens</option>
            <option value="area">Specific Area</option>
            <option value="role">Specific Role</option>
          </select>
        </div>

        <div>
          <label className="form-label">Priority Level</label>
          <select className="form-input">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Send SMS notifications
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Send email notifications
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" className="btn-secondary">
            Save as Draft
          </button>
          <button type="submit" className="btn-primary">
            Send Alert Now
          </button>
        </div>
      </form>
    </motion.div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'complaints':
        return <ComplaintsTab />;
      case 'staff':
        return <StaffTab />;
      case 'alerts':
        return <AlertsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <DashboardLayout
      title="Admin Dashboard"
      actions={sidebarActions}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminDashboard;
