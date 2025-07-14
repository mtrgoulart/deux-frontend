import { useState, useMemo } from 'react';
import { apiFetch } from '../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

function StrategiesPage() {
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortField, setSortField] = useState(localStorage.getItem('strategySortField') || 'name');
  const [sortDirection, setSortDirection] = useState(localStorage.getItem('strategySortDirection') || 'asc');
  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const res = await apiFetch('/get_strategies');
      return res.json().then(data => data.strategies);
    }
  });

  const sortedStrategies = useMemo(() => {
    const sorted = [...strategies];
    if (sortField) {
      sorted.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
  
        if (!valA || !valB) return 0;
  
        // Se for campo de data, converte para Date para comparar corretamente
        if (sortField === 'created_at' || sortField === 'updated_at') {
          const dateA = new Date(valA);
          const dateB = new Date(valB);
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
  
        // Se for string
        if (typeof valA === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
  
        // Se for número
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
    }
    return sorted;
  }, [strategies, sortField, sortDirection]);

  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!newStrategy.name) errors.name = 'Campo obrigatório';
    if (!newStrategy.side) errors.side = 'Campo obrigatório';
    if (!newStrategy.percent) errors.percent = 'Campo obrigatório';
    if (!newStrategy.condition_limit) errors.condition_limit = 'Campo obrigatório';
    if (!newStrategy.interval) errors.interval = 'Campo obrigatório';
    if (!newStrategy.simultaneous_operations) errors.simultaneous_operations = 'Campo obrigatório';
    if (!newStrategy.tp) errors.tp = 'Campo obrigatório';
    if (!newStrategy.sl) errors.sl = 'Campo obrigatório';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const emptyStrategy = {
    id: '',
    name: '',
    side: '',
    delay: '',
    conditionals: '',
    strategy: uuidv4(),
    percent: '',
    condition_limit: '',
    interval: '',
    simultaneous_operations: '',
    tp: '',
    sl: '',
    status: '',
  };

  const [strategyToDelete, setStrategyToDelete] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const confirmDelete = (strategy) => {
    setStrategyToDelete(strategy);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteStrategy = async () => {
    if (!strategyToDelete?.id) return;
  
    try {
      setConfirmDeleteOpen(false);     // fecha modal imediatamente
      setLoadingStrategy(true);        // ativa o loading
  
      const res = await apiFetch('/delete_strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: strategyToDelete.id }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        await queryClient.invalidateQueries(['strategies']);
      } else {
        alert(data.error || 'Erro ao deletar a estratégia.');
      }
    } catch (err) {
      console.error('Erro ao deletar estratégia:', err);
      alert('Erro ao deletar a estratégia.');
    } finally {
      setStrategyToDelete(null);     // limpa estado
      setLoadingStrategy(false);     // desativa o loading
    }
  };

  const [newStrategy, setNewStrategy] = useState(emptyStrategy);
  const [editingStrategy, setEditingStrategy] = useState(null);

  const saveStrategyMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) return;
      const payload = {
        ...newStrategy,
        percent: newStrategy.percent / 100,
        tp: newStrategy.tp / 100,
        sl: newStrategy.sl / 100,
      };
      const res = await apiFetch('/save_strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['strategies']);
      handleCancelAdd();
    }
  });

  const removeStrategyMutation = useMutation({
    mutationFn: async (strategy) => {
      await apiFetch('/delete_strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy_id: strategy.id }),
      });
    },
    onSuccess: (_, strategy) => {
      queryClient.setQueryData(['strategies'], (oldData = []) =>
        oldData.filter(s => s.id !== strategy.id)
      );
    }
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewStrategy(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStrategy = () => {
    setNewStrategy({
      name: '',
      side: '',
      delay: '',
      conditionals: '',
      strategy: uuidv4(),
    });
    setShowAddForm(true);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewStrategy({ side: '', strategy: '', delay: '', conditionals: '', name: '' });
  };

  const handleConfigureStrategy = async (strategy_id) => {
    try {
      setLoadingStrategy(true);
      const res = await apiFetch(`/get_strategy_parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: strategy_id }),
      });
  
      const data = await res.json();
      if (res.ok) {
        setEditingStrategy(data);
      } else {
        alert(data.error || 'Erro ao buscar dados da estratégia.');
      }
    } catch (err) {
      console.error('Erro ao configurar:', err);
      alert('Erro ao configurar a estratégia.');
    } finally {
      setLoadingStrategy(false);
    }
  };

  const handleSaveStrategy = async () => {
    setLoadingStrategy(true); // ativa o loading imediatamente
  
    try {
      const res = await apiFetch('/save_strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStrategy),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        await queryClient.invalidateQueries(['strategies']);
        handleCancelAdd(); // fecha o formulário
      } else {
        alert(data.error || 'Erro ao salvar a estratégia.');
      }
    } catch (err) {
      console.error('Erro ao salvar estratégia:', err);
      alert('Erro ao salvar a estratégia.');
    } finally {
      setLoadingStrategy(false); // desativa o loading
    }
  };


  const handleSaveEdit = async () => {
    try {
      const payload = {
        ...editingStrategy,
        strategy_id: editingStrategy.strategy_uuid,
      };
  
      const res = await apiFetch('/update_strategy_parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingStrategy,
          strategy_id: editingStrategy.strategy_uuid,
          id: editingStrategy.id 
        }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        queryClient.invalidateQueries(['strategies']);
        setEditingStrategy(null);
      } else {
        alert(data.error || 'Erro ao salvar a estratégia.');
      }
    } catch (err) {
      console.error('Erro ao salvar edição:', err);
      alert('Erro ao salvar a estratégia.');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
      localStorage.setItem('strategySortDirection', newDirection);
    } else {
      setSortField(field);
      setSortDirection('asc');
      localStorage.setItem('strategySortField', field);
      localStorage.setItem('strategySortDirection', 'asc');
    }
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
          <div>
            <label className="text-sm text-gray-300">Nome</label>
            <input
              name="name"
              value={newStrategy.name}
              onChange={handleFormChange}
              placeholder="Nome"
              className={`w-full p-2 rounded bg-gray-800 text-white ${formErrors.name ? 'border border-red-500' : ''}`}
            />
            {formErrors.name && <p className="text-red-400 text-sm">{formErrors.name}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-300">Lado</label>
            <select
              name="side"
              value={newStrategy.side}
              onChange={handleFormChange}
              className={`w-full p-2 rounded bg-gray-800 text-white ${formErrors.side ? 'border border-red-500' : ''}`}
            >
              <option value="">Selecione o Lado</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            {formErrors.side && <p className="text-red-400 text-sm">{formErrors.side}</p>}
          </div>

          <div className="col-span-2">
            <label className="text-sm text-gray-300">UUID</label>
            <input
              name="strategy"
              value={newStrategy.strategy}
              readOnly
              className="w-full p-2 rounded bg-gray-800 text-white opacity-50 cursor-not-allowed"
              placeholder="UUID da Estratégia"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Percentual (%)</label>
            <input
              name="percent"
              type="number"
              value={newStrategy.percent !== '' ? Number(newStrategy.percent) * 100 : ''}
              onChange={(e) => {
                let input = parseFloat(e.target.value);
                if (isNaN(input)) input = '';
                else if (input > 100) input = 100;
                else if (input < 0) input = 0;
                setNewStrategy(prev => ({
                  ...prev,
                  percent: input === '' ? '' : input / 100
                }));
              }}
              placeholder="Percentual"
              className={`w-full p-2 rounded bg-gray-800 text-white ${formErrors.percent ? 'border border-red-500' : ''}`}
            />
            {formErrors.percent && <p className="text-red-400 text-sm">{formErrors.percent}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-300">Limite de Condição</label>
            <input
              name="condition_limit"
              type="number"
              value={newStrategy.condition_limit}
              onChange={(e) => {
                let value = parseFloat(e.target.value);
                if (isNaN(value)) value = '';
                else if (value > 100) value = 100;
                else if (value < 0) value = 0;
                setNewStrategy(prev => ({ ...prev, condition_limit: value }));
              }}
              className={`w-full p-2 rounded bg-gray-800 text-white ${formErrors.condition_limit ? 'border border-red-500' : ''}`}
            />
            {formErrors.condition_limit && <p className="text-red-400 text-sm">{formErrors.condition_limit}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-300">Intervalo (min)</label>
            <input
              name="interval"
              type="number"
              value={newStrategy.interval}
              onChange={(e) => {
                let value = parseFloat(e.target.value);
                if (isNaN(value) || value < 0) value = '';
                setNewStrategy(prev => ({ ...prev, interval: value }));
              }}
              className={`w-full p-2 rounded bg-gray-800 text-white ${formErrors.interval ? 'border border-red-500' : ''}`}
            />
            {formErrors.interval && <p className="text-red-400 text-sm">{formErrors.interval}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-300">Ops Simultâneas</label>
            <input
              name="simultaneous_operations"
              type="number"
              value={newStrategy.simultaneous_operations}
              onChange={(e) => {
                let value = parseFloat(e.target.value);
                if (isNaN(value)) value = '';
                else if (value > 100) value = 100;
                else if (value < 0) value = 0;
                setNewStrategy(prev => ({ ...prev, simultaneous_operations: value }));
              }}
              className={`w-full p-2 rounded bg-gray-800 text-white ${formErrors.simultaneous_operations ? 'border border-red-500' : ''}`}
            />
            {formErrors.simultaneous_operations && <p className="text-red-400 text-sm">{formErrors.simultaneous_operations}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-300">Take Profit %</label>
            <input
              name="tp"
              type="number"
              value={newStrategy.tp}
              onChange={(e) => {
                let value = parseFloat(e.target.value);
                if (isNaN(value)) value = '';
                else if (value > 100) value = 100;
                else if (value < 0) value = 0;
                setNewStrategy(prev => ({ ...prev, tp: value }));
              }}
              className={`w-full p-2 rounded bg-gray-800 text-white ${formErrors.tp ? 'border border-red-500' : ''}`}
            />
            {formErrors.tp && <p className="text-red-400 text-sm">{formErrors.tp}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-300">Stop Loss %</label>
            <input
              name="sl"
              type="number"
              value={newStrategy.sl}
              onChange={(e) => {
                let value = parseFloat(e.target.value);
                if (isNaN(value)) value = '';
                else if (value > 100) value = 100;
                else if (value < 0) value = 0;
                setNewStrategy(prev => ({ ...prev, sl: value }));
              }}
              className={`w-full p-2 rounded bg-gray-800 text-white ${formErrors.sl ? 'border border-red-500' : ''}`}
            />
            {formErrors.sl && <p className="text-red-400 text-sm">{formErrors.sl}</p>}
          </div>
          </div>
          <div className="flex justify-end mt-6 gap-4">
          <button onClick={handleSaveStrategy} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">Salvar</button>
            <button onClick={handleCancelAdd} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              Cancelar
            </button>
          </div>
        </div>
      )}


      {loadingStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <p className="text-white text-xl">Carregando dados da estratégia...</p>
        </div>
      )}

      {editingStrategy && !loadingStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto shadow-lg">
            <h3 className="text-2xl font-semibold mb-6 text-white">Editar Estratégia</h3>
            <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-sm text-gray-300">Nome</label>
                <input
                  name="name"
                  value={editingStrategy.name || ''}
                  onChange={(e) => setEditingStrategy({ ...editingStrategy, name: e.target.value })}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Lado</label>
                <select name="side" value={editingStrategy.side || ''}
                  onChange={(e) => setEditingStrategy({ ...editingStrategy, side: e.target.value })}
                  className="w-full p-2 rounded bg-gray-700 text-white">
                  <option value="">Selecione o Lado</option>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300">UUID</label>
                <input readOnly value={editingStrategy.strategy_uuid}
                  className="w-full p-2 rounded bg-gray-700 text-white opacity-50 cursor-not-allowed" />
              </div>
              {[
                ['percent', 'Percentual (%)'],
                ['condition_limit', 'Limite de Condição'],
                ['interval', 'Intervalo (seg)'],
                ['simultaneous_operations', 'Ops Simultâneas'],
                ['tp', 'Take Profit %'],
                ['sl', 'Stop Loss %']
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="text-sm text-gray-300">{label}</label>
                  <input type="number" name={field} value={editingStrategy[field] || ''}
                    onChange={(e) => setEditingStrategy({ ...editingStrategy, [field]: e.target.value })}
                    className="w-full p-2 rounded bg-gray-700 text-white" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={handleSaveEdit}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded"
            >
              Salvar Edição
            </button>
              <button
                onClick={() => setEditingStrategy(null)}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p>Carregando estratégias...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto bg-gray-800 rounded">
          <thead className="bg-gray-700 text-left">
            <tr>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('id')}>
                ID {renderSortIcon('id')}
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('name')}>
                Nome {renderSortIcon('name')}
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('side')}>
                Lado {renderSortIcon('side')}
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('created_at')}>
                Criado em {renderSortIcon('created_at')}
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('updated_at')}>
                Alterado em {renderSortIcon('updated_at')}
              </th>
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedStrategies.map(strategy => (
              <tr key={strategy.id} className="border-t border-gray-700">
                 <td className="px-4 py-2">{strategy.id}</td>
                <td className="px-4 py-2">{strategy.name}</td>
                <td className="px-4 py-2">{strategy.side}</td>
                <td className="px-4 py-2">{new Date(strategy.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">{new Date(strategy.updated_at).toLocaleString()}</td>
                <td className="px-4 py-2">
  <div className="flex gap-4">
    <button
      onClick={() => handleConfigureStrategy(strategy.id)}
      className="hover:opacity-80"
      title="Configurar"
    >
      <img src="/icons/config.svg" alt="Configurar" className="w-6 h-6" />
    </button>
    <button
      onClick={() => confirmDelete(strategy)}
      className="hover:opacity-80"
      title="Remover"
    >
      <img src="/icons/trash.svg" alt="Remover" className="w-6 h-6" />
    </button>
  </div>
</td>

              </tr>
            ))}
          </tbody>
          </table>
          {confirmDeleteOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-lg shadow-md text-center max-w-sm w-full">
                <h3 className="text-xl font-semibold text-white mb-4">Confirmar Exclusão</h3>
                <p className="text-white mb-2">Tem certeza que deseja deletar a estratégia:</p>
                <p className="text-red-400 font-bold truncate">ID: {strategyToDelete?.id || '--'}</p>
                <p className="text-gray-400 text-sm mb-4 italic truncate">
                  {strategyToDelete?.name || '(sem nome)'}
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleDeleteStrategy}
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

        </div>

        
      )}
    </div>
  );
}

export default StrategiesPage;