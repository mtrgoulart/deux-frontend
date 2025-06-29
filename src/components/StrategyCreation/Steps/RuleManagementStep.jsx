import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import ValidationMessage from '../UI/ValidationMessage';
import useFormValidation, { WIZARD_VALIDATION_SCHEMAS } from '../hooks/useFormValidation';

function RuleManagementStep({ 
  stepData, 
  updateStepData, 
  onValidationChange 
}) {
  const [activeTab, setActiveTab] = useState(stepData.mode || 'select');
  const [errors, setErrors] = useState({});

  // Fetch existing strategies
  const { data: strategies = [], isLoading: strategiesLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const res = await apiFetch('/get_strategies');
      const data = await res.json();
      return data.strategies || [];
    },
  });

  // Filter strategies by side
  const buyStrategies = strategies.filter(s => s.side === 'buy' || !s.side);
  const sellStrategies = strategies.filter(s => s.side === 'sell' || !s.side);

  // Form validation for new rule creation
  const newBuyRuleForm = useFormValidation(
    stepData.newBuyRule || {},
    WIZARD_VALIDATION_SCHEMAS.newRuleCreation
  );

  const newSellRuleForm = useFormValidation(
    stepData.newSellRule || {},
    WIZARD_VALIDATION_SCHEMAS.newRuleCreation
  );

  // Create new strategy mutation
  const createStrategyMutation = useMutation({
    mutationFn: async (strategyData) => {
      const res = await apiFetch('/save_strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategyData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create strategy');
      }
      
      return res.json();
    }
  });

  // Validation effect
  useEffect(() => {
    const newErrors = {};
    
    if (activeTab === 'select') {
      if (!stepData.strategy_buy) {
        newErrors.strategy_buy = 'Please select a buy strategy';
      }
      if (!stepData.strategy_sell) {
        newErrors.strategy_sell = 'Please select a sell strategy';
      }
    } else if (activeTab === 'create') {
      if (!newBuyRuleForm.isValid) {
        newErrors.newBuyRule = 'Please complete the buy rule form';
      }
      if (!newSellRuleForm.isValid) {
        newErrors.newSellRule = 'Please complete the sell rule form';
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange(isValid);
  }, [activeTab, stepData.strategy_buy, stepData.strategy_sell, newBuyRuleForm.isValid, newSellRuleForm.isValid]); // Removed onValidationChange from dependencies

  // Update step data when tab changes
  useEffect(() => {
    updateStepData({ mode: activeTab });
  }, [activeTab]); // Removed updateStepData from dependencies

  // Handle strategy selection
  const handleStrategySelect = (type, strategyId) => {
    const strategy = strategies.find(s => s.id === strategyId);
    updateStepData({ 
      [`strategy_${type}`]: strategyId,
      [`${type}RuleData`]: strategy
    });
  };

  // Handle new rule form changes
  const handleNewRuleChange = (type, field, value) => {
    const form = type === 'buy' ? newBuyRuleForm : newSellRuleForm;
    form.handleChange(field, value);
    
    updateStepData({
      [`new${type.charAt(0).toUpperCase() + type.slice(1)}Rule`]: form.values
    });
  };

  // Create new strategy
  const createNewStrategy = async (type, formData) => {
    try {
      const strategyData = {
        ...formData,
        side: type,
        created_at: new Date().toISOString()
      };
      
      const result = await createStrategyMutation.mutateAsync(strategyData);
      
      // Update step data with new strategy
      handleStrategySelect(type, result.id);
      
      return result;
    } catch (error) {
      console.error(`Failed to create ${type} strategy:`, error);
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚙️</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Rule Management</h2>
        <p className="text-gray-400">
          Configure your buy and sell strategies with quantity rules
        </p>
      </div>

      {/* Mode Selection Tabs */}
      <div className="flex bg-gray-900 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('select')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'select'
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-5 5l3 3 7-7" />
          </svg>
          <span>Select Existing Rules</span>
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'create'
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create New Rules</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'select' ? (
        <SelectExistingRules
          buyStrategies={buyStrategies}
          sellStrategies={sellStrategies}
          selectedBuy={stepData.strategy_buy}
          selectedSell={stepData.strategy_sell}
          onBuySelect={(id) => handleStrategySelect('buy', id)}
          onSellSelect={(id) => handleStrategySelect('sell', id)}
          loading={strategiesLoading}
          errors={errors}
        />
      ) : (
        <CreateNewRules
          buyRuleForm={newBuyRuleForm}
          sellRuleForm={newSellRuleForm}
          onBuyRuleChange={(field, value) => handleNewRuleChange('buy', field, value)}
          onSellRuleChange={(field, value) => handleNewRuleChange('sell', field, value)}
          onCreateStrategy={createNewStrategy}
          isCreating={createStrategyMutation.isLoading}
          errors={errors}
        />
      )}
    </div>
  );
}

// Component for selecting existing rules
function SelectExistingRules({ 
  buyStrategies, 
  sellStrategies, 
  selectedBuy, 
  selectedSell, 
  onBuySelect, 
  onSellSelect, 
  loading, 
  errors 
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSpinner.Skeleton lines={3} height="h-20" />
        <LoadingSpinner.Skeleton lines={3} height="h-20" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Buy Strategies */}
      <div className="space-y-4">
        <ValidationMessage.Field error={errors.strategy_buy}>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white">Buy Strategies</h3>
            <span className="text-sm text-gray-400">({buyStrategies.length} available)</span>
          </div>

          {buyStrategies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buyStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  isSelected={selectedBuy === strategy.id}
                  onClick={() => onBuySelect(strategy.id)}
                  type="buy"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              <p className="text-gray-400">No buy strategies available. Create one in the "Create New Rules" tab.</p>
            </div>
          )}
        </ValidationMessage.Field>
      </div>

      {/* Sell Strategies */}
      <div className="space-y-4">
        <ValidationMessage.Field error={errors.strategy_sell}>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white">Sell Strategies</h3>
            <span className="text-sm text-gray-400">({sellStrategies.length} available)</span>
          </div>

          {sellStrategies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sellStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  isSelected={selectedSell === strategy.id}
                  onClick={() => onSellSelect(strategy.id)}
                  type="sell"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
              <p className="text-gray-400">No sell strategies available. Create one in the "Create New Rules" tab.</p>
            </div>
          )}
        </ValidationMessage.Field>
      </div>
    </div>
  );
}

