import React from 'react';
import { motion } from 'framer-motion';
import {
  FiCheckCircle, FiUsers, FiClock, FiTool, FiPackage,
  FiDollarSign, FiTarget, FiZap, FiAward, FiMapPin
} from 'react-icons/fi';

const StepTeamSummary = ({ teamData, teamConfig }) => {
  if (!teamData) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading team details...</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      forming: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ready: 'bg-blue-100 text-blue-800 border-blue-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getMemberStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      accepted: 'bg-blue-100 text-blue-800',
      invited: 'bg-yellow-100 text-yellow-800',
      declined: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <FiCheckCircle className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">Team Created Successfully!</h3>
            <p className="text-green-100">
              Your team "{teamData.teamName}" is ready. Invitations have been sent to selected members.
            </p>
          </div>
        </div>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-2 gap-4">
        <InfoCard
          icon={FiUsers}
          label="Team Size"
          value={`${teamData.members?.length || 0} / ${teamData.maxMembers}`}
          color="blue"
        />
        <InfoCard
          icon={FiClock}
          label="Est. Duration"
          value={`${Math.floor(teamConfig.estimatedDuration / 60)}h ${teamConfig.estimatedDuration % 60}m`}
          color="purple"
        />
        <InfoCard
          icon={FiZap}
          label="Team Type"
          value={teamConfig.teamType.replace('_', ' ')}
          color="orange"
        />
        <InfoCard
          icon={FiTarget}
          label="Complexity"
          value={teamConfig.taskComplexity}
          color="red"
        />
      </div>

      {/* Team Status */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Team Status</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor(teamData.status)}`}>
            {teamData.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Team Members */}
      {teamData.members && teamData.members.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <FiUsers className="mr-2 h-5 w-5 text-blue-600" />
            Team Members ({teamData.members.length})
          </h3>
          <div className="space-y-2">
            {teamData.members.map((member, index) => (
              <div key={member._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                    {member.fieldStaff?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {member.fieldStaff?.name || 'Unknown'}
                      {member.role === 'leader' && (
                        <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          <FiAward className="inline h-3 w-3 mr-1" />
                          Leader
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">{member.fieldStaff?.department || 'N/A'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getMemberStatusColor(member.status)}`}>
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources Summary */}
      {(teamConfig.requiredEquipment.length > 0 || teamConfig.requiredMaterials.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {/* Equipment */}
          {teamConfig.requiredEquipment.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <FiTool className="mr-2 h-4 w-4" />
                Equipment ({teamConfig.requiredEquipment.length})
              </h4>
              <ul className="space-y-2">
                {teamConfig.requiredEquipment.slice(0, 3).map((eq, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                    {eq.equipment} (x{eq.quantity})
                    {eq.critical && <span className="ml-2 text-red-600 font-semibold">*</span>}
                  </li>
                ))}
                {teamConfig.requiredEquipment.length > 3 && (
                  <li className="text-sm text-blue-600 font-medium">
                    +{teamConfig.requiredEquipment.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Materials */}
          {teamConfig.requiredMaterials.length > 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <FiPackage className="mr-2 h-4 w-4" />
                Materials ({teamConfig.requiredMaterials.length})
              </h4>
              <ul className="space-y-2">
                {teamConfig.requiredMaterials.slice(0, 3).map((mat, index) => (
                  <li key={index} className="text-sm text-green-800 flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2" />
                    {mat.material} ({mat.quantity} {mat.unit})
                  </li>
                ))}
                {teamConfig.requiredMaterials.length > 3 && (
                  <li className="text-sm text-green-600 font-medium">
                    +{teamConfig.requiredMaterials.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Budget */}
      {teamConfig.estimatedBudget > 0 && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <FiDollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Estimated Budget</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${teamConfig.estimatedBudget.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Required Skills */}
      {teamConfig.requiredSkills.length > 0 && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
          <h4 className="font-semibold text-indigo-900 mb-3">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {teamConfig.requiredSkills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <h4 className="font-bold text-blue-900 mb-3 text-lg">Next Steps</h4>
        <ul className="space-y-2">
          <li className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
              1
            </div>
            <p className="text-blue-800">
              Team members will receive invitations and can accept/decline
            </p>
          </li>
          <li className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
              2
            </div>
            <p className="text-blue-800">
              Once all members respond, team status will update to "Ready"
            </p>
          </li>
          <li className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
              3
            </div>
            <p className="text-blue-800">
              Team leader can start work when team is ready
            </p>
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

const InfoCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600'
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 bg-gradient-to-r ${colors[color]} rounded-lg flex items-center justify-center shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StepTeamSummary;
