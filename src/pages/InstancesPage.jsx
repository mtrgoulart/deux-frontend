import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

function InstancesPage() {
  const queryClient = useQueryClient();
  const [selectedApiKey, setSelectedApiKey] = useState(localStorage.getItem('selectedApiKey') || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    api_key: '',
    symbol: '',
    strategy_buy: '',
    strategy_sell: '',
    status: 1
  });
  const [symbolSuggestions, setSymbolSuggestions] = useState([]);
  const [symbolSearchTimeout, setSymbolSearchTimeout] = useState(null);
  const [isSearchingSymbols, setIsSearchingSymbols] = useState(false);
  const [strategySuggestionsBuy, setStrategySuggestionsBuy] = useState([]);
  const [strategySuggestionsSell, setStrategySuggestionsSell] = useState([]);
  const [strategySearchTimeout, setStrategySearchTimeout] = useState(null);
  const [isSearchingStrategies, setIsSearchingStrategies] = useState(false);
  const [loadingStatusChange, setLoadingStatusChange] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const [instanceToDelete, setInstanceToDelete] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  const handleStrategySearch = (value, side) => {
    if (strategySearchTimeout) clearTimeout(strategySearchTimeout);
  
    setIsSearchingStrategies(true);
  
    const timeout = setTimeout(async () => {
      if (!value || !formState.api_key) {
        if (side === 'buy') setStrategySuggestionsBuy([]);
        if (side === 'sell') setStrategySuggestionsSell([]);
        setIsSearchingStrategies(false);
        return;
      }
  
      try {
        const res = await apiFetch(`/search_strategies?query=${value}`);
        const data = await res.json();
        const filtered = (data.strategies || []).filter(s => s.side === side);
  
        if (side === 'buy') setStrategySuggestionsBuy(filtered);
        if (side === 'sell') setStrategySuggestionsSell(filtered);
      } catch (err) {
        if (side === 'buy') setStrategySuggestionsBuy([]);
        if (side === 'sell') setStrategySuggestionsSell([]);
      } finally {
        setIsSearchingStrategies(false);
      }
    }, 300);
  
    setStrategySearchTimeout(timeout);
  };

  const handleInstanceStatusChange = async (instance, action) => {
    if (
      (action === 'start' && instance.status !== 1) ||
      (action === 'stop' && instance.status !== 2)
    ) return;
  
    setLoadingStatusChange(true);
    setStatusMessage(action === 'start' ? 'Iniciando instância...' : 'Parando instância...');
  
    try {
      await apiFetch(`/${action}_instance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: instance.id })
      });
  
      setStatusMessage(action === 'start' ? '✅ Instância iniciada com sucesso!' : '🛑 Instância parada com sucesso!');
      await queryClient.invalidateQueries(['instances', selectedApiKey]);
  
      setTimeout(() => {
        setLoadingStatusChange(false);
        setStatusMessage('');
      }, 2000);
    } catch (err) {
      console.error(`Erro ao ${action} instância:`, err);
      setStatusMessage(`❌ Erro ao ${action === 'start' ? 'iniciar' : 'parar'} a instância.`);
      setTimeout(() => {
        setLoadingStatusChange(false);
        setStatusMessage('');
      }, 3000);
    }
  };
  

  const handleDeleteInstance = async () => {
    if (!instanceToDelete?.id) return;
  
    try {
      setConfirmDeleteOpen(false);
      setLoadingDelete(true);
  
      const res = await apiFetch('/remove_instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: instanceToDelete.id })
      });
  
      const data = await res.json();
  
      if (res.ok) {
        await queryClient.invalidateQueries(['instances', selectedApiKey]);
      } else {
        alert(data.error || 'Erro ao deletar a instância.');
      }
    } catch (err) {
      console.error('Erro ao deletar instância:', err);
      alert('Erro ao deletar a instância.');
    } finally {
      setLoadingDelete(false);
      setInstanceToDelete(null);
    }
  };
  

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['user_apikeys'],
    queryFn: async () => {
      const res = await apiFetch('/get_user_apikeys');
      const data = await res.json();
      const keys = data.user_apikeys || [];
      if (!selectedApiKey && keys.length > 0) {
        const defaultKey = keys[0].api_key_id;
        setSelectedApiKey(defaultKey);
        localStorage.setItem('selectedApiKey', defaultKey);
      }
      return keys;
    },
  });
  

  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['instances', selectedApiKey],
    queryFn: async () => {
      const res = await apiFetch(`/get_instances?api_key_id=${selectedApiKey}`);
      const data = await res.json();
      return data.instances || [];
    },
    enabled: !!selectedApiKey,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      setLoadingSave(true); 
  
      const route = formState.id ? '/update_instance' : '/save_instance';
      const payload = {
        ...formState,
        strategies: [formState.strategy_buy, formState.strategy_sell].filter(Boolean),
      };
  
      delete payload.strategy_buy;
      delete payload.strategy_sell;
  
      const res = await apiFetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instances', selectedApiKey]);
      setShowAddForm(false);
      setFormState({
        name: '',
        api_key: '',
        symbol: '',
        strategy_buy: '',
        strategy_sell: '',
        status: 1
      });
      setLoadingSave(false);  // Finaliza loading com sucesso
    },
    onError: () => {
      setLoadingSave(false);  // Finaliza loading em caso de erro
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSymbolSearch = (value) => {
    setFormState(prev => ({ ...prev, symbol: value }));
    if (symbolSearchTimeout) clearTimeout(symbolSearchTimeout);
    setIsSearchingSymbols(true); // Inicia loading
  
    const timeout = setTimeout(async () => {
      if (!value || !formState.api_key) {
        setSymbolSuggestions([]);
        setIsSearchingSymbols(false); // Finaliza loading se não houver valor
        return;
      }
  
      try {
        const res = await apiFetch(`/search_symbols?query=${value}&api_key_id=${formState.api_key}`);
        const data = await res.json();
        setSymbolSuggestions(data.symbols || []);
      } catch (e) {
        setSymbolSuggestions([]);
      } finally {
        setIsSearchingSymbols(false); // Finaliza loading
      }
    }, 300);
  
    setSymbolSearchTimeout(timeout);
  };
  

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Instâncias</h2>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <select
          value={selectedApiKey}
          onChange={(e) => {
            setSelectedApiKey(e.target.value);
            localStorage.setItem('selectedApiKey', e.target.value);
          }}
          className="bg-gray-800 text-white p-2 rounded"
        >
          <option value="">Selecione a API Key</option>
          {apiKeys.map(key => (
            <option key={key.api_key_id} value={key.api_key_id}>
              ({key.api_key_id}) {key.name}
            </option>
          ))}
        </select>

        <button onClick={() => setShowAddForm(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded">
          Adicionar Instância
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">{formState.id ? 'Editar Instância' : 'Nova Instância'}</h3>
            <div className="space-y-4">
              <input
                name="name"
                maxLength={255}
                value={formState.name}
                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value.trimStart() }))}
                placeholder="Nome da Instância"
                className="w-full p-2 rounded bg-gray-700 text-white"
                required
              />
              <select
                name="api_key"
                value={formState.api_key}
                onChange={(e) => setFormState(prev => ({ ...prev, api_key: e.target.value }))}
                className="w-full p-2 rounded bg-gray-700 text-white"
              >
                <option value="">Selecione a API Key</option>
                {apiKeys.map(key => (
                  <option key={key.api_key_id} value={key.api_key_id}>
                    ({key.api_key_id}) {key.name}
                  </option>
                ))}
              </select>
              <div className="relative">
              <input
                type="text"
                name="symbol"
                value={formState.symbol}
                onChange={(e) => handleSymbolSearch(e.target.value)}
                placeholder="Buscar símbolo..."
                autoComplete="off"
                className="w-full p-2 rounded bg-gray-700 text-white"
              />

              {isSearchingSymbols && (
                <div className="absolute right-3 top-2 text-xs text-gray-400 animate-pulse">
                  Buscando...
                </div>
              )}

              {symbolSuggestions.length > 0 && (
                <ul className="absolute z-10 bg-gray-800 border border-gray-600 mt-1 rounded w-full max-h-40 overflow-y-auto shadow-md">
                  {symbolSuggestions.map((s, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        setFormState(prev => ({ ...prev, symbol: s }));
                        setSymbolSuggestions([]);
                      }}
                      className="px-3 py-2 hover:bg-cyan-700 cursor-pointer transition-colors"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative">
            <input
                type="text"
                placeholder="Buscar Estratégia de Compra"
                onChange={(e) => handleStrategySearch(e.target.value, 'buy')}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
              {strategySuggestionsBuy.length > 0 && (
                <ul className="absolute z-10 bg-gray-800 border border-gray-600 mt-1 rounded w-full max-h-40 overflow-y-auto shadow-md">
                  {strategySuggestionsBuy.map((s) => (
                    <li
                      key={s.id}
                      onClick={() => {
                        setFormState(prev => ({ ...prev, strategy_buy: s.id }));
                        setStrategySuggestionsBuy([]);
                      }}
                      className="px-3 py-2 hover:bg-cyan-700 cursor-pointer transition-colors"
                    >
                      {s.name} ({s.id}) - {s.side}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="relative">
              <input
              type="text"
              placeholder="Buscar Estratégia de Venda"
              onChange={(e) => handleStrategySearch(e.target.value, 'sell')}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
              {strategySuggestionsSell.length > 0 && (
                <ul className="absolute z-10 bg-gray-800 border border-gray-600 mt-1 rounded w-full max-h-40 overflow-y-auto shadow-md">
                  {strategySuggestionsSell.map((s) => (
                    <li
                      key={s.id}
                      onClick={() => {
                        setFormState(prev => ({ ...prev, strategy_sell: s.id }));
                        setStrategySuggestionsSell([]);
                      }}
                      className="px-3 py-2 hover:bg-cyan-700 cursor-pointer transition-colors"
                    >
                      {s.name} ({s.strategy_id}) - {s.side}
                    </li>
                  ))}
                </ul>
              )}
            </div>

              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormState({ name: '', api_key: '', symbol: '', strategy: '', status: 1 });
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => mutation.mutate()}
                  disabled={!formState.strategy_buy && !formState.strategy_sell}
                  className={`px-4 py-2 rounded ${(!formState.strategy_buy && !formState.strategy_sell)
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p>Carregando instâncias...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto bg-gray-800 rounded text-sm">
            <thead>
              <tr className="bg-gray-700 text-left">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Símbolo</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Criado em</th>
                <th className="px-4 py-2">Data Início</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((instance) => (
                <tr key={instance.id} className="border-t border-gray-700">
                  <td className="px-4 py-2 whitespace-nowrap">{instance.id}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{instance.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{instance.symbol}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{instance.status === 2 ? 'Running' : 'Stopped'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(instance.created_at)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(instance.start_date)}</td>
                  <td className="px-4 py-2 flex gap-2 items-center">
                    {/* Configurar */}
                    <img
                      src="/icons/config.svg"
                      alt="Configurar"
                      title="Configurar"
                      className="w-5 h-5 cursor-pointer hover:opacity-80"
                      onClick={() => {
                        setFormState({
                          name: instance.name,
                          api_key: instance.api_key,
                          symbol: instance.strategies?.buy?.symbol || instance.strategies?.sell?.symbol || '',
                          strategy: instance.strategies?.buy?.id || instance.strategies?.sell?.id || '',
                          id: instance.id
                        });
                        setShowAddForm(true);
                      }}
                    />

                    {/* Iniciar */}
                    <img
                      src="/icons/play.svg"
                      alt="Iniciar"
                      title="Iniciar"
                      className={`w-5 h-5 ${instance.status === 1 ? 'cursor-pointer hover:opacity-80' : 'opacity-30'}`}
                      onClick={() => handleInstanceStatusChange(instance, 'start')}
                    />

                    <img
                      src="/icons/pause.svg"
                      alt="Parar"
                      title="Parar"
                      className={`w-5 h-5 ${instance.status === 2 ? 'cursor-pointer hover:opacity-80' : 'opacity-30'}`}
                      onClick={() => handleInstanceStatusChange(instance, 'stop')}
                    />

                    {/* Remover */}
                    <img
                      src="/icons/trash.svg"
                      alt="Remover"
                      title="Remover"
                      className={`w-5 h-5 ${instance.status === 1 ? 'cursor-pointer hover:opacity-80' : 'opacity-30'}`}
                      onClick={() => {
                        if (instance.status !== 1) return;
                        setInstanceToDelete(instance);
                        setConfirmDeleteOpen(true);
                      }}
                      
                    />
                  </td>
                </tr>
              ))}
              {confirmDeleteOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                  <div className="bg-gray-900 p-6 rounded-lg shadow-md text-center max-w-sm w-full">
                    <h3 className="text-xl font-semibold text-white mb-4">Confirmar Exclusão</h3>
                    <p className="text-white mb-2">Tem certeza que deseja deletar a instância:</p>
                    <p className="text-red-400 font-bold truncate">ID: {instanceToDelete?.id || '--'}</p>
                    <p className="text-gray-400 text-sm mb-4 italic truncate">
                      {instanceToDelete?.name || '(sem nome)'}
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={handleDeleteInstance}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteOpen(false)}
                        className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadingDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <p className="text-white text-xl">Excluindo instância...</p>
                </div>
              )}

              {loadingSave && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                  <p className="text-white text-xl">Salvando instância...</p>
                </div>
              )}

              {loadingStatusChange && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                  <div className="bg-gray-900 px-8 py-6 rounded-lg shadow-lg text-white text-xl text-center">
                    {statusMessage}
                  </div>
                </div>
              )}

            </tbody>
          </table>
        </div>

      )}
    </div>

    
  );
  
}

export default InstancesPage;
