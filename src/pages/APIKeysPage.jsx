import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    exchange_id: '',
    api_key: '',
    secret_key: '',
    passphrase: '',
  });

  const {
    data: apiKeys,
    isLoading: loadingApiKeys,
  } = useQuery({
    queryKey: ['user_apikeys'],
    queryFn: async () => {
      const response = await apiFetch(`/get_user_apikeys`);
      const data = await response.json();
      return data.user_apikeys || [];
    },
  });

  const {
    data: exchanges,
    isLoading: loadingExchanges,
  } = useQuery({
    queryKey: ['exchanges'],
    queryFn: async () => {
      const response = await apiFetch(`/get_exchanges`);
      const data = await response.json();
      return data.exchanges || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return await apiFetch(`/save_user_apikey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          exchange_id: formData.exchange_id,
          api_credentials: {
            api_key: formData.api_key,
            secret_key: formData.secret_key,
            passphrase: formData.passphrase,
          },
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user_apikeys']);
      setShowAddForm(false);
      setFormData({ name: '', exchange_id: '', api_key: '', secret_key: '', passphrase: '' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (api_key_id) => {
      return await apiFetch(`/remove_user_apikey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key_id }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['user_apikeys']),
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">API Keys</h2>
        <button onClick={() => setShowAddForm(true)} className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded">Adicionar API Key</button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-gray-700 p-4 mb-6 rounded grid grid-cols-2 gap-4">
          <input name="name" value={formData.name} onChange={handleFormChange} placeholder="Nome" className="p-2 rounded bg-gray-800 text-white" required />
          <select name="exchange_id" value={formData.exchange_id} onChange={handleFormChange} className="p-2 rounded bg-gray-800 text-white" required>
            <option value="">Selecione a exchange</option>
            {exchanges?.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          <input name="api_key" value={formData.api_key} onChange={handleFormChange} placeholder="API Key" className="p-2 rounded bg-gray-800 text-white" required />
          <input name="secret_key" value={formData.secret_key} onChange={handleFormChange} placeholder="Secret Key" className="p-2 rounded bg-gray-800 text-white" required />
          <input name="passphrase" value={formData.passphrase} onChange={handleFormChange} placeholder="Passphrase" className="p-2 rounded bg-gray-800 text-white" required />
          <div className="col-span-2 flex justify-end gap-4">
            <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">Salvar</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      {loadingApiKeys ? <p>Carregando API Keys...</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto bg-gray-800 rounded">
            <thead>
              <tr className="bg-gray-700 text-left">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Exchange</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys?.map((key) => (
                <tr key={key.api_key_id} className="border-t border-gray-700">
                  <td className="px-4 py-2">{key.api_key_id}</td>
                  <td className="px-4 py-2">{key.name || key.api_credentials?.api_key}</td>
                  <td className="px-4 py-2">{key.exchange_name}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removeMutation.mutate(key.api_key_id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                    >
                      Remover
                    </button>
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

export default ApiKeysPage;