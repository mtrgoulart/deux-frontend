import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

function SharingPage() {
  const queryClient = useQueryClient();

  const { data: sharedInstances = [], isLoading } = useQuery({
    queryKey: ['shared_instances'],
    queryFn: async () => {
      const res = await apiFetch('/get_sharing_instances');
      const data = await res.json();
      return data.instances || [];
    }
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['user_apikeys'],
    queryFn: async () => {
      const res = await apiFetch('/get_user_apikeys');
      const data = await res.json();
      return data.user_apikeys || [];
    }
  });
  const { data: userInstances = [] } = useQuery({
      queryKey: ['instances'],
      queryFn: async () => {
        const res = await apiFetch('/get_instances?api_key_id=all'); // adapte conforme necessário
        const json = await res.json();
        return json.instances || [];
      },
    });

  const [formState, setFormState] = useState({
    api_key: '',
    perc_balance_operation: '',
  });
  const [confirmSubscribe, setConfirmSubscribe] = useState(null);
  const [loadingSubscribe, setLoadingSubscribe] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState('');

  const [showAddSharingForm, setShowAddSharingForm] = useState(false);
  const [newSharingForm, setNewSharingForm] = useState({ name: '', instance_id: '' });
  const [loadingSharingSave, setLoadingSharingSave] = useState(false);
  const [sharingSaveMessage, setSharingSaveMessage] = useState('');

  const handleSaveSharingInstance = async () => {
    setLoadingSharingSave(true);
    setSharingSaveMessage('');

    try {
      const res = await apiFetch('/save_sharing_instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSharingForm)
      });

      if (res.ok) {
        setSharingSaveMessage('✅ Compartilhamento criado com sucesso!');
        setTimeout(() => {
          setShowAddSharingForm(false);
          setNewSharingForm({ name: '', instance_id: '' });
          queryClient.invalidateQueries(['shared_instances']);
          setSharingSaveMessage('');
        }, 2000);
      } else {
        setSharingSaveMessage('❌ Erro ao salvar compartilhamento.');
      }
    } catch (err) {
      setSharingSaveMessage('❌ Erro na requisição.');
    } finally {
      setLoadingSharingSave(false);
    }
  };

  const handleSubscribe = async () => {
    if (!confirmSubscribe || !formState.api_key || !formState.perc_balance_operation) return;
    setLoadingSubscribe(true);
    setSubscribeMessage('');

    try {
      const res = await apiFetch('/subscribe_instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sharing_id: confirmSubscribe.id,
          api_key: formState.api_key,
          perc_balance_operation: parseFloat(formState.perc_balance_operation) / 100,
          active: true
        })
      });

      if (res.ok) {
        setSubscribeMessage('✅ Inscrição feita com sucesso!');
        setTimeout(() => {
          setConfirmSubscribe(null);
          setFormState({ api_key: '', perc_balance_operation: '' });
          setSubscribeMessage('');
        }, 2000);
      } else {
        setSubscribeMessage('❌ Erro ao realizar a inscrição.');
      }
    } catch (err) {
      setSubscribeMessage('❌ Erro na requisição.');
    } finally {
      setLoadingSubscribe(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Instâncias Compartilhadas</h2>
        <button
          onClick={() => setShowAddSharingForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Adicionar Compartilhamento
        </button>
      </div>

      {isLoading ? (
        <p>Carregando instâncias...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto bg-gray-800 rounded text-sm">
            <thead>
              <tr className="bg-gray-700 text-left">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Símbolo</th>
                <th className="px-4 py-2">Criador</th>
                <th className="px-4 py-2">Inscritos</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sharedInstances.map((instance) => (
                <tr key={instance.id} className="border-t border-gray-700">
                  <td className="px-4 py-2 whitespace-nowrap">{instance.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{instance.symbol}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{instance.creator}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{instance.subscribers}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setConfirmSubscribe(instance)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    >
                      Inscrever-se
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddSharingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Compartilhar Instância</h3>
            <div className="text-left space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Nome para Compartilhamento</label>
                <input
                  type="text"
                  value={newSharingForm.name}
                  onChange={(e) => setNewSharingForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Instância</label>
                <select
                  value={newSharingForm.instance_id}
                  onChange={(e) => setNewSharingForm(prev => ({ ...prev, instance_id: e.target.value }))}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  <option value="">Selecione sua instância</option>
                  {userInstances.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name} - {inst.symbol}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleSaveSharingInstance}
                disabled={loadingSharingSave}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
              >
                {loadingSharingSave ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setShowAddSharingForm(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
              >
                Cancelar
              </button>
            </div>
            {sharingSaveMessage && <p className="mt-4 text-white">{sharingSaveMessage}</p>}
          </div>
        </div>
      )}

      {confirmSubscribe && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Formulário de Inscrição</h3>
            <p className="text-white mb-2">Instância: <strong>{confirmSubscribe.name}</strong> ({confirmSubscribe.symbol})</p>
            <div className="text-left space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">API Key</label>
                <select
                  value={formState.api_key}
                  onChange={(e) => setFormState(prev => ({ ...prev, api_key: e.target.value }))}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  <option value="">Selecione a API Key</option>
                  {apiKeys.map(key => (
                    <option key={key.api_key_id} value={key.api_key_id}>{key.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">% do Saldo para Operações</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formState.perc_balance_operation}
                  onChange={(e) => setFormState(prev => ({ ...prev, perc_balance_operation: e.target.value }))}
                  placeholder="Ex: 20%"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                />
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleSubscribe}
                disabled={loadingSubscribe}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
              >
                {loadingSubscribe ? 'Inscrevendo...' : 'Confirmar'}
              </button>
              <button
                onClick={() => {
                  setConfirmSubscribe(null);
                  setFormState({ api_key: '', perc_balance_operation: '' });
                }}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
              >
                Cancelar
              </button>
            </div>
            {subscribeMessage && <p className="mt-4 text-white">{subscribeMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default SharingPage;