import React from 'react';

const STEPS = [
  { 
    id: 'symbol', 
    label: 'Symbol Selection', 
    icon: '🪙',
    description: 'Choose trading pair'
  },
  { 
    id: 'configuration', 
    label: 'Strategy Configuration & Indicators', 
    icon: '⚙️',
    description: 'Configure strategy and set up indicators'
  },
  { 
    id: 'review', 
    label: 'Review & Create', 
    icon: '✅',
    description: 'Finalize strategy'
  }
];

function ProgressIndicator({ currentStep, completedSteps = new Set() }) {
  const getCurrentStepIndex = () => {
    return STEPS.findIndex(step => step.id === currentStep);
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="bg-gray-900 px-6 py-4">
      {/* Mobile Progress Bar */}
      <div className="block md:hidden mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Step {currentIndex + 1} of {STEPS.length}</span>
          <span className="text-sm text-gray-400">{Math.round(((currentIndex + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-center">
          <span className="text-cyan-200 font-medium">{STEPS[currentIndex]?.label}</span>
          <p className="text-xs text-gray-400">{STEPS[currentIndex]?.description}</p>
        </div>
      </div>

      {/* Desktop Progress Steps */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-700 z-0">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = completedSteps.has(step.id) || index < currentIndex;
            const isAccessible = index <= currentIndex;

            return (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                {/* Step Circle */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg scale-110'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : isAccessible
                      ? 'bg-gray-700 text-gray-300 border-2 border-gray-600'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <div
                    className={`font-medium transition-colors duration-300 ${
                      isActive ? 'text-cyan-200' : isCompleted ? 'text-green-200' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProgressIndicator;
