// components/CopyCard.jsx
import userIcon from '/icons/user.svg';

// A prop 'onDetails' foi removida da lista de parâmetros, pois não é mais usada.
function CopyCard({ name, creator, profit, isSubscribed, onPrimaryAction, onExitAction }) {
  const numericProfit = parseFloat(profit);
  const displayProfit = !isNaN(numericProfit) ? numericProfit.toFixed(2) : '0.00';

  return (
    <div className="
      group
      relative overflow-hidden
      flex flex-col 
      p-4 rounded-xl 
      bg-gray-900/80
      transition-all duration-300 ease-in-out
      transform hover:-translate-y-1
      border border-gray-800
      hover:border-red-500/50 hover:shadow-red-500/20 hover:shadow-lg
      min-h-[170px]
    ">
      <div className="flex-grow">
        <div className="flex justify-between items-start gap-4">
          
          <div className="flex-1">
            <div className="flex items-center text-xs text-gray-400 mb-2 gap-2">
              <img src={userIcon} alt="Creator" className="w-4 h-4 opacity-70" /> 
              <span className="font-mono">by <span className="text-red-400 group-hover:text-red-300">{creator}</span></span>
            </div>
            <h3 
              className="text-lg font-bold text-white leading-tight break-words"
              title={name}
              style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.3)' }}
            >
              {name}
            </h3>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400 mb-1">APY</p>
            <p className="font-bold text-xl text-green-400" style={{ textShadow: '0 0 8px rgba(34, 197, 94, 0.7)' }}>
              {displayProfit}%
            </p>
          </div>
        </div>
      </div>

      {/* Container dos botões - restauramos o gap */}
      <div className="flex gap-2 mt-auto pt-4">
        {isSubscribed ? (
            // Fragmento <> para agrupar os dois botões
            <>
                <button 
                    onClick={onPrimaryAction}
                    className="
                      w-2/3 py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded-md 
                      bg-gray-700 text-gray-300 
                      transition-all duration-300 ease-in-out 
                      hover:bg-gray-600 hover:scale-105
                    "
                >
                    Review
                </button>
                <button 
                    onClick={onExitAction} // Nova prop para a ação de sair
                    className="
                      w-1/3 py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded-md 
                      bg-red-600 text-white
                      transition-all duration-300 ease-in-out 
                      hover:bg-red-500 hover:scale-105
                    "
                >
                    Exit
                </button>
            </>
        ) : (
            <button 
                onClick={onPrimaryAction}
                className="
                  w-full py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded-md
                  bg-yellow-500 text-gray-900 
                  transition-all duration-300 ease-in-out 
                  hover:bg-yellow-400 hover:scale-105
                "
                style={{ 
                    boxShadow: '0 0 10px rgba(234, 179, 8, 0.5)',
                    textShadow: '0 0 2px rgba(0,0,0,0.4)'
                }}
            >
                Copy
            </button>
        )}
      </div>
    </div>
  );
}

export default CopyCard;