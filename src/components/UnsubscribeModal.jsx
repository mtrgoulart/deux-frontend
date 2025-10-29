// components/UnsubscribeModal.jsx

function UnsubscribeModal({ copyItem, onClose, onConfirm, isLoading }) {
  if (!copyItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg text-center max-w-sm w-full border border-red-500/30">
        <h3 className="text-xl font-semibold text-white mb-4">Confirm Exit</h3>
        <p className="text-slate-300 mb-2">
          Are you sure you want to exit this configuration?
        </p>
        <p className="text-red-400 font-bold truncate" title={copyItem.name}>
          {copyItem.name}
        </p>
        <p className="text-xs text-gray-500 mt-4">This action cannot be undone.</p>
        
        <div className="flex justify-center gap-4 mt-8">
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="px-6 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isLoading} 
            className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:bg-red-800 disabled:cursor-wait"
          >
            {isLoading ? 'Exiting...' : 'Exit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnsubscribeModal;