import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { AddApiKeyForm } from '../components/AddApiKeyForm';
import { EditApiKeyModal } from '../components/EditApiKeyModal';
import { ConfirmDeleteApiKeyModal } from '../components/ConfirmDeleteApiKeyModal';
import { FullScreenLoader } from '../components/FullScreenLoader';
import Pagination from '../components/Pagination';
import TradingBarsLoader from '../components/TradingBarsLoader';

function ApiKeysPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [highlightedKeyId, setHighlightedKeyId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 25;

  const { data: apiKeys = [], isLoading: loadingApiKeys } = useQuery({
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
      return data.exchanges || [];
    },
  });

  // Pagination logic
  const paginatedKeys = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return apiKeys.slice(startIndex, startIndex + recordsPerPage);
  }, [apiKeys, currentPage, recordsPerPage]);

  const totalPages = Math.ceil(apiKeys.length / recordsPerPage);

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
    onError: () => alert(t('apiKeys.errors.saveError')),
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
    onError: () => alert(t('apiKeys.errors.editError')),
  });

  const removeMutation = useMutation({
    mutationFn: async (apiKeyId) => {
      const response = await apiFetch(`/remove_user_apikey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key_id: apiKeyId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_apikeys'] });
      setShowConfirmDelete(false);
    },
    onError: (error) => {
      if (error && error.error === 'API_KEY_IN_USE') {
        setDeleteError(error.message);
      } else {
        setDeleteError(error.message || t('apiKeys.errors.unexpectedError'));
      }
    },
  });

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

  const isMutating = addMutation.isPending || editMutation.isPending || removeMutation.isPending;
  const loaderMessage = () => {
    if (addMutation.isPending) return t('apiKeys.savingKey');
    if (editMutation.isPending) return t('apiKeys.updatingKey');
    if (removeMutation.isPending) return t('apiKeys.deletingKey');
    return t('apiKeys.processingRequest');
  };

  if (loadingApiKeys) {
    return (
      <div className="bg-surface-primary">
        <TradingBarsLoader title={t('apiKeys.loadingTitle')} subtitle={t('apiKeys.loadingDescription')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <FullScreenLoader isOpen={isMutating} message={loaderMessage()} />

      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
              {t('apiKeys.title')}
            </h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-semibold text-sm uppercase tracking-wider
                       transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-accent/50
                       border border-accent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('apiKeys.addApiKey')}</span>
            </button>
          </div>
        </div>

        {/* Add Form */}
        <AddApiKeyForm
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSave={handleSaveNewKey}
          exchanges={exchanges}
          isSaving={addMutation.isPending}
        />

        {/* Table */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            {/* Table header bar */}
            <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-content-accent uppercase tracking-wider">
                {t('apiKeys.keysLabel')}
              </span>
            </div>

            {/* Table content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-raised/30">
                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">
                      {t('apiKeys.id')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">
                      {t('apiKeys.name')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">
                      {t('apiKeys.exchange')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">
                      {t('apiKeys.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {paginatedKeys.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <div className="text-content-muted text-sm">
                          {t('apiKeys.noApiKeys')}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedKeys.map((key) => {
                      const isHighlighted = key.api_key_id === highlightedKeyId;
                      return (
                        <tr
                          key={key.api_key_id}
                          className={`hover:bg-surface-raised/30 transition-colors group ${isHighlighted ? 'animate-glow-success' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                            {key.api_key_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-content-primary">
                            {key.name || <span className="text-content-muted italic">{t('apiKeys.untitled')}</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary">
                            {key.exchange_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => openEditModal(key)}
                                className="p-2 hover:bg-surface-raised/50 rounded transition-all duration-200 group/btn"
                                title={t('apiKeys.configure')}
                              >
                                <svg className="w-5 h-5 text-content-secondary group-hover/btn:text-content-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => openDeleteConfirm(key)}
                                className="p-2 hover:bg-surface-raised/50 rounded transition-all duration-200 group/btn"
                                title={t('apiKeys.delete')}
                              >
                                <svg className="w-5 h-5 text-content-secondary group-hover/btn:text-content-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-surface-raised/30 border-t border-border-subtle px-6 py-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={recordsPerPage}
                totalItems={apiKeys.length}
                itemLabel={t('apiKeys.keysLabel')}
              />
            </div>
          </div>
        </div>
      </div>

      <EditApiKeyModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEditedKey}
        apiKeyToEdit={selectedKey}
        isSaving={editMutation.isPending}
      />

      <ConfirmDeleteApiKeyModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDeleteKey}
        apiKey={selectedKey}
        isPending={removeMutation.isPending}
        error={deleteError}
      />
    </div>
  );
}

export default ApiKeysPage;
