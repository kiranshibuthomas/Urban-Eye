import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiUser,
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiEdit3,
  FiTrash2,
  FiDownload,
  FiRefreshCw,
  FiBarChart3,
  FiActivity,
  FiTarget,


  
  FiShield,
  FiZap,
  FiMessageSquare,
  FiBell,
  FiSettings,
  FiGrid,
  FiList
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import UserManagement from './UserManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    status: '',
    priority: '',
    category: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced mock data with more realistic metrics
  const stats = {
    totalComplaints: 1247,
    pending: 89,
    inProgress: 156,
    resolved: 1002,
    totalUsers: 15420,
    activeStaff: 23,
    avgResolutionTime: '2.3 days',
    satisfactionRate: '94.2%'
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
      assignedTo: null,
      description: "Streetlight has been out for 3 days, creating safety concerns for pedestrians",
      images: 2,
      comments: 3
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
      assignedTo: "Mike Johnson",
      description: "Large pothole causing traffic delays and vehicle damage",
      images: 1,
      comments: 5
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
      assignedTo: "Sarah Davis",
      description: "Weekly garbage collection was missed in the entire block",
      images: 0,
      comments: 2
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
      assignedTo: null,
      description: "Major water leak near the fountain, water pooling on pathways",
      images: 3,
      comments: 8
    },
    {
      id: 5,
      title: "Traffic signal malfunction",
      status: "in-progress",
      date: "2024-01-13",
      category: "Traffic",
      location: "Downtown Intersection",
      citizen: "Carlos Rodriguez",
      priority: "high",
      assignedTo: "Tom Wilson",
      description: "Traffic light stuck on red, causing major traffic backup",
      images: 1,
      comments: 12
    },
    {
      id: 6,
      title: "Sidewalk damage",
      status: "resolved",
      date: "2024-01-08",
      category: "Infrastructure",
      location: "Oak Street",
      citizen: "Maria Garcia",
      priority: "medium",
      assignedTo: "Lisa Chen",
      description: "Cracked and uneven sidewalk tiles creating tripping hazard",
      images: 2,
      comments: 1
    }
  ];

  const staffMembers = [
    { 
      id: 1, 
      name: "Mike Johnson", 
      role: "Field Engineer", 
      active: true, 
      assignments: 5,
      avatar: null,
      department: "Infrastructure",
      lastActive: "2 hours ago",
      performance: 94
    },
    { 
      id: 2, 
      name: "Sarah Davis", 
      role: "Sanitation Supervisor", 
      active: true, 
      assignments: 3,
      avatar: null,
      department: "Sanitation",
      lastActive: "1 hour ago",
      performance: 87
    },
    { 
      id: 3, 
      name: "Tom Wilson", 
      role: "Infrastructure Specialist", 
      active: false, 
      assignments: 0,
      avatar: null,
      department: "Infrastructure",
      lastActive: "3 days ago",
      performance: 76
    },
    { 
      id: 4, 
      name: "Lisa Chen", 
      role: "Environmental Officer", 
      active: true, 
      assignments: 2,
      avatar: null,
      department: "Environmental",
      lastActive: "30 minutes ago",
      performance: 91
    },
    { 
      id: 5, 
      name: "David Kim", 
      role: "Traffic Engineer", 
      active: true, 
      assignments: 4,
      avatar: null,
      department: "Traffic",
      lastActive: "45 minutes ago",
      performance: 89
    }
  ];

  const sidebarActions = [
    {
      label: 'Overview',
      icon: FiTrendingUp,
      onClick: () => setActiveTab('overview'),
      badge: null
    },
    {
      label: 'All Complaints',
      icon: FiFileText,
      onClick: () => setActiveTab('complaints'),
      badge: stats.totalComplaints
    },
    {
      label: 'User Management',
      icon: FiUsers,
      onClick: () => setActiveTab('users'),
      badge: stats.totalUsers
    },
    {
      label: 'Manage Staff',
      icon: FiUserCheck,
      onClick: () => setActiveTab('staff'),
      badge: stats.activeStaff
    },
    {
      label: 'Send Alerts',
      icon: FiSend,
      onClick: () => setActiveTab('alerts'),
      badge: null
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'in-progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="h-4 w-4" />;
      case 'in-progress':
        return <FiActivity className="h-4 w-4" />;
      case 'resolved':
        return <FiCheckCircle className="h-4 w-4" />;
      default:
        return <FiFileText className="h-4 w-4" />;
    }
  };

  const StatCard = ({ icon: Icon, title, value, change, color, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative group"
    >
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
            {change && (
              <div className="flex items-center">
                <span className={`text-sm font-medium ${change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiFileText}
          title="Total Complaints"
          value={stats.totalComplaints.toLocaleString()}
          change={12}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.1}
        />
        <StatCard
          icon={FiClock}
          title="Pending"
          value={stats.pending}
          change={-5}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
          delay={0.2}
        />
        <StatCard
          icon={FiActivity}
          title="In Progress"
          value={stats.inProgress}
          change={8}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          delay={0.3}
        />
        <StatCard
          icon={FiCheckCircle}
          title="Resolved"
          value={stats.resolved.toLocaleString()}
          change={15}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          delay={0.4}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {allComplaints.slice(0, 4).map((complaint, index) => (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getPriorityColor(complaint.priority)}`}>
                    {getStatusIcon(complaint.status)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{complaint.title}</h4>
                    <p className="text-sm text-gray-600">{complaint.address || 'Location not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                    {complaint.status.replace('-', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(complaint.date).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { icon: FiPlus, label: 'New Complaint', color: 'bg-blue-500' },
              { icon: FiUsers, label: 'Add Staff', color: 'bg-emerald-500' },
              { icon: FiSend, label: 'Send Alert', color: 'bg-amber-500' },
              { icon: FiDownload, label: 'Export Data', color: 'bg-purple-500' }
            ].map((action, index) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center p-3 text-left rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              >
                <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <span className="ml-3 font-medium text-gray-700">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Priority Complaints Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">High Priority Complaints</h3>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {allComplaints.filter(c => c.priority === 'urgent' || c.priority === 'high').length} Active
              </span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {allComplaints.filter(c => c.priority === 'urgent' || c.priority === 'high').map((complaint, index) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="p-6 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{complaint.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <span className="flex items-center">
                      <FiMapPin className="h-4 w-4 mr-1" />
                      {complaint.address || 'Location not specified'}
                    </span>
                    <span className="flex items-center">
                      <FiUser className="h-4 w-4 mr-1" />
                      {complaint.citizen}
                    </span>
                    <span className="flex items-center">
                      <FiCalendar className="h-4 w-4 mr-1" />
                      {new Date(complaint.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(complaint.status)}`}>
                    {complaint.status.replace('-', ' ')}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    Assign
                  </motion.button>
                </div>
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
      {/* Enhanced Header with Search and Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold text-gray-900">All Complaints</h3>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors duration-200 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <FiGrid className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors duration-200 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <FiList className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>
            <select 
              value={selectedFilters.status}
              onChange={(e) => setSelectedFilters({...selectedFilters, status: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select 
              value={selectedFilters.priority}
              onChange={(e) => setSelectedFilters({...selectedFilters, priority: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <FiFilter className="h-4 w-4" />
              <span>More</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Complaints Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {allComplaints.map((complaint, index) => (
          <motion.div
            key={complaint.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${
              viewMode === 'list' ? 'p-6' : 'p-6'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold text-gray-900">{complaint.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{complaint.description}</p>
                <div className="flex items-center text-sm text-gray-500 space-x-4 mb-3">
                  <span className="flex items-center">
                    <FiMapPin className="h-4 w-4 mr-1" />
                    {complaint.address || 'Location not specified'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                    {complaint.category}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span className="flex items-center">
                    <FiUser className="h-4 w-4 mr-1" />
                    {complaint.citizen}
                  </span>
                  <span className="flex items-center">
                    <FiCalendar className="h-4 w-4 mr-1" />
                    {new Date(complaint.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(complaint.status)}`}>
                  {getStatusIcon(complaint.status)}
                  <span className="ml-1 capitalize">{complaint.status.replace('-', ' ')}</span>
                </span>
                {complaint.assignedTo && (
                  <span className="text-sm text-gray-600">Assigned to: {complaint.assignedTo}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {complaint.images > 0 && (
                  <span className="flex items-center">
                    <FiEye className="h-4 w-4 mr-1" />
                    {complaint.images} images
                  </span>
                )}
                {complaint.comments > 0 && (
                  <span className="flex items-center">
                    <FiMessageSquare className="h-4 w-4 mr-1" />
                    {complaint.comments} comments
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Assign
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                >
                  <FiMoreVertical className="h-4 w-4" />
                </motion.button>
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <h3 className="text-xl font-semibold text-gray-900">Staff Management</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center space-x-2"
          >
            <FiPlus className="h-4 w-4" />
            <span>Add New Staff</span>
          </motion.button>
        </div>
      </div>

      <div className="grid gap-6">
        {staffMembers.map((staff, index) => (
          <motion.div
            key={staff.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2, scale: 1.01 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ring-4 ring-blue-100">
                    {staff.avatar ? (
                      <img
                        src={staff.avatar}
                        alt={staff.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <FiUser className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                    staff.active ? 'bg-emerald-400' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{staff.name}</h4>
                  <p className="text-sm text-gray-600 mb-1">{staff.role}</p>
                  <p className="text-sm text-gray-500 mb-2">{staff.department}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Active assignments: {staff.assignments}</span>
                    <span>Performance: {staff.performance}%</span>
                    <span className="flex items-center">
                      <FiActivity className="h-4 w-4 mr-1" />
                      {staff.lastActive}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                  staff.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  {staff.active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                  >
                    {staff.active ? 'Deactivate' : 'Activate'}
                  </motion.button>
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
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Send Emergency Alert</h3>
          <p className="text-sm text-gray-600 mt-1">Send notifications to citizens and staff members</p>
        </div>
        
        <form className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200">
                <option value="">Select alert type</option>
                <option value="emergency">Emergency</option>
                <option value="maintenance">Maintenance</option>
                <option value="announcement">General Announcement</option>
                <option value="weather">Weather Warning</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alert Title</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Brief title for the alert"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Enter the alert message..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200">
              <option value="all">All Citizens</option>
              <option value="area">Specific Area</option>
              <option value="role">Specific Role</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-3 block text-sm text-gray-900">
                Send SMS notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-3 block text-sm text-gray-900">
                Send email notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-3 block text-sm text-gray-900">
                Send push notifications
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
            >
              Save as Draft
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <FiSend className="h-4 w-4" />
              <span>Send Alert Now</span>
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'complaints':
        return <ComplaintsTab />;
      case 'users':
        return <UserManagement />;
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
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default AdminDashboard;
