import React from 'react';

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, strategy }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-900 border border-red-500/30 p-6 rounded-lg shadow-lg shadow-red-500/10 text-center max-w-sm w-full">
        {/* ✅ Traduzido */}
        <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
        <p className="text-gray-300 mb-2">Are you sure you want to delete the strategy:</p>
        <p className="text-red-400 font-bold truncate" title={strategy?.name}>
          {strategy?.name || '(no name)'}
        </p>
        <p className="text-gray-500 text-sm mb-6">ID: {strategy?.id || '--'}</p>
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="px-4 py-2 rounded text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded text-white bg-red-600 hover:bg-red-700 transition-colors">
            Confirm Deletion
          </button>
        </div>
      </div>
    </div>
  );
}