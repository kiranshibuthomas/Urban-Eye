import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiMapPin,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiSend,
  FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const TeamFormationModal = ({ complaint, onClose, onTeamCreated }) => {
  const [step, setStep] = useState(1); // 1: Create team, 2: Invite members, 3: View team
  const [teamName, setTeamName] = useState(`Team for ${complaint.title}`);
  const [maxMembers, setMaxMembers] = useState(3);
  const [teamId, setTeamId] = useState(complaint.teamId || null);
  const [teamData, setTeamData] = useState(complaint.team || null);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Check for existing team on mount
  useEffect(() => {
    checkExistingTeam();
  }, []);

  // Check if team already exists for this complaint
  const checkExistingTeam = async () => {
    try {
      const response = await fetch('/api/teams/my/teams', {
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        const existingTeam = data.teams.find(
          t => t.complaint._id === complaint._id && 
          ['forming', 'ready', 'active'].includes(t.status)
        );

        if (existingTeam) {
          // Team already exists, show it
          setTeamId(existingTeam._id);
          setTeamData(existingTeam);
          setTeamName(existingTeam.teamName);
          setMaxMembers(existingTeam.maxMembers);
          
          // Go to invite members step if team is still forming
          if (existingTeam.status === 'forming') {
            setStep(2);
            fetchAvailableStaff(existingTeam._id);
          } else {
            setStep(3); // View team
          }
        }
      }
    } catch (error) {
      console.error('Check existing team error:', error);
    } finally {
      setCheckingExisting(false);
    }
  };

  // Create team
  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          complaintId: complaint._id,
          teamName,
          maxMembers
        })
      });

      const data = await response.json();

      if (data.success) {
        setTeamId(data.team._id);
        setTeamData(data.team);
        toast.success('Team created successfully!');
        setStep(2);
        fetchAvailableStaff(data.team._id);
        
        // Notify parent
        if (onTeamCreated) {
          onTeamCreated(data.team);
        }
      } else {
        toast.error(data.message || 'Failed to create team');
      }
    } catch (error) {
      console.error('Create team error:', error);
      toast.error('Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available staff
  const fetchAvailableStaff = async (tId) => {
    try {
      const response = await fetch(
        `/api/teams/${tId}/available-staff?search=${searchQuery}`,
        { credentials: 'include' }
      );

      const data = await response.json();

      if (data.success) {
        setAvailableStaff(data.availableStaff);
      }
    } catch (error) {
      console.error('Fetch staff error:', error);
    }
  };

  // Invite members
  const handleInviteMembers = async () => {
    if (selectedStaff.length === 0) {
      toast.error('Please select at least one team member');
      return;
    }

    setInviting(true);
    try {
      const promises = selectedStaff.map(staffId =>
        fetch(`/api/teams/${teamId}/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            fieldStaffId: staffId,
            role: 'member'
          })
        })
      );

      await Promise.all(promises);
      toast.success('Team invitations sent!');
      
      // Move to view team step
      setStep(3);
      
      // Refresh team data
      await fetchTeamDetails();
    } catch (error) {
      console.error('Invite members error:', error);
      toast.error('Failed to send invitations');
    } finally {
      setInviting(false);
    }
  };

  // Fetch team details
  const fetchTeamDetails = async () => {
    if (!teamId) return;
    
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setTeamData(data.team);
      }
    } catch (error) {
      console.error('Fetch team details error:', error);
    }
  };

  // Skip invitations and go to view team
  const handleSkipInvitations = () => {
    setStep(3);
    fetchTeamDetails();
  };

  // Close and notify parent
  const handleClose = () => {
    if (onTeamCreated && teamData) {
      onTeamCreated(teamData);
    }
    onClose();
  };

  // Toggle staff selection
  const toggleStaffSelection = (staffId) => {
    setSelectedStaff(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  // Search staff
  useEffect(() => {
    if (teamId) {
      const timer = setTimeout(() => {
        fetchAvailableStaff(teamId);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, teamId]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        >
          {checkingExisting ? (
            // Loading state while checking for existing team
            <div className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Checking for existing team...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FiUsers className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {step === 1 ? 'Create Team' : step === 2 ? 'Invite Team Members' : 'Team Details'}
                      </h2>
                      <p className="text-blue-100 mt-1">
                        {complaint.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center space-x-4 mt-6">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= 1 ? 'bg-white text-blue-600' : 'bg-white/20 text-white'
                    }`}>
                      {step > 1 ? <FiCheck className="h-5 w-5" /> : '1'}
                    </div>
                    <span className="text-sm font-medium">Create Team</span>
                  </div>
                  <div className="flex-1 h-1 bg-white/20 rounded">
                    <div className={`h-full bg-white rounded transition-all duration-300 ${
                      step >= 2 ? 'w-full' : 'w-0'
                    }`} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= 2 ? 'bg-white text-blue-600' : 'bg-white/20 text-white'
                    }`}>
                      {step > 2 ? <FiCheck className="h-5 w-5" /> : '2'}
                    </div>
                    <span className="text-sm font-medium">Invite Members</span>
                  </div>
                  <div className="flex-1 h-1 bg-white/20 rounded">
                    <div className={`h-full bg-white rounded transition-all duration-300 ${
                      step >= 3 ? 'w-full' : 'w-0'
                    }`} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= 3 ? 'bg-white text-blue-600' : 'bg-white/20 text-white'
                    }`}>
                      3
                    </div>
                    <span className="text-sm font-medium">View Team</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
                {step === 1 ? (
                  // Step 1: Create Team
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter team name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Team Size
                      </label>
                      <select
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={2}>2 members</option>
                        <option value={3}>3 members</option>
                        <option value={4}>4 members</option>
                        <option value={5}>5 members</option>
                      </select>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <FiAlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">Team Work Benefits</h4>
                          <ul className="mt-2 text-sm text-blue-700 space-y-1">
                            <li>• Collaborate with other field staff</li>
                            <li>• Share real-time locations</li>
                            <li>• Communicate via team chat</li>
                            <li>• Track combined progress</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : step === 2 ? (
                  // Step 2: Invite Members
                  <div className="space-y-6">
                    {/* Search */}
                    <div className="relative">
                      <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search field staff by name, department..."
                      />
                    </div>

                    {/* Selected Count */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                      <span className="text-sm text-gray-600">
                        Selected: {selectedStaff.length} / {maxMembers - 1}
                      </span>
                      {selectedStaff.length > 0 && (
                        <button
                          onClick={() => setSelectedStaff([])}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {/* Available Staff List */}
                    <div className="space-y-3">
                      {availableStaff.length > 0 ? (
                        availableStaff.map((staff) => (
                          <StaffCard
                            key={staff._id}
                            staff={staff}
                            isSelected={selectedStaff.includes(staff._id)}
                            onToggle={() => toggleStaffSelection(staff._id)}
                            disabled={
                              !selectedStaff.includes(staff._id) &&
                              selectedStaff.length >= maxMembers - 1
                            }
                          />
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <FiUsers className="mx-auto h-12 w-12 text-gray-300" />
                          <p className="mt-4 text-gray-500">No available field staff found</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Step 3: View Team
                  <div className="space-y-6">
                    {teamData ? (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-center space-x-3">
                            <FiCheckCircle className="h-6 w-6 text-green-600" />
                            <div>
                              <h4 className="font-semibold text-green-900">Team Created Successfully!</h4>
                              <p className="text-sm text-green-700 mt-1">
                                Your team "{teamData.teamName}" is ready. Members will receive invitations.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Team Information</h3>
                          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Team Name:</span>
                              <span className="font-medium">{teamData.teamName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                teamData.status === 'forming' ? 'bg-yellow-100 text-yellow-800' :
                                teamData.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {teamData.status}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Team Size:</span>
                              <span className="font-medium">
                                {teamData.members?.length || 0} / {teamData.maxMembers}
                              </span>
                            </div>
                          </div>
                        </div>

                        {teamData.members && teamData.members.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Team Members</h3>
                            <div className="space-y-2">
                              {teamData.members.map((member) => (
                                <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold">
                                      {member.fieldStaff?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{member.fieldStaff?.name || 'Unknown'}</p>
                                      <p className="text-sm text-gray-600">{member.role}</p>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    member.status === 'active' ? 'bg-green-100 text-green-800' :
                                    member.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                                    member.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {member.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading team details...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                  >
                    {step === 3 ? 'Close' : 'Cancel'}
                  </button>
                  <div className="flex items-center space-x-3">
                    {step === 2 && (
                      <button
                        onClick={() => setStep(1)}
                        className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                      >
                        Back
                      </button>
                    )}
                    {step === 2 && (
                      <button
                        onClick={handleSkipInvitations}
                        className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                      >
                        Skip for Now
                      </button>
                    )}
                    {step === 1 && (
                      <button
                        onClick={handleCreateTeam}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <span>Create Team</span>
                            <FiSend className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                    {step === 2 && (
                      <button
                        onClick={handleInviteMembers}
                        disabled={inviting || selectedStaff.length === 0}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {inviting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Inviting...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Invitations</span>
                            <FiSend className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                    {step === 3 && (
                      <button
                        onClick={handleClose}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center space-x-2"
                      >
                        <FiCheckCircle className="h-4 w-4" />
                        <span>Done</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Staff Card Component
const StaffCard = ({ staff, isSelected, onToggle, disabled }) => {
  return (
    <div
      onClick={() => !disabled && onToggle()}
      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : disabled
          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-semibold">
            {staff.name.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-gray-900">{staff.name}</h4>
            <p className="text-sm text-gray-600">{staff.department}</p>
            {staff.distanceFromTask && (
              <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                <FiMapPin className="h-3 w-3" />
                <span>{(staff.distanceFromTask / 1000).toFixed(1)} km away</span>
              </div>
            )}
          </div>
        </div>

        {/* Selection Indicator */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-500'
            : 'border-gray-300'
        }`}>
          {isSelected && <FiCheck className="h-4 w-4 text-white" />}
        </div>
      </div>

      {/* Skills */}
      {staff.skills && staff.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {staff.skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamFormationModal;
