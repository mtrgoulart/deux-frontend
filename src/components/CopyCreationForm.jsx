import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { FullScreenLoader } from './FullScreenLoader';

function PanelLoader({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="flex items-end justify-center gap-1 h-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-t from-teal-600 to-teal-400"
            style={{
              animation: 'panel-bars 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
              height: '20%',
            }}
          />
        ))}
        <style>{`
          @keyframes panel-bars {
            0%, 100% { height: 20%; opacity: 0.4; }
            50% { height: 100%; opacity: 1; }
          }
        `}</style>
      </div>
      <p className="text-xs text-content-muted">{message}</p>
    </div>
  );
}

function SharingItem({ sharing, actionButton, t }) {
  const isActive = sharing.status === 1;
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-content-primary truncate">{sharing.instance_name}</p>
          <span
            className={`flex-shrink-0 w-2 h-2 rounded-full ${isActive ? 'bg-success' : 'bg-content-muted'}`}
            title={isActive ? t('copyCreate.formActive') : t('copyCreate.formInactive')}
          />
        </div>
        {sharing.symbol && (
          <span className="inline-block mt-1 px-1.5 py-0.5 text-xs font-mono text-content-accent bg-surface-raised/60 border border-border-subtle rounded">
            {sharing.symbol}
          </span>
        )}
      </div>
      {actionButton}
    </div>
  );
}

function CopyCreationForm({ show, onClose, initialData }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [selectedSharings, setSelectedSharings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: availableSharings = [], isLoading: isLoadingSharings } = useQuery({
    queryKey: ['user_sharings'],
    queryFn: async () => {
      const res = await apiFetch('/user_sharings');
      const data = await res.json();
      return data.sharings || [];
    },
  });

  const { data: details, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['copytrading_details', initialData?.id],
    queryFn: async () => {
      const res = await apiFetch(`/copytrading/${initialData.id}`);
      return res.json();
    },
    enabled: !!initialData?.id,
  });

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      if (details) {
        setSelectedSharings(details.sharing_ids || []);
      }
    } else {
      setName('');
      setSelectedSharings([]);
    }
  }, [initialData, details]);

  const handleAddSharing = (sharingId) => {
    setSelectedSharings(prev => [...prev, sharingId]);
  };

  const handleRemoveSharing = (sharingId) => {
    setSelectedSharings(prev => prev.filter(id => id !== sharingId));
  };

  const { filteredAvailable, selectedObjects } = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredAvailable = availableSharings
      .filter(sharing => !selectedSharings.includes(sharing.id))
      .filter(sharing =>
        sharing.instance_name.toLowerCase().includes(lowercasedFilter) ||
        (sharing.symbol && sharing.symbol.toLowerCase().includes(lowercasedFilter))
      );
    const selectedObjects = selectedSharings
      .map(id => availableSharings.find(s => s.id === id))
      .filter(Boolean);
    return { filteredAvailable, selectedObjects };
  }, [searchTerm, availableSharings, selectedSharings]);

  const saveMutation = useMutation({
    mutationFn: async (newCopyData) => {
      const endpoint = initialData?.id ? '/update_copytrading' : '/save_copytrading';
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCopyData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['copytradings']);
      queryClient.invalidateQueries(['copytrading_details', initialData?.id]);
      onClose();
    },
    onError: (error) => {
      alert(t('copyCreate.formSaveError', { message: error.message }));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { name, sharing_ids: selectedSharings };
    if (initialData?.id) {
      payload.id = initialData.id;
    }
    saveMutation.mutate(payload);
  };

  if (!show) return null;

  return (
    <>
      <FullScreenLoader isOpen={saveMutation.isPending} message={t('copyCreate.formSaving')} />

      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-40 animate-fade-in">
        <div className="bg-surface border border-border rounded-lg shadow-2xl p-6 max-w-3xl w-full">
          <h3 className="text-xl font-bold text-content-primary mb-6">
            {initialData ? t('copyCreate.formTitleEdit') : t('copyCreate.formTitleNew')}
          </h3>

          <form onSubmit={handleSubmit}>
            {/* Configuration Name */}
            <div className="mb-6">
              <label htmlFor="copyName" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                {t('copyCreate.formConfigName')}
              </label>
              <input
                type="text"
                id="copyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-primary border border-border text-content-primary rounded text-sm
                         placeholder-content-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                required
              />
            </div>

            {/* Sharings Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Available */}
              <div>
                <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('copyCreate.formAvailableSharings')} ({filteredAvailable.length})
                </label>
                <input
                  type="text"
                  placeholder={t('copyCreate.formSearchSharings')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-primary border border-border text-content-primary rounded text-sm mb-2
                           placeholder-content-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <div className="bg-surface-primary border border-border rounded-lg h-64 overflow-y-auto">
                  {isLoadingSharings ? (
                    <PanelLoader message={t('copyCreate.formLoadingSharings')} />
                  ) : filteredAvailable.length > 0 ? (
                    <div className="divide-y divide-border-subtle">
                      {filteredAvailable.map(sharing => (
                        <SharingItem
                          key={sharing.id}
                          sharing={sharing}
                          t={t}
                          actionButton={
                            <button
                              type="button"
                              onClick={() => handleAddSharing(sharing.id)}
                              className="flex-shrink-0 ml-2 p-1.5 rounded-full text-success hover:bg-success-muted transition-colors"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="p-4 text-center text-content-muted text-sm">{t('copyCreate.formNoSharings')}</p>
                  )}
                </div>
              </div>

              {/* Selected */}
              <div>
                <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('copyCreate.formSelectedSharings')} ({selectedObjects.length})
                </label>
                <div className="bg-surface-primary border border-border rounded-lg h-[18.5rem] overflow-y-auto">
                  {isLoadingDetails ? (
                    <PanelLoader message={t('copyCreate.formLoadingSelected')} />
                  ) : selectedObjects.length > 0 ? (
                    <div className="divide-y divide-border-subtle">
                      {selectedObjects.map(sharing => (
                        <SharingItem
                          key={sharing.id}
                          sharing={sharing}
                          t={t}
                          actionButton={
                            <button
                              type="button"
                              onClick={() => handleRemoveSharing(sharing.id)}
                              className="flex-shrink-0 ml-2 p-1.5 rounded-full text-danger hover:bg-danger-muted transition-colors"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <svg className="w-8 h-8 text-content-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <p className="text-center text-content-muted text-sm">{t('copyCreate.formAddFromLeft')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={saveMutation.isPending}
                className="px-5 py-2.5 bg-surface-raised border border-border text-content-secondary rounded text-sm font-medium
                         hover:bg-surface-raised/80 transition-colors disabled:opacity-50"
              >
                {t('copyCreate.formCancel')}
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded text-sm font-medium transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? t('copyCreate.formSaving') : t('copyCreate.formSave')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CopyCreationForm;
