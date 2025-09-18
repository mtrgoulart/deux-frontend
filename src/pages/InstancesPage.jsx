import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import InstanceCreationForm from '../components/InstanceCreationForm';

function InstancesPage() {
  const queryClient = useQueryClient();
  const [selectedApiKey, setSelectedApiKey] = useState(localStorage.getItem('selectedApiKey') || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editInstanceData, setEditInstanceData] = useState(null);
  const [loadingStatusChange, setLoadingStatusChange] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [instanceToDelete, setInstanceToDelete] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [operationModalOpen, setOperationModalOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null); // Guarda { instance, side }
  const [operationPercent, setOperationPercent] = useState('100');
  const [isSubmittingOperation, setIsSubmittingOperation] = useState(false);

  const handleInstanceStatusChange = async (instance, action) => {
    if (
      (action === 'start' && instance.status !== 1) ||
      (action === 'stop' && instance.status !== 2)
    ) return;
  
    setLoadingStatusChange(true);
    setStatusMessage(action === 'start' ? 'Starting strategy...' : 'Stoping strategy...');
  
    try {
      await apiFetch(`/${action}_instance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: instance.id })
      });
  
      setStatusMessage(action === 'start' ? '✅ Strategy sucessfully started' : '🛑 Strategy sucessfully stoped');
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

  const handleOpenOperationModal = (instance, side) => {
    // Apenas permite operação manual se a instância estiver rodando
    if (instance.status !== 2) {
      alert("Operações manuais só podem ser executadas em estratégias no estado 'Running'.");
      return;
    }
    setCurrentOperation({ instance, side });
    setOperationPercent('100'); // Reseta para o valor padrão
    setOperationModalOpen(true);
  };

  // --- FUNÇÃO PARA ENVIAR A OPERAÇÃO MANUAL PARA A API ---
  const handleConfirmOperation = async () => {
    if (!currentOperation) return;

    const percent = parseFloat(operationPercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      alert("Por favor, insira um percentual válido (ex: de 1 a 100).");
      return;
    }

    setIsSubmittingOperation(true);
    try {
      const res = await apiFetch('/execute_operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: currentOperation.instance.id,
          side: currentOperation.side,
          symbol: currentOperation.instance.symbol, // O backend precisa do symbol
          perc_balance_operation: percent / 100, // Envia como decimal (ex: 50% -> 0.5)
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`✅ Ordem de ${currentOperation.side} enviada com sucesso! Task ID: ${data.task_id}`);
        setOperationModalOpen(false);
        setCurrentOperation(null);
      } else {
        alert(`❌ Erro ao enviar ordem: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Erro ao enviar operação manual:', err);
      alert('❌ Erro de comunicação ao enviar a ordem.');
    } finally {
      setIsSubmittingOperation(false);
    }
  };

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

  const handleEdit = (instance) => {
    setEditInstanceData({
      id: instance.id,
      name: instance.name,
      api_key: instance.api_key_id, // Corrigido para api_key_id, conforme seu backend
      symbol: instance.symbol,
      // Correção principal aqui: use os campos diretos da instância
      strategy_buy: instance.strategy_buy || '',
      strategy_sell: instance.strategy_sell || '',
      // Remova os campos _name, o formulário cuidará de buscá-los
    });
    setShowAddForm(true);
  };

  const handleAdd = () => {
    setEditInstanceData({
      name: '',
      api_key: selectedApiKey,
      symbol: '',
      strategy_buy: '',
      strategy_sell: '',
      status: 1
    });
    setShowAddForm(true);
  };

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Strategy</h2>
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

        <button onClick={handleAdd} className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded">
          Add Strategy
        </button>
      </div>

      {showAddForm && editInstanceData && <InstanceCreationForm 
        show={showAddForm}
        onClose={() => setShowAddForm(false)}
        apiKeys={apiKeys}
        initialData={editInstanceData}
        selectedApiKey={selectedApiKey}
      />}

      {isLoading ? (
        <p>Carregando instâncias...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto bg-gray-800 rounded text-sm">
            <thead>
              <tr className="bg-gray-700 text-left">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Symbol</th>
                <th className="px-4 py-2">Status</th>
                {/* --- NOVA COLUNA ADICIONADA --- */}
                <th className="px-4 py-2">Manual Operation</th>
                <th className="px-4 py-2">Created at</th>
                <th className="px-4 py-2">Start date</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {instances.map((instance) => (
                <tr key={instance.id} className="border-t border-gray-700">
                  <td className="px-4 py-2 whitespace-nowrap">{instance.id}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{instance.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{instance.symbol}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${instance.status === 2 ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
                      {instance.status === 2 ? 'Running' : 'Stopped'}
                    </span>
                  </td>
                  {/* --- NOVOS BOTÕES DE OPERAÇÃO MANUAL --- */}
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenOperationModal(instance, 'buy')}
                        disabled={instance.status !== 2}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs"
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => handleOpenOperationModal(instance, 'sell')}
                        disabled={instance.status !== 2}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs"
                      >
                        Sell
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(instance.created_at)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(instance.start_date)}</td>
                  <td className="px-4 py-2 flex gap-2 items-center">
                    {/* ... (ícones de ações existentes sem alterações) ... */}
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

              {operationModalOpen && currentOperation && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                  <div className="bg-gray-900 p-6 rounded-lg shadow-md text-left max-w-sm w-full">
                    <h3 className={`text-xl font-semibold mb-4 ${currentOperation.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      Manual {currentOperation.side === 'buy' ? 'Buy' : 'Sell'} Order
                    </h3>
                    <div className='mb-4'>
                      <p className="text-sm text-gray-400">Instance: <span className="font-bold text-white">{currentOperation.instance.name}</span></p>
                      <p className="text-sm text-gray-400">Symbol: <span className="font-bold text-white">{currentOperation.instance.symbol}</span></p>
                    </div>

                    <label htmlFor="operationPercent" className="block mb-2 text-sm font-medium text-white">
                      Percent of balance to use (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="operationPercent"
                        value={operationPercent}
                        onChange={(e) => setOperationPercent(e.target.value)}
                        className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
                        placeholder="Ex: 100"
                        min="1"
                        max="100"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">%</span>
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                      <button
                        onClick={() => setOperationModalOpen(false)}
                        disabled={isSubmittingOperation}
                        className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmOperation}
                        disabled={isSubmittingOperation}
                        className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-800 px-4 py-2 rounded text-white"
                      >
                        {isSubmittingOperation ? 'Sending...' : 'Confirm'}
                      </button>
                    </div>
                  </div>
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
