
// src/components/StrategyCreation/StrategyDetailModal.jsx
import React from 'react';

const StrategyDetailModal = ({ strategy, onClose, onEdit }) => {
  if (!strategy) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h3 className="text-2xl font-semibold mb-4 text-white">Strategy Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
          <div>
            <label className="block text-sm font-medium text-gray-400">Name</label>
            <p>{strategy.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Symbol</label>
            <p>{strategy.symbol}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Buy Strategy</label>
            <p>{strategy.strategy_buy}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Sell Strategy</label>
            <p>{strategy.strategy_sell}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Status</label>
            <p>{strategy.status === 1 ? 'Stopped' : 'Running'}</p>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(strategy)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyDetailModal;
