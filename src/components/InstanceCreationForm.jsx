import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import StrategySearchModal from './StrategySearchModal';


function SavingOverlay({ isSaving }) {
  if (!isSaving) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-[100]">
      <div className="w-16 h-16 border-4 border-solid border-gray-600 border-t-red-500 rounded-full animate-spin"></div>
      <p className="text-white text-xl mt-4 font-semibold">Saving...</p>
      <p className="text-gray-300 mt-1">Please, wait.</p>
    </div>
  );
}

function StrategyDetailsCard({ strategy, onClear }) {
  if (!strategy) return null;

  // Determine sizing mode (default to 'percentage' for backward compatibility)
  const sizeMode = strategy.size_mode || 'percentage';
  const isFlatValue = sizeMode === 'flat_value';

  // Format the sizing value based on mode
  const formattedSizing = isFlatValue
    ? `$${parseFloat(strategy.flat_value || 0).toFixed(2)}`
    : ((percentValue) => {
        const num = parseFloat(percentValue);
        return !isNaN(num) ? `${num * 100}%` : 'N/A';
      })(strategy.percent);

  return (
    // Adicionamos a classe 'animate-fade-in' que já tínhamos definido no CSS
    <div className="bg-gray-700 p-3 rounded-md animate-fade-in transition-all duration-300">
      <div className="flex justify-between items-center mb-2">
        <h5 className="font-bold text-white truncate" title={strategy.name}>
          {strategy.name} <span className="text-gray-400 font-normal">({strategy.id})</span>
        </h5>
        <button onClick={() => onClear(strategy.side)} className="text-red-500 hover:text-red-400 font-bold text-xl px-2">
          &times;
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {/* Sizing Mode - shows either Percent or Flat Value */}
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400">{isFlatValue ? 'Flat Value' : 'Operation Percent'}</p>
          <p className="font-semibold text-white">
            {formattedSizing}
          </p>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400">Condition Limit</p>
          <p className="font-semibold text-white">{strategy.condition_limit ?? 'N/A'}</p>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400">Interval (min)</p>
          <p className="font-semibold text-white">{strategy.interval ?? 'N/A'}</p>
        </div>
        {/* Renderiza "Op. Simultâneas" apenas se for uma estratégia de compra */}
        {strategy.side === 'buy' && (
           <div className="bg-gray-800 p-2 rounded">
            <p className="text-gray-400">Simultaneos Operations</p>
            <p className="font-semibold text-white">{strategy.simultaneous_operations ?? 'N/A'}</p>
          </div>
        )}
      </div>
    </div>
  );
}


