import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import StrategySearchModal from './StrategySearchModal';


function SavingOverlay({ isSaving }) {
  // Se não estiver salvando, o componente não renderiza nada.
  if (!isSaving) {
    return null;
  }

  return (
    // Camada principal: cobre a tela inteira, semi-transparente e centraliza o conteúdo.
    // z-[100] garante que ele fique por cima de todos os outros elementos do modal.
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-[100]">
      {/* O Spinner: um círculo que gira usando a classe 'animate-spin' do Tailwind. */}
      <div className="w-16 h-16 border-4 border-solid border-gray-600 border-t-cyan-400 rounded-full animate-spin"></div>
      {/* O Texto abaixo do spinner */}
      <p className="text-white text-xl mt-4 font-semibold">Saving...</p>
      <p className="text-gray-300 mt-1">Please, wait.</p>
    </div>
  );
}


// --- NOVO COMPONENTE DE CARD ---
// Este componente exibirá os detalhes de uma estratégia selecionada.
function StrategyDetailsCard({ strategy, onClear }) {
  if (!strategy) return null;

  // Lógica de formatação mais robusta para o percentual
  const formattedPercent = ((percentValue) => {
    const num = parseFloat(percentValue); // Tenta converter string para número
    // Se a conversão resultar em um número válido, formata. Senão, 'N/A'.
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
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400">Operation Percent</p>
        <p className="font-semibold text-white">
            {formattedPercent}
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

  return (
    <div className="border border-gray-600 p-4 rounded-md space-y-2 min-h-[120px]">
      <h4 className={`text-lg font-semibold ${side === 'buy' ? 'text-cyan-400' : 'text-pink-400'}`}>{sideTitle}</h4>

      {isLoading ? (
        <div className="p-3 rounded bg-gray-700 animate-pulse w-full">
          <div className="h-4 bg-gray-600 rounded w-3/4"></div>
        </div>
      ) : !selectedStrategy ? (
        <div className="relative">
          <div
            className="w-full p-2 rounded bg-gray-700 text-gray-400 cursor-pointer text-left"
            onClick={() => setShowSuggestions(prev => !prev)}
          >
            Click here to Select Configuration...
          </div>
          <button
            onClick={onSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
          >
            Search
          </button>
          {showSuggestions && (
            <ul className="absolute z-10 w-full bg-gray-900 border border-gray-600 mt-1 rounded max-h-40 overflow-y-auto shadow-lg">
              {recentSuggestions.length > 0 ? (
                recentSuggestions.map(s => (
                  <li
                    key={s.id}
                    onClick={() => {
                      onSelect(s);
                      setShowSuggestions(false);
                    }}
                    className="px-3 py-2 hover:bg-cyan-700 cursor-pointer"
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
        // AQUI ESTÁ A MUDANÇA: Usamos o novo componente de card!
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-semibold mb-4">{formState.id ? 'Strategy' : 'New Strategy'}</h3>
            <div className="space-y-4">
              
              {/* CAMPO NOME DA ESTRATÉGIA COM LABEL */}
              <div>
                <label htmlFor="strategy-name" className="block text-sm font-medium text-gray-300 mb-1">
                  Strategy Name
                </label>
                <input
                  id="strategy-name"
                  name="name"
                  maxLength={255}
                  value={formState.name || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter a name for the strategy"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                />
              </div>

              {/* CAMPO API KEY COM LABEL */}
              <div>
                <label htmlFor="api-key-select" className="block text-sm font-medium text-gray-300 mb-1">
                  API Key
                </label>
                <select
                  id="api-key-select"
                  name="api_key"
                  value={formState.api_key || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, api_key: e.target.value }))}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  <option value="">Select API Key</option>
                  {apiKeys.map(key => (<option key={key.api_key_id} value={key.api_key_id}>({key.api_key_id}) {key.name}</option>))}
                </select>
              </div>
              
              {/* CAMPO SYMBOL COM LABEL */}
              <div>
                <label htmlFor="symbol-search" className="block text-sm font-medium text-gray-300 mb-1">
                  Symbol
                </label>
                <div className="relative">
                  <input
                    id="symbol-search"
                    type="text"
                    name="symbol"
                    value={formState.symbol || ''}
                    onChange={(e) => handleSymbolSearch(e.target.value)}
                    placeholder="Search symbol..."
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  />
                  {isSearchingSymbols && <div className="absolute right-3 top-2 text-xs text-gray-400 animate-pulse">Searching...</div>}
                  {symbolSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-gray-900 border border-gray-600 mt-1 rounded w-full max-h-40 overflow-y-auto shadow-md">
                      {symbolSuggestions.map((s, i) => (
                        <li key={i} onClick={() => { setFormState(prev => ({ ...prev, symbol: s })); setSymbolSuggestions([]); }} className="px-3 py-2 hover:bg-cyan-700 cursor-pointer">{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
  
              <StrategySelector
                side="buy"
                isLoading={isStrategyLoading.buy}
                selectedStrategy={selectedStrategies.buy}
                recentSuggestions={recentSuggestions.buy}
                onSelect={(strategy) => fetchStrategyDetails({ ...strategy, side: 'buy' })}
                onClear={handleClearStrategy}
                onSearch={() => setIsSearchModalOpen(prev => ({ ...prev, buy: true }))}
              />
  
              <StrategySelector
                side="sell"
                isLoading={isStrategyLoading.sell}
                selectedStrategy={selectedStrategies.sell}
                recentSuggestions={recentSuggestions.sell}
                onSelect={(strategy) => fetchStrategyDetails({ ...strategy, side: 'sell' })}
                onClear={handleClearStrategy}
                onSearch={() => setIsSearchModalOpen(prev => ({ ...prev, sell: true }))}
              />
  
              <div className="flex justify-end gap-4 mt-6">
                <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded">Cancel</button>
                <button onClick={() => mutation.mutate()} disabled={loadingSave || isStrategyLoading.buy || isStrategyLoading.sell} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded disabled:bg-gray-500 disabled:cursor-not-allowed">
                  {loadingSave ? 'Saving...' : (formState.id ? 'Update' : 'Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
  
        {isSearchModalOpen.buy && (
          <StrategySearchModal
            show={isSearchModalOpen.buy}
            onClose={() => setIsSearchModalOpen(prev => ({ ...prev, buy: false }))}
            onSelectStrategy={(strategy) => {
              fetchStrategyDetails({ ...strategy, side: 'buy' });
              setIsSearchModalOpen(prev => ({ ...prev, buy: false }));
            }}
            side="buy"
          />
        )}
        {isSearchModalOpen.sell && (
          <StrategySearchModal
            show={isSearchModalOpen.sell}
            onClose={() => setIsSearchModalOpen(prev => ({ ...prev, sell: false }))}
            onSelectStrategy={(strategy) => {
              fetchStrategyDetails({ ...strategy, side: 'sell' });
              setIsSearchModalOpen(prev => ({ ...prev, sell: false }));
            }}
            side="sell"
          />
        )}
      </>
    );
  }
  
  export default InstanceCreationForm;