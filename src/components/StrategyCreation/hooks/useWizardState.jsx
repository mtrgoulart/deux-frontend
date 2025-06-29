import { useState, useEffect } from 'react';

export const STEPS = {
  SYMBOL: 'symbol',
  CONFIGURATION: 'configuration',
  REVIEW: 'review'
};

export const STEP_ORDER = [
  STEPS.SYMBOL,
  STEPS.CONFIGURATION,
  STEPS.REVIEW
];

export default function useWizardState() {
  const [currentStep, setCurrentStep] = useState(STEPS.SYMBOL);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepData, setStepData] = useState({});

  // Helper functions
  const isFirstStep = currentStep === STEPS.SYMBOL;
  const isLastStep = currentStep === STEPS.REVIEW;

  // Step navigation
  const nextStep = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStepId = STEP_ORDER[currentIndex + 1];
      setCurrentStep(nextStepId);
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
  };

  const prevStep = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  };

  const goToStep = (stepId) => {
    if (completedSteps.has(stepId) || stepId === STEPS.SYMBOL) {
      setCurrentStep(stepId);
    }
  };

  // Step data management
  const updateStepData = (stepId, data) => {
    setStepData(prev => ({
      ...prev,
      [stepId]: {
        ...(prev[stepId] || {}),
        ...data
      }
    }));
  };

  const getStepData = (stepId) => stepData[stepId] || {};

  const getAllData = () => stepData;

  // Progress calculation
  const getProgress = () => {
    const totalSteps = STEP_ORDER.length;
    const completed = completedSteps.size;
    return Math.round((completed / totalSteps) * 100);
  };

  // Validation
  const validateStep = (stepId, isValid) => {
    if (isValid) {
      setCompletedSteps(prev => new Set([...prev, stepId]));
    } else {
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  const canProceedToNext = () => {
    return completedSteps.has(currentStep);
  };

  // Reset wizard
  const resetWizard = () => {
    setCurrentStep(STEPS.SYMBOL);
    setCompletedSteps(new Set());
    setStepData({});
  };

  const setInitialData = (initialData) => {
    setStepData(initialData);
    // Mark all steps as completed to allow navigation
    const allSteps = new Set(STEP_ORDER);
    setCompletedSteps(allSteps);
  };

  return {
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
    setInitialData,
    getProgress,
    STEPS,
    STEP_ORDER
  };
}
