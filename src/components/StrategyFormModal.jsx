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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-lg"></div>

        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg shadow-2xl">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 z-10"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 z-10"></div>

          {/* Header */}
          <div className="relative border-b border-red-900/30 bg-black/40 backdrop-blur-sm px-6 py-4">
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-red-900/10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600 tracking-wider uppercase">
                  {isEditing ? 'Edit Configuration' : 'New Configuration'}
                </h3>
                <p className="text-gray-500 text-xs mt-1 font-mono tracking-wide">
                  {isEditing ? 'MODIFY EXISTING PARAMETERS' : 'CREATE NEW STRATEGY CONFIGURATION'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-900/30 rounded transition-all duration-200 group"
                title="Close"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Name and Side in a 2-column grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono">
                    ◆ Configuration Name
                  </label>
                  <input
                    name="name"
                    value={strategy.name}
                    onChange={handleChange}
                    placeholder="Enter name..."
                    className={`w-full px-3 py-2 bg-black/60 border rounded font-mono text-sm text-red-400
                             placeholder-gray-600 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm
                             ${formErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-red-900/50 focus:border-red-500 focus:ring-red-500/20 hover:border-red-700'}`}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono">
                    ◆ Trade Side
                  </label>
                  <div className="relative group">
                    <select
                      name="side"
                      value={strategy.side}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 bg-black/60 border rounded font-mono text-sm text-red-400
                               focus:outline-none focus:ring-2 transition-all duration-300
                               appearance-none cursor-pointer backdrop-blur-sm
                               ${formErrors.side ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-red-900/50 focus:border-red-500 focus:ring-red-500/20 hover:border-red-700'}`}
                    >
                      <option value="" className="bg-black text-red-400">Select side...</option>
                      <option value="buy" className="bg-black text-green-400">Buy</option>
                      <option value="sell" className="bg-black text-red-400">Sell</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500"></div>
                    </div>
                  </div>
                  {formErrors.side && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.side}</p>}
                </div>
              </div>

              {/* UUID */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest font-mono">
                  ◆ Strategy UUID
                </label>
                <input
                  value={strategy.strategy}
                  readOnly
                  className="w-full px-3 py-2 bg-black/40 border border-gray-800 text-gray-500 rounded font-mono text-xs
                           cursor-not-allowed opacity-60"
                />
              </div>

              {/* Size Mode Section */}
              <div className="border-t border-red-900/30 pt-4 mt-2">
                <h4 className="text-sm font-bold text-red-400 mb-3 uppercase tracking-wider font-mono">
                  ◆ Position Sizing
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Size Mode */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono">
                      ◆ Sizing Mode
                    </label>
                    <div className="relative group">
                      <select
                        name="size_mode"
                        value={strategy.size_mode || 'percentage'}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 bg-black/60 border rounded font-mono text-sm text-red-400
                                 focus:outline-none focus:ring-2 transition-all duration-300
                                 appearance-none cursor-pointer backdrop-blur-sm
                                 ${formErrors.size_mode ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-red-900/50 focus:border-red-500 focus:ring-red-500/20 hover:border-red-700'}`}
                      >
                        <option value="percentage" className="bg-black text-red-400">Percentage of Balance</option>
                        <option value="flat_value" className="bg-black text-red-400">Flat Value (Fixed Amount)</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500"></div>
                      </div>
                    </div>
                    {formErrors.size_mode && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.size_mode}</p>}
                  </div>

                  {/* Conditional rendering based on size_mode */}
                  {strategy.size_mode === 'percentage' ? (
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono">
                        ◆ Percentage (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="percent"
                          value={strategy.percent || ''}
                          onChange={handleChange}
                          placeholder="e.g., 10"
                          className={`w-full px-3 py-2 pr-10 bg-black/60 border rounded font-mono text-sm text-red-400
                                   placeholder-gray-600 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm
                                   ${formErrors.percent ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-red-900/50 focus:border-red-500 focus:ring-red-500/20 hover:border-red-700'}`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">%</div>
                      </div>
                      {formErrors.percent && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.percent}</p>}
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono">
                        ◆ Flat Value ($)
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">$</div>
                        <input
                          type="number"
                          name="flat_value"
                          value={strategy.flat_value || ''}
                          onChange={handleChange}
                          placeholder="e.g., 500"
                          className={`w-full px-3 py-2 pl-8 bg-black/60 border rounded font-mono text-sm text-red-400
                                   placeholder-gray-600 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm
                                   ${formErrors.flat_value ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-red-900/50 focus:border-red-500 focus:ring-red-500/20 hover:border-red-700'}`}
                        />
                      </div>
                      {formErrors.flat_value && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.flat_value}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Execution Parameters Section */}
              <div className="border-t border-red-900/30 pt-4 mt-2">
                <h4 className="text-sm font-bold text-red-400 mb-3 uppercase tracking-wider font-mono">
                  ◆ Execution Parameters
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {/* Condition Limit */}
                  <div>
                    <label className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono">
                      ◆ Condition
                    </label>
                    <input
                      type="number"
                      name="condition_limit"
                      value={strategy.condition_limit || ''}
                      onChange={handleChange}
                      placeholder="Limit..."
                      className={`w-full px-3 py-2 bg-black/60 border rounded font-mono text-sm text-red-400
                               placeholder-gray-600 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm
                               ${formErrors.condition_limit ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-red-900/50 focus:border-red-500 focus:ring-red-500/20 hover:border-red-700'}`}
                    />
                    {formErrors.condition_limit && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.condition_limit}</p>}
                  </div>

                  {/* Interval */}
                  <div>
                    <label className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono">
                      ◆ Interval
                    </label>
                    <input
                      type="number"
                      name="interval"
                      value={strategy.interval || ''}
                      onChange={handleChange}
                      placeholder="Minutes..."
                      className={`w-full px-3 py-2 bg-black/60 border rounded font-mono text-sm text-red-400
                               placeholder-gray-600 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm
                               ${formErrors.interval ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-red-900/50 focus:border-red-500 focus:ring-red-500/20 hover:border-red-700'}`}
                    />
                    {formErrors.interval && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.interval}</p>}
                  </div>

                  {/* Simultaneous Operations */}
                  <div>
                    <label className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono">
                      ◆ Max Ops
                    </label>
                    <input
                      type="number"
                      name="simultaneous_operations"
                      value={strategy.simultaneous_operations || ''}
                      onChange={handleChange}
                      placeholder="Max..."
                      className={`w-full px-3 py-2 bg-black/60 border rounded font-mono text-sm text-red-400
                               placeholder-gray-600 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm
                               ${formErrors.simultaneous_operations ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-red-900/50 focus:border-red-500 focus:ring-red-500/20 hover:border-red-700'}`}
                    />
                    {formErrors.simultaneous_operations && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.simultaneous_operations}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-red-900/30 bg-black/40 backdrop-blur-sm px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-gray-900/30 border border-gray-500/30 text-gray-400 rounded font-mono text-sm uppercase tracking-wider
                         hover:bg-gray-900/50 hover:border-gray-500/50 transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-gray-500/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-gradient-to-br from-red-600 to-red-700 text-white rounded font-mono text-sm uppercase tracking-wider font-bold
                         shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300
                         hover:from-red-500 hover:to-red-600
                         focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-black
                         border border-red-400/50 hover:border-red-300"
              >
                {isEditing ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>

          {/* Bottom decorations */}
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 z-10"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 z-10"></div>
        </div>
      </div>
    </div>
  );
}
