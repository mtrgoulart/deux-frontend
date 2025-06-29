import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api';
import CopyButton from '../UI/CopyButton';
import ValidationMessage from '../UI/ValidationMessage';

function ReviewStep({ 
  stepData, 
  updateStepData, 
  onValidationChange,
  isEditMode,
  allWizardData
}) {
  const [strategyName, setStrategyName] = useState(stepData.strategyName || '');
  const [strategyDescription, setStrategyDescription] = useState(stepData.strategyDescription || '');
  const [errors, setErrors] = useState({});

  // Get API key details
  const { data: apiKeys = [] } = useQuery({
    queryKey: ['user_apikeys'],
    queryFn: async () => {
      const res = await apiFetch('/get_user_apikeys');
      const data = await res.json();
      return data.user_apikeys || [];
    },
  });

  // Validation
  useEffect(() => {
    const newErrors = {};
    
    if (!strategyName.trim()) {
      newErrors.strategyName = 'Strategy name is required';
    } else if (strategyName.trim().length < 3) {
      newErrors.strategyName = 'Strategy name must be at least 3 characters';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange(isValid);
  }, [strategyName, onValidationChange]);

  // Update step data when inputs change
  useEffect(() => {
    updateStepData({ 
      strategyName: strategyName.trim(),
      strategyDescription: strategyDescription.trim()
    });
  }, [strategyName, strategyDescription, updateStepData]);

  // Generate strategy configuration
  const generateStrategyConfig = () => {
    return {
      name: strategyName.trim(),
      description: strategyDescription.trim(),
      symbol: allWizardData.symbol?.symbol,
      api_key: allWizardData.symbol?.api_key,
      strategy_buy: allWizardData.rules?.strategy_buy,
      strategy_sell: allWizardData.rules?.strategy_sell,
      buy_indicators: allWizardData.indicators?.buyIndicators || [],
      sell_indicators: allWizardData.indicators?.sellIndicators || [],
      created_at: new Date().toISOString(),
      status: 1
    };
  };

  // Generate webhook messages
  const generateWebhookMessages = () => {
    const config = generateStrategyConfig();
    const baseUrl = `${window.location.origin}/api/webhook`;

    return {
      buy: {
        symbol: config.symbol,
        action: 'BUY',
        strategy_name: config.name,
        indicators: config.buy_indicators.map(ind => ({
          id: ind.id,
          name: ind.name,
          mandatory: ind.mandatory
        })),
        mandatory_count: config.buy_indicators.filter(ind => ind.mandatory).length,
        webhook_url: `${baseUrl}/buy`,
        timestamp: '{{time}}'
      },
      sell: {
        symbol: config.symbol,
        action: 'SELL',
        strategy_name: config.name,
        indicators: config.sell_indicators.map(ind => ({
          id: ind.id,
          name: ind.name,
          mandatory: ind.mandatory
        })),
        mandatory_count: config.sell_indicators.filter(ind => ind.mandatory).length,
        webhook_url: `${baseUrl}/sell`,
        timestamp: '{{time}}'
      },
      combined: {
        strategy: config.name,
        symbol: config.symbol,
        buy_config: {
          action: 'BUY',
          indicators: config.buy_indicators,
          mandatory_count: config.buy_indicators.filter(ind => ind.mandatory).length
        },
        sell_config: {
          action: 'SELL',
          indicators: config.sell_indicators,
          mandatory_count: config.sell_indicators.filter(ind => ind.mandatory).length
        },
        webhook_base_url: baseUrl,
        created_at: new Date().toISOString()
      }
    };
  };

  // Generate TradingView alerts
  const generateTradingViewAlerts = () => {
    const config = generateStrategyConfig();
    
    return {
      buy: `{"symbol":"${config.symbol}","action":"BUY","strategy":"${config.name}","indicators":[${config.buy_indicators.map(ind => `"${ind.name}"`).join(',')}],"mandatory":${config.buy_indicators.filter(ind => ind.mandatory).length}}`,
      sell: `{"symbol":"${config.symbol}","action":"SELL","strategy":"${config.name}","indicators":[${config.sell_indicators.map(ind => `"${ind.name}"`).join(',')}],"mandatory":${config.sell_indicators.filter(ind => ind.mandatory).length}}`
    };
  };

  const webhookMessages = generateWebhookMessages();
  const tradingViewAlerts = generateTradingViewAlerts();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{isEditMode ? 'Review & Update Strategy' : 'Review & Create Strategy'}</h2>
        <p className="text-gray-400">
          Review your strategy configuration and generate webhook messages
        </p>
      </div>

      {/* Strategy Details Form */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-medium text-white mb-4">Strategy Details</h3>
        
        <ValidationMessage.Field error={errors.strategyName}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Strategy Name *
          </label>
          <input
            type="text"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            className={`w-full p-3 rounded-lg bg-gray-700 text-white border transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
              errors.strategyName ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Enter a name for your strategy"
          />
        </ValidationMessage.Field>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={strategyDescription}
            onChange={(e) => setStrategyDescription(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Describe your strategy (optional)"
            rows="3"
          />
        </div>
      </div>

      {/* Strategy Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Configuration */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Basic Configuration</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Trading Symbol:</span>
              <span className="text-white font-medium">{allWizardData.symbol?.symbol || 'Not selected'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">API Key:</span>
              <span className="text-white font-medium">
                {allWizardData.symbol?.api_key ? 
                  apiKeys.find(key => key.api_key_id === allWizardData.symbol?.api_key)?.name || 'Not selected' : 
                  'Not selected'
                }
              </span>
            </div>
            <div className="flex justify-between">
  <span className="text-gray-400">Operation Percentage:</span>
  <span className="text-white font-medium">{allWizardData.configuration?.operationPercentage || 'Not set'}</span>
</div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Allocated Value:</span>
              <span className="text-white font-medium">{allWizardData.configuration?.maxAllocatedValue || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Simultaneous Operations:</span>
              <span className="text-white font-medium">{allWizardData.configuration?.simultaneousOperations || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Interval Between Operations:</span>
              <span className="text-white font-medium">{allWizardData.configuration?.intervalBetweenOperations || 'Not set'} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Buy Condition Limit:</span>
              <span className="text-white font-medium">{allWizardData.configuration?.buyQuantityCondition || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sell Condition Limit:</span>
              <span className="text-white font-medium">{allWizardData.configuration?.sellQuantityCondition || 'Not set'}</span>
            </div>
          </div>
        </div>

        {/* Indicators Summary */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Indicators Summary</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Buy Indicators:</span>
                <span className="text-green-400 font-medium">
                  {allWizardData.indicators?.buyIndicators?.length || 0} total
                </span>
              </div>
              {allWizardData.indicators?.buyIndicators?.map((indicator, index) => (
                <div key={indicator.id} className="text-sm text-gray-300 ml-4 flex items-center space-x-2">
                  <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                  <span>{indicator.name}</span>
                  {indicator.mandatory && (
                    <span className="bg-orange-500/20 text-orange-400 px-1 py-0.5 rounded text-xs">M</span>
                  )}
                </div>
              ))}
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Sell Indicators:</span>
                <span className="text-red-400 font-medium">
                  {allWizardData.indicators?.sellIndicators?.length || 0} total
                </span>
              </div>
              {allWizardData.indicators?.sellIndicators?.map((indicator, index) => (
                <div key={indicator.id} className="text-sm text-gray-300 ml-4 flex items-center space-x-2">
                  <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                  <span>{indicator.name}</span>
                  {indicator.mandatory && (
                    <span className="bg-orange-500/20 text-orange-400 px-1 py-0.5 rounded text-xs">M</span>
                  )}
                </div>
              ))}
            </div>
            
            <div className="pt-2 border-t border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-400">Mandatory Count:</span>
                <span className="text-orange-400 font-medium">
                  {(allWizardData.indicators?.buyIndicators?.filter(ind => ind.mandatory).length || 0) + 
                   (allWizardData.indicators?.sellIndicators?.filter(ind => ind.mandatory).length || 0)} total
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy URL */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-white">Strategy Webhook URL</h4>
          <CopyButton 
            text={`${window.location.origin}/api/webhook/strategy`}
            variant="outline"
            size="sm"
          >
            Copy URL
          </CopyButton>
        </div>
        <div className="bg-gray-900 p-3 rounded">
          <code className="text-cyan-400 text-sm break-all">
            {window.location.origin}/api/webhook/strategy
          </code>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          Use this URL as the webhook endpoint in TradingView alerts
        </p>
      </div>

      {/* Final Validation */}
      {Object.keys(errors).length > 0 && (
        <ValidationMessage.Summary 
          errors={Object.values(errors)}
          title="Please complete the following before creating your strategy:"
        />
      )}
    </div>
  );
}

export default ReviewStep;
