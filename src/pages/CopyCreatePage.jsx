import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import CopyCreationForm from '../components/CopyCreationForm';
import TradingBarsLoader from '../components/TradingBarsLoader';
import RefreshButton from '../components/RefreshButton';
import { FullScreenLoader } from '../components/FullScreenLoader';
import Pagination from '../components/Pagination';

function CopyCreatePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editCopyData, setEditCopyData] = useState(null);
  const [copyToDelete, setCopyToDelete] = useState(null);
  const [loadingStatusChange, setLoadingStatusChange] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 25;

  const { data: copytradings = [], isLoading, isFetching: copytradingsFetching, refetch: refetchCopytradings } = useQuery({
    queryKey: ['copytradings'],
    queryFn: async () => {
      const res = await apiFetch('/copytradings');
      const data = await res.json();
      return data.copytradings || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (copytradingId) =>
      apiFetch('/remove_copytrading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copytrading_id: copytradingId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['copytradings']);
      setCopyToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting configuration:', error);
      alert(t('copyCreate.deleteError'));
    },
  });

  // Filter copytradings
  const filteredCopytradings = useMemo(() => {
    return copytradings.filter(item => {
      const nameMatch = nameFilter === '' || item.name.toLowerCase().includes(nameFilter.toLowerCase());
      const statusMatch = statusFilter === 'all' ||
        (statusFilter === 'online' && item.status === 1) ||
        (statusFilter === 'offline' && item.status === 0);
      return nameMatch && statusMatch;
    });
  }, [copytradings, nameFilter, statusFilter]);

  // Paginate
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredCopytradings.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredCopytradings, currentPage, recordsPerPage]);

  const totalPages = Math.ceil(filteredCopytradings.length / recordsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, statusFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return { datePart: '-', timePart: '' };
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return { datePart, timePart };
  };

  const handleAdd = () => {
    setEditCopyData(null);
    setShowForm(true);
  };

  const handleEdit = (copyItem) => {
    setEditCopyData(copyItem);
    setShowForm(true);
  };

  const handleDelete = () => {
    if (copyToDelete) {
      deleteMutation.mutate(copyToDelete.id);
    }
  };

  const handleStatusChange = async (copyItem, action) => {
    if (
      (action === 'start' && copyItem.status === 1) ||
      (action === 'stop' && copyItem.status === 0)
    ) return;

    setLoadingStatusChange(true);
    setStatusMessage(action === 'start' ? t('copyCreate.starting') : t('copyCreate.stopping'));

    try {
      const res = await apiFetch(`/${action}_copytrading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copytrading_id: copyItem.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Unknown error');
      }

      setStatusMessage(action === 'start' ? t('copyCreate.startSuccess') : t('copyCreate.stopSuccess'));
      await queryClient.invalidateQueries(['copytradings']);

      setTimeout(() => { setLoadingStatusChange(false); setStatusMessage(''); }, 2000);
    } catch (err) {
      console.error(`Error ${action} copytrading:`, err);
      setStatusMessage(err.message);
      setTimeout(() => { setLoadingStatusChange(false); setStatusMessage(''); }, 3000);
    }
  };

  const isMutating = deleteMutation.isPending;
  const showLoader = loadingStatusChange || isMutating;
  const loaderMessage = () => {
    if (loadingStatusChange) return statusMessage;
    if (isMutating) return t('copyCreate.deleting');
    return '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <TradingBarsLoader title={t('copyCreate.loadingTitle')} subtitle={t('copyCreate.loadingDescription')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <FullScreenLoader isOpen={showLoader} message={loaderMessage()} />

      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
              {t('copyCreate.title')}
            </h1>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-semibold text-sm uppercase tracking-wider
                       transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-accent/50
                       border border-accent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('copyCreate.addNew')}</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Name Filter */}
              <div>
                <label htmlFor="name-filter" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('copyCreate.filterByName')}
                </label>
                <input
                  type="text"
                  id="name-filter"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder={t('copyCreate.searchByName')}
                  className="w-full px-4 py-2.5 bg-surface-primary border border-border text-content-primary rounded text-sm
                           placeholder-content-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('copyCreate.filterByStatus')}
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-primary border border-border text-content-primary rounded text-sm
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 appearance-none cursor-pointer"
                >
                  <option value="all">{t('copyCreate.allStatuses')}</option>
                  <option value="online">{t('copyCreate.online')}</option>
                  <option value="offline">{t('copyCreate.offline')}</option>
                </select>
              </div>

              {/* Clear */}
              <div className="flex items-end">
                <button
                  onClick={() => { setNameFilter(''); setStatusFilter('all'); }}
                  className="px-5 py-2.5 bg-surface-raised border border-border text-content-secondary rounded text-sm uppercase tracking-wider
                           hover:bg-surface-raised/80 hover:text-content-primary transition-colors
                           focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {t('copyCreate.clearFilters')}
                </button>
              </div>
            </div>

            {/* Filter status indicator */}
            <div className="mt-3 flex items-center gap-2 text-xs text-content-muted">
              <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
              <span className="uppercase tracking-wider">
                {t('common.showing')} {filteredCopytradings.length} {t('common.of')} {copytradings.length} {t('copyCreate.configurationsLabel')}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            {/* Table header bar */}
            <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-content-secondary">
                {t('copyCreate.registryHeader')}
              </span>
              <RefreshButton onClick={refetchCopytradings} isRefreshing={copytradingsFetching} label={t('common.refresh')} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyCreate.id')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyCreate.name')}</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyCreate.status')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyCreate.createdAt')}</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyCreate.actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-border-subtle transition-opacity duration-300 ${copytradingsFetching && !isLoading ? 'opacity-40' : ''}`}>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="text-content-muted text-sm">
                          {copytradings.length === 0
                            ? t('copyCreate.noConfigurations')
                            : t('copyCreate.noMatchingConfigurations')
                          }
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-raised/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-content-primary">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                            item.status === 1
                              ? 'bg-success-muted text-success'
                              : 'bg-surface-raised text-content-muted'
                          }`}>
                            {item.status === 1 ? t('copyCreate.statusOnline') : t('copyCreate.statusOffline')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm text-content-secondary font-mono">{formatDate(item.created_at).datePart}</span>
                            <span className="text-xs text-content-muted font-mono">{formatDate(item.created_at).timePart}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-3">
                            {/* Configure */}
                            <button
                              onClick={() => { if (item.status !== 1) handleEdit(item); }}
                              disabled={item.status === 1}
                              className="p-2 hover:bg-surface-raised rounded transition-all duration-200 group/btn disabled:opacity-30 disabled:cursor-not-allowed"
                              title={item.status !== 1 ? t('copyCreate.configure') : t('copyCreate.stopToEdit')}
                            >
                              <svg className="w-5 h-5 text-content-muted group-hover/btn:text-content-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                            {/* Start */}
                            <button
                              onClick={() => handleStatusChange(item, 'start')}
                              disabled={item.status === 1}
                              className="p-2 hover:bg-surface-raised rounded transition-all duration-200 group/btn disabled:opacity-30 disabled:cursor-not-allowed"
                              title={t('copyCreate.start')}
                            >
                              <svg className="w-5 h-5 text-content-muted group-hover/btn:text-success transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            {/* Stop */}
                            <button
                              onClick={() => handleStatusChange(item, 'stop')}
                              disabled={item.status === 0}
                              className="p-2 hover:bg-surface-raised rounded transition-all duration-200 group/btn disabled:opacity-30 disabled:cursor-not-allowed"
                              title={t('copyCreate.stop')}
                            >
                              <svg className="w-5 h-5 text-content-muted group-hover/btn:text-warning transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => { if (item.status !== 1) setCopyToDelete(item); }}
                              disabled={item.status === 1}
                              className="p-2 hover:bg-surface-raised rounded transition-all duration-200 group/btn disabled:opacity-30 disabled:cursor-not-allowed"
                              title={t('copyCreate.delete')}
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
                totalItems={filteredCopytradings.length}
                itemLabel={t('copyCreate.configurationsLabel')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Creation/Edit Form Modal */}
      {showForm && (
        <CopyCreationForm
          show={showForm}
          onClose={() => setShowForm(false)}
          initialData={editCopyData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {copyToDelete && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface border border-border rounded-lg shadow-2xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-danger-muted rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-content-primary">
                {t('copyCreate.deleteModalTitle')}
              </h3>
            </div>

            <p className="text-content-secondary text-sm mb-2">
              {t('copyCreate.deleteModalMessage')}
            </p>

            <div className="bg-surface-primary border border-border rounded p-3 mb-4">
              <p className="text-content-primary font-medium text-sm">
                {copyToDelete.name}
              </p>
              <p className="text-content-muted text-xs mt-1">
                ID: {copyToDelete.id}
              </p>
            </div>

            <p className="text-xs text-warning mb-6">
              {t('copyCreate.deleteModalCannotUndo')}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCopyToDelete(null)}
                className="px-5 py-2.5 bg-surface-raised border border-border text-content-secondary rounded text-sm font-medium
                         hover:bg-surface-raised/80 transition-colors"
              >
                {t('copyCreate.deleteModalCancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-5 py-2.5 bg-danger hover:bg-danger/80 text-white rounded text-sm font-medium transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? t('copyCreate.deleting') : t('copyCreate.deleteModalConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CopyCreatePage;
