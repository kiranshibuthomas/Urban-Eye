import React from 'react';
import { FiChevronLeft, FiChevronRight, FiSend, FiCheckCircle } from 'react-icons/fi';

const TeamFooter = ({
  step,
  setStep,
  loading,
  inviting,
  selectedStaff,
  handleCreateTeam,
  handleInviteMembers,
  handleClose
}) => {
  return (
    <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
      <div className="flex items-center justify-between">
        {/* Back Button */}
        <button
          onClick={() => {
            if (step > 1 && step < 4) {
              setStep(step - 1);
            } else {
              handleClose();
            }
          }}
          className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-all flex items-center space-x-2"
        >
          {step > 1 && step < 4 ? (
            <>
              <FiChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </>
          ) : (
            <span>{step === 4 ? 'Close' : 'Cancel'}</span>
          )}
        </button>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Step 1: Next to Resources */}
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center space-x-2 shadow-lg"
            >
              <span>Continue to Resources</span>
              <FiChevronRight className="h-4 w-4" />
            </button>
          )}

          {/* Step 2: Create Team or Skip */}
          {step === 2 && (
            <>
              <button
                onClick={() => {
                  handleCreateTeam();
                  // Skip to step 4 (summary) instead of member selection
                }}
                className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-all"
              >
                Skip Member Selection
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Team...</span>
                  </>
                ) : (
                  <>
                    <span>Create Team & Add Members</span>
                    <FiChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </>
          )}

          {/* Step 3: Invite Members or Skip */}
          {step === 3 && (
            <>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-all"
              >
                Skip for Now
              </button>
              <button
                onClick={handleInviteMembers}
                disabled={inviting || selectedStaff.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
              >
                {inviting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Invitations...</span>
                  </>
                ) : (
                  <>
                    <FiSend className="h-4 w-4" />
                    <span>Send Invitations ({selectedStaff.length})</span>
                  </>
                )}
              </button>
            </>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex items-center space-x-2 shadow-lg"
            >
              <FiCheckCircle className="h-5 w-5" />
              <span>Done</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {step < 4 && (
        <div className="mt-4 flex items-center justify-center space-x-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-blue-600' :
                s < step ? 'w-6 bg-blue-400' :
                'w-4 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamFooter;
