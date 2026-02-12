import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import InstanceCreationForm from '../components/InstanceCreationForm';
import TradingBarsLoader from '../components/TradingBarsLoader';
import RefreshButton from '../components/RefreshButton';
import { FullScreenLoader } from '../components/FullScreenLoader';
import Pagination from '../components/Pagination';
import { InstanceDeleteModal } from '../components/InstanceDeleteModal';
import { ManualOperationModal } from '../components/ManualOperationModal';
import { PanicStopModal } from '../components/PanicStopModal';
import { ResumeFromPanicModal } from '../components/ResumeFromPanicModal';

function StrategyPage() {
  const { t } = useTranslation();
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
  const [currentOperation, setCurrentOperation] = useState(null);
  const [isSubmittingOperation, setIsSubmittingOperation] = useState(false);

  const [panicModalOpen, setPanicModalOpen] = useState(false);
  const [isStoppingAll, setIsStoppingAll] = useState(false);
  const [panicStatusMessage, setPanicStatusMessage] = useState('');

  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [resumeStatusMessage, setResumeStatusMessage] = useState('');

  const [nameFilter, setNameFilter] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  const handleInstanceStatusChange = async (instance, action) => {
    if ((action === 'start' && instance.status !== 1) || (action === 'stop' && instance.status !== 2)) return;

    if (action === 'start' && isPanicActive) {
      alert(t('instance.cannotStartPanicAlert'));
      return;
    }

    setLoadingStatusChange(true);
    setStatusMessage(action === 'start' ? t('instance.starting') : t('instance.stopping'));

    try {
      const res = await apiFetch(`/${action}_instance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: instance.id })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Unknown error');
      }

      setStatusMessage(action === 'start' ? t('instance.startSuccess') : t('instance.stopSuccess'));
      await queryClient.invalidateQueries(['instances', selectedApiKey]);

      setTimeout(() => { setLoadingStatusChange(false); setStatusMessage(''); }, 2000);
    } catch (err) {
      console.error(`Error ${action} instance:`, err);
      setStatusMessage(err.message);
      setTimeout(() => { setLoadingStatusChange(false); setStatusMessage(''); }, 3000);
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
        alert(data.error || t('instance.deleteError'));
      }
    } catch (err) {
      console.error('Error deleting instance:', err);
      alert(t('instance.deleteError'));
    } finally {
      setLoadingDelete(false);
      setInstanceToDelete(null);
    }
  };

  const handlePanicStop = async () => {
    setPanicModalOpen(false);
    setIsStoppingAll(true);
    setPanicStatusMessage(t('instance.panicModalExecuting'));

    try {
      const res = await apiFetch('/panic_button', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Unknown error');

      setPanicStatusMessage(data.message);
      await queryClient.invalidateQueries(['instances', selectedApiKey]);
      await queryClient.invalidateQueries(['panicState']);
      await refetchPanicState();

      setTimeout(() => { setIsStoppingAll(false); setPanicStatusMessage(''); }, 4000);
    } catch (err) {
      console.error('Error triggering panic button:', err);
      setPanicStatusMessage(t('instance.panicModalError', { message: err.message }));
      setTimeout(() => { setIsStoppingAll(false); setPanicStatusMessage(''); }, 5000);
    }
  };

  const handleResumeWithRestart = async () => {
    setResumeModalOpen(false);
    setIsResuming(true);
    setResumeStatusMessage(t('instance.resumeModalExecutingRestart'));

    try {
      const res = await apiFetch('/resume_from_panic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restart_instances: true })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Unknown error');

      setResumeStatusMessage(data.message);
      await queryClient.invalidateQueries(['instances', selectedApiKey]);
      await queryClient.invalidateQueries(['panicState']);
      await refetchPanicState();

      setTimeout(() => { setIsResuming(false); setResumeStatusMessage(''); }, 4000);
    } catch (err) {
      console.error('Error resuming from panic:', err);
      setResumeStatusMessage(t('instance.resumeModalError', { message: err.message }));
      setTimeout(() => { setIsResuming(false); setResumeStatusMessage(''); }, 5000);
    }
  };

  const handleResumeWithoutRestart = async () => {
    setResumeModalOpen(false);
    setIsResuming(true);
    setResumeStatusMessage(t('instance.resumeModalExecutingNoRestart'));

    try {
      const res = await apiFetch('/resume_from_panic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restart_instances: false })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Unknown error');

      setResumeStatusMessage(data.message);
      await queryClient.invalidateQueries(['panicState']);
      await refetchPanicState();

      setTimeout(() => { setIsResuming(false); setResumeStatusMessage(''); }, 4000);
    } catch (err) {
      console.error('Error resuming from panic:', err);
      setResumeStatusMessage(t('instance.resumeModalError', { message: err.message }));
      setTimeout(() => { setIsResuming(false); setResumeStatusMessage(''); }, 5000);
    }
  };

  const handleOpenOperationModal = (instance, side) => {
    if (instance.status !== 2) {
      alert(t('instance.manualOpRequiresRunning'));
      return;
    }
    setCurrentOperation({ instance, side });
    setOperationModalOpen(true);
  };

  const handleConfirmOperation = async (operationPercent) => {
    if (!currentOperation) return;

    const percent = parseFloat(operationPercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      alert(t('instance.operationModalInvalidPercent'));
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
          symbol: currentOperation.instance.symbol,
          perc_balance_operation: percent / 100,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const sideLabel = currentOperation.side === 'buy' ? t('instance.buy') : t('instance.sell');
        alert(t('instance.operationModalSuccess', { side: sideLabel }));
        setOperationModalOpen(false);
        setCurrentOperation(null);
      } else {
        alert(t('instance.operationModalError', { message: data.error || 'Unknown error' }));
      }
    } catch (err) {
      console.error('Error sending manual operation:', err);
      alert(t('instance.operationModalNetworkError'));
    } finally {
      setIsSubmittingOperation(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return { datePart: '-', timePart: '' };
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return { datePart, timePart };
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

  const { data: instances = [], isLoading, isFetching: instancesFetching, refetch: refetchInstances } = useQuery({
    queryKey: ['instances', selectedApiKey],
    queryFn: async () => {
      const res = await apiFetch(`/get_instances?api_key_id=${selectedApiKey}`);
      const data = await res.json();
      return data.instances || [];
    },
    enabled: !!selectedApiKey,
  });

  const { data: panicState = null, refetch: refetchPanicState } = useQuery({
    queryKey: ['panicState'],
    queryFn: async () => {
      const res = await apiFetch('/panic_state');
      const data = await res.json();
      return data;
    },
    refetchInterval: 5000,
  });

  const isPanicActive = panicState?.is_panic_active || false;

  const filteredInstances = useMemo(() => {
    return instances.filter(instance => {
      const nameMatch = nameFilter === '' || instance.name.toLowerCase().includes(nameFilter.toLowerCase());
      const symbolMatch = symbolFilter === '' || instance.symbol.toLowerCase().includes(symbolFilter.toLowerCase());
      const statusMatch = statusFilter === 'all' ||
        (statusFilter === 'running' && instance.status === 2) ||
        (statusFilter === 'stopped' && instance.status === 1);
      return nameMatch && symbolMatch && statusMatch;
    });
  }, [instances, nameFilter, symbolFilter, statusFilter]);

  const paginatedInstances = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredInstances.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredInstances, currentPage, recordsPerPage]);

  const totalPages = Math.ceil(filteredInstances.length / recordsPerPage);

  useEffect(() => { setCurrentPage(1); }, [nameFilter, symbolFilter, statusFilter, selectedApiKey]);

  const handleEdit = (instance) => {
    setEditInstanceData({
      id: instance.id,
      name: instance.name,
      api_key: instance.api_key_id,
      symbol: instance.symbol,
      strategy_buy: instance.strategy_buy || '',
      strategy_sell: instance.strategy_sell || '',
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <TradingBarsLoader title={t('instance.loadingTitle')} subtitle={t('instance.loadingDescription')} />
      </div>
    );
  }

  const loaderMessage = statusMessage || (loadingDelete && t('instance.deleting')) || panicStatusMessage || resumeStatusMessage;

  return (
    <div className="min-h-screen bg-surface-primary">
      <FullScreenLoader isOpen={loadingStatusChange || loadingDelete || isStoppingAll || isResuming} message={loaderMessage} />

      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
              {t('instance.title')}
            </h1>
            <div className="flex items-center gap-3">
              {isPanicActive ? (
                <button
                  onClick={() => setResumeModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-success hover:bg-success/80 text-white rounded-lg text-sm font-bold uppercase tracking-wider
                           border-2 border-success/50 shadow-lg shadow-success/20
                           transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-success/40 focus:ring-offset-2 focus:ring-offset-surface
                           animate-pulse"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('instance.resume')}
                </button>
              ) : (
                <button
                  onClick={() => setPanicModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-danger hover:bg-danger/80 text-white rounded-lg text-sm font-bold uppercase tracking-wider
                           border-2 border-danger/50 shadow-lg shadow-danger/25
                           transition-all duration-300 hover:shadow-xl hover:shadow-danger/30 hover:scale-[1.02]
                           focus:outline-none focus:ring-2 focus:ring-danger/40 focus:ring-offset-2 focus:ring-offset-surface"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="hidden sm:inline">{t('instance.panicStop')}</span>
                  <span className="sm:hidden">PANIC</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Panic Mode Banner */}
          {isPanicActive && (
            <div className="bg-warning-muted border border-warning/50 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <svg className="w-8 h-8 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-bold text-warning uppercase tracking-wider">
                      {t('instance.panicBannerTitle')}
                    </h3>
                    <p className="text-content-secondary text-sm mt-1">
                      {t('instance.panicBannerMessage', { count: panicState?.total_instances_stopped || 0 })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResumeModalOpen(true)}
                  className="px-5 py-2.5 bg-success/20 border border-success/50 text-success rounded text-sm uppercase tracking-wider font-bold
                           hover:bg-success/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-success/20 whitespace-nowrap"
                >
                  {t('instance.panicBannerResume')}
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* API Key Filter */}
              <div>
                <label htmlFor="apikey-filter" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('instance.filterByApiKey')}
                </label>
                <select
                  id="apikey-filter"
                  value={selectedApiKey}
                  onChange={(e) => { setSelectedApiKey(e.target.value); localStorage.setItem('selectedApiKey', e.target.value); }}
                  className="w-full px-4 py-2.5 bg-surface-primary border border-border text-content-primary rounded text-sm
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 appearance-none cursor-pointer"
                >
                  <option value="">{t('instance.selectApiKey')}</option>
                  {apiKeys.map(key => (
                    <option key={key.api_key_id} value={key.api_key_id}>({key.api_key_id}) {key.name}</option>
                  ))}
                </select>
              </div>

              {/* Name Filter */}
              <div>
                <label htmlFor="name-filter" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('instance.filterByName')}
                </label>
                <input
                  type="text"
                  id="name-filter"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder={t('instance.searchByName')}
                  className="w-full px-4 py-2.5 bg-surface-primary border border-border text-content-primary rounded text-sm
                           placeholder-content-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {/* Symbol Filter */}
              <div>
                <label htmlFor="symbol-filter" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('instance.filterBySymbol')}
                </label>
                <input
                  type="text"
                  id="symbol-filter"
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  placeholder={t('instance.searchBySymbol')}
                  className="w-full px-4 py-2.5 bg-surface-primary border border-border text-content-primary rounded text-sm
                           placeholder-content-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('instance.filterByStatus')}
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-primary border border-border text-content-primary rounded text-sm
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 appearance-none cursor-pointer"
                >
                  <option value="all">{t('instance.allStatuses')}</option>
                  <option value="running">{t('instance.running')}</option>
                  <option value="stopped">{t('instance.stopped')}</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleAdd}
                className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded text-sm uppercase tracking-wider transition-colors
                         focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('instance.addInstance')}
              </button>
              <button
                onClick={() => { setNameFilter(''); setSymbolFilter(''); setStatusFilter('all'); }}
                className="px-5 py-2.5 bg-surface-raised border border-border text-content-secondary rounded text-sm uppercase tracking-wider
                         hover:bg-surface-raised/80 hover:text-content-primary transition-colors
                         focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {t('instance.clearFilters')}
              </button>
            </div>
          </div>

          {/* Instance Table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            {/* Table header bar */}
            <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-content-secondary">
                {t('instance.registryHeader')}
              </span>
              <RefreshButton onClick={refetchInstances} isRefreshing={instancesFetching} label={t('common.refresh')} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('instance.id')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('instance.name')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('instance.symbol')}</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-content-muted uppercase tracking-wider">{t('instance.status')}</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-content-muted uppercase tracking-wider">{t('instance.manualOp')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('instance.created')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('instance.started')}</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('instance.actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-border-subtle transition-opacity duration-300 ${instancesFetching && !isLoading ? 'opacity-40' : ''}`}>
                  {paginatedInstances.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="text-content-muted text-sm">
                          {instances.length === 0 ? t('instance.noInstances') : t('instance.noMatchingInstances')}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedInstances.map((instance) => (
                      <tr key={instance.id} className="hover:bg-surface-raised/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                          {instance.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-content-primary">
                          {instance.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                          {instance.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                            instance.status === 2
                              ? 'bg-success-muted text-success'
                              : 'bg-surface-raised text-content-muted'
                          }`}>
                            {instance.status === 2 ? t('instance.statusRunning') : t('instance.statusStopped')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleOpenOperationModal(instance, 'buy')}
                              disabled={instance.status !== 2}
                              className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all duration-200
                                       bg-success-muted text-success hover:bg-success/20
                                       disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {t('instance.buy')}
                            </button>
                            <button
                              onClick={() => handleOpenOperationModal(instance, 'sell')}
                              disabled={instance.status !== 2}
                              className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all duration-200
                                       bg-danger-muted text-danger hover:bg-danger/20
                                       disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {t('instance.sell')}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm text-content-secondary font-mono">{formatDate(instance.created_at).datePart}</span>
                            <span className="text-xs text-content-muted font-mono">{formatDate(instance.created_at).timePart}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm text-content-secondary font-mono">{formatDate(instance.start_date).datePart}</span>
                            <span className="text-xs text-content-muted font-mono">{formatDate(instance.start_date).timePart}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-3">
                            {/* Configure */}
                            <button
                              onClick={() => { if (instance.status === 1) handleEdit(instance); }}
                              disabled={instance.status !== 1}
                              className="p-2 hover:bg-surface-raised rounded transition-all duration-200 group/btn disabled:opacity-30 disabled:cursor-not-allowed"
                              title={instance.status === 1 ? t('instance.configure') : t('instance.stopToEdit')}
                            >
                              <svg className="w-5 h-5 text-content-muted group-hover/btn:text-content-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                            {/* Start */}
                            <button
                              onClick={() => handleInstanceStatusChange(instance, 'start')}
                              disabled={instance.status !== 1 || isPanicActive}
                              className={`p-2 rounded transition-all duration-200 group/btn disabled:opacity-30 disabled:cursor-not-allowed ${
                                isPanicActive && instance.status === 1 ? 'bg-warning-muted' : 'hover:bg-surface-raised'
                              }`}
                              title={
                                isPanicActive && instance.status === 1
                                  ? t('instance.cannotStartPanic')
                                  : instance.status !== 1
                                  ? t('instance.mustBeStoppedToStart')
                                  : t('instance.startInstance')
                              }
                            >
                              <svg className={`w-5 h-5 transition-colors ${
                                isPanicActive && instance.status === 1
                                  ? 'text-warning'
                                  : 'text-content-muted group-hover/btn:text-success'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            {/* Stop */}
                            <button
                              onClick={() => handleInstanceStatusChange(instance, 'stop')}
                              disabled={instance.status !== 2}
                              className="p-2 hover:bg-surface-raised rounded transition-all duration-200 group/btn disabled:opacity-30 disabled:cursor-not-allowed"
                              title={t('instance.stop')}
                            >
                              <svg className="w-5 h-5 text-content-muted group-hover/btn:text-warning transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => { if (instance.status === 1) { setInstanceToDelete(instance); setConfirmDeleteOpen(true); } }}
                              disabled={instance.status !== 1}
                              className="p-2 hover:bg-surface-raised rounded transition-all duration-200 group/btn disabled:opacity-30 disabled:cursor-not-allowed"
                              title={t('instance.delete')}
                            >
                              <svg className="w-5 h-5 text-content-muted group-hover/btn:text-danger transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                onPageChange={setCurrentPage}
                itemsPerPage={recordsPerPage}
                totalItems={filteredInstances.length}
                itemLabel={t('instance.instancesLabel')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddForm && editInstanceData && (
        <InstanceCreationForm
          show={showAddForm}
          onClose={() => setShowAddForm(false)}
          apiKeys={apiKeys}
          initialData={editInstanceData}
          selectedApiKey={selectedApiKey}
        />
      )}

      <InstanceDeleteModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteInstance}
        instance={instanceToDelete}
      />

      <ManualOperationModal
        isOpen={operationModalOpen}
        onClose={() => setOperationModalOpen(false)}
        onConfirm={handleConfirmOperation}
        operation={currentOperation}
        isSubmitting={isSubmittingOperation}
      />

      <PanicStopModal
        isOpen={panicModalOpen}
        onClose={() => setPanicModalOpen(false)}
        onConfirm={handlePanicStop}
      />

      <ResumeFromPanicModal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        onResumeWithRestart={handleResumeWithRestart}
        onResumeWithoutRestart={handleResumeWithoutRestart}
        panicState={panicState}
      />
    </div>
  );
}

export default StrategyPage;
