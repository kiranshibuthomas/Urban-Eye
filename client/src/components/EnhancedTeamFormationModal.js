import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import TeamHeader from './TeamFormation/TeamHeader';
import StepBasicInfo from './TeamFormation/StepBasicInfo';
import StepResourcePlanning from './TeamFormation/StepResourcePlanning';
import StepMemberSelection from './TeamFormation/StepMemberSelection';
import StepTeamSummary from './TeamFormation/StepTeamSummary';
import TeamFooter from './TeamFormation/TeamFooter';

const EnhancedTeamFormationModal = ({ complaint, onClose, onTeamCreated }) => {
  const [step, setStep] = useState(1);
  const [teamConfig, setTeamConfig] = useState({
    teamName: `Team for ${complaint.title}`,
    maxMembers: 3,
    teamType: 'standard',
    specialization: 'general',
    taskComplexity: 'moderate',
    estimatedDuration: 120,
    requiredSkills: [],
    requiredEquipment: [],
    requiredMaterials: [],
    estimatedBudget: 0
  });
  
  const [teamId, setTeamId] = useState(complaint.teamId || null);
  const [teamData, setTeamData] = useState(complaint.team || null);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [filterSkill, setFilterSkill] = useState('all');
  const [sortBy, setSortBy] = useState('distance');

  // Check for existing team
  useEffect(() => {
    checkExistingTeam();
  }, []);

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
          setTeamId(existingTeam._id);
          setTeamData(existingTeam);
          setTeamConfig({
            teamName: existingTeam.teamName,
            maxMembers: existingTeam.maxMembers,
            teamType: existingTeam.teamType || 'standard',
            specialization: existingTeam.specialization || 'general',
            taskComplexity: existingTeam.taskComplexity || 'moderate',
            estimatedDuration: existingTeam.estimatedDuration || 120,
            requiredSkills: existingTeam.requiredSkills || [],
            requiredEquipment: existingTeam.requiredEquipment || [],
            requiredMaterials: existingTeam.requiredMaterials || [],
            estimatedBudget: existingTeam.estimatedBudget || 0
          });
          
          if (existingTeam.status === 'forming') {
            setStep(3);
            fetchAvailableStaff(existingTeam._id);
          } else {
            setStep(4);
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
    if (!teamConfig.teamName.trim()) {
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
          ...teamConfig
        })
      });

      const data = await response.json();

      if (data.success) {
        setTeamId(data.team._id);
        setTeamData(data.team);
        toast.success('Team created successfully!');
        setStep(3);
        fetchAvailableStaff(data.team._id);
        
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
        let staff = data.availableStaff;
        
        // Filter by skill
        if (filterSkill !== 'all') {
          staff = staff.filter(s => s.skills?.includes(filterSkill));
        }
        
        // Sort
        if (sortBy === 'distance') {
          staff.sort((a, b) => (a.distanceFromTask || 999999) - (b.distanceFromTask || 999999));
        } else if (sortBy === 'experience') {
          staff.sort((a, b) => (b.tasksCompleted || 0) - (a.tasksCompleted || 0));
        } else if (sortBy === 'rating') {
          staff.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }
        
        setAvailableStaff(staff);
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
      
      setStep(4);
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

  const handleClose = () => {
    if (onTeamCreated && teamData) {
      onTeamCreated(teamData);
    }
    onClose();
  };

  const toggleStaffSelection = (staffId) => {
    setSelectedStaff(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  useEffect(() => {
    if (teamId && step === 3) {
      const timer = setTimeout(() => {
        fetchAvailableStaff(teamId);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, filterSkill, sortBy, teamId, step]);

  if (checkingExisting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-12 text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking for existing team...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <TeamHeader 
            step={step} 
            complaint={complaint} 
            onClose={handleClose}
          />

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <StepBasicInfo
                  teamConfig={teamConfig}
                  setTeamConfig={setTeamConfig}
                  complaint={complaint}
                />
              )}
              
              {step === 2 && (
                <StepResourcePlanning
                  teamConfig={teamConfig}
                  setTeamConfig={setTeamConfig}
                />
              )}
              
              {step === 3 && (
                <StepMemberSelection
                  availableStaff={availableStaff}
                  selectedStaff={selectedStaff}
                  toggleStaffSelection={toggleStaffSelection}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filterSkill={filterSkill}
                  setFilterSkill={setFilterSkill}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  maxMembers={teamConfig.maxMembers}
                  requiredSkills={teamConfig.requiredSkills}
                />
              )}
              
              {step === 4 && (
                <StepTeamSummary
                  teamData={teamData}
                  teamConfig={teamConfig}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <TeamFooter
            step={step}
            setStep={setStep}
            loading={loading}
            inviting={inviting}
            selectedStaff={selectedStaff}
            handleCreateTeam={handleCreateTeam}
            handleInviteMembers={handleInviteMembers}
            handleClose={handleClose}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EnhancedTeamFormationModal;
