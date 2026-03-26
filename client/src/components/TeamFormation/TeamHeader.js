import React from 'react';
import { FiX, FiUsers, FiCheck } from 'react-icons/fi';

const TeamHeader = ({ step, complaint, onClose }) => {
  const steps = [
    { number: 1, label: 'Basic Info', icon: FiUsers },
    { number: 2, label: 'Resources', icon: FiCheck },
    { number: 3, label: 'Members', icon: FiUsers },
    { number: 4, label: 'Summary', icon: FiCheck }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <FiUsers className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {step === 1 ? 'Create Professional Team' : 
               step === 2 ? 'Plan Resources' :
               step === 3 ? 'Select Team Members' : 
               'Team Summary'}
            </h2>
            <p className="text-blue-100 mt-1 line-clamp-1">
              {complaint.title}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <FiX className="h-6 w-6" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = step === s.number;
          const isCompleted = step > s.number;
          
          return (
            <React.Fragment key={s.number}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted ? 'bg-white text-blue-600' :
                  isActive ? 'bg-white text-blue-600 ring-4 ring-white/30' :
                  'bg-white/20 text-white'
                }`}>
                  {isCompleted ? <FiCheck className="h-5 w-5" /> : s.number}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  isActive ? 'text-white' : 'text-blue-200'
                }`}>
                  {s.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 bg-white/20 rounded mx-2 mt-[-20px]">
                  <div 
                    className={`h-full bg-white rounded transition-all duration-500 ${
                      step > s.number ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default TeamHeader;
