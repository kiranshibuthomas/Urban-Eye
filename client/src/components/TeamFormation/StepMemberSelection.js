import React from 'react';
import { motion } from 'framer-motion';
import {
  FiSearch, FiFilter, FiMapPin, FiCheck, FiStar,
  FiAward, FiTrendingUp, FiClock, FiTarget
} from 'react-icons/fi';

const StepMemberSelection = ({
  availableStaff,
  selectedStaff,
  toggleStaffSelection,
  searchQuery,
  setSearchQuery,
  filterSkill,
  setFilterSkill,
  sortBy,
  setSortBy,
  maxMembers,
  requiredSkills
}) => {
  const allSkills = ['all', ...new Set(availableStaff.flatMap(s => s.skills || []))];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search by name, department, or skills..."
          />
        </div>

        {/* Filters Row */}
        <div className="flex items-center space-x-3">
          {/* Skill Filter */}
          <select
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {allSkills.map(skill => (
              <option key={skill} value={skill}>
                {skill === 'all' ? 'All Skills' : skill}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="distance">Nearest First</option>
            <option value="experience">Most Experienced</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {/* Selection Counter */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <div>
            <p className="text-sm text-gray-600">Selected Members</p>
            <p className="text-2xl font-bold text-blue-900">
              {selectedStaff.length} / {maxMembers - 1}
            </p>
          </div>
          {selectedStaff.length > 0 && (
            <button
              onClick={() => toggleStaffSelection([])}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Required Skills Info */}
      {requiredSkills.length > 0 && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-purple-900 mb-2">
            Required Skills for This Team:
          </p>
          <div className="flex flex-wrap gap-2">
            {requiredSkills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
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
              requiredSkills={requiredSkills}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <FiSearch className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const StaffCard = ({ staff, isSelected, onToggle, disabled, requiredSkills }) => {
  const matchedSkills = staff.skills?.filter(s => requiredSkills.includes(s)) || [];
  const skillMatchPercentage = requiredSkills.length > 0
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 100;

  return (
    <div
      onClick={() => !disabled && onToggle()}
      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : disabled
          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Avatar */}
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {staff.name.charAt(0).toUpperCase()}
            </div>
            {staff.isAvailable && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900 truncate">{staff.name}</h4>
              {staff.rating && (
                <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-0.5 rounded-full">
                  <FiStar className="h-3 w-3 text-yellow-600 fill-current" />
                  <span className="text-xs font-semibold text-yellow-900">{staff.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{staff.department}</p>
            
            {/* Stats Row */}
            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
              {staff.distanceFromTask && (
                <span className="flex items-center">
                  <FiMapPin className="h-3 w-3 mr-1" />
                  {(staff.distanceFromTask / 1000).toFixed(1)} km
                </span>
              )}
              {staff.tasksCompleted && (
                <span className="flex items-center">
                  <FiTarget className="h-3 w-3 mr-1" />
                  {staff.tasksCompleted} tasks
                </span>
              )}
              {staff.avgCompletionTime && (
                <span className="flex items-center">
                  <FiClock className="h-3 w-3 mr-1" />
                  {staff.avgCompletionTime}
                </span>
              )}
            </div>

            {/* Skills */}
            {staff.skills && staff.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {staff.skills.slice(0, 4).map((skill, index) => {
                  const isRequired = requiredSkills.includes(skill);
                  return (
                    <span
                      key={index}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isRequired
                          ? 'bg-green-100 text-green-800 ring-1 ring-green-300'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {skill}
                      {isRequired && <FiCheck className="inline h-3 w-3 ml-1" />}
                    </span>
                  );
                })}
                {staff.skills.length > 4 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                    +{staff.skills.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Skill Match Indicator */}
            {requiredSkills.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Skill Match</span>
                  <span className={`font-semibold ${
                    skillMatchPercentage >= 80 ? 'text-green-600' :
                    skillMatchPercentage >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {skillMatchPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      skillMatchPercentage >= 80 ? 'bg-green-500' :
                      skillMatchPercentage >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${skillMatchPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selection Indicator */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-500'
            : 'border-gray-300'
        }`}>
          {isSelected && <FiCheck className="h-4 w-4 text-white" />}
        </div>
      </div>
    </div>
  );
};

export default StepMemberSelection;
