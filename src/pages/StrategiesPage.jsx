import { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function StrategiesPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [symbols, setSymbols] = useState([]);
  const [newStrategy, setNewStrategy] = useState({
    api_key_id: '', symbol: '', type: '', strategy: '', delay: '', conditionals: '', name: '',
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api_keys'],
    queryFn: async () => {
      const res = await apiFetch('/get_user_apikeys');
      return res.json().then(data => data.user_apikeys);
    }
  });

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const res = await apiFetch('/get_strategies');
      return res.json().then(data => data.strategies);
    }
  });

  const saveStrategyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/save_strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStrategy),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['strategies']);
      handleCancelAdd();
    }
  });

  const removeStrategyMutation = useMutation({
    mutationFn: async (strategy_id) => {
      await apiFetch('/remove_strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy_id })
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['strategies'])
  });

  const fetchSymbols = async (apiKeyId) => {
    try {
      const res = await apiFetch(`/get_symbols?api_key_id=${apiKeyId}`);
      const data = await res.json();
      setSymbols(data.symbols || []);
    } catch (err) {
      console.error('Erro ao carregar símbolos:', err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewStrategy(prev => ({ ...prev, [name]: value }));
    if (name === 'api_key_id') fetchSymbols(value);
  };

  const handleAddStrategy = () => setShowAddForm(true);
  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewStrategy({ api_key_id: '', symbol: '', type: '', strategy: '', delay: '', conditionals: '', name: '' });
    setSymbols([]);
  };

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Estratégias</h2>
        <button onClick={handleAddStrategy} className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded">
          Adicionar Estratégia
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-700 p-4 mb-6 rounded">
          <h3 className="text-xl mb-4">Nova Estratégia</h3>
          <div className="grid grid-cols-2 gap-4">
            <input name="name" value={newStrategy.name} onChange={handleFormChange} placeholder="Nome" className="p-2 rounded bg-gray-800 text-white" />
            <select name="api_key_id" value={newStrategy.api_key_id} onChange={handleFormChange} className="p-2 rounded bg-gray-800 text-white">
              <option value="">Selecione a API Key</option>
              {apiKeys.map(key => (
                <option key={key.api_key_id} value={key.api_key_id}>{key.name}</option>
              ))}
            </select>
            <select name="symbol" value={newStrategy.symbol} onChange={handleFormChange} className="p-2 rounded bg-gray-800 text-white">
              <option value="">Selecione o Símbolo</option>
              {symbols.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
            <input name="type" value={newStrategy.type} onChange={handleFormChange} placeholder="Tipo (buy/sell)" className="p-2 rounded bg-gray-800 text-white" />
            <input name="strategy" value={newStrategy.strategy} onChange={handleFormChange} placeholder="Estratégia" className="p-2 rounded bg-gray-800 text-white" />
            <input name="delay" value={newStrategy.delay} onChange={handleFormChange} placeholder="Delay (segundos)" className="p-2 rounded bg-gray-800 text-white" />
            <input name="conditionals" value={newStrategy.conditionals} onChange={handleFormChange} placeholder="Condicionais" className="p-2 rounded bg-gray-800 text-white" />
          </div>
          <div className="flex justify-end mt-4 gap-4">
            <button onClick={() => saveStrategyMutation.mutate()} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">Salvar</button>
            <button onClick={handleCancelAdd} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p>Carregando estratégias...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto bg-gray-800 rounded">
            <thead>
              <tr className="bg-gray-700 text-left">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Símbolo</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map(strategy => (
                <tr key={strategy.strategy_id} className="border-t border-gray-700">
                  <td className="px-4 py-2">{strategy.strategy_id}</td>
                  <td className="px-4 py-2">{strategy.symbol}</td>
                  <td className="px-4 py-2">{strategy.buy ? 'buy' : strategy.sell ? 'sell' : '-'}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button onClick={() => alert('Configurar')} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">Configurar</button>
                    <button onClick={() => removeStrategyMutation.mutate(strategy.strategy_id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">Remover</button>
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

export default StrategiesPage;