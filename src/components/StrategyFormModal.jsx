import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const initialFormState = {
  id: '', name: '', side: '', strategy: '', percent: '',
  condition_limit: '', interval: '', simultaneous_operations: '',
  size_mode: 'percentage', flat_value: '',
};

export function StrategyFormModal({ isOpen, onClose, onSave, initialData, formErrors = {} }) {
  const [strategy, setStrategy] = useState(initialFormState);
  const isEditing = Boolean(initialData?.id);

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setStrategy({ ...initialData, strategy: initialData.strategy_uuid });
      } else {
        setStrategy({ ...initialFormState, strategy: uuidv4() });
      }
    }
  }, [isOpen, initialData, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStrategy(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(strategy);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40 animate-fade-in">
      <div className="bg-gray-900 border border-red-500/30 p-6 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto shadow-lg shadow-red-500/10">
        {/* ✅ Traduzido */}
        <h3 className="text-2xl font-semibold mb-6 text-white">{isEditing ? 'Edit Configuration' : 'New Configuration'}</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {/* Fields */}
          <div>
            <label className="text-sm text-gray-400">Name</label>
            <input name="name" value={strategy.name} onChange={handleChange} className={`w-full p-2 mt-1 rounded bg-gray-800 text-white border ${formErrors.name ? 'border-red-500' : 'border-gray-700'} focus:ring-1 focus:ring-red-500 focus:border-red-500`} />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-400">Side</label>
            <select name="side" value={strategy.side} onChange={handleChange} className={`w-full p-2 mt-1 rounded bg-gray-800 text-white border ${formErrors.side ? 'border-red-500' : 'border-gray-700'} focus:ring-1 focus:ring-red-500 focus:border-red-500`}>
              {/* ✅ Traduzido */}
              <option value="">Select...</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            {formErrors.side && <p className="text-red-500 text-xs mt-1">{formErrors.side}</p>}
          </div>
          <div className="col-span-2">
            <label className="text-sm text-gray-400">UUID</label>
            <input value={strategy.strategy} readOnly className="w-full p-2 mt-1 rounded bg-gray-800/50 text-white opacity-60 cursor-not-allowed border border-gray-700" />
          </div>

          {/* Size Mode Selection */}
          <div className="col-span-2">
            <label className="text-sm text-gray-400">Sizing Mode</label>
            <select
              name="size_mode"
              value={strategy.size_mode || 'percentage'}
              onChange={handleChange}
              className={`w-full p-2 mt-1 rounded bg-gray-800 text-white border ${formErrors.size_mode ? 'border-red-500' : 'border-gray-700'} focus:ring-1 focus:ring-red-500 focus:border-red-500`}
            >
              <option value="percentage">Percentage of Balance</option>
              <option value="flat_value">Flat Value (Fixed Amount)</option>
            </select>
            {formErrors.size_mode && <p className="text-red-500 text-xs mt-1">{formErrors.size_mode}</p>}
          </div>

          {/* Conditional rendering based on size_mode */}
          {strategy.size_mode === 'percentage' ? (
            <div>
              <label className="text-sm text-gray-400">Percent (%)</label>
              <input
                type="number"
                name="percent"
                value={strategy.percent || ''}
                onChange={handleChange}
                className={`w-full p-2 mt-1 rounded bg-gray-800 text-white border ${formErrors.percent ? 'border-red-500' : 'border-gray-700'} focus:ring-1 focus:ring-red-500 focus:border-red-500`}
                placeholder="e.g., 10 for 10%"
              />
              {formErrors.percent && <p className="text-red-500 text-xs mt-1">{formErrors.percent}</p>}
              <p className="text-xs text-gray-500 mt-1">Percentage of account balance to trade</p>
            </div>
          ) : (
            <div>
              <label className="text-sm text-gray-400">Flat Value ($)</label>
              <input
                type="number"
                name="flat_value"
                value={strategy.flat_value || ''}
                onChange={handleChange}
                className={`w-full p-2 mt-1 rounded bg-gray-800 text-white border ${formErrors.flat_value ? 'border-red-500' : 'border-gray-700'} focus:ring-1 focus:ring-red-500 focus:border-red-500`}
                placeholder="e.g., 500"
              />
              {formErrors.flat_value && <p className="text-red-500 text-xs mt-1">{formErrors.flat_value}</p>}
              <p className="text-xs text-gray-500 mt-1">Exact dollar amount to trade</p>
            </div>
          )}

          {/* Other fields */}
          {[
            { key: 'condition_limit', label: 'Condition Limit' },
            { key: 'interval', label: 'Interval (min)' },
            { key: 'simultaneous_operations', label: 'Simultaneous Ops' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm text-gray-400">{label}</label>
              <input type="number" name={key} value={strategy[key] || ''} onChange={handleChange} className={`w-full p-2 mt-1 rounded bg-gray-800 text-white border ${formErrors[key] ? 'border-red-500' : 'border-gray-700'} focus:ring-1 focus:ring-red-500 focus:border-red-500`} />
              {formErrors[key] && <p className="text-red-500 text-xs mt-1">{formErrors[key]}</p>}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-4 mt-8">
          {/* ✅ Traduzido */}
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors">
            {isEditing ? 'Save Changes' : 'Create Strategy'}
          </button>
        </div>
      </div>
    </div>
  );
}