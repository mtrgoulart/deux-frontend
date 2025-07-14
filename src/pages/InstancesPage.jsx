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
                  <td className="px-4 py-2 whitespace-nowrap">{instance.status === 2 ? 'Running' : 'Stopped'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(instance.created_at)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(instance.start_date)}</td>
                  <td className="px-4 py-2 flex gap-2 items-center">
                    <img
                      src="/icons/config.svg"
                      alt="Configurar"
                      title="Configurar"
                      className="w-5 h-5 cursor-pointer hover:opacity-80"
                      onClick={() => handleEdit(instance)}
                    />
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
