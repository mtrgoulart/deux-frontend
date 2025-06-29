import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import LoadingSpinner from '../UI/LoadingSpinner';
import ValidationMessage from '../UI/ValidationMessage';

function IndicatorConfigurationStep({ 
  stepData, 
  updateStepData, 
  onValidationChange 
}) {
  const [buyIndicators, setBuyIndicators] = useState(stepData.buyIndicators || []);
  const [sellIndicators, setSellIndicators] = useState(stepData.sellIndicators || []);
  const [newBuyIndicator, setNewBuyIndicator] = useState({ name: '', mandatory: false });
  const [newSellIndicator, setNewSellIndicator] = useState({ name: '', mandatory: false });
  const [errors, setErrors] = useState({});

  // Validation effect
  useEffect(() => {
    const newErrors = {};
    
    if (buyIndicators.length === 0) {
      newErrors.buyIndicators = 'At least one buy indicator is required';
    }
    
    if (sellIndicators.length === 0) {
      newErrors.sellIndicators = 'At least one sell indicator is required';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange(isValid);
  }, [buyIndicators.length, sellIndicators.length]); // Removed onValidationChange from dependencies

  // Update step data when indicators change
  useEffect(() => {
    updateStepData({ 
      buyIndicators,
      sellIndicators 
    });
  }, [buyIndicators, sellIndicators]); // Removed updateStepData from dependencies

  // Add buy indicator
  const addBuyIndicator = () => {
    if (!newBuyIndicator.name.trim()) return;

    const indicator = {
      id: uuidv4(),
      name: newBuyIndicator.name.trim(),
      mandatory: newBuyIndicator.mandatory,
      type: 'buy',
      created_at: new Date().toISOString()
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
      created_at: new Date().toISOString()
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

  // Edit indicator name
  const editIndicator = (id, type, newName) => {
    if (!newName.trim()) return;

    if (type === 'buy') {
      setBuyIndicators(prev => 
        prev.map(ind => 
          ind.id === id ? { ...ind, name: newName.trim() } : ind
        )
      );
    } else {
      setSellIndicators(prev => 
        prev.map(ind => 
          ind.id === id ? { ...ind, name: newName.trim() } : ind
        )
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📈</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Indicator Configuration</h2>
        <p className="text-gray-400">
          Set up your buy and sell indicators with quantity rules and mandatory requirements
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{buyIndicators.length}</div>
          <div className="text-sm text-green-300">Buy Indicators</div>
          <div className="text-xs text-green-400 mt-1">
            {buyIndicators.filter(ind => ind.mandatory).length} mandatory
          </div>
        </div>
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{sellIndicators.length}</div>
          <div className="text-sm text-red-300">Sell Indicators</div>
          <div className="text-xs text-red-400 mt-1">
            {sellIndicators.filter(ind => ind.mandatory).length} mandatory
          </div>
        </div>
      </div>

      {/* Buy Indicators Section */}
      <div className="space-y-6">
        <ValidationMessage.Field error={errors.buyIndicators}>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white">Buy Indicators</h3>
            <span className="text-sm text-gray-400">Entry signals</span>
          </div>

          {/* Add New Buy Indicator */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newBuyIndicator.name}
                  onChange={(e) => setNewBuyIndicator(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter buy indicator name (e.g., RSI Oversold, MACD Cross)"
                  onKeyPress={(e) => e.key === 'Enter' && addBuyIndicator()}
                />
              </div>
              <label className="flex items-center space-x-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={newBuyIndicator.mandatory}
                  onChange={(e) => setNewBuyIndicator(prev => ({ ...prev, mandatory: e.target.checked }))}
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <span className="text-sm">Mandatory</span>
              </label>
              <button
                onClick={addBuyIndicator}
                disabled={!newBuyIndicator.name.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Buy Indicators List */}
          {buyIndicators.length > 0 ? (
            <div className="space-y-3">
              {buyIndicators.map((indicator, index) => (
                <IndicatorCard
                  key={indicator.id}
                  indicator={indicator}
                  index={index}
                  type="buy"
                  onRemove={() => removeIndicator(indicator.id, 'buy')}
                  onToggleMandatory={() => toggleMandatory(indicator.id, 'buy')}
                  onEdit={(newName) => editIndicator(indicator.id, 'buy', newName)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              <p className="text-gray-400">No buy indicators added yet</p>
              <p className="text-sm text-gray-500 mt-1">Add indicators that will trigger buy signals</p>
            </div>
          )}
        </ValidationMessage.Field>
      </div>

      {/* Sell Indicators Section */}
      <div className="space-y-6">
        <ValidationMessage.Field error={errors.sellIndicators}>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white">Sell Indicators</h3>
            <span className="text-sm text-gray-400">Exit signals</span>
          </div>

          {/* Add New Sell Indicator */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newSellIndicator.name}
                  onChange={(e) => setNewSellIndicator(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter sell indicator name (e.g., RSI Overbought, Stop Loss)"
                  onKeyPress={(e) => e.key === 'Enter' && addSellIndicator()}
                />
              </div>
              <label className="flex items-center space-x-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={newSellIndicator.mandatory}
                  onChange={(e) => setNewSellIndicator(prev => ({ ...prev, mandatory: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
                <span className="text-sm">Mandatory</span>
              </label>
              <button
                onClick={addSellIndicator}
                disabled={!newSellIndicator.name.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Sell Indicators List */}
          {sellIndicators.length > 0 ? (
            <div className="space-y-3">
              {sellIndicators.map((indicator, index) => (
                <IndicatorCard
                  key={indicator.id}
                  indicator={indicator}
                  index={index}
                  type="sell"
                  onRemove={() => removeIndicator(indicator.id, 'sell')}
                  onToggleMandatory={() => toggleMandatory(indicator.id, 'sell')}
                  onEdit={(newName) => editIndicator(indicator.id, 'sell', newName)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
              <p className="text-gray-400">No sell indicators added yet</p>
              <p className="text-sm text-gray-500 mt-1">Add indicators that will trigger sell signals</p>
            </div>
          )}
        </ValidationMessage.Field>
      </div>

      {/* Configuration Tips */}
      <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
        <h4 className="text-blue-200 font-medium mb-2 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Configuration Tips</span>
        </h4>
        <ul className="text-blue-100 text-sm space-y-1">
          <li>• <strong>Mandatory indicators</strong> must trigger before any signal is executed</li>
          <li>• <strong>Buy indicators</strong> work together - multiple confirmations reduce false signals</li>
          <li>• <strong>Sell indicators</strong> typically work independently for quick exits</li>
          <li>• Each indicator gets a unique ID for webhook integration</li>
          <li>• Consider using 2-4 buy indicators and 1-2 sell indicators for optimal performance</li>
        </ul>
      </div>
    </div>
  );
}

// Individual Indicator Card Component
function IndicatorCard({ 
  indicator, 
  index, 
  type, 
  onRemove, 
  onToggleMandatory, 
  onEdit 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(indicator.name);

  const handleSaveEdit = () => {
    if (editName.trim() && editName.trim() !== indicator.name) {
      onEdit(editName.trim());
    }
    setIsEditing(false);
    setEditName(indicator.name);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(indicator.name);
  };

  const colorClasses = type === 'buy' 
    ? 'border-green-500/30 bg-green-900/10' 
    : 'border-red-500/30 bg-red-900/10';

  return (
    <div className={`border rounded-lg p-4 ${colorClasses} transition-all duration-200`}>
      <div className="flex items-center space-x-4">
        {/* Index Number */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
          type === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {index + 1}
        </div>

        {/* Indicator Name */}
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">{indicator.name}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          )}
          
          {/* UUID Display */}
          <div className="text-xs text-gray-500 font-mono mt-1">
            ID: {indicator.id}
          </div>
        </div>

        {/* Mandatory Toggle */}
        <label className="flex items-center space-x-2 text-gray-300">
          <input
            type="checkbox"
            checked={indicator.mandatory}
            onChange={onToggleMandatory}
            className={`w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-2 ${
              type === 'buy' 
                ? 'text-green-600 focus:ring-green-500' 
                : 'text-red-600 focus:ring-red-500'
            }`}
          />
          <span className="text-sm">
            {indicator.mandatory ? (
              <span className="text-orange-400 font-medium">Mandatory</span>
            ) : (
              'Optional'
            )}
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 transition-colors p-1"
            title="Remove indicator"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default IndicatorConfigurationStep;
