import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import EditIndicatorModal from '../components/EditIndicatorModal';
import { IndicatorKeyModal } from '../components/IndicatorKeyModal';
import TradingBarsLoader from '../components/TradingBarsLoader';
import RefreshButton from '../components/RefreshButton';
import Pagination from '../components/Pagination';

function IndicatorsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [instanceFilter, setInstanceFilter] = useState('all');
  const [sideFilter, setSideFilter] = useState('all');
  const [mandatoryFilter, setMandatoryFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  // State for the Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState(null);

  // State for the Key Viewer modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyModalData, setKeyModalData] = useState(null);
  const [isLoadingKey, setIsLoadingKey] = useState(false);

  // State for the Delete Confirmation modal
  const [indicatorToDelete, setIndicatorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: indicators = [], isLoading, isFetching: indicatorsFetching, refetch: refetchIndicators } = useQuery({
    queryKey: ['indicators'],
    queryFn: async () => {
      const res = await apiFetch('/select_indicators_by_user');
      const data = await res.json();
      return data.indicator_data || [];
    },
  });

  const { data: instances = [] } = useQuery({
    queryKey: ['instances_all'],
    queryFn: async () => {
      const res = await apiFetch('/get_instances?api_key_id=all');
      const data = await res.json();
      return data.instances || [];
    },
  });

  // Filter indicators
  const filteredIndicators = useMemo(() => {
    return indicators.filter(indicator => {
      const nameMatch = nameFilter === '' || indicator.name.toLowerCase().includes(nameFilter.toLowerCase());
      const instanceMatch = instanceFilter === 'all' || indicator.instance_id === parseInt(instanceFilter);
      const sideMatch = sideFilter === 'all' || indicator.side === sideFilter;
      const mandatoryMatch = mandatoryFilter === 'all' ||
        (mandatoryFilter === 'yes' && indicator.mandatory) ||
        (mandatoryFilter === 'no' && !indicator.mandatory);
      return nameMatch && instanceMatch && sideMatch && mandatoryMatch;
    });
  }, [indicators, nameFilter, instanceFilter, sideFilter, mandatoryFilter]);

  // Paginate filtered indicators
  const paginatedIndicators = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredIndicators.slice(startIndex, endIndex);
  }, [filteredIndicators, currentPage, recordsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredIndicators.length / recordsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, instanceFilter, sideFilter, mandatoryFilter]);

  const handleConfirmDelete = async () => {
    if (!indicatorToDelete) return;
    setIsDeleting(true);
    try {
      await apiFetch('/remove_indicator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: indicatorToDelete.id })
      });
      await queryClient.invalidateQueries({ queryKey: ['indicators'] });
    } catch (error) {
      console.error("Failed to delete indicator:", error);
      alert(t('indicator.deleteError'));
    } finally {
      setIsDeleting(false);
      setIndicatorToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIndicator(null);
  };

  const handleOpenAddModal = () => {
    setSelectedIndicator({});
    setShowModal(true);
  };

  const handleOpenEditModal = (indicator) => {
    setSelectedIndicator(indicator);
    setShowModal(true);
  };

  const handleSaveIndicator = async (indicatorData) => {
    const isEditMode = !!indicatorData.id;
    const endpoint = isEditMode ? '/update_indicator' : '/add_indicator';

    try {
      await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(indicatorData),
      });
      await queryClient.invalidateQueries({ queryKey: ['indicators'] });
    } catch (error) {
      console.error("Save failed:", error);
      throw error;
    }
  };

  const handleViewKey = async (indicator) => {
    setShowKeyModal(true);
    setKeyModalData(indicator);

    if (indicator.key) return;

    setIsLoadingKey(true);
    try {
      const res = await apiFetch('/select_indicator_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: indicator.id })
      });
      const data = await res.json();
      if (res.ok) {
        const fetchedKey = data.indicator_data.key;
        // Update React Query cache so the key persists
        queryClient.setQueryData(['indicators'], (old) =>
          (old || []).map(ind =>
            ind.id === indicator.id ? { ...ind, key: fetchedKey } : ind
          )
        );
        setKeyModalData(prev => ({ ...prev, key: fetchedKey }));
      } else {
        alert(data.error || t('indicator.keyModalFetchError'));
        setShowKeyModal(false);
      }
    } catch (err) {
      alert(t('indicator.keyModalNetworkError'));
      setShowKeyModal(false);
    } finally {
      setIsLoadingKey(false);
    }
  };

  const formatDelay = (seconds) => {
    if (!seconds) return '-';
    if (seconds >= 3600) return `${seconds / 3600}h`;
    if (seconds >= 60) return `${seconds / 60}min`;
    return `${seconds}s`;
  };

  const hasActiveFilters = nameFilter || instanceFilter !== 'all' || sideFilter !== 'all' || mandatoryFilter !== 'all';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <TradingBarsLoader
          title={t('indicator.loadingTitle')}
          description={t('indicator.loadingDescription')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
              {t('indicator.title')}
            </h1>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('indicator.addIndicator')}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-content-primary uppercase tracking-wider">
                {t('indicator.filters')}
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setNameFilter('');
                    setInstanceFilter('all');
                    setSideFilter('all');
                    setMandatoryFilter('all');
                  }}
                  className="px-4 py-1.5 bg-surface-raised border border-border text-content-secondary rounded text-xs font-medium
                           hover:bg-surface-raised/80 transition-colors"
                >
                  {t('indicator.clearAll')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Name Filter */}
              <div>
                <label htmlFor="name-filter" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('indicator.filterByName')}
                </label>
                <input
                  type="text"
                  id="name-filter"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder={t('indicator.searchByName')}
                  className="w-full px-3 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm
                           placeholder-content-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                />
              </div>

              {/* Strategy Filter */}
              <div>
                <label htmlFor="instance-filter" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('indicator.filterByStrategy')}
                </label>
                <select
                  id="instance-filter"
                  value={instanceFilter}
                  onChange={(e) => setInstanceFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                >
                  <option value="all">{t('indicator.allStrategies')}</option>
                  {instances.map(instance => (
                    <option key={instance.id} value={instance.id}>
                      ({instance.id}) {instance.name || t('indicator.untitled')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Side Filter */}
              <div>
                <label htmlFor="side-filter" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('indicator.filterBySide')}
                </label>
                <select
                  id="side-filter"
                  value={sideFilter}
                  onChange={(e) => setSideFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                >
                  <option value="all">{t('indicator.allSides')}</option>
                  <option value="buy">{t('indicator.buy')}</option>
                  <option value="sell">{t('indicator.sell')}</option>
                </select>
              </div>

              {/* Mandatory Filter */}
              <div>
                <label htmlFor="mandatory-filter" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('indicator.filterByMandatory')}
                </label>
                <select
                  id="mandatory-filter"
                  value={mandatoryFilter}
                  onChange={(e) => setMandatoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                >
                  <option value="all">{t('indicator.allMandatory')}</option>
                  <option value="yes">{t('indicator.mandatoryYes')}</option>
                  <option value="no">{t('indicator.mandatoryNo')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Indicators Table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            {/* Table header bar */}
            <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-content-secondary">
                  {t('indicator.registry')}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-content-muted">
                    {filteredIndicators.length} {t('indicator.indicatorsLabel')}
                  </span>
                  <RefreshButton onClick={refetchIndicators} isRefreshing={indicatorsFetching} label={t('common.refresh')} />
                </div>
              </div>
            </div>

            {/* Table content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-raised/30">
                    <th className="px-6 py-3 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('indicator.id')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('indicator.name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('indicator.strategy')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('indicator.side')}</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-content-muted uppercase tracking-wider">{t('indicator.mandatory')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('indicator.delay')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('indicator.createdAt')}</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('indicator.actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-border-subtle transition-opacity duration-300 ${indicatorsFetching && !isLoading ? 'opacity-40' : ''}`}>
                  {paginatedIndicators.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <p className="text-content-muted text-sm">
                          {indicators.length === 0
                            ? t('indicator.noIndicators')
                            : t('indicator.noMatchingIndicators')
                          }
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedIndicators.map((ind) => (
                      <tr key={ind.id} className="hover:bg-surface-raised/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-content-muted font-mono">
                          {ind.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-content-primary">
                          {ind.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                          {ind.instance_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                            ind.side === 'buy'
                              ? 'bg-success-muted text-success'
                              : 'bg-danger-muted text-danger'
                          }`}>
                            {ind.side === 'buy' ? t('indicator.buyBadge') : t('indicator.sellBadge')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                            ind.mandatory
                              ? 'bg-warning-muted text-warning'
                              : 'bg-surface-raised text-content-muted'
                          }`}>
                            {ind.mandatory ? t('indicator.mandatoryBadgeYes') : t('indicator.mandatoryBadgeNo')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                          {formatDelay(ind.delay_seconds)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary">
                          {new Date(ind.created_at).toLocaleDateString()} {new Date(ind.created_at).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewKey(ind)}
                              className="p-2 hover:bg-surface-raised rounded transition-colors"
                              title={t('indicator.viewKey')}
                            >
                              <svg className="w-4 h-4 text-content-muted group-hover:text-content-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(ind)}
                              className="p-2 hover:bg-surface-raised rounded transition-colors"
                              title={t('indicator.configure')}
                            >
                              <svg className="w-4 h-4 text-content-muted group-hover:text-content-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setIndicatorToDelete(ind)}
                              className="p-2 hover:bg-danger-muted rounded transition-colors"
                              title={t('indicator.delete')}
                            >
                              <svg className="w-4 h-4 text-content-muted group-hover:text-danger transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-surface-raised/30 border-t border-border-subtle px-6 py-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredIndicators.length}
                itemsPerPage={recordsPerPage}
                onPageChange={setCurrentPage}
                itemLabel={t('indicator.indicatorsLabel')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {showModal && (
        <EditIndicatorModal
          indicator={selectedIndicator}
          instances={instances}
          onClose={handleCloseModal}
          onSave={handleSaveIndicator}
        />
      )}

      {/* Key Viewer Modal */}
      <IndicatorKeyModal
        isOpen={showKeyModal && !!keyModalData}
        onClose={() => setShowKeyModal(false)}
        indicator={keyModalData}
        isLoadingKey={isLoadingKey}
      />

      {/* Delete Confirmation Modal */}
      {indicatorToDelete && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface border border-border rounded-lg shadow-2xl p-8 max-w-md w-full">
            {isDeleting ? (
              <div className="flex flex-col items-center justify-center h-32">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-danger border-t-transparent"></div>
                <p className="mt-4 text-content-secondary">{t('indicator.deleteModalDeleting')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-danger-muted rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-content-primary">
                    {t('indicator.deleteModalTitle')}
                  </h3>
                </div>

                <p className="text-content-secondary text-sm mb-2">
                  {t('indicator.deleteModalMessage')}
                </p>

                <div className="bg-surface-primary border border-border rounded p-3 mb-4">
                  <p className="text-content-primary font-medium text-sm">
                    {indicatorToDelete.name}
                  </p>
                  <p className="text-content-muted text-xs mt-1">
                    ID: {indicatorToDelete.id}
                  </p>
                </div>

                <p className="text-xs text-warning mb-6">
                  {t('indicator.deleteModalCannotUndo')}
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIndicatorToDelete(null)}
                    className="px-5 py-2.5 bg-surface-raised border border-border text-content-secondary rounded text-sm font-medium
                             hover:bg-surface-raised/80 transition-colors"
                  >
                    {t('indicator.deleteModalCancel')}
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-5 py-2.5 bg-danger hover:bg-danger/80 text-white rounded text-sm font-medium transition-colors"
                  >
                    {t('indicator.deleteModalConfirm')}
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

export default IndicatorsPage;
