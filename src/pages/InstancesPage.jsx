import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

function InstancesPage() {
  const queryClient = useQueryClient();
  const [selectedApiKey, setSelectedApiKey] = useState(localStorage.getItem('selectedApiKey') || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formState, setFormState] = useState({ name: '', api_key: '', symbol: '', strategy: '' });
  const [symbolSuggestions, setSymbolSuggestions] = useState([]);
  const [symbolSearchTimeout, setSymbolSearchTimeout] = useState(null);
  const [isSearchingSymbols, setIsSearchingSymbols] = useState(false);

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
  


  const { data: strategies = [] } = useQuery({
    queryKey: ['user_strategies'],
    queryFn: async () => {
      const res = await apiFetch('/get_strategies');
      const data = await res.json();
      return data.strategies || [];
    }
  });

  const { data: symbols = [] } = useQuery({
    queryKey: ['symbols', formState.api_key],
    queryFn: async () => {
      if (!formState.api_key) return [];
      const res = await apiFetch(`/get_symbols_by_api?id=${formState.api_key}`);
      const data = await res.json();
      return data.symbols || [];
    },
    enabled: !!formState.api_key,
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
      const route = formState.id ? '/update_instance' : '/save_instance';
      const res = await apiFetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instances', selectedApiKey]);
      setShowAddForm(false);
      setFormState({ name: '', api_key: '', symbol: '', strategy: '' });
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

              <select
                name="strategy"
                value={formState.strategy}
                onChange={(e) => setFormState(prev => ({ ...prev, strategy: e.target.value }))}
                className="w-full p-2 rounded bg-gray-700 text-white"
              >
                <option value="">Selecione a Estratégia</option>
                {strategies.map(s => (
                  <option key={s.strategy_id} value={s.strategy_id}>{s.strategy_id} - {s.symbol}</option>
                ))}
              </select>

              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormState({ name: '', api_key: '', symbol: '', strategy: '' });
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => mutation.mutate()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
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
                  <td className="px-4 py-2 whitespace-nowrap">{instance.strategies?.buy?.symbol || instance.strategies?.sell?.symbol || '-'}</td>
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
                          strategy: instance.strategies?.buy?.strategy_id || instance.strategies?.sell?.strategy_id || '',
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
                      onClick={async () => {
                        if (instance.status !== 1) return;
                        await apiFetch('/start_instance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ instance_id: instance.id })
                        });
                        queryClient.invalidateQueries(['instances', selectedApiKey]);
                      }}
                    />

                    {/* Parar */}
                    <img
                      src="/icons/pause.svg"
                      alt="Parar"
                      title="Parar"
                      className={`w-5 h-5 ${instance.status === 2 ? 'cursor-pointer hover:opacity-80' : 'opacity-30'}`}
                      onClick={async () => {
                        if (instance.status !== 2) return;
                        await apiFetch('/stop_instance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ instance_id: instance.id })
                        });
                        queryClient.invalidateQueries(['instances', selectedApiKey]);
                      }}
                    />

                    {/* Remover */}
                    <img
                      src="/icons/trash.svg"
                      alt="Remover"
                      title="Remover"
                      className={`w-5 h-5 ${instance.status === 1 ? 'cursor-pointer hover:opacity-80' : 'opacity-30'}`}
                      onClick={async () => {
                        if (instance.status !== 1) return;
                        const confirm = window.confirm(`Tem certeza que deseja remover a instância "${instance.name}"?`);
                        if (!confirm) return;
                        await apiFetch('/remove_instance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ instance_id: instance.id })
                        });
                        queryClient.invalidateQueries(['instances', selectedApiKey]);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InstancesPage;
