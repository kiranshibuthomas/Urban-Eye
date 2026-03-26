import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FiHome, FiClipboard, FiUsers, FiSettings, FiLogOut,
  FiRefreshCw, FiUser, FiChevronDown, FiBell, FiClock,
  FiCheckCircle, FiActivity, FiTarget, FiMapPin, FiList,
  FiAward, FiAlertCircle, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ModernStatCard from '../components/ModernStatCard';
import TeamInvitationsPanel from '../components/TeamInvitationsPanel';

const CleanFieldStaffDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks'); // tasks, teams, invitations
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/field-work/dashboard', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.dashboard);
        }
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const { assignedComplaints, stats } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            {/* Left: Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center">
                <FiActivity className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">Field Operations</h1>
                <p className="text-xs text-gray-500">{user?.name}</p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded relative">
                <FiBell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-100"
                >
                  <div className="w-7 h-7 bg-slate-700 rounded flex items-center justify-center">
                    <FiUser className="h-3.5 w-3.5 text-white" />
                  </div>
                  <FiChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded border border-gray-200 shadow-lg py-1 z-50"
                    >
                      <button
                        onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FiUser className="mr-3 h-4 w-4" />
                        Profile
                      </button>
                      <button
                        onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FiSettings className="mr-3 h-4 w-4" />
                        Settings
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <FiLogOut className="mr-3 h-4 w-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <ModernStatCard
            title="Total Assigned"
            value={stats?.totalAssigned || 0}
            icon={FiClipboard}
            color="bg-slate-700"
          />
          <ModernStatCard
            title="In Progress"
            value={stats?.inProgress || 0}
            icon={FiActivity}
            color="bg-amber-600"
          />
          <ModernStatCard
            title="Completed"
            value={stats?.workCompleted || 0}
            icon={FiCheckCircle}
            color="bg-emerald-600"
          />
          <ModernStatCard
            title="Resolved"
            value={stats?.resolved || 0}
            icon={FiTarget}
            color="bg-blue-600"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <TabButton
              active={activeTab === 'tasks'}
              onClick={() => setActiveTab('tasks')}
              icon={FiClipboard}
              label="My Tasks"
              count={assignedComplaints?.length || 0}
            />
            <TabButton
              active={activeTab === 'teams'}
              onClick={() => setActiveTab('teams')}
              icon={FiUsers}
              label="My Teams"
              count={0}
            />
            <TabButton
              active={activeTab === 'invitations'}
              onClick={() => setActiveTab('invitations')}
              icon={FiBell}
              label="Invitations"
              count={0}
            />
            <TabButton
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              icon={FiList}
              label="Work History"
              count={0}
            />
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'tasks' && (
                <TasksTab
                  complaints={assignedComplaints}
                  onRefresh={fetchDashboardData}
                />
              )}
              {activeTab === 'teams' && (
                <TeamsTab onRefresh={fetchDashboardData} />
              )}
              {activeTab === 'invitations' && (
                <InvitationsTab onRefresh={fetchDashboardData} />
              )}
              {activeTab === 'history' && (
                <HistoryTab />
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-5 py-3 font-medium text-sm transition-colors ${
      active
        ? 'text-slate-900 border-b-2 border-slate-900 bg-gray-50'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
    {count > 0 && (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
        active ? 'bg-slate-900 text-white' : 'bg-gray-200 text-gray-700'
      }`}>
        {count}
      </span>
    )}
  </button>
);

// Tasks Tab Component
const TasksTab = ({ complaints, onRefresh }) => {
  const navigate = useNavigate();

  if (!complaints || complaints.length === 0) {
    return (
      <div className="text-center py-16">
        <FiClipboard className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">No tasks assigned</h3>
        <p className="text-sm text-gray-500">You don't have any tasks assigned at the moment</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-3"
    >
      {complaints.map((complaint) => (
        <TaskCard
          key={complaint._id}
          complaint={complaint}
          onRefresh={onRefresh}
        />
      ))}
    </motion.div>
  );
};

// Teams Tab Component
const TeamsTab = ({ onRefresh }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams/my/teams', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('Fetch teams error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-16">
        <FiUsers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">No teams yet</h3>
        <p className="text-sm text-gray-500">Create a team for your assigned tasks</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-3"
    >
      {teams.map((team) => (
        <TeamCard key={team._id} team={team} onRefresh={onRefresh} />
      ))}
    </motion.div>
  );
};

// Invitations Tab Component
const InvitationsTab = ({ onRefresh }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <TeamInvitationsPanel onInvitationResponse={onRefresh} />
    </motion.div>
  );
};

// Task Card Component - Simplified to just click to view
const TaskCard = ({ complaint, onRefresh }) => {
  const navigate = useNavigate();
  const [hasTeam, setHasTeam] = useState(false);
  const [teamId, setTeamId] = useState(null);

  useEffect(() => {
    checkTeamStatus();
  }, [complaint._id]);

  const checkTeamStatus = async () => {
    try {
      const response = await fetch('/api/teams/my/teams', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        const team = data.teams.find(
          t => t.complaint._id === complaint._id && 
          ['forming', 'ready', 'active'].includes(t.status)
        );
        if (team) {
          setHasTeam(true);
          setTeamId(team._id);
        } else {
          setHasTeam(false);
          setTeamId(null);
        }
      }
    } catch (error) {
      console.error('Check team error:', error);
    }
  };

  const handleCardClick = () => {
    navigate(`/field-staff/task/${complaint._id}`);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-50 text-red-700 border border-red-200',
      high: 'bg-orange-50 text-orange-700 border border-orange-200',
      medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      low: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    };
    return colors[priority] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'bg-blue-50 text-blue-700 border border-blue-200',
      in_progress: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      work_completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white border border-gray-200 p-4 hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{complaint.title}</h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{complaint.description}</p>
          
          <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
            <span className="flex items-center">
              <FiMapPin className="h-3.5 w-3.5 mr-1" />
              {complaint.address}
            </span>
            <span className="flex items-center">
              <FiClock className="h-3.5 w-3.5 mr-1" />
              {new Date(complaint.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
              {complaint.priority}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(complaint.status)}`}>
              {complaint.status.replace('_', ' ')}
            </span>
            {hasTeam && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                <FiUsers className="inline h-3 w-3 mr-1" />
                Team
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">Click to view details</span>
        <FiChevronDown className="h-4 w-4 text-gray-400 transform rotate-[-90deg]" />
      </div>
    </div>
  );
};

// Team Card Component
const TeamCard = ({ team, onRefresh }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    const colors = {
      forming: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      ready: 'bg-blue-50 text-blue-700 border border-blue-200',
      active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      completed: 'bg-slate-50 text-slate-700 border border-slate-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  const getStatusIcon = (status) => {
    if (status === 'active') return '●';
    if (status === 'ready') return '●';
    if (status === 'forming') return '●';
    if (status === 'completed') return '●';
    return '●';
  };

  return (
    <div className="bg-white border border-gray-200 p-4 hover:border-slate-400 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1.5">
            <h3 className="text-sm font-semibold text-gray-900">{team.teamName}</h3>
            <span className={`text-xs ${
              team.status === 'active' ? 'text-emerald-600' :
              team.status === 'ready' ? 'text-blue-600' :
              team.status === 'forming' ? 'text-yellow-600' :
              'text-slate-600'
            }`}>{getStatusIcon(team.status)}</span>
          </div>
          <p className="text-sm text-gray-600 mb-2 line-clamp-1">{team.complaint?.title}</p>
          
          <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
            <span className="flex items-center">
              <FiUsers className="h-3.5 w-3.5 mr-1" />
              {team.members?.length || 0} members
            </span>
            <span className="flex items-center">
              <FiClock className="h-3.5 w-3.5 mr-1" />
              {new Date(team.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(team.status)}`}>
            {team.status.toUpperCase()}
          </span>
        </div>
      </div>
      
      <button
        onClick={() => navigate(`/field-staff/team/${team._id}`)}
        className="w-full px-4 py-2 bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition-colors flex items-center justify-center space-x-2"
      >
        <FiUsers className="h-4 w-4" />
        <span>Open Workspace</span>
      </button>
    </div>
  );
};

// History Tab Component
const HistoryTab = () => {
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchHistory(1); }, []);

  const fetchHistory = async (p) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/field-work/history?page=${p}&limit=10`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setWorkLogs(data.workLogs);
        setPagination(data.pagination);
        setPage(p);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s) => ({
    submitted: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    started: 'bg-yellow-100 text-yellow-700',
    paused: 'bg-orange-100 text-orange-700',
  }[s] || 'bg-gray-100 text-gray-600');

  const reviewColor = (r) => ({
    approved: 'text-emerald-600',
    rejected: 'text-red-600',
    needs_revision: 'text-orange-600',
    pending: 'text-yellow-600',
  }[r] || 'text-gray-500');

  const reviewIcon = (r) => ({
    approved: '✓',
    rejected: '✗',
    needs_revision: '↩',
    pending: '⏳',
  }[r] || '–');

  const formatDuration = (ms) => {
    if (!ms) return '–';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) return (
    <div className="flex justify-center py-12"><LoadingSpinner /></div>
  );

  if (workLogs.length === 0) return (
    <div className="text-center py-16">
      <FiList className="mx-auto h-12 w-12 text-gray-300 mb-3" />
      <h3 className="text-base font-medium text-gray-900 mb-1">No work history yet</h3>
      <p className="text-sm text-gray-500">Completed work sessions will appear here</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3">
      {workLogs.map((log) => log.complaint && (
        <div key={log._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Row */}
          <div
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setExpanded(expanded === log._id ? null : log._id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {log.complaint?.title || 'Unknown complaint'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  {log.complaint?.category?.replace(/_/g, ' ')} · {log.complaint?.address}
                </p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(log.status)}`}>
                    {log.status}
                  </span>
                  <span className={`text-xs font-semibold ${reviewColor(log.reviewStatus)}`}>
                    {reviewIcon(log.reviewStatus)} {log.reviewStatus?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center">
                    <FiClock className="h-3 w-3 mr-1" />{formatDuration(log.totalDuration)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end ml-3 flex-shrink-0">
                <p className="text-xs text-gray-400">{new Date(log.startTime).toLocaleDateString()}</p>
                <FiChevronRight className={`h-4 w-4 text-gray-400 mt-2 transition-transform ${expanded === log._id ? 'rotate-90' : ''}`} />
              </div>
            </div>
          </div>

          {/* Expanded detail */}
          <AnimatePresence>
            {expanded === log._id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-3 overflow-hidden"
              >
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-bold text-gray-900">{formatDuration(log.totalDuration)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-xs text-gray-500">Updates</p>
                    <p className="text-sm font-bold text-gray-900">{log.progressUpdates?.length || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-xs text-gray-500">Proof Images</p>
                    <p className="text-sm font-bold text-gray-900">{log.completionImages?.length || 0}</p>
                  </div>
                </div>

                {/* Progress updates */}
                {log.progressUpdates?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Progress Updates</p>
                    <div className="space-y-1.5">
                      {log.progressUpdates.map((u, i) => (
                        <div key={i} className="flex items-start space-x-2 text-xs text-gray-700">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                          <span>{u.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completion notes */}
                {log.completionNotes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Completion Notes</p>
                    <p className="text-xs text-gray-700 bg-white rounded-lg p-2 border border-gray-100">{log.completionNotes}</p>
                  </div>
                )}

                {/* Review notes (rejection reason) */}
                {log.reviewNotes && (
                  <div className={`rounded-lg p-2 border text-xs ${log.reviewStatus === 'rejected' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                    <p className="font-semibold mb-0.5">Admin Feedback</p>
                    <p>{log.reviewNotes}</p>
                  </div>
                )}

                {/* Proof images */}
                {log.completionImages?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Proof Photos</p>
                    <div className="flex space-x-2 overflow-x-auto pb-1">
                      {log.completionImages.map((img, i) => (
                        <img key={i} src={img.url} alt="" className="h-16 w-16 object-cover rounded-lg flex-shrink-0 border border-gray-200" />
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  {new Date(log.startTime).toLocaleString()} {log.endTime ? `→ ${new Date(log.endTime).toLocaleString()}` : ''}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">Page {page} of {pagination.totalPages}</p>
          <div className="flex space-x-2">
            <button
              onClick={() => fetchHistory(page - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
            >Previous</button>
            <button
              onClick={() => fetchHistory(page + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
            >Next</button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CleanFieldStaffDashboard;
