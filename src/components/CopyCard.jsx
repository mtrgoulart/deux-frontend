// components/CopyCard.jsx
import userIcon from '/icons/user.svg';

function CopyCard({ name, creator, profit, isSubscribed, onPrimaryAction, onExitAction }) {
  const numericProfit = parseFloat(profit);
  const displayProfit = !isNaN(numericProfit) ? numericProfit.toFixed(2) : '0.00';

  return (
    <div className="group relative">
      {/* Outer glow effect */}
      <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 blur-xl rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100"></div>

      {/* Card container */}
      <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg overflow-hidden shadow-2xl
                    hover:border-red-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-red-500/20 hover:shadow-xl
                    min-h-[200px] flex flex-col">

        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>

        {/* Status indicator */}
        {isSubscribed && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 border border-green-500/30 rounded px-2 py-1 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-mono uppercase tracking-wider">Active</span>
          </div>
        )}

        {/* Card content */}
        <div className="flex-grow p-5">
          {/* Creator info */}
          <div className="flex items-center gap-2 mb-3">
            <img src={userIcon} alt="Creator" className="w-4 h-4 opacity-60 group-hover:opacity-80 transition-opacity" />
            <span className="text-xs text-gray-600 font-mono uppercase tracking-wider">
              by <span className="text-red-500 group-hover:text-red-400 font-bold transition-colors">{creator}</span>
            </span>
          </div>

          {/* Strategy name */}
          <h3
            className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 leading-tight break-words mb-4 group-hover:from-red-100 group-hover:to-white transition-all"
            title={name}
          >
            {name}
          </h3>

          {/* APY display */}
          <div className="bg-black/40 border border-red-900/30 rounded-lg p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-1 font-mono">Annual Yield</div>
            <div className={`text-2xl font-black font-mono ${numericProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {numericProfit >= 0 ? '+' : ''}{displayProfit}%
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-black/20 border-t border-red-900/20">
          {isSubscribed ? (
            <div className="flex gap-2">
              <button
                onClick={onPrimaryAction}
                className="flex-1 py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg font-mono
                         bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-red-900/50 text-red-400
                         hover:bg-red-900/30 hover:border-red-500/50 hover:scale-105 transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                ◆ Review
              </button>
              <button
                onClick={onExitAction}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg font-mono
                         bg-red-600/80 border border-red-500/50 text-white
                         hover:bg-red-500 hover:scale-105 transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={onPrimaryAction}
              className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg font-mono
                       bg-gradient-to-r from-yellow-500 to-yellow-600 text-black border border-yellow-400
                       hover:from-yellow-400 hover:to-yellow-500 hover:scale-105 transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-yellow-500/20 shadow-lg shadow-yellow-500/30"
            >
              ◆ Copy Strategy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CopyCard;