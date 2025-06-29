import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import LoadingSpinner from '../UI/LoadingSpinner';
import ValidationMessage from '../UI/ValidationMessage';
import useFormValidation, { WIZARD_VALIDATION_SCHEMAS } from '../hooks/useFormValidation';

function CombinedConfigurationStep({ 
  stepData, 
  updateStepData, 
  onValidationChange,
  isEditMode
}) {
  // Strategy Configuration State
  const [strategyConfig, setStrategyConfig] = useState(stepData.configuration || {
    operationPercentage: '',
    maxAllocatedValue: '',
    simultaneousOperations: '',
    intervalBetweenOperations: ''
  });

  // Initialize quantity conditions from stepData
  const [buyQuantityCondition, setBuyQuantityCondition] = useState(stepData.buyQuantityCondition || '');
  const [sellQuantityCondition, setSellQuantityCondition] = useState(stepData.sellQuantityCondition || '');

  // Indicators State
  const [buyIndicators, setBuyIndicators] = useState(stepData.indicators?.buyIndicators || []);
const [sellIndicators, setSellIndicators] = useState(stepData.indicators?.sellIndicators || []);
  const [newBuyIndicator, setNewBuyIndicator] = useState({ name: '', mandatory: false });
  const [newSellIndicator, setNewSellIndicator] = useState({ name: '', mandatory: false });
  const [errors, setErrors] = useState({});

  // Form validation for strategy configuration
  const strategyConfigForm = useFormValidation(
    strategyConfig,
    WIZARD_VALIDATION_SCHEMAS.strategyConfiguration
  );

  // Validation effect
  useEffect(() => {
    const newErrors = {};
    
    // Validate strategy configuration
    Object.entries(strategyConfigForm.errors).forEach(([field, error]) => {
      if (error) newErrors[field] = error;
    });

    // Validate indicators
    if (buyIndicators.length === 0) {
      newErrors.buyIndicators = 'At least one buy indicator is required';
    }
    
    if (sellIndicators.length === 0) {
      newErrors.sellIndicators = 'At least one sell indicator is required';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange(isValid);
  }, [strategyConfig, buyIndicators.length, sellIndicators.length, strategyConfigForm.errors]);

  // Update step data when any state changes
  useEffect(() => {
    const buyStrategy = {
        side: 'buy',
        percent: strategyConfig.operationPercentage,
        condition_limit: buyQuantityCondition,
        interval: strategyConfig.intervalBetweenOperations,
        simultaneous_operations: strategyConfig.simultaneousOperations,
    };

    const sellStrategy = {
        side: 'sell',
        percent: strategyConfig.operationPercentage,
        condition_limit: sellQuantityCondition,
        interval: strategyConfig.intervalBetweenOperations,
        simultaneous_operations: strategyConfig.simultaneousOperations,
    };

    updateStepData({ 
      configuration: strategyConfig,
      indicators: { buyIndicators, sellIndicators },
      buyQuantityCondition,
      sellQuantityCondition,
      strategies: [buyStrategy, sellStrategy]
    });
  }, [strategyConfig, buyIndicators, sellIndicators, buyQuantityCondition, sellQuantityCondition, updateStepData]);

  // Add buy indicator
  const addBuyIndicator = () => {
    if (!newBuyIndicator.name.trim()) return;

    const indicator = {
      id: uuidv4(),
      name: newBuyIndicator.name.trim(),
      mandatory: newBuyIndicator.mandatory,
      type: 'buy',
      created_at: new Date().toISOString(),
      key: uuidv4() // Generate UUID for copy-paste
    };

    setBuyIndicators(prev => [...prev, indicator]);
    setNewBuyIndicator({ name: '', mandatory: false });
  };

  // Add sell indicator
  const addSellIndicator = () => {
    if (!newSellIndicator.name.trim()) return;

    const indicator = {
      id: uuidv4(),
      name: newSellIndicator.name.trim(),
      mandatory: newSellIndicator.mandatory,
      type: 'sell',
      created_at: new Date().toISOString(),
      key: uuidv4() // Generate UUID for copy-paste
    };

    setSellIndicators(prev => [...prev, indicator]);
    setNewSellIndicator({ name: '', mandatory: false });
  };

  // Remove indicator
  const removeIndicator = (id, type) => {
    if (type === 'buy') {
      setBuyIndicators(prev => prev.filter(ind => ind.id !== id));
    } else {
      setSellIndicators(prev => prev.filter(ind => ind.id !== id));
    }
  };

  // Toggle mandatory status
  const toggleMandatory = (id, type) => {
    if (type === 'buy') {
      setBuyIndicators(prev => 
        prev.map(ind => 
          ind.id === id ? { ...ind, mandatory: !ind.mandatory } : ind
        )
      );
    } else {
      setSellIndicators(prev => 
        prev.map(ind => 
          ind.id === id ? { ...ind, mandatory: !ind.mandatory } : ind
        )
      );
    }
  };

  // Handle strategy config changes
  const handleConfigChange = (field, value) => {
    setStrategyConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-8">
      {/* Strategy Configuration Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Strategy Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Operation Percentage</label>
            <div className="relative">
              <input
                type="number"
                value={strategyConfig.operationPercentage}
                onChange={(e) => {
                  const value = Math.min(Number(e.target.value), 100);
                  handleConfigChange('operationPercentage', value);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white pl-10"
                placeholder="Enter percentage"
                min="0"
                max="100"
              />
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Maximum Allocated Value</label>
            <input
              type="number"
              value={strategyConfig.maxAllocatedValue}
              onChange={(e) => handleConfigChange('maxAllocatedValue', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
              placeholder="Enter maximum value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Simultaneous Operations</label>
            <input
              type="number"
              value={strategyConfig.simultaneousOperations}
              onChange={(e) => handleConfigChange('simultaneousOperations', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
              placeholder="Enter number of operations"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Interval Between Operations (minutes)</label>
            <input
              type="number"
              value={strategyConfig.intervalBetweenOperations}
              onChange={(e) => handleConfigChange('intervalBetweenOperations', Math.floor(Number(e.target.value)))}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
              placeholder="Enter interval in minutes"
              step="1"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Indicators Section */}
      <div className="space-y-6">
        {/* Buy Indicators */}
        <div className="bg-gradient-to-r from-green-700/50 to-green-900 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-green-200">Buy Indicators</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Buy Condition Limit</label>
            <input
              type="number"
              value={buyQuantityCondition}
              onChange={(e) => setBuyQuantityCondition(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
              placeholder="Enter buy limit condition"
              min="0"
            />
          </div>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={newBuyIndicator.name}
              onChange={(e) => setNewBuyIndicator(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter indicator name"
              className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
            />
            <input
              type="checkbox"
              checked={newBuyIndicator.mandatory}
              onChange={(e) => setNewBuyIndicator(prev => ({ ...prev, mandatory: e.target.checked }))}
              className="text-green-300"
            />
            <label className="ml-2 text-gray-300">Mandatory</label>
            <button
              onClick={addBuyIndicator}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-4 py-2 rounded-md text-white shadow-lg"
            >
              Add
            </button>
          </div>
          <div className="space-y-4">
            {buyIndicators.map((indicator) => (
              <div key={indicator.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-800/50 to-green-900 rounded-md">
                <div className="flex items-center gap-4">
                  <span className="text-white">{indicator.name}</span>
                  <input
                    type="checkbox"
                    checked={indicator.mandatory}
                    onChange={() => toggleMandatory(indicator.id, 'buy')}
                    className="text-green-300"
                  />
                  <label className="ml-2 text-gray-300">Mandatory</label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeIndicator(indicator.id, 'buy')}
                    className="text-green-300 hover:text-green-200 p-1"
                    title="Remove"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify({ key: indicator.key, side: 'buy' }))}
                    className="text-green-300 hover:text-green-200 p-1"
                    title="Copy"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                  <div className="bg-gray-800 px-3 py-1 rounded-md text-sm">
                    {`{key: ${indicator.key}, side: 'buy'}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sell Indicators */}
        <div className="bg-gradient-to-r from-red-700/50 to-red-900 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-red-200">Sell Indicators</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Sell Limit Condition</label>
            <input
              type="number"
              value={sellQuantityCondition}
              onChange={(e) => setSellQuantityCondition(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
              placeholder="Enter sell limit condition"
              min="0"
            />
          </div>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={newSellIndicator.name}
              onChange={(e) => setNewSellIndicator(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter indicator name"
              className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
            />
            <input
              type="checkbox"
              checked={newSellIndicator.mandatory}
              onChange={(e) => setNewSellIndicator(prev => ({ ...prev, mandatory: e.target.checked }))}
              className="text-red-300"
            />
            <label className="ml-2 text-gray-300">Mandatory</label>
            <button
              onClick={addSellIndicator}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-4 py-2 rounded-md text-white shadow-lg"
            >
              Add
            </button>
          </div>
          <div className="space-y-4">
            {sellIndicators.map((indicator) => (
              <div key={indicator.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-red-800/50 to-red-900 rounded-md">
                <div className="flex items-center gap-4">
                  <span className="text-white">{indicator.name}</span>
                  <input
                    type="checkbox"
                    checked={indicator.mandatory}
                    onChange={() => toggleMandatory(indicator.id, 'sell')}
                    className="text-red-300"
                  />
                  <label className="ml-2 text-gray-300">Mandatory</label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeIndicator(indicator.id, 'sell')}
                    className="text-red-300 hover:text-red-200 p-1"
                    title="Remove"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify({ key: indicator.key, side: 'sell' }))}
                    className="text-red-300 hover:text-red-200 p-1"
                    title="Copy"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                  <div className="bg-gray-800 px-3 py-1 rounded-md text-sm">
                    {`{key: ${indicator.key}, side: 'sell'}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {Object.entries(errors).map(([field, message]) => (
        <ValidationMessage key={field} message={message} />
      ))}
    </div>
  );
}

export default CombinedConfigurationStep;
