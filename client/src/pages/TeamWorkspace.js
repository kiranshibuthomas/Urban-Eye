import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiArrowLeft, FiUsers, FiMapPin, FiMessageSquare, FiActivity,
  FiClock, FiTarget, FiSend, FiMoreVertical, FiPhone, FiMail,
  FiNavigation, FiTool, FiPackage, FiDollarSign, FiCheckCircle,
  FiAlertCircle, FiRefreshCw, FiSettings, FiUserPlus, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const TeamWorkspace = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Fetch team details
  const fetchTeamDetails = useCallback(async () => {
    try {
      console.log('Fetching team details for teamId:', teamId);
      
      const response = await fetch(`/api/teams/${teamId}`, {
        credentials: 'include'
      });

      const data = await response.json();
      
      console.log('Team details response:', data);
      
      if (data.success) {
        setTeam(data.team);
      } else {
        console.error('Failed to load team details:', data.message);
        toast.error(data.message || 'Failed to load team details');
      }
    } catch (error) {
      console.error('Fetch team error:', error);
      toast.error('Failed to load team details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: message.trim() })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Message send failed:', response.status, errorText);
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setMessage('');
        await fetchTeamDetails();
        toast.success('Message sent');
      } else {
        console.error('Message send failed:', data);
        toast.error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Update location
  const updateLocation = useCallback(async () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await fetch(`/api/teams/${teamId}/update-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              },
              accuracy: position.coords.accuracy,
              battery: 100, // Get from battery API if available
              isMoving: false
            })
          });
        } catch (error) {
          console.error('Update location error:', error);
        }
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true }
    );
  }, [teamId]);

  // Fetch available staff for adding
  const fetchAvailableStaff = async () => {
    setLoadingStaff(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/available-staff`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setAvailableStaff(data.availableStaff);
      }
    } catch (error) {
      console.error('Fetch available staff error:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Add member to team
  const handleAddMember = async (staffId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fieldStaffId: staffId,
          role: 'member'
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Member invited successfully');
        setShowAddMemberModal(false);
        await fetchTeamDetails();
      } else {
        toast.error(data.message || 'Failed to invite member');
      }
    } catch (error) {
      console.error('Add member error:', error);
      toast.error('Failed to invite member');
    }
  };

  // Remove member from team
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/remove-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fieldStaffId: memberId,
          reason: 'Removed by team leader'
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Member removed successfully');
        await fetchTeamDetails();
      } else {
        toast.error(data.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Remove member error:', error);
      toast.error('Failed to remove member');
    }
  };

  // Start team work
  const handleStartWork = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.loading('Getting your location...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        toast.dismiss();
        
        try {
          const response = await fetch(`/api/teams/${teamId}/start-work`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              },
              notes: 'Team work started'
            })
          });

          const data = await response.json();
          if (data.success) {
            toast.success('Team work started successfully!');
            await fetchTeamDetails();
          } else {
            toast.error(data.message || 'Failed to start work');
          }
        } catch (error) {
          console.error('Start work error:', error);
          toast.error('Failed to start work');
        }
      },
      (error) => {
        toast.dismiss();
        console.error('Geolocation error:', error);
        toast.error('Failed to get your location. Please enable location services.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Add progress update
  const handleAddProgress = async () => {
    const description = prompt('Enter progress description:');
    if (!description) return;

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    // Check if work session exists
    if (!team.workSession) {
      toast.error('No active work session found');
      return;
    }

    toast.loading('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        toast.dismiss();
        
        try {
          const formData = new FormData();
          formData.append('sessionId', team.workSession.sessionId);
          formData.append('description', description);
          formData.append('location', JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }));

          const response = await fetch(`/api/field-work/progress`, {
            method: 'POST',
            credentials: 'include',
            body: formData
          });

          const data = await response.json();
          if (data.success) {
            toast.success('Progress updated!');
            await fetchTeamDetails();
          } else {
            toast.error(data.message || 'Failed to add progress');
          }
        } catch (error) {
          console.error('Add progress error:', error);
          toast.error('Failed to add progress');
        }
      },
      (error) => {
        toast.dismiss();
        console.error('Geolocation error:', error);
        toast.error('Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Complete work
  const handleCompleteWork = async () => {
    const notes = prompt('Enter completion notes:');
    if (!notes) return;

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    // Check if work session exists
    if (!team.workSession) {
      toast.error('No active work session found');
      return;
    }

    if (!window.confirm('Are you sure you want to complete this work?')) return;

    toast.loading('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        toast.dismiss();
        
        try {
          const formData = new FormData();
          formData.append('sessionId', team.workSession.sessionId);
          formData.append('completionNotes', notes);
          formData.append('location', JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }));

          // Note: Completion images are optional for team work
          // In a real implementation, you might want to add an image upload UI

          const response = await fetch(`/api/field-work/complete`, {
            method: 'POST',
            credentials: 'include',
            body: formData
          });

          const data = await response.json();
          if (data.success) {
            toast.success('Work completed successfully!');
            await fetchTeamDetails();
          } else {
            toast.error(data.message || 'Failed to complete work');
          }
        } catch (error) {
          console.error('Complete work error:', error);
          toast.error('Failed to complete work');
        }
      },
      (error) => {
        toast.dismiss();
        console.error('Geolocation error:', error);
        toast.error('Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (showAddMemberModal) {
      fetchAvailableStaff();
    }
  }, [showAddMemberModal]);

  useEffect(() => {
    fetchTeamDetails();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchTeamDetails();
    }, 10000);

    // Update location every 30 seconds
    const locationInterval = setInterval(() => {
      updateLocation();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(locationInterval);
    };
  }, [fetchTeamDetails, updateLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Team Not Found</h2>
          <button
            onClick={() => navigate('/field-staff/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isLeader = team.teamLeader._id === user._id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/field-staff/dashboard')}
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <FiArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">{team.teamName}</h1>
                <p className="text-xs text-gray-500">
                  {team.members?.length} members • {team.status}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setRefreshing(true);
                  fetchTeamDetails();
                }}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              {isLeader && (
                <button 
                  onClick={() => setShowAddMemberModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 flex items-center space-x-1.5"
                >
                  <FiUserPlus className="h-3.5 w-3.5" />
                  <span>Add Member</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab Navigation */}
            <div className="bg-white border border-gray-200">
              <div className="flex border-b border-gray-200">
                <TabButton
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  icon={FiTarget}
                  label="Overview"
                />
                <TabButton
                  active={activeTab === 'chat'}
                  onClick={() => setActiveTab('chat')}
                  icon={FiMessageSquare}
                  label="Chat"
                />
                <TabButton
                  active={activeTab === 'map'}
                  onClick={() => setActiveTab('map')}
                  icon={FiMapPin}
                  label="Live Map"
                />
                <TabButton
                  active={activeTab === 'activity'}
                  onClick={() => setActiveTab('activity')}
                  icon={FiActivity}
                  label="Activity"
                />
              </div>

              <div className="p-5">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <OverviewTab 
                      team={team} 
                      isLeader={isLeader} 
                      onStartWork={handleStartWork}
                      onAddProgress={handleAddProgress}
                      onCompleteWork={handleCompleteWork}
                    />
                  )}
                  {activeTab === 'chat' && (
                    <ChatTab
                      team={team}
                      message={message}
                      setMessage={setMessage}
                      sending={sending}
                      onSend={handleSendMessage}
                      currentUserId={user._id}
                    />
                  )}
                  {activeTab === 'map' && (
                    <MapTab team={team} />
                  )}
                  {activeTab === 'activity' && (
                    <ActivityTab team={team} />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Team Members */}
            <TeamMembersCard 
              team={team} 
              isLeader={isLeader} 
              onRemoveMember={handleRemoveMember}
              currentUserId={user._id}
            />

            {/* Task Details */}
            <TaskDetailsCard complaint={team.complaint} />

            {/* Resources */}
            {(team.requiredEquipment?.length > 0 || team.requiredMaterials?.length > 0) && (
              <ResourcesCard team={team} />
            )}
          </div>
        </div>
      </main>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <AddMemberModal
            availableStaff={availableStaff}
            loading={loadingStaff}
            onClose={() => setShowAddMemberModal(false)}
            onAddMember={handleAddMember}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Tab Button
const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors ${
      active
        ? 'text-slate-900 border-b-2 border-slate-900 bg-gray-50'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);

// Overview Tab
const OverviewTab = ({ team, isLeader, onStartWork, onAddProgress, onCompleteWork }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-4"
  >
    {/* Start Work Button (Team Leader Only) */}
    {isLeader && team.status === 'ready' && (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-900 mb-1">Ready to Start</h3>
            <p className="text-sm text-green-700">
              Your team is ready. Start work when you're at the location.
            </p>
          </div>
          <button
            onClick={onStartWork}
            className="px-6 py-3 bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-lg"
          >
            <FiCheckCircle className="h-5 w-5" />
            <span>Start Work</span>
          </button>
        </div>
      </div>
    )}

    {/* Active Work Session */}
    {team.status === 'active' && (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900 mb-1 flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" />
              Work in Progress
            </h3>
            <p className="text-sm text-blue-700">
              Started {new Date(team.startedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={onAddProgress}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Add Progress
            </button>
            {isLeader && (
              <button 
                onClick={onCompleteWork}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                Complete Work
              </button>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Work Progress Timeline */}
    {team.workSession && team.workSession.progressUpdates && team.workSession.progressUpdates.length > 0 && (
      <div className="bg-white border border-gray-200 p-4">
        <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center">
          <FiActivity className="mr-2 h-4 w-4" />
          Work Progress Timeline
        </h3>
        <div className="space-y-3">
          {team.workSession.progressUpdates.map((update, index) => (
            <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiCheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{update.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(update.timestamp).toLocaleString()}
                </p>
                {update.images && update.images.length > 0 && (
                  <div className="flex space-x-2 mt-2">
                    {update.images.map((img, imgIdx) => (
                      <img
                        key={imgIdx}
                        src={img.url}
                        alt="Progress"
                        className="w-16 h-16 object-cover rounded border border-gray-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Team Stats */}
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        icon={FiUsers}
        label="Team Size"
        value={`${team.members?.length || 0}/${team.maxMembers}`}
        color="blue"
      />
      <StatCard
        icon={FiClock}
        label="Duration"
        value={`${Math.floor((team.estimatedDuration || 0) / 60)}h`}
        color="purple"
      />
      <StatCard
        icon={FiActivity}
        label="Status"
        value={team.status}
        color="green"
      />
    </div>

    {/* Task Description */}
    <div className="bg-gray-50 p-4">
      <h3 className="font-semibold text-sm text-gray-900 mb-2">Task Description</h3>
      <p className="text-sm text-gray-700">{team.complaint?.description}</p>
    </div>

    {/* Location */}
    <div className="bg-gray-50 p-4">
      <h3 className="font-semibold text-sm text-gray-900 mb-2 flex items-center">
        <FiMapPin className="mr-2 h-4 w-4" />
        Location
      </h3>
      <p className="text-sm text-gray-700">{team.complaint?.address}</p>
    </div>
  </motion.div>
);

// Chat Tab
const ChatTab = ({ team, message, setMessage, sending, onSend, currentUserId }) => {
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [team.messages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-3"
    >
      {/* Messages */}
      <div className="h-96 overflow-y-auto space-y-2 bg-gray-50 p-3">
        {team.messages && team.messages.length > 0 ? (
          team.messages.map((msg, index) => {
            const isOwn = msg.sender._id === currentUserId;
            return (
              <div
                key={index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs ${isOwn ? 'order-2' : 'order-1'}`}>
                  <div className={`px-3 py-2 ${
                    isOwn
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    {!isOwn && (
                      <p className="text-xs font-semibold mb-1 opacity-70">
                        {msg.sender.name}
                      </p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-gray-300' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <FiMessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !sending && onSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
        />
        <button
          onClick={onSend}
          disabled={sending || !message.trim()}
          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <FiSend className="h-4 w-4" />
          <span>Send</span>
        </button>
      </div>
    </motion.div>
  );
};

// Map Tab
const MapTab = ({ team }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-3"
  >
    <div className="bg-gray-100 h-96 flex items-center justify-center">
      <div className="text-center">
        <FiMapPin className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-sm text-gray-600">Live map integration coming soon</p>
        <p className="text-xs text-gray-500 mt-1">
          Will show real-time locations of all team members
        </p>
      </div>
    </div>

    {/* Member Locations */}
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-gray-900">Team Member Locations</h3>
      {team.lastKnownLocations && team.lastKnownLocations.length > 0 ? (
        team.lastKnownLocations.map((loc, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-white text-xs font-semibold">
                {loc.fieldStaff?.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{loc.fieldStaff?.name}</p>
                <p className="text-xs text-gray-500">
                  Updated {new Date(loc.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {loc.battery && (
                <span className="text-xs text-gray-600">{loc.battery}%</span>
              )}
              <span className={`w-2 h-2 rounded-full ${
                loc.isMoving ? 'bg-emerald-500' : 'bg-gray-400'
              }`} />
            </div>
          </div>
        ))
      ) : (
        <p className="text-xs text-gray-500">No location data available</p>
      )}
    </div>
  </motion.div>
);

// Activity Tab
const ActivityTab = ({ team }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-2"
  >
    {team.activityLog && team.activityLog.length > 0 ? (
      team.activityLog.slice().reverse().map((activity, index) => (
        <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50">
          <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
            <FiActivity className="h-3 w-3 text-slate-700" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-900">{activity.description}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-12">
        <FiActivity className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No activity yet</p>
      </div>
    )}
  </motion.div>
);

// Team Members Card
const TeamMembersCard = ({ team, isLeader, onRemoveMember, currentUserId }) => (
  <div className="bg-white border border-gray-200 p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-sm text-gray-900">Team Members</h3>
      <span className="text-xs text-gray-500">{team.members?.length} members</span>
    </div>
    <div className="space-y-2">
      {team.members?.map((member, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-white text-xs font-semibold">
              {member.fieldStaff?.name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {member.fieldStaff?.name}
                {member.role === 'leader' && (
                  <span className="ml-1.5 text-xs text-amber-600">★</span>
                )}
              </p>
              <p className="text-xs text-gray-500">{member.fieldStaff?.department}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              member.status === 'accepted' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}>
              {member.status}
            </span>
            {isLeader && member.role !== 'leader' && member.fieldStaff?._id !== currentUserId && (
              <button
                onClick={() => onRemoveMember(member.fieldStaff._id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Remove member"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Task Details Card
const TaskDetailsCard = ({ complaint }) => (
  <div className="bg-white border border-gray-200 p-5">
    <h3 className="font-semibold text-sm text-gray-900 mb-3">Task Details</h3>
    <div className="space-y-2">
      <DetailRow icon={FiTarget} label="Title" value={complaint?.title} />
      <DetailRow icon={FiMapPin} label="Location" value={complaint?.address} />
      <DetailRow icon={FiClock} label="Created" value={new Date(complaint?.createdAt).toLocaleDateString()} />
      <DetailRow
        icon={FiAlertCircle}
        label="Priority"
        value={
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            complaint?.priority === 'urgent' ? 'bg-red-50 text-red-700 border border-red-200' :
            complaint?.priority === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
            'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {complaint?.priority}
          </span>
        }
      />
    </div>
  </div>
);

// Resources Card
const ResourcesCard = ({ team }) => (
  <div className="bg-white border border-gray-200 p-5">
    <h3 className="font-semibold text-sm text-gray-900 mb-3">Resources</h3>
    
    {team.requiredEquipment?.length > 0 && (
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
          <FiTool className="mr-1.5 h-3.5 w-3.5" />
          Equipment
        </h4>
        <ul className="space-y-1">
          {team.requiredEquipment.map((eq, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-center">
              <span className="w-1 h-1 bg-slate-700 rounded-full mr-2" />
              {eq.equipment} (x{eq.quantity})
            </li>
          ))}
        </ul>
      </div>
    )}
    
    {team.requiredMaterials?.length > 0 && (
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
          <FiPackage className="mr-1.5 h-3.5 w-3.5" />
          Materials
        </h4>
        <ul className="space-y-1">
          {team.requiredMaterials.map((mat, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-center">
              <span className="w-1 h-1 bg-emerald-600 rounded-full mr-2" />
              {mat.material} ({mat.quantity} {mat.unit})
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

// Helper Components
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'bg-slate-700',
    purple: 'bg-indigo-600',
    green: 'bg-emerald-600'
  };

  return (
    <div className="bg-gray-50 p-3">
      <div className={`w-8 h-8 ${colors[color]} rounded flex items-center justify-center mb-2`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-base font-semibold text-gray-900">{value}</p>
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start space-x-2">
    <Icon className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xs text-gray-900 font-medium break-words">{value}</p>
    </div>
  </div>
);

// Add Member Modal
const AddMemberModal = ({ availableStaff, loading, onClose, onAddMember }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Add Team Member</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : availableStaff.length === 0 ? (
          <div className="text-center py-12">
            <FiUsers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No available staff members</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableStaff.map((staff) => (
              <div
                key={staff._id}
                className="flex items-center justify-between p-3 border border-gray-200 hover:border-slate-400 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center text-white font-semibold">
                    {staff.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                    <p className="text-xs text-gray-500">{staff.department}</p>
                    {staff.skills && staff.skills.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        {staff.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onAddMember(staff._id)}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                >
                  Invite
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  </div>
);

export default TeamWorkspace;
