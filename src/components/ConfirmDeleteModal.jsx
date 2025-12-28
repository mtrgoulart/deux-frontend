import React from 'react';

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, strategy }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="relative w-full max-w-md">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-lg"></div>

        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg shadow-2xl p-8">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 z-10"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 z-10"></div>

          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
              <div className="relative bg-red-900/30 border border-red-500/50 rounded-full p-4">
                <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600 tracking-wider uppercase mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-400 font-mono text-sm mb-4">
              Are you sure you want to delete this configuration?
            </p>

            {/* Configuration Info */}
            <div className="bg-black/60 border border-red-900/50 rounded-lg p-4 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">Name</span>
                <span className="text-red-400 font-bold font-mono" title={strategy?.name}>
                  {strategy?.name || '(no name)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">ID</span>
                <span className="text-gray-400 font-mono">
                  {strategy?.id || '--'}
                </span>
              </div>
            </div>

            <p className="text-xs text-amber-400 font-mono mt-4">
              ⚠ This action cannot be undone
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-900/30 border border-gray-500/30 text-gray-400 rounded font-mono text-sm uppercase tracking-wider
                       hover:bg-gray-900/50 hover:border-gray-500/50 transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-gray-500/20"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-gradient-to-br from-red-600 to-red-700 text-white rounded font-mono text-sm uppercase tracking-wider font-bold
                       shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300
                       hover:from-red-500 hover:to-red-600
                       focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-black
                       border border-red-400/50 hover:border-red-300"
            >
              Delete
            </button>
          </div>

          {/* Bottom decorations */}
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 z-10"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 z-10"></div>
        </div>
      </div>
    </div>
  );
}
