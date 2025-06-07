import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [extraParams, setExtraParams] = useState([]);
  const [message, setMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [deleteStatusMessage, setDeleteStatusMessage] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingKeyId, setEditingKeyId] = useState(null);

  const safePattern = /^[a-zA-Z0-9_-]+$/;

  const [formData, setFormData] = useState({
    name: '',
    exchange_id: '',
    api_key: '',
    secret_key: '',
  });

  const handleExtraParamChange = (index, key, value) => {
    setExtraParams((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const addExtraParam = () => {
    setExtraParams([...extraParams, { key: '', value: '' }]);
  };

  const removeExtraParam = (index) => {
    setExtraParams(extraParams.filter((_, i) => i !== index));
  };

  const { data: apiKeys, isLoading: loadingApiKeys } = useQuery({
    queryKey: ['user_apikeys'],
    queryFn: async () => {
      const response = await apiFetch(`/get_user_apikeys`);
      const data = await response.json();
      return data.user_apikeys || [];
    },
  });

  const { data: exchanges, isLoading: loadingExchanges } = useQuery({
    queryKey: ['exchanges'],
    queryFn: async () => {
      const response = await apiFetch(`/get_exchanges`);
      const data = await response.json();
      return data.exchanges || [];
    },
  });


  const editNameMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch('/edit_apikey_name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key_id: editingKeyId,
          name: formData.name,
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user_apikeys']);
      setShowEditForm(false);
      setEditingKeyId(null);
    },
    onError: () => {
      alert('Erro ao editar nome da API Key');
    }
  });

  const mutation = useMutation({
    mutationFn: async () => {
      setLoadingSave(true);
      const additional = Object.fromEntries(extraParams.map(p => [p.key, p.value]));
      return await apiFetch(`/save_user_apikey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          exchange_id: formData.exchange_id,
          api_credentials: {
            api_key: formData.api_key,
            secret_key: formData.secret_key,
            ...additional,
          },
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user_apikeys']);
      setMessage("Chave salva com sucesso.");
      setFormData({ name: '', exchange_id: '', api_key: '', secret_key: '' });
      setExtraParams([]);
      setShowAddForm(false);
      setLoadingSave(false);
    },
    onError: () => {
      setMessage("Erro ao salvar credenciais.");
      setLoadingSave(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (api_key_id) => {
      setLoadingDelete(true);
      setDeleteStatusMessage('Removendo chave...');
  
      const response = await apiFetch(`/remove_user_apikey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key_id }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }
  
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user_apikeys']);
      setDeleteStatusMessage('✅ Chave removida com sucesso!');
      setTimeout(() => {
        setLoadingDelete(false);
        setConfirmDeleteOpen(false);
        setKeyToDelete(null);
        setDeleteStatusMessage('');
      }, 2000);
    },
    onError: (error) => {
      const msg = error.message.includes('API Key em uso')
        ? '❌ Erro: API Key em uso'
        : `❌ ${error.message}`;
      setDeleteStatusMessage(msg);
      setTimeout(() => {
        setLoadingDelete(false);
        setDeleteStatusMessage('');
      }, 3000);
    }
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = "Campo obrigatório";
    if (!formData.exchange_id) errors.exchange_id = "Campo obrigatório";
    if (!formData.api_key.trim()) errors.api_key = "Campo obrigatório";
    if (!formData.secret_key.trim()) errors.secret_key = "Campo obrigatório";
    if (formData.api_key && !safePattern.test(formData.api_key)) errors.api_key = "Caracteres inválidos";
    if (formData.secret_key && !safePattern.test(formData.secret_key)) errors.secret_key = "Caracteres inválidos";
    extraParams.forEach((p, i) => {
      if (!p.key.trim() || !p.value.trim()) errors[`extra_${i}`] = "Preencha chave e valor";
      if (!safePattern.test(p.key) || !safePattern.test(p.value)) errors[`extra_${i}`] = "Use apenas letras, números, hífen ou underscore";
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setMessage('');
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

          <div className="col-span-2">
            <h3 className="mb-2 text-sm">Parâmetros Adicionais</h3>
            {extraParams.map((param, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input type="text" placeholder="Chave" value={param.key} onChange={(e) => handleExtraParamChange(index, 'key', e.target.value)} className="flex-1 p-2 rounded bg-gray-800 text-white" />
                <input type="text" placeholder="Valor" value={param.value} onChange={(e) => handleExtraParamChange(index, 'value', e.target.value)} className="flex-1 p-2 rounded bg-gray-800 text-white" />
                <button type="button" onClick={() => removeExtraParam(index)} className="bg-red-500 hover:bg-red-600 px-2 rounded">X</button>
              </div>
            ))}
            <button type="button" onClick={addExtraParam} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">+ Novo Parâmetro</button>
          </div>

          <div className="col-span-2 flex justify-end gap-4">
            <button type="submit" disabled={mutation.isLoading} className={`px-4 py-2 rounded ${mutation.isLoading ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'}`}>{mutation.isLoading ? 'Salvando...' : 'Salvar'}</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Cancelar</button>
          </div>

          {message && <div className="col-span-2 text-sm text-green-400 mt-2">{message}</div>}
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
  <div className="flex gap-2">
    <button
      onClick={() => {
        setFormData({
          name: key.name,
          exchange_id: key.exchange_id,
          api_key: key.api_credentials?.api_key,
          secret_key: key.api_credentials?.secret_key,
        });

        const extras = Object.entries(key.api_credentials || {})
          .filter(([k]) => !['api_key', 'secret_key'].includes(k))
          .map(([k, v]) => ({ key: k, value: v }));

        setExtraParams(extras);
        setShowEditForm(true);
        setEditingKeyId(key.api_key_id);
      }}
      className="hover:opacity-80"
      title="Configurar"
    >
      <img src="/icons/config.svg" alt="Configurar" className="w-7 h-7" />
    </button>

    <button
      onClick={() => {
        setKeyToDelete(key);
        setConfirmDeleteOpen(true);
      }}
      className="hover:opacity-80"
      title="Remover"
    >
      <img src="/icons/trash.svg" alt="Remover" className="w-7 h-7" />
    </button>
  </div>
</td>
                </tr>
              ))}
            </tbody>
          </table>
          {showEditForm && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
      <h3 className="text-xl font-semibold mb-4">Editar Nome da API Key</h3>
      <div className="space-y-4">
        <input
          name="name"
          value={formData.name}
          onChange={handleFormChange}
          placeholder="Nome da API Key"
          className="w-full p-2 rounded bg-gray-700 text-white"
        />

        <input
          name="api_key"
          value={formData.api_key}
          disabled
          className="w-full p-2 rounded bg-gray-700 text-white opacity-70 cursor-not-allowed"
        />
        <input
          name="secret_key"
          value={formData.secret_key}
          disabled
          className="w-full p-2 rounded bg-gray-700 text-white opacity-70 cursor-not-allowed"
        />

        {extraParams.length > 0 && (
          <div>
            <h4 className="text-sm mb-1">Parâmetros Adicionais</h4>
            {extraParams.map((param, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  value={param.key}
                  disabled
                  className="flex-1 p-2 rounded bg-gray-700 text-white opacity-70 cursor-not-allowed"
                />
                <input
                  value={param.value}
                  disabled
                  className="flex-1 p-2 rounded bg-gray-700 text-white opacity-70 cursor-not-allowed"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={() => {
              editNameMutation.mutate();
              setShowEditForm(false);
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            Salvar
          </button>
          <button
            onClick={() => {
              setShowEditForm(false);
              setFormData({ name: '', exchange_id: '', api_key: '', secret_key: '' });
              setExtraParams([]);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
)}

        </div>
      )}

      {confirmDeleteOpen && keyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-md text-center max-w-sm w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-white mb-2">Deseja realmente deletar a chave:</p>
            <p className="text-red-400 font-bold truncate">ID: {keyToDelete.api_key_id}</p>
            <p className="text-gray-400 text-sm mb-4 italic truncate">{keyToDelete.name}</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => removeMutation.mutate(keyToDelete.api_key_id)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white">Confirmar</button>
              <button onClick={() => setConfirmDeleteOpen(false)} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {loadingSave && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <p className="text-white text-xl">Salvando credenciais...</p>
        </div>
      )}

      {loadingDelete && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-gray-900 px-6 py-4 rounded-lg shadow-lg text-white text-lg">
                  {deleteStatusMessage}
                </div>
              </div>
            )}
    </div>
  );
}

export default ApiKeysPage;
