import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { AddApiKeyForm } from '../components/AddApiKeyForm';
import { EditApiKeyModal } from '../components/EditApiKeyModal';
import { TableSkeleton } from '../components/TableSkeleton';
import { FullScreenLoader } from '../components/FullScreenLoader';

function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const tutorialUrl = import.meta.env.VITE_TUTORIAL_URL;
  const apiKeyHeaders = ["ID", "Name", "Exchange", "Actions"];
  const [deleteError, setDeleteError] = useState(null);

  const [highlightedKeyId, setHighlightedKeyId] = useState(null);

  // --- LÓGICA RESTAURADA ---
  const { data: apiKeys, isLoading: loadingApiKeys } = useQuery({
    queryKey: ['user_apikeys'],
    queryFn: async () => {
      const response = await apiFetch(`/get_user_apikeys`);
      const data = await response.json();
      return data.user_apikeys || [];
    },
  });

  const { data: exchanges } = useQuery({
    queryKey: ['exchanges'],
    queryFn: async () => {
      const response = await apiFetch(`/get_exchanges`);
      const data = await response.json();
      return data.exchanges || []; // Garante que nunca retorne undefined
    },
  });

  const addMutation = useMutation({
    mutationFn: (newKeyData) => apiFetch(`/save_user_apikey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newKeyData),
    }),
    onSuccess: (newlySavedKey) => {
      queryClient.invalidateQueries({ queryKey: ['user_apikeys'] }).then(() => {
        setHighlightedKeyId(newlySavedKey.api_key_id);
        setTimeout(() => setHighlightedKeyId(null), 2000);
      });
      setShowAddForm(false);
    },
    onError: () => alert("Error saving credentials."),
  });

  const editMutation = useMutation({
    mutationFn: ({ apiKeyId, name }) => apiFetch('/edit_apikey_name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key_id: apiKeyId, name }),
    }),
    onSuccess: (updatedKey) => {
      queryClient.invalidateQueries({ queryKey: ['user_apikeys'] }).then(() => {
        setHighlightedKeyId(updatedKey.api_key_id);
        setTimeout(() => setHighlightedKeyId(null), 2000);
      });
      setShowEditModal(false);
    },
    onError: () => alert('Error editing API Key'),
  });

const removeMutation = useMutation({
    mutationFn: async (apiKeyId) => {
      const response = await apiFetch(`/remove_user_apikey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key_id: apiKeyId }),
      });

      // Se a resposta da API não for bem-sucedida (ex: status 400, 500)
      if (!response.ok) {
        // Lemos os dados do erro (o JSON com a mensagem) e os lançamos como um erro.
        // Isso vai forçar o useMutation a chamar o callback 'onError'.
        const errorData = await response.json();
        throw errorData; 
      }

      // Se a resposta for bem-sucedida, apenas retornamos.
      return response.json();
    },
    onSuccess: () => {
      // Este código agora só será executado em caso de sucesso real (status 200)
      queryClient.invalidateQueries({ queryKey: ['user_apikeys'] });
      setShowConfirmDelete(false); 
    },
    onError: (error) => {
      // O 'error' que recebemos aqui é o objeto 'errorData' que lançamos acima.
      // Verificamos se ele tem a mensagem que esperamos.
      if (error && error.error === 'API_KEY_IN_USE') {
        setDeleteError(error.message); 
      } else {
        // Caso contrário, mostramos uma mensagem de erro genérica.
        setDeleteError(error.message || "Ocorreu um erro inesperado ao tentar deletar a chave.");
      }
    },
  });

  // --- LÓGICA RESTAURADA ---
  const handleSaveNewKey = (formData, extraParams) => {
    const additional = Object.fromEntries(extraParams.map(p => [p.key, p.value]));
    addMutation.mutate({
      name: formData.name,
      exchange_id: formData.exchange_id,
      api_credentials: {
        api_key: formData.api_key,
        secret_key: formData.secret_key,
        ...additional,
      },
    });
  };

  const handleSaveEditedKey = (apiKeyId, name) => {
    editMutation.mutate({ apiKeyId, name });
  };

  const handleDeleteKey = () => {
    if (selectedKey) {
      // Chama a mutação diretamente
      removeMutation.mutate(selectedKey.api_key_id);
    }
};

  const openEditModal = (apiKey) => {
    setSelectedKey(apiKey);
    setShowEditModal(true);
  };

  const openDeleteConfirm = (apiKey) => {
    setSelectedKey(apiKey);
    setDeleteError(null);
    setShowConfirmDelete(true);
  };

  const buttonPrimaryStyle = "px-4 py-2 font-semibold text-white rounded-md transition-all duration-300 transform focus:outline-none";
  const buttonSecondaryStyle = `${buttonPrimaryStyle} bg-transparent border-2 border-gray-700 hover:bg-red-500 hover:border-red-500`;

  let loaderMessage = '';
  if (addMutation.isLoading) loaderMessage = 'Saving new key...';
  if (editMutation.isLoading) loaderMessage = 'Updating key...';
  if (removeMutation.isLoading) loaderMessage = 'Deleting key...';

  return (
    <div className="p-4 text-slate-200">
      <FullScreenLoader
        isOpen={addMutation.isLoading || editMutation.isLoading || removeMutation.isLoading}
        message={loaderMessage}
      />

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}>
          API Keys
        </h2>
        <div className="flex items-center gap-4">
          <a href={tutorialUrl} target="_blank" rel="noopener noreferrer" className={buttonSecondaryStyle}>
            Tutorial
          </a>
          <button onClick={() => setShowAddForm(true)} className={`${buttonPrimaryStyle} bg-red-500/90 hover:bg-red-500 border border-red-500/50 hover:border-red-400 hover:-translate-y-px`} style={{ filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.5))' }}>
            Add API Key
          </button>
        </div>
      </div>

      <AddApiKeyForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSave={handleSaveNewKey}
        exchanges={exchanges}
        isSaving={addMutation.isLoading}
      />

      {loadingApiKeys ? <TableSkeleton headers={apiKeyHeaders} /> : (
        <div className="overflow-x-auto bg-black/50 rounded-lg border border-gray-800">
          <table className="min-w-full table-auto">
            <thead className='border-b border-red-500/30'>
              <tr className="text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Exchange</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {apiKeys?.map((key) => {
    const isHighlighted = key.api_key_id === highlightedKeyId;
    // A variável isDeleting e a classe animate-glitch-out foram removidas.
    let rowClass = "border-t border-gray-800/50 hover:bg-gray-900/50 transition-colors";
    if (isHighlighted) rowClass += ' animate-glow-success';

    return (
      <tr key={key.api_key_id} className={rowClass}>
        {/* --- CONTEÚDO DA TABELA RESTAURADO --- */}
        <td className="px-6 py-4 font-mono text-xs">{key.api_key_id}</td>
        <td className="px-6 py-4">{key.name || <span className="text-gray-500 italic">Untitled</span>}</td>
        <td className="px-6 py-4">{key.exchange_name}</td>
        <td className="px-6 py-4">
          <div className="flex gap-4 justify-end">
            <button onClick={() => openEditModal(key)} className="hover:opacity-80 transition-opacity" title="Configure">
             <img src="/icons/config.svg" alt="Configure" className="w-7 h-7" />
            </button>
            <button onClick={() => openDeleteConfirm(key)} className="hover:opacity-80 transition-opacity" title="Remove">
              <img src="/icons/trash.svg" alt="Remove" className="w-7 h-7" />
            </button>
          </div>
        </td>
      </tr>
    );
})}
            </tbody>
          </table>
        </div>
      )}

      <EditApiKeyModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEditedKey}
        apiKeyToEdit={selectedKey}
        isSaving={editMutation.isLoading}
      />

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-900 p-8 rounded-lg shadow-lg text-center max-w-sm w-full border border-red-500/30">
            
            {/* Se NÃO houver erro, mostra a confirmação normal */}
            {!deleteError ? (
              <>
                <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
                <p className="text-slate-300 mb-2">Do you really want to delete the key:</p>
                <p className="text-red-400 font-bold truncate text-lg">{selectedKey?.name}</p>
                <p className="text-gray-500 text-sm mb-6 italic truncate">ID: {selectedKey?.api_key_id}</p>
                <div className="flex justify-center gap-4">
                  <button onClick={() => setShowConfirmDelete(false)} className={`${buttonSecondaryStyle} border-gray-600`}>Cancel</button>
                  <button onClick={handleDeleteKey} disabled={removeMutation.isLoading} className={`${buttonPrimaryStyle} bg-red-600 hover:bg-red-700`}>
                    {removeMutation.isLoading ? 'Deleting...' : 'Confirm'}
                  </button>
                </div>
              </>
            ) : (
              /* Se HOUVER erro, mostra a mensagem de erro */
              <>
                <h3 className="text-xl font-semibold text-red-500 mb-4">Deletion Failed</h3>
                {/* Exibe a mensagem de erro que foi guardada no estado */}
                <p className="text-slate-300 mb-6">{deleteError}</p>
                <div className="flex justify-center">
                  <button onClick={() => setShowConfirmDelete(false)} className={`${buttonPrimaryStyle} bg-gray-600 hover:bg-gray-700`}>
                    Close
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default ApiKeysPage;