// --- StrategySelector ATUALIZADO ---
// Agora usa o novo StrategyDetailsCard quando uma estratégia é selecionada.
function StrategySelector({
  side,
  isLoading,
  selectedStrategy,
  recentSuggestions,
  onSelect,
  onClear,
  onSearch,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sideTitle = side.charAt(0).toUpperCase() + side.slice(1);

  // 1. Objeto de tema que define as cores com base no 'side'
  const isBuy = side === 'buy';
  const themeClasses = {
    border: isBuy ? 'border-green-500/20' : 'border-red-500/20',
    title: isBuy ? 'text-green-400' : 'text-red-400',
    searchButton: isBuy ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300',
    suggestionHover: isBuy ? 'hover:bg-green-800/50' : 'hover:bg-red-800/50'
  };

  return (
    // 2. Aplica a classe de borda do tema
    <div className={`border ${themeClasses.border} p-4 rounded-md space-y-2 min-h-[120px]`}>
      {/* 3. Aplica a classe de título do tema */}
      <h4 className={`text-lg font-semibold ${themeClasses.title}`}>{sideTitle}</h4>

      {isLoading ? (
        <div className="p-3 rounded bg-gray-700 animate-pulse w-full"><div className="h-4 bg-gray-600 rounded w-3/4"></div></div>
      ) : !selectedStrategy ? (
        <div className="relative">
          <div
            className="w-full p-2 rounded bg-gray-700 text-gray-400 cursor-pointer text-left"
            onClick={() => setShowSuggestions(prev => !prev)}
          >
            Click here to Select Configuration...
          </div>
          {/* 4. Aplica a classe do botão de busca do tema */}
          <button
            onClick={onSearch}
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm font-semibold ${themeClasses.searchButton}`}
          >
            Search
          </button>
          {showSuggestions && (
            <ul className="absolute z-10 w-full bg-gray-900 border border-gray-600 mt-1 rounded max-h-40 overflow-y-auto shadow-lg">
              {recentSuggestions.length > 0 ? (
                recentSuggestions.map(s => (
                  // 5. Aplica a classe de hover da sugestão do tema
                  <li
                    key={s.id}
                    onClick={() => { onSelect(s); setShowSuggestions(false); }}
                    className={`px-3 py-2 cursor-pointer ${themeClasses.suggestionHover}`}
                  >
                    {s.name} ({s.id})
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-gray-500">None Configuration.</li>
              )}
            </ul>
          )}
        </div>
      ) : (
        <StrategyDetailsCard strategy={selectedStrategy} onClear={onClear} />
      )}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL (com os novos labels) ---
function InstanceCreationForm({ show, onClose, apiKeys, initialData, selectedApiKey }) {
    const queryClient = useQueryClient();
  
    const [formState, setFormState] = useState(initialData);
    const [selectedStrategies, setSelectedStrategies] = useState({ buy: null, sell: null });
    const [recentSuggestions, setRecentSuggestions] = useState({ buy: [], sell: [] });
    const [isSearchModalOpen, setIsSearchModalOpen] = useState({ buy: false, sell: false });
    const [symbolSuggestions, setSymbolSuggestions] = useState([]);
    const [isSearchingSymbols, setIsSearchingSymbols] = useState(false);
    const [symbolSearchTimeout, setSymbolSearchTimeout] = useState(null);
    const [loadingSave, setLoadingSave] = useState(false);
    const [isStrategyLoading, setIsStrategyLoading] = useState({ buy: false, sell: false });
  
    const fetchStrategyDetails = async (strategy) => {
      if (!strategy || !strategy.id) return;
      setIsStrategyLoading(prev => ({ ...prev, [strategy.side]: true }));
      try {
        const res = await apiFetch(`/get_strategy_parameters?id=${strategy.id}`);
        const data = await res.json();
        if (res.ok) {
          const detailedStrategy = { ...data, side: strategy.side };
          setSelectedStrategies(prev => ({ ...prev, [strategy.side]: detailedStrategy }));
          setFormState(prev => ({ ...prev, [`strategy_${strategy.side}`]: strategy.id }));
        }
      } catch (error) {
        console.error("Failed to fetch strategy details:", error);
      } finally {
        setIsStrategyLoading(prev => ({ ...prev, [strategy.side]: false }));
      }
    };
  
    const handleClearStrategy = (side) => {
      setSelectedStrategies(prev => ({ ...prev, [side]: null }));
      setFormState(prev => ({ ...prev, [`strategy_${side}`]: '' }));
    };
  
    const handleSymbolSearch = (value) => {
      setFormState(prev => ({ ...prev, symbol: value }));
      if (symbolSearchTimeout) clearTimeout(symbolSearchTimeout);
      setIsSearchingSymbols(true);
      const timeout = setTimeout(async () => {
        if (!value || !formState.api_key) {
          setSymbolSuggestions([]);
          setIsSearchingSymbols(false);
          return;
        }
        try {
          const res = await apiFetch(`/search_symbols?query=${value}&api_key_id=${formState.api_key}`);
          const data = await res.json();
          setSymbolSuggestions(data.symbols || []);
        } catch (e) {
          setSymbolSuggestions([]);
        } finally {
          setIsSearchingSymbols(false);
        }
      }, 300);
      setSymbolSearchTimeout(timeout);
    };
  
    useEffect(() => {
      if (initialData) {
        setFormState(initialData);
        if (initialData.strategy_buy) fetchStrategyDetails({ id: initialData.strategy_buy, side: 'buy' });
        if (initialData.strategy_sell) fetchStrategyDetails({ id: initialData.strategy_sell, side: 'sell' });
      }
    }, [initialData]);
  
    useEffect(() => {
      const fetchRecent = async () => {
        if (show) {
          try {
            const res = await apiFetch('/get_recent_strategies');
            const data = await res.json();
            if (res.ok) setRecentSuggestions({ buy: data.buy || [], sell: data.sell || [] });
          } catch (error) { console.error("Failed to fetch recent strategies:", error); }
        }
      };
      fetchRecent();
    }, [show]);
  
    const mutation = useMutation({
      mutationFn: async () => {
        setLoadingSave(true);
        const route = formState.id ? '/update_instance' : '/save_instance';
        const payload = { ...formState };
        const res = await apiFetch(route, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Falha ao salvar a instância');
        }
        return res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['instances', selectedApiKey]);
        onClose();
      },
      onError: (error) => {
        alert(`Erro ao salvar: ${error.message}`);
      },
      onSettled: () => {
        setLoadingSave(false);
      }
    });
  
    if (!show) {
      return null;
    }
  
    return (
      <>
        <SavingOverlay isSaving={loadingSave} />
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in">
          {/* --- VISUAL: Container do modal com borda e sombra vermelhas --- */}
          <div className="bg-gray-900 p-6 rounded-lg shadow-xl shadow-red-500/10 border border-red-500/30 w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-semibold mb-6 text-white">{formState.id ? 'Edit Strategy Instance' : 'New Strategy Instance'}</h3>
            <div className="space-y-4">
              
              <div>
                <label htmlFor="strategy-name" className="block text-sm font-medium text-gray-300 mb-1">Strategy Name</label>
                {/* --- VISUAL: Campos de formulário com foco vermelho --- */}
                <input id="strategy-name" name="name" maxLength={255} value={formState.name || ''} onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter a name for the strategy"
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-red-500 focus:border-red-500" />
              </div>

              <div>
                <label htmlFor="api-key-select" className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                <select id="api-key-select" name="api_key" value={formState.api_key || ''} onChange={(e) => setFormState(prev => ({ ...prev, api_key: e.target.value }))}
                  disabled={Boolean(formState.id)}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-red-500 focus:border-red-500">
                  <option value="">Select API Key</option>
                  {apiKeys.map(key => (<option key={key.api_key_id} value={key.api_key_id}>({key.api_key_id}) {key.name}</option>))}
                </select>
              </div>
              
              <div>
                <label htmlFor="symbol-search" className="block text-sm font-medium text-gray-300 mb-1">Symbol</label>
                <div className="relative">
                  <input id="symbol-search" type="text" name="symbol" value={formState.symbol || ''} onChange={(e) => handleSymbolSearch(e.target.value)} placeholder="Search symbol..."
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-red-500 focus:border-red-500" />
                  {isSearchingSymbols && <div className="absolute right-3 top-2 text-xs text-gray-400 animate-pulse">Searching...</div>}
                  {symbolSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-gray-900 border border-gray-600 mt-1 rounded w-full max-h-40 overflow-y-auto shadow-md">
                      {symbolSuggestions.map((s, i) => (<li key={i} onClick={() => { setFormState(prev => ({ ...prev, symbol: s })); setSymbolSuggestions([]); }} className="px-3 py-2 hover:bg-red-800/50 cursor-pointer">{s}</li>))}
                    </ul>
                  )}
                </div>
              </div>
  
              <StrategySelector side="buy" isLoading={isStrategyLoading.buy} selectedStrategy={selectedStrategies.buy} recentSuggestions={recentSuggestions.buy} onSelect={(strategy) => fetchStrategyDetails({ ...strategy, side: 'buy' })} onClear={handleClearStrategy} onSearch={() => setIsSearchModalOpen(prev => ({ ...prev, buy: true }))} />
              <StrategySelector side="sell" isLoading={isStrategyLoading.sell} selectedStrategy={selectedStrategies.sell} recentSuggestions={recentSuggestions.sell} onSelect={(strategy) => fetchStrategyDetails({ ...strategy, side: 'sell' })} onClear={handleClearStrategy} onSearch={() => setIsSearchModalOpen(prev => ({ ...prev, sell: true }))} />
  
              {/* --- VISUAL: Botões de ação com as cores do tema --- */}
              <div className="flex justify-end gap-4 mt-6">
                <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors">Cancel</button>
                <button
                  onClick={() => mutation.mutate()}
                  disabled={loadingSave || isStrategyLoading.buy || isStrategyLoading.sell}
                  // Aplicando o mesmo estilo do botão azul "Add Strategy"
                  className="px-4 py-2 font-semibold text-white rounded-md transition-all duration-300 transform bg-blue-600/90 hover:bg-blue-600 border border-blue-600/50 hover:border-blue-500 hover:-translate-y-px disabled:bg-gray-600/50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' }}
                >
                  {loadingSave ? 'Saving...' : (formState.id ? 'Update Instance' : 'Save Instance')}
                </button>
              </div>
            </div>
          </div>
        </div>
  
        {isSearchModalOpen.buy && (<StrategySearchModal show={isSearchModalOpen.buy} onClose={() => setIsSearchModalOpen(prev => ({ ...prev, buy: false }))} onSelectStrategy={(strategy) => { fetchStrategyDetails({ ...strategy, side: 'buy' }); setIsSearchModalOpen(prev => ({ ...prev, buy: false })); }} side="buy" />)}
        {isSearchModalOpen.sell && (<StrategySearchModal show={isSearchModalOpen.sell} onClose={() => setIsSearchModalOpen(prev => ({ ...prev, sell: false }))} onSelectStrategy={(strategy) => { fetchStrategyDetails({ ...strategy, side: 'sell' }); setIsSearchModalOpen(prev => ({ ...prev, sell: false })); }} side="sell" />)}
      </>
    );
  }
  
  
  export default InstanceCreationForm;