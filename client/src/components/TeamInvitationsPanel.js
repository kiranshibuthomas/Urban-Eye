import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers,
  FiCheck,
  FiX,
  FiMapPin,
  FiClock,
  FiUser,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const TeamInvitationsPanel = ({ onInvitationResponse }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  // Fetch team invitations
  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/teams/my/teams?status=forming', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Filter to only show teams where user has pending invitation
        const pendingInvitations = data.teams.filter(team => {
          const myMembership = team.members.find(
            m => m.fieldStaff._id === localStorage.getItem('userId') && m.status === 'invited'
          );
          return myMembership !== undefined;
        });
        
        setInvitations(pendingInvitations);
      }
    } catch (error) {
      console.error('Fetch invitations error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Respond to invitation
  const handleResponse = async (teamId, accept) => {
    setResponding(teamId);
    try {
      const response = await fetch(`/api/teams/${teamId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accept })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(accept ? 'Invitation accepted!' : 'Invitation declined');
        
        // Remove from invitations list
        setInvitations(prev => prev.filter(inv => inv._id !== teamId));
        
        // Notify parent component
        if (onInvitationResponse) {
          onInvitationResponse(accept);
        }
      } else {
        toast.error(data.message || 'Failed to respond to invitation');
      }
    } catch (error) {
      console.error('Respond error:', error);
      toast.error('Failed to respond to invitation');
    } finally {
      setResponding(null);
    }
  };

  useEffect(() => {
    fetchInvitations();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchInvitations, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <FiUsers className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Team Invitations</h3>
          <p className="text-sm text-gray-600">
            You have {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {invitations.map((team) => (
            <InvitationCard
              key={team._id}
              team={team}
              onAccept={() => handleResponse(team._id, true)}
              onDecline={() => handleResponse(team._id, false)}
              isResponding={responding === team._id}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Invitation Card Component
const InvitationCard = ({ team, onAccept, onDecline, isResponding }) => {
  const inviter = team.members.find(m => m.role === 'leader')?.fieldStaff;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-white rounded-xl p-5 shadow-md border border-gray-200"
    >
      {/* Team Info */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">{team.teamName}</h4>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <FiAlertCircle className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{team.complaint?.title}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <FiMapPin className="h-4 w-4" />
            <span className="truncate">{team.complaint?.address}</span>
          </div>
          
          {inviter && (
            <div className="flex items-center space-x-2">
              <FiUser className="h-4 w-4" />
              <span>Invited by {inviter.name}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <FiUsers className="h-4 w-4" />
            <span>
              {team.members.filter(m => m.status === 'active' || m.status === 'accepted').length} / {team.maxMembers} members
            </span>
          </div>
        </div>
      </div>

      {/* Task Details */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-700 line-clamp-2">
          {team.complaint?.description}
        </p>
        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-white rounded-full">
            {team.complaint?.category}
          </span>
          <span className="px-2 py-1 bg-white rounded-full">
            {team.complaint?.priority} priority
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onAccept}
          disabled={isResponding}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResponding ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <FiCheck className="h-4 w-4" />
              <span>Accept</span>
            </>
          )}
        </button>
        
        <button
          onClick={onDecline}
          disabled={isResponding}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiX className="h-4 w-4" />
          <span>Decline</span>
        </button>
      </div>
    </motion.div>
  );
};

export default TeamInvitationsPanel;
