import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import CorrectedInstanceCreation from '../components/CorrectedInstanceCreation';

function InstancesPage() {
  const queryClient = useQueryClient();
  const [selectedApiKey, setSelectedApiKey] = useState(localStorage.getItem('selectedApiKey') || '');
  const [showAddForm, setShowAddForm] = useState(false);
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      1: { text: 'Parado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      2: { text: 'Executando', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      3: { text: 'Pausado', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    };
    
    const config = statusConfig[status] || { text: 'Desconhecido', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const onInstanceCreated = () => {
    queryClient.invalidateQueries(['instances', selectedApiKey]);
    setShowAddForm(false);
  };

  return (
    <div className="p-6 text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Trading Instances</h2>
          <p className="text-gray-400">Manage your automated trading bots</p>
        </div>
        
        {statusMessage && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
            <p className="text-sm">{statusMessage}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select API Key
          </label>
          <select
            value={selectedApiKey}
            onChange={(e) => {
              setSelectedApiKey(e.target.value);
              localStorage.setItem('selectedApiKey', e.target.value);
            }}
            className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-w-64"
          >
            <option value="">Select an API Key</option>
            {apiKeys.map(key => (
              <option key={key.api_key_id} value={key.api_key_id}>
                ({key.api_key_id}) {key.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-shrink-0 mt-7">
          <button 
            onClick={() => setShowAddForm(true)} 
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create Instance</span>
          </button>
        </div>
      </div>

      {/* Instances List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-3 text-gray-400">Loading instances...</span>
        </div>
      ) : instances.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 text-gray-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No instances found</h3>
          <p className="text-gray-500 mb-6">
            {selectedApiKey ? 'No trading instances for this API key.' : 'Select an API key to view instances.'}
          </p>
          {selectedApiKey && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Create Your First Instance
            </button>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Instance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Update
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {instances.map((instance) => (
                  <tr key={instance.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {instance.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {instance.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            ID: {instance.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{instance.symbol}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(instance.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(instance.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(instance.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {instance.status === 1 && (
                          <button
                            onClick={() => handleInstanceStatusChange(instance, 'start')}
                            disabled={loadingStatusChange}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {instance.status === 2 && (
                          <button
                            onClick={() => handleInstanceStatusChange(instance, 'stop')}
                            disabled={loadingStatusChange}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Stop
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setInstanceToDelete(instance);
                            setConfirmDeleteOpen(true);
                          }}
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded text-sm transition-colors border border-red-600/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Corrected Instance Creation Modal */}
      <CorrectedInstanceCreation
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
        onInstanceCreated={onInstanceCreated}
      />

      {/* Delete Confirmation Modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-white">Confirm Delete</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the instance "{instanceToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  setInstanceToDelete(null);
                }}
                disabled={loadingDelete}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInstance}
                disabled={loadingDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded transition-colors flex items-center space-x-2"
              >
                {loadingDelete ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstancesPage;
