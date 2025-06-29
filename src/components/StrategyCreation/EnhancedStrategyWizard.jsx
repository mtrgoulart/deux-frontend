import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { apiFetch } from '../../utils/api';

// Import hooks
import useWizardState from './hooks/useWizardState.jsx';

// Import UI components
import ProgressIndicator from './UI/ProgressIndicator';
import LoadingSpinner from './UI/LoadingSpinner';
import ValidationMessage from './UI/ValidationMessage';

// Import step components
import SymbolSelectionStep from './Steps/SymbolSelectionStep';
import CombinedConfigurationStep from './Steps/CombinedConfigurationStep';
import ReviewStep from './Steps/ReviewStep';

// Step constants
const STEPS = {
  SYMBOL: 'symbol',
  CONFIGURATION: 'configuration',
  REVIEW: 'review'
};

function EnhancedStrategyWizard({ 
  showCreateForm, 
  setShowCreateForm, 
  showEditForm, 
  setShowEditForm, 
  instanceToEdit, 
  onStrategyCreatedOrEdited 
}) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [stepValidation, setStepValidation] = useState({});

  // Determine if we are in edit mode
  const isEditMode = !!instanceToEdit;

  const { data: buyStrategy, isLoading: isLoadingBuyStrategy } = useQuery({
    queryKey: ['buyStrategy', instanceToEdit?.strategy_buy],
    queryFn: () => apiFetch(`/get_strategy_parameters`, { method: 'POST', body: JSON.stringify({ id: instanceToEdit.strategy_buy }) }).then(res => res.json()),
    enabled: isEditMode && !!instanceToEdit?.strategy_buy,
  });

  const { data: sellStrategy, isLoading: isLoadingSellStrategy } = useQuery({
    queryKey: ['sellStrategy', instanceToEdit?.strategy_sell],
    queryFn: () => apiFetch(`/get_strategy_parameters`, { method: 'POST', body: JSON.stringify({ id: instanceToEdit.strategy_sell }) }).then(res => res.json()),
    enabled: isEditMode && !!instanceToEdit?.strategy_sell,
  });

  const { data: indicators, isLoading: isLoadingIndicators } = useQuery({
    queryKey: ['indicators', instanceToEdit?.id],
    queryFn: () => apiFetch(`/get_indicators_by_instance/${instanceToEdit.id}`).then(res => res.json()),
    enabled: isEditMode && !!instanceToEdit?.id,
  });

  const isLoading = isLoadingBuyStrategy || isLoadingSellStrategy || isLoadingIndicators;

  const {
    currentStep,
    completedSteps,
    stepData,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    updateStepData,
    getStepData,
    getAllData,
    validateStep,
    canProceedToNext,
    resetWizard,
    getProgress,
    STEP_ORDER,
    setInitialData
  } = useWizardState();

  useEffect(() => {
    if (isEditMode && !isLoading) {
      const initialData = {
        symbol: {
          symbol: instanceToEdit.symbol,
          api_key: instanceToEdit.api_key_id,
        },
        configuration: {
          strategies: [buyStrategy, sellStrategy].filter(Boolean),
        },
        indicators: {
          buyIndicators: indicators?.indicators.filter(ind => ind.type === 'buy') || [],
          sellIndicators: indicators?.indicators.filter(ind => ind.type === 'sell') || [],
        },
        review: {
          strategyName: instanceToEdit.name,
          strategyDescription: instanceToEdit.description,
        },
      };
      setInitialData(initialData);
    }
  }, [isEditMode, isLoading, buyStrategy, sellStrategy, indicators, instanceToEdit, setInitialData]);

  // Handle step validation changes
  const handleStepValidation = React.useCallback((stepId, isValid) => {
    setStepValidation(prev => ({
      ...prev,
      [stepId]: isValid
    }));
  }, []);

  // Strategy creation/update mutation
  const strategyMutation = useMutation({
    mutationFn: async (strategyData) => {
      const endpoint = isEditMode ? '/update_strategy_parameters' : '/save_instance';
      const method = 'POST';

      const payload = isEditMode 
        ? { 
            id: instanceToEdit.id,
            name: strategyData.name,
            side: strategyData.strategies[0].side,
            percent: strategyData.strategies[0].percent,
            condition_limit: strategyData.strategies[0].condition_limit,
            interval: strategyData.strategies[0].interval,
            simultaneous_operations: strategyData.strategies[0].simultaneous_operations,
            tp: strategyData.strategies[0].tp,
            sl: strategyData.strategies[0].sl,
          }
        : strategyData;

      const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} strategy`);
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      if (!isEditMode) {
        const strategyId = data.instance_id || data.id;
        createIndicators(strategyId);
      } else {
        handleIndicatorChanges(instanceToEdit.id);
      }
    },
    onError: (error) => {
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  });

  const handleIndicatorChanges = async () => {
    try {
      const allData = getAllData();
      const newIndicators = [
        ...(allData.indicators?.buyIndicators || []),
        ...(allData.indicators?.sellIndicators || [])
      ];

      const oldIndicators = strategyDetails.indicators;

      // Find indicators to add
      const indicatorsToAdd = newIndicators.filter(newInd => !oldIndicators.some(oldInd => oldInd.id === newInd.id));

      // Find indicators to remove
      const indicatorsToRemove = oldIndicators.filter(oldInd => !newIndicators.some(newInd => newInd.id === oldInd.id));

      for (const indicator of indicatorsToAdd) {
        await apiFetch('/add_indicator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: indicator.name,
            instance_id: strategyToEdit.id,
            mandatory: indicator.mandatory,
            indicator_key: indicator.id,
            type: indicator.type
          })
        });
      }

      for (const indicator of indicatorsToRemove) {
        await apiFetch('/remove_indicator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: indicator.id
          })
        });
      }

      onStrategyCreatedOrEdited();
      resetWizard();
      setShowEditForm(false);
      setIsSubmitting(false);
      setSubmitError(null);
    } catch (error) {
      console.error('Error updating indicators:', error);
      setSubmitError('Strategy updated but failed to update indicators');
      setIsSubmitting(false);
    }
  };

  // Create indicators for the strategy
  const createIndicators = async (strategyId) => {
    try {
      const allData = getAllData();
      const allIndicators = [
        ...(allData.indicators?.buyIndicators || []),
        ...(allData.indicators?.sellIndicators || [])
      ];

      if (allIndicators.length > 0) {
        for (const indicator of allIndicators) {
          await apiFetch('/add_indicator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: indicator.name,
              instance_id: strategyId,
              mandatory: indicator.mandatory,
              indicator_key: indicator.id,
              type: indicator.type
            })
          });
        }
      }

      // Success
      onStrategyCreated();
      resetWizard();
      setShowCreateForm(false);
      setIsSubmitting(false);
      setSubmitError(null);
    } catch (error) {
      console.error('Error creating indicators:', error);
      setSubmitError('Strategy created but failed to create indicators');
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const allData = getAllData();
      
      // Generate strategy data
      const strategyData = {
        name: allData.review?.strategyName,
        api_key: allData.symbol?.api_key,
        symbol: allData.symbol?.symbol,
        strategies: allData.configuration.strategies.map(strategy => ({
          ...strategy,
          name: allData.review?.strategyName,
          strategy: isEditMode ? strategyToEdit.strategy_uuid : uuidv4()
        })),
        hash: uuidv4(),
        status: 1,
        created_at: new Date().toISOString(),
        description: allData.review?.strategyDescription || ''
      };

      await strategyMutation.mutateAsync(strategyData);
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  };

  // Handle next step
  const handleNext = () => {
    const currentStepId = STEP_ORDER[STEP_ORDER.indexOf(currentStep)];
    const isValid = stepValidation[currentStepId];
    
    if (isValid) {
      if (isLastStep) {
        handleSubmit();
      } else {
        nextStep();
      }
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      resetWizard();
      setShowCreateForm(false);
      setSubmitError(null);
    }
  };

  // Get current step component
  const getCurrentStepComponent = () => {
    const stepProps = {
      stepData: getStepData(currentStep),
      updateStepData: (data) => updateStepData(currentStep, data),
      onValidationChange: (isValid) => handleStepValidation(currentStep, isValid),
      isEditMode: isEditMode
    };

    switch (currentStep) {
      case STEPS.SYMBOL:
        return <SymbolSelectionStep {...stepProps} />;
      case STEPS.CONFIGURATION:
        return <CombinedConfigurationStep {...stepProps} />;
      case STEPS.REVIEW:
        return <ReviewStep {...stepProps} allWizardData={getAllData()} />;
      default:
        console.error('Unknown step:', currentStep);
        return <div className="text-center text-gray-400">Unknown step</div>;
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case STEPS.SYMBOL: return 'Symbol Selection';
      case STEPS.CONFIGURATION: return 'Strategy Configuration & Indicators';
      case STEPS.REVIEW: return 'Review & Create';
      default: return 'Unknown step';
    }
  };

  // Progress calculation
  const progress = getProgress();
  const canProceed = stepValidation[currentStep] && !isSubmitting;

  if (!showCreateForm && !showEditForm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-[800px] max-w-[90vw] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg md:text-xl">🚀</span>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Enhanced Strategy Wizard</h2>
                <p className="text-cyan-100 text-sm md:text-base">{getStepTitle()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs md:text-sm text-cyan-200">Progress</div>
                <div className="text-base md:text-lg font-semibold">{progress}%</div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-white hover:bg-white/20 rounded-full p-1 md:p-2 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
  
        {/* Progress Indicator */}
        <div className="px-4 md:px-6">
          <ProgressIndicator 
            currentStep={currentStep} 
            completedSteps={completedSteps}
          />
        </div>
  
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {/* Loading Overlay */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10">
                <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl border border-gray-700 max-w-[90%]">
                  <div className="flex flex-col items-center space-y-3 md:space-y-4">
                    <LoadingSpinner size="md" />
                    <div className="text-center">
                      <p className="text-white font-medium text-sm md:text-base">Creating Your Strategy</p>
                      <p className="text-gray-400 text-xs md:text-sm">Please wait while we set up your configuration...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
  
            {/* Error Display */}
            {submitError && (
              <div className="mb-4 md:mb-6">
                <ValidationMessage 
                  type="error" 
                  message={submitError}
                />
              </div>
            )}
  
            {/* Step Content */}
            <div className="transition-all duration-300 ease-in-out">
              {getCurrentStepComponent()}
            </div>
          </div>
        </div>
  
        {/* Footer */}
        <div className="bg-gray-900 px-4 py-3 md:px-6 md:py-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <div>
              {!isFirstStep && (
                <button
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg transition-colors flex items-center space-x-1 md:space-x-2 text-sm md:text-base"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Previous</span>
                </button>
              )}
            </div>
  
            {/* Next/Submit Button */}
            <div>
              {isLastStep ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className={`flex items-center space-x-1 md:space-x-2 transition-all duration-200 px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base ${
                    canProceed
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
                      : 'bg-gray-500'
                  }`}
                >
                  <span>{isEditMode ? 'Update Strategy' : 'Create Strategy'}</span>
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className={`flex items-center space-x-1 md:space-x-2 transition-all duration-200 px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base ${
                    canProceed
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
                      : 'bg-gray-500'
                  }`}
                >
                  <span>Next</span>
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default EnhancedStrategyWizard;
