// components/UnsubscribeModal.jsx

function UnsubscribeModal({ copyItem, onClose, onConfirm, isLoading }) {
  if (!copyItem) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="relative max-w-md w-full">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-red-500/30 blur-2xl rounded-lg"></div>

        {/* Modal container */}
        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-500/50 rounded-lg shadow-2xl overflow-hidden">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500 z-10"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500 z-10"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500 z-10"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500 z-10"></div>

          {/* Header */}
          <div className="bg-black/40 border-b border-red-900/30 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-red-400 animate-pulse"></div>
                <div className="w-3 h-3 rounded-full bg-red-600 border border-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-red-700 border border-red-600"></div>
              </div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400 uppercase tracking-wider font-mono">
                ◆ Confirm Exit
              </h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 bg-gradient-to-br from-black/60 to-gray-900/60 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/30 border-2 border-red-500/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-gray-300 mb-3 font-mono text-sm">
                Are you sure you want to exit this configuration?
              </p>
              <div className="bg-black/60 border border-red-900/50 rounded-lg p-4 mb-2">
                <p className="text-red-400 font-bold font-mono truncate" title={copyItem.name}>
                  {copyItem.name}
                </p>
              </div>
              <p className="text-xs text-gray-600 uppercase tracking-wider font-mono">
                [Warning: This action cannot be undone]
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="bg-black/40 border-t border-red-900/30 px-6 py-4 flex justify-center gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-red-900/50 text-gray-400 rounded-lg font-mono text-sm uppercase tracking-wider
                       hover:bg-red-900/20 hover:border-red-700/50 hover:text-red-400 transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 border border-red-500 text-white rounded-lg font-mono text-sm uppercase tracking-wider font-bold
                       hover:from-red-500 hover:to-red-600 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300
                       disabled:opacity-50 disabled:cursor-wait
                       focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              {isLoading ? 'Exiting...' : '◆ Confirm Exit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnsubscribeModal;