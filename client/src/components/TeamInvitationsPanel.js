import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers,
  FiCheck,
  FiX,
  FiMapPin,
  FiUser,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TeamInvitationsPanel = ({ onInvitationResponse }) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  // Fetch team invitations
  const fetchInvitations = async () => {
    if (!user?._id) {
      console.log('User not loaded yet, skipping invitation fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching invitations for user:', user._id);
      const response = await fetch('/api/teams/my/teams?status=forming', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Teams response:', data);

      if (data.success) {
        console.log('Total teams found:', data.teams.length);
        
        // Filter to only show teams where user has pending invitation
        const pendingInvitations = data.teams.filter(team => {
          const myMembership = team.members.find(m => {
            // Convert both to strings for comparison
            const memberIdStr = m.fieldStaff._id?.toString() || m.fieldStaff.toString();
            const userIdStr = user?._id?.toString();
            const isMatch = memberIdStr === userIdStr && m.status === 'invited';
            
            if (memberIdStr === userIdStr) {
              console.log(`Found membership in team ${team._id}, status: ${m.status}`);
            }
            
            return isMatch;
          });
          return myMembership !== undefined;
        });
        
        console.log('Pending invitations found:', pendingInvitations.length);
        setInvitations(pendingInvitations);
      } else {
        console.error('API returned success: false', data.message);
      }
    } catch (error) {
      console.error('Fetch invitations error:', error);
      toast.error('Failed to load team invitations');
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
    if (user?._id) {
      fetchInvitations();
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchInvitations, 30000);
      return () => clearInterval(interval);
    }
  }, [user?._id]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-gray-200 w-1/3" />
          <div className="h-16 bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <FiUsers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">Loading...</h3>
        <p className="text-sm text-gray-500">Please wait while we load your invitations</p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-16">
        <FiUsers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">No pending invitations</h3>
        <p className="text-sm text-gray-500">You don't have any team invitations at the moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Pending Invitations</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchInvitations}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 transition-colors"
            title="Refresh invitations"
          >
            Refresh
          </button>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
            {invitations.length} pending
          </span>
        </div>
      </div>

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
      className="bg-white border border-gray-200 p-4 hover:border-slate-400 transition-colors"
    >
      {/* Team Info */}
      <div className="mb-3">
        <h4 className="font-semibold text-sm text-gray-900 mb-2">{team.teamName}</h4>
        
        <div className="space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <FiAlertCircle className="h-3.5 w-3.5 text-slate-700" />
            <span className="font-medium">{team.complaint?.title}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <FiMapPin className="h-3.5 w-3.5" />
            <span className="truncate">{team.complaint?.address}</span>
          </div>
          
          {inviter && (
            <div className="flex items-center space-x-2">
              <FiUser className="h-3.5 w-3.5" />
              <span>Invited by {inviter.name}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <FiUsers className="h-3.5 w-3.5" />
            <span>
              {team.members.filter(m => m.status === 'active' || m.status === 'accepted').length} / {team.maxMembers} members
            </span>
          </div>
        </div>
      </div>

      {/* Task Details */}
      <div className="bg-gray-50 p-3 mb-3">
        <p className="text-xs text-gray-700 line-clamp-2">
          {team.complaint?.description}
        </p>
        <div className="flex items-center space-x-2 mt-2 text-xs">
          <span className="px-2 py-0.5 bg-white text-gray-700 border border-gray-200">
            {team.complaint?.category}
          </span>
          <span className="px-2 py-0.5 bg-white text-gray-700 border border-gray-200">
            {team.complaint?.priority}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onAccept}
          disabled={isResponding}
          className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResponding ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <FiCheck className="h-3.5 w-3.5" />
              <span>Accept</span>
            </>
          )}
        </button>
        
        <button
          onClick={onDecline}
          disabled={isResponding}
          className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiX className="h-3.5 w-3.5" />
          <span>Decline</span>
        </button>
      </div>
    </motion.div>
  );
};

export default TeamInvitationsPanel;
