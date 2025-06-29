import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api';
import useSymbolSearch from '../hooks/useSymbolSearch';
import LoadingSpinner from '../UI/LoadingSpinner';
import ValidationMessage from '../UI/ValidationMessage';

function SymbolSelectionStep({ 
  stepData, 
  updateStepData, 
  onValidationChange,
  isEditMode
}) {
  

  const [selectedApiKey, setSelectedApiKey] = useState(stepData.symbol?.api_key || '');
  const [errors, setErrors] = useState({});

  // Initialize symbol search
  const {
    query,
    displaySymbols,
    isLoading: searchLoading,
    error: searchError,
    selectedSymbol,
    showDefaults,
    updateQuery,
    selectSymbol,
    clearSelection,
    isSearchActive,
    getSymbolIcon
  } = useSymbolSearch(selectedApiKey, stepData.symbol?.symbol, stepData.symbol?.api_key);

  useEffect(() => {
    setSelectedApiKey(stepData.symbol?.api_key || '');
    if (stepData.symbol?.symbol) {
      selectSymbol({
        symbol: stepData.symbol.symbol,
        api_key: stepData.symbol.api_key,
      });
    }
  }, [stepData, selectSymbol, setSelectedApiKey]);

  // Auto-select first API key if only one exists
  useEffect(() => {
    if (apiKeys.length === 1 && !selectedApiKey) {
      const firstKey = apiKeys[0].api_key_id;
      setSelectedApiKey(firstKey);
      updateStepData({ 
        symbol: {
          api_key: firstKey
        }
      });
    }
  }, [apiKeys, selectedApiKey]);

  // Validation
  useEffect(() => {
    const newErrors = {};
    
    if (!selectedApiKey) {
      newErrors.api_key = 'Please select an API key';
    }
    
    if (!selectedSymbol) {
      newErrors.symbol = 'Please select a trading symbol';
    }

    setErrors(newErrors);
    const currentStepIsValid = Object.keys(newErrors).length === 0;
    onValidationChange(currentStepIsValid);
  }, [selectedApiKey, selectedSymbol, onValidationChange]);

  // Handle API key selection
  const handleApiKeyChange = (apiKeyId) => {
    setSelectedApiKey(apiKeyId);
    clearSelection();
    updateStepData({ 
      symbol: {
        api_key: apiKeyId,
        symbol: null
      }
    });
  };

  // Handle symbol selection
  const handleSymbolSelect = (symbol) => {
    selectSymbol(symbol);
    updateStepData({ 
      symbol: {
        ...symbol,
        api_key: selectedApiKey
      }
    });
  };

  // Handle custom symbol input
  const handleCustomSymbolChange = (value) => {
    updateQuery(value);
    updateStepData({ 
      symbol: {
        symbol: value,
        isCustom: !!value,
        api_key: selectedApiKey
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🪙</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Select Trading Symbol</h2>
        <p className="text-gray-400">
          Choose your API key and the trading pair for your strategy
        </p>
      </div>

      {/* API Key Selection */}
      <div className="space-y-4">
        <ValidationMessage.Field error={errors.api_key}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            API Key *
          </label>
          {apiKeysLoading ? (
            <LoadingSpinner.Skeleton height="h-12" />
          ) : (
            <select
              value={selectedApiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className={`w-full p-3 rounded-lg bg-gray-700 text-white border transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.api_key ? 'border-red-500' : 'border-gray-600'
              }`}
              // disabled={isEditMode} // Enabled for editing
            >
              <option value="">Select an API Key</option>
              {apiKeys.map(key => (
                <option key={key.api_key_id} value={key.api_key_id}>
                  ({key.api_key_id}) {key.name}
                </option>
              ))}
            </select>
          )}
        </ValidationMessage.Field>

        {apiKeys.length === 0 && !apiKeysLoading && (
          <ValidationMessage 
            type="warning" 
            message="No API keys found. Please add an API key in the API Keys section first."
          />
        )}
      </div>

      {/* Symbol Selection */}
      {selectedApiKey && (
        <div className="space-y-6">
          <ValidationMessage.Field error={errors.symbol}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trading Symbol *
            </label>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => handleCustomSymbolChange(e.target.value)}
                placeholder="Search symbols (e.g., BTC-USDT) or select from popular options below"
                className={`w-full p-3 pr-10 rounded-lg bg-gray-700 text-white border transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  errors.symbol ? 'border-red-500' : 'border-gray-600'
                }`}
                // disabled={isEditMode} // Enabled for editing
              />
              
              {/* Search Loading Indicator */}
              {searchLoading && (
                <div className="absolute right-3 top-3">
                  <LoadingSpinner size="sm" />
                </div>
              )}

              {/* Clear Button */}
              {query && (
                <button
                  onClick={() => {
                    clearSelection();
                    updateStepData({ symbol: { api_key: selectedApiKey } });
                  }}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  disabled={isEditMode}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Search Error */}
            {searchError && (
              <ValidationMessage type="error" message={searchError} />
            )}
          </ValidationMessage.Field>

          {/* Symbol Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">
                {showDefaults ? 'Popular Trading Pairs' : `Search Results (${displaySymbols.length})`}
              </h3>
              {isSearchActive && (
                <span className="text-sm text-gray-400">
                  {searchLoading ? 'Searching...' : `${displaySymbols.length} results`}
                </span>
              )}
            </div>

            {displaySymbols.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displaySymbols.map((symbol, index) => (
                  <SymbolCard
                    key={`${symbol.symbol}-${index}`}
                    symbol={symbol}
                    isSelected={selectedSymbol?.symbol === symbol.symbol}
                    onClick={() => handleSymbolSelect(symbol)}
                    // disabled={isEditMode} // Enabled for editing
                  />
                ))}
              </div>
            ) : isSearchActive && !searchLoading ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-400 mb-2">No symbols found</h3>
                <p className="text-gray-500">
                  Try a different search term or check your API key permissions
                </p>
              </div>
            ) : null}
          </div>

          {/* Selection Summary */}
          {selectedSymbol && (
            <div className="bg-cyan-900/20 border border-cyan-500/50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center">
                  <span className="text-lg">{getSymbolIcon(selectedSymbol.baseAsset)}</span>
                </div>
                <div>
                  <h4 className="text-cyan-200 font-medium">Selected: {selectedSymbol.symbol}</h4>
                  <p className="text-cyan-300 text-sm">
                    {selectedSymbol.name || `${selectedSymbol.baseAsset || 'Unknown'} / ${selectedSymbol.quoteAsset || 'Unknown'}`}
                  </p>
                </div>
                <div className="ml-auto">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Symbol Card Component
function SymbolCard({ symbol, isSelected, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border transition-all duration-200 text-left group hover:scale-105 ${
        isSelected
          ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg'
          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
      }`}
      disabled={disabled}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isSelected ? 'bg-cyan-700' : 'bg-gray-600 group-hover:bg-gray-500'
        }`}>
          <span className="text-lg">
            {symbol.icon || '🪙'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium truncate ${
            isSelected ? 'text-white' : 'text-gray-200'
          }`}>
            {symbol.symbol}
          </h4>
          <p className={`text-sm truncate ${
            isSelected ? 'text-cyan-200' : 'text-gray-400'
          }`}>
            {symbol.name || `${symbol.baseAsset || 'Unknown'} / ${symbol.quoteAsset || 'Unknown'}`}
          </p>
        </div>
        {symbol.isDefault && (
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isSelected 
                ? 'bg-cyan-700 text-cyan-200' 
                : 'bg-blue-600/20 text-blue-400'
            }`}>
              Popular
            </span>
          </div>
        )}
        {isSelected && (
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}

export default SymbolSelectionStep;