// Component for creating new rules
function CreateNewRules({ 
  buyRuleForm, 
  sellRuleForm, 
  onBuyRuleChange, 
  onSellRuleChange, 
  onCreateStrategy, 
  isCreating, 
  errors 
}) {
  return (
    <div className="space-y-8">
      {/* Buy Rule Creation */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white">Create Buy Rule</h3>
        </div>

        <RuleCreationForm
          form={buyRuleForm}
          onChange={onBuyRuleChange}
          onCreate={() => onCreateStrategy('buy', buyRuleForm.values)}
          isCreating={isCreating}
          type="buy"
        />
      </div>

      {/* Sell Rule Creation */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white">Create Sell Rule</h3>
        </div>

        <RuleCreationForm
          form={sellRuleForm}
          onChange={onSellRuleChange}
          onCreate={() => onCreateStrategy('sell', sellRuleForm.values)}
          isCreating={isCreating}
          type="sell"
        />
      </div>
    </div>
  );
}

// Strategy Card Component
function StrategyCard({ strategy, isSelected, onClick, type }) {
  const colorClasses = type === 'buy' 
    ? 'border-green-500 bg-green-600' 
    : 'border-red-500 bg-red-600';
  
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border transition-all duration-200 text-left hover:scale-105 ${
        isSelected
          ? `${colorClasses} text-white shadow-lg`
          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-lg mb-1">{strategy.name}</h4>
          {strategy.description && (
            <p className={`text-sm ${isSelected ? 'text-gray-200' : 'text-gray-400'}`}>
              {strategy.description}
            </p>
          )}
          <div className="mt-3 flex items-center space-x-4 text-xs">
            <span className={isSelected ? 'text-gray-200' : 'text-gray-500'}>
              ID: {strategy.id}
            </span>
            {strategy.threshold && (
              <span className={isSelected ? 'text-gray-200' : 'text-gray-500'}>
                Threshold: {strategy.threshold}%
              </span>
            )}
          </div>
        </div>
        {isSelected && (
          <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}

// Rule Creation Form Component
function RuleCreationForm({ form, onChange, onCreate, isCreating, type }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ValidationMessage.Field error={form.errors.name}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Rule Name *
          </label>
          <input
            {...form.getFieldProps('name')}
            onChange={(e) => onChange('name', e.target.value)}
            className={`w-full p-3 rounded-lg bg-gray-700 text-white border transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
              form.errors.name ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder={`Enter ${type} rule name`}
          />
        </ValidationMessage.Field>

        <ValidationMessage.Field error={form.errors.threshold}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Threshold (%)
          </label>
          <input
            type="number"
            {...form.getFieldProps('threshold')}
            onChange={(e) => onChange('threshold', e.target.value)}
            className={`w-full p-3 rounded-lg bg-gray-700 text-white border transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
              form.errors.threshold ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Enter threshold percentage"
            min="0"
            max="100"
            step="0.01"
          />
        </ValidationMessage.Field>
      </div>

      <ValidationMessage.Field error={form.errors.description}>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          {...form.getFieldProps('description')}
          onChange={(e) => onChange('description', e.target.value)}
          className={`w-full p-3 rounded-lg bg-gray-700 text-white border transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
            form.errors.description ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder={`Describe this ${type} rule`}
          rows="3"
        />
      </ValidationMessage.Field>

      <LoadingSpinner.Button
        onClick={onCreate}
        isLoading={isCreating}
        loadingText={`Creating ${type} rule...`}
        disabled={!form.isValid || isCreating}
        className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
          form.isValid && !isCreating
            ? `${type === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        Create {type.charAt(0).toUpperCase() + type.slice(1)} Rule
      </LoadingSpinner.Button>
    </div>
  );
}

export default RuleManagementStep;
