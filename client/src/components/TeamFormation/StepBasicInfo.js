import React from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiZap, FiClock, FiTarget, FiInfo } from 'react-icons/fi';

const StepBasicInfo = ({ teamConfig, setTeamConfig, complaint }) => {
  const teamTypes = [
    { value: 'standard', label: 'Standard Team', icon: '👥', desc: 'Regular task execution' },
    { value: 'emergency', label: 'Emergency Response', icon: '🚨', desc: 'Urgent critical tasks' },
    { value: 'specialized', label: 'Specialized Team', icon: '⚡', desc: 'Technical expertise required' },
    { value: 'training', label: 'Training Team', icon: '📚', desc: 'Learning & development' }
  ];

  const specializations = [
    { value: 'general', label: 'General Maintenance', icon: '🔧' },
    { value: 'electrical', label: 'Electrical Work', icon: '⚡' },
    { value: 'plumbing', label: 'Plumbing', icon: '💧' },
    { value: 'road_work', label: 'Road Work', icon: '🛣️' },
    { value: 'sanitation', label: 'Sanitation', icon: '🧹' },
    { value: 'emergency_response', label: 'Emergency Response', icon: '🚨' }
  ];

  const complexityLevels = [
    { value: 'simple', label: 'Simple', color: 'green', time: '< 1 hour' },
    { value: 'moderate', label: 'Moderate', color: 'blue', time: '1-3 hours' },
    { value: 'complex', label: 'Complex', color: 'orange', time: '3-6 hours' },
    { value: 'critical', label: 'Critical', color: 'red', time: '> 6 hours' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      {/* Team Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Team Name *
        </label>
        <input
          type="text"
          value={teamConfig.teamName}
          onChange={(e) => setTeamConfig({ ...teamConfig, teamName: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Enter a descriptive team name"
        />
      </div>

      {/* Team Size */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Team Size *
        </label>
        <div className="grid grid-cols-5 gap-3">
          {[2, 3, 4, 5, 6].map(size => (
            <button
              key={size}
              onClick={() => setTeamConfig({ ...teamConfig, maxMembers: size })}
              className={`p-4 rounded-xl border-2 transition-all ${
                teamConfig.maxMembers === size
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <FiUsers className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm font-semibold">{size}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Team Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Team Type *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {teamTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setTeamConfig({ ...teamConfig, teamType: type.value })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                teamConfig.teamType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{type.label}</h4>
                  <p className="text-xs text-gray-600 mt-1">{type.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Specialization */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Specialization *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {specializations.map(spec => (
            <button
              key={spec.value}
              onClick={() => setTeamConfig({ ...teamConfig, specialization: spec.value })}
              className={`p-3 rounded-xl border-2 transition-all ${
                teamConfig.specialization === spec.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="text-xl block mb-1">{spec.icon}</span>
              <span className="text-xs font-medium text-gray-900">{spec.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Task Complexity */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Task Complexity *
        </label>
        <div className="grid grid-cols-4 gap-3">
          {complexityLevels.map(level => (
            <button
              key={level.value}
              onClick={() => setTeamConfig({ ...teamConfig, taskComplexity: level.value })}
              className={`p-4 rounded-xl border-2 transition-all ${
                teamConfig.taskComplexity === level.value
                  ? `border-${level.color}-500 bg-${level.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-3 h-3 rounded-full bg-${level.color}-500 mx-auto mb-2`} />
              <p className="text-sm font-semibold text-gray-900">{level.label}</p>
              <p className="text-xs text-gray-600 mt-1">{level.time}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Estimated Duration */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Estimated Duration (minutes)
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="30"
            max="480"
            step="30"
            value={teamConfig.estimatedDuration}
            onChange={(e) => setTeamConfig({ ...teamConfig, estimatedDuration: parseInt(e.target.value) })}
            className="flex-1"
          />
          <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl">
            <FiClock className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-900">
              {Math.floor(teamConfig.estimatedDuration / 60)}h {teamConfig.estimatedDuration % 60}m
            </span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <FiInfo className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Team Configuration Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Choose team size based on task complexity</li>
              <li>• Emergency teams get priority resource allocation</li>
              <li>• Specialized teams require specific skill matches</li>
              <li>• Accurate duration estimates improve scheduling</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StepBasicInfo;
