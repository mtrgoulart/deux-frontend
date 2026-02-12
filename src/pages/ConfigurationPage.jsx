import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { StrategyFormModal } from '../components/StrategyFormModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { FullScreenLoader } from '../components/FullScreenLoader';
import Pagination from '../components/Pagination';
import TradingBarsLoader from '../components/TradingBarsLoader';
import RefreshButton from '../components/RefreshButton';

const validateStrategy = (strategy, t) => {
  const errors = {};
  const baseRequiredFields = ['name', 'side', 'condition_limit', 'interval', 'simultaneous_operations'];

  baseRequiredFields.forEach(field => {
    if (!strategy[field] && strategy[field] !== 0) {
      errors[field] = t('configuration.validation.required');
    }
  });

  if (strategy.name && strategy.name.length > 50) {
    errors.name = t('configuration.validation.nameTooLong');
  }

  const sizeMode = strategy.size_mode || 'percentage';

  if (sizeMode === 'percentage') {
    if (!strategy.percent && strategy.percent !== 0) {
      errors.percent = t('configuration.validation.percentRequired');
    } else if (parseFloat(strategy.percent) <= 0 || parseFloat(strategy.percent) > 100) {
      errors.percent = t('configuration.validation.percentRange');
    }
  } else if (sizeMode === 'flat_value') {
    if (!strategy.flat_value && strategy.flat_value !== 0) {
      errors.flat_value = t('configuration.validation.flatValueRequired');
    } else if (parseFloat(strategy.flat_value) <= 0) {
      errors.flat_value = t('configuration.validation.flatValuePositive');
    }
  }

  return errors;
}

function ConfigurationPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [sideFilter, setSideFilter] = useState('all');
  const [sizeModeFilter, setSizeModeFilter] = useState('all');

  // Sorting states
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 25;

  const [editingStrategy, setEditingStrategy] = useState(null);
  const [strategyToDelete, setStrategyToDelete] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoadingParameters, setIsLoadingParameters] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const { data: strategies = [], isLoading: isLoadingStrategies, isFetching: strategiesFetching, refetch: refetchStrategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const res = await apiFetch('/get_strategies');
      const data = await res.json();
      return data.strategies || [];
    }
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries(['strategies']);
      setFormErrors({});
    },
    onError: (error) => {
        console.error("Mutation failed", error);
        alert(t('configuration.saveError'));
    }
  };

  const saveMutation = useMutation({
    mutationFn: (strategy) => apiFetch('/save_strategy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(strategy) }),
    ...mutationOptions,
  });

  const updateMutation = useMutation({
    mutationFn: (strategy) => apiFetch('/update_strategy_parameters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(strategy) }),
    ...mutationOptions,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch('/delete_strategy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }),
    ...mutationOptions,
  });

  // Filter strategies
  const filteredStrategies = useMemo(() => {
    return strategies.filter(strategy => {
      const nameMatch = nameFilter === '' || strategy.name.toLowerCase().includes(nameFilter.toLowerCase());
      const sideMatch = sideFilter === 'all' || strategy.side === sideFilter;
      const sizeModeMatch = sizeModeFilter === 'all' || (strategy.size_mode || 'percentage') === sizeModeFilter;
      return nameMatch && sideMatch && sizeModeMatch;
    });
  }, [strategies, nameFilter, sideFilter, sizeModeFilter]);

  // Sort strategies
  const sortedStrategies = useMemo(() => {
    const sorted = [...filteredStrategies];
    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle special cases
      if (sortField === 'size_mode') {
        aVal = a.size_mode || 'percentage';
        bVal = b.size_mode || 'percentage';
      }

      // Handle numeric fields
      if (sortField === 'id' || sortField === 'condition_limit') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      // Handle string fields
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredStrategies, sortField, sortDirection]);

  // Paginate sorted strategies
  const paginatedStrategies = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return sortedStrategies.slice(startIndex, endIndex);
  }, [sortedStrategies, currentPage, recordsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(sortedStrategies.length / recordsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, sideFilter, sizeModeFilter]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-content-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-content-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const handleAdd = () => {
    setEditingStrategy(null);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleConfigure = async (id) => {
    setIsLoadingParameters(true);
    setFormErrors({});
    try {
      const res = await apiFetch(`/get_strategy_parameters?id=${id}`);
      const data = await res.json();
      if (res.ok) {
        const formattedData = {
          ...data,
          percent: data.size_mode === 'percentage' && data.percent ? data.percent * 100 : data.percent,
          size_mode: data.size_mode || 'percentage',
        };
        setEditingStrategy(formattedData);
        setIsFormOpen(true);
      } else {
        alert(data.error || t('configuration.loadError'));
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
      alert(t('configuration.networkError'));
    } finally {
      setIsLoadingParameters(false);
    }
  };

  const handleSave = async (strategyFromForm) => {
    const errors = validateStrategy(strategyFromForm, t);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const sizeMode = strategyFromForm.size_mode || 'percentage';

    const payload = {
      ...strategyFromForm,
      id: strategyFromForm.id || undefined,
      size_mode: sizeMode,
    };

    if (sizeMode === 'percentage') {
      payload.percent = parseFloat(strategyFromForm.percent) / 100;
      payload.flat_value = null;
    } else {
      payload.flat_value = parseFloat(strategyFromForm.flat_value);
      payload.percent = 0;
    }

    const mutation = strategyFromForm.id ? updateMutation : saveMutation;
    await mutation.mutateAsync(payload);

    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (strategyToDelete?.id) {
      const idToDelete = strategyToDelete.id;
      setStrategyToDelete(null);
      await deleteMutation.mutateAsync(idToDelete);
    }
  };

  const isMutating = saveMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const showLoader = isMutating || isLoadingParameters;
  const loaderMessage = () => {
    if (isLoadingParameters) return t('configuration.loadingParameters');
    if (isMutating) return t('configuration.processingRequest');
    return "";
  };

  if (isLoadingStrategies) {
    return (
      <div className="bg-surface-primary">
        <TradingBarsLoader title={t('configuration.loadingTitle')} subtitle={t('configuration.loadingDescription')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <FullScreenLoader isOpen={showLoader} message={loaderMessage()} />

      {/* Header */}
      <div className="container mx-auto px-4 md:px-6 py-6">
        <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
              {t('configuration.title')}
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
              <span>{t('configuration.addConfiguration')}</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Filters */}
          <div>
            <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
              {t('configuration.filters')}
            </h2>

            <div className="bg-surface border border-border rounded-lg p-5">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Name Filter */}
                <div className="flex-1">
                  <label
                    htmlFor="name-filter"
                    className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider"
                  >
                    {t('configuration.filterByName')}
                  </label>
                  <input
                    type="text"
                    id="name-filter"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder={t('configuration.searchByName')}
                    className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                             placeholder-content-muted focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-accent/20
                             hover:border-border-accent transition-all duration-300"
                  />
                </div>

                {/* Side Filter */}
                <div className="flex-1">
                  <label
                    htmlFor="side-filter"
                    className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider"
                  >
                    {t('configuration.filterBySide')}
                  </label>
                  <select
                    id="side-filter"
                    value={sideFilter}
                    onChange={(e) => setSideFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                             focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-accent/20
                             hover:border-border-accent transition-all duration-300
                             appearance-none cursor-pointer"
                  >
                    <option value="all">{t('configuration.allSides')}</option>
                    <option value="buy">{t('configuration.buy')}</option>
                    <option value="sell">{t('configuration.sell')}</option>
                  </select>
                </div>

                {/* Size Mode Filter */}
                <div className="flex-1">
                  <label
                    htmlFor="sizemode-filter"
                    className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider"
                  >
                    {t('configuration.filterBySizeMode')}
                  </label>
                  <select
                    id="sizemode-filter"
                    value={sizeModeFilter}
                    onChange={(e) => setSizeModeFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                             focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-accent/20
                             hover:border-border-accent transition-all duration-300
                             appearance-none cursor-pointer"
                  >
                    <option value="all">{t('configuration.allModes')}</option>
                    <option value="percentage">{t('configuration.percentage')}</option>
                    <option value="flat_value">{t('configuration.flatValue')}</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-end gap-3">
                  <button
                    onClick={() => {
                      setNameFilter('');
                      setSideFilter('all');
                      setSizeModeFilter('all');
                    }}
                    className="px-6 py-3 bg-surface-raised border border-border text-content-secondary rounded text-sm uppercase tracking-wider
                             hover:bg-surface-raised/80 hover:text-content-primary transition-all duration-300
                             focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {t('configuration.clearAll')}
                  </button>
                </div>
              </div>

              {/* Filter status indicator */}
              <div className="mt-3 flex items-center gap-2 text-xs text-content-muted">
                <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                <span className="uppercase tracking-wider">
                  {t('common.showing')} {filteredStrategies.length} {t('common.of')} {strategies.length} {t('configuration.configurationsLabel')}
                </span>
              </div>
            </div>
          </div>

          {/* Configurations Table */}
          <div>
            <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
              {t('configuration.database')}
            </h2>

            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              {/* Table header bar */}
              <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3 flex items-center justify-between">
                <span className="text-sm text-content-accent uppercase tracking-wider">
                  {t('configuration.registry')}
                </span>
                <RefreshButton onClick={refetchStrategies} isRefreshing={strategiesFetching} label={t('common.refresh')} />
              </div>

              {/* Table content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-raised/30">
                      <th
                        onClick={() => handleSort('id')}
                        className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider cursor-pointer hover:bg-surface-raised/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {t('configuration.id')}
                          <SortIcon field="id" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider cursor-pointer hover:bg-surface-raised/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {t('configuration.name')}
                          <SortIcon field="name" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">
                        {t('configuration.side')}
                      </th>
                      <th
                        onClick={() => handleSort('condition_limit')}
                        className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider cursor-pointer hover:bg-surface-raised/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {t('configuration.condition')}
                          <SortIcon field="condition_limit" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('size_mode')}
                        className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider cursor-pointer hover:bg-surface-raised/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {t('configuration.sizeMode')}
                          <SortIcon field="size_mode" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">
                        {t('configuration.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-border-subtle transition-opacity duration-300 ${strategiesFetching && !isLoadingStrategies ? 'opacity-40' : ''}`}>
                    {paginatedStrategies.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="text-content-muted text-sm">
                            {strategies.length === 0
                              ? t('configuration.noConfigurations')
                              : t('configuration.noMatchingConfigurations')
                            }
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedStrategies.map((strategy) => (
                        <tr key={strategy.id} className="hover:bg-surface-raised/30 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                            {strategy.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-content-primary">
                            {strategy.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                              strategy.side === 'buy'
                                ? 'bg-success-muted text-success'
                                : 'bg-danger-muted text-danger'
                            }`}>
                              {strategy.side === 'buy' ? t('configuration.buyBadge') : t('configuration.sellBadge')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                            {strategy.condition_limit || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary">
                            {(strategy.size_mode || 'percentage') === 'percentage' ? t('configuration.percentage') : t('configuration.flatValue')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleConfigure(strategy.id)}
                                className="p-2 hover:bg-surface-raised/50 rounded transition-all duration-200 group/btn"
                                title={t('configuration.configure')}
                              >
                                <svg className="w-5 h-5 text-content-secondary group-hover/btn:text-content-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setStrategyToDelete(strategy)}
                                className="p-2 hover:bg-surface-raised/50 rounded transition-all duration-200 group/btn"
                                title={t('configuration.delete')}
                              >
                                <svg className="w-5 h-5 text-content-secondary group-hover/btn:text-content-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  totalItems={sortedStrategies.length}
                  itemLabel={t('configuration.configurationsLabel')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <StrategyFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        initialData={editingStrategy}
        formErrors={formErrors}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(strategyToDelete)}
        onClose={() => setStrategyToDelete(null)}
        onConfirm={handleDelete}
        strategy={strategyToDelete}
      />
    </div>
  );
}

export default ConfigurationPage;
