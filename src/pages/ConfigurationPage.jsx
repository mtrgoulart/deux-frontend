import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { StrategyFormModal } from '../components/StrategyFormModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { FullScreenLoader } from '../components/FullScreenLoader';

const validateStrategy = (strategy) => {
  const errors = {};
  const baseRequiredFields = ['name', 'side', 'condition_limit', 'interval', 'simultaneous_operations'];

  baseRequiredFields.forEach(field => {
    if (!strategy[field] && strategy[field] !== 0) {
      errors[field] = 'Field is required.';
    }
  });

  const sizeMode = strategy.size_mode || 'percentage';

  if (sizeMode === 'percentage') {
    if (!strategy.percent && strategy.percent !== 0) {
      errors.percent = 'Percent is required for percentage mode.';
    } else if (parseFloat(strategy.percent) <= 0 || parseFloat(strategy.percent) > 100) {
      errors.percent = 'Percent must be between 0 and 100.';
    }
  } else if (sizeMode === 'flat_value') {
    if (!strategy.flat_value && strategy.flat_value !== 0) {
      errors.flat_value = 'Flat value is required for flat value mode.';
    } else if (parseFloat(strategy.flat_value) <= 0) {
      errors.flat_value = 'Flat value must be greater than 0.';
    }
  }

  return errors;
}

function ConfigurationPage() {
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
  const recordsPerPage = 50;

  const [editingStrategy, setEditingStrategy] = useState(null);
  const [strategyToDelete, setStrategyToDelete] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoadingParameters, setIsLoadingParameters] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const { data: strategies = [], isLoading: isLoadingStrategies } = useQuery({
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
        alert("An error occurred while saving the configuration.");
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
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        alert(data.error || "Could not load the configuration data.");
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
      alert("A network error occurred. Please try again.");
    } finally {
      setIsLoadingParameters(false);
    }
  };

  const handleSave = async (strategyFromForm) => {
    const errors = validateStrategy(strategyFromForm);
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
    if (isLoadingParameters) return "Loading parameters...";
    if (isMutating) return "Processing your request...";
    return "";
  };

  if (isLoadingStrategies) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto border-4 border-red-900/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-24 h-24 mx-auto border-t-4 border-r-4 border-red-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 tracking-wider uppercase mb-2">
            Loading Configurations
          </h2>
          <p className="text-gray-600 font-mono text-sm tracking-wide">
            [FETCHING CONFIGURATION DATA...]
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <FullScreenLoader isOpen={showLoader} message={loaderMessage()} />

      {/* Cyberpunk Header */}
      <div className="relative border-b border-red-900/50 bg-black/40 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-red-900/10"></div>
        <div className="container mx-auto px-4 md:px-6 py-8 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-1 h-16 bg-gradient-to-b from-red-500 to-red-900"></div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600 tracking-wider uppercase">
                  Configuration
                </h1>
                <p className="text-gray-500 text-sm mt-1 font-mono tracking-wide">
                  STRATEGY SETTINGS // {filteredStrategies.length} CONFIGURATIONS AVAILABLE
                </p>
              </div>
            </div>
            {/* Add Configuration Button - Improved */}
            <button
              onClick={handleAdd}
              className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg font-bold text-base uppercase tracking-wider
                       shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300
                       hover:scale-105 hover:from-green-500 hover:to-green-600
                       focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-black
                       border-2 border-green-400/50 hover:border-green-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Configuration</span>
            </button>
          </div>
          {/* Tech decoration lines */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-red-500"></div>
            <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-red-400"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Filters */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-red-500"></div>
            <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider font-mono">
              ◆ Filters
            </h2>
            <div className="flex-1 h-px bg-red-900/30"></div>
          </div>

          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-red-500/5 blur-xl rounded-lg"></div>

            <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg p-5 shadow-2xl">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>

              <div className="flex flex-col md:flex-row gap-4">
                {/* Name Filter */}
                <div className="flex-1">
                  <label
                    htmlFor="name-filter"
                    className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono"
                  >
                    ◆ Filter by Name
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      id="name-filter"
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      placeholder="Search by name..."
                      className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                               placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                               hover:border-red-700 transition-all duration-300 backdrop-blur-sm"
                    />
                    <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 rounded transition-all duration-300 pointer-events-none"></div>
                  </div>
                </div>

                {/* Side Filter */}
                <div className="flex-1">
                  <label
                    htmlFor="side-filter"
                    className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono"
                  >
                    ◆ Filter by Side
                  </label>
                  <div className="relative group">
                    <select
                      id="side-filter"
                      value={sideFilter}
                      onChange={(e) => setSideFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                               focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                               hover:border-red-700 transition-all duration-300
                               appearance-none cursor-pointer backdrop-blur-sm"
                    >
                      <option value="all" className="bg-black text-red-400">All Sides</option>
                      <option value="buy" className="bg-black text-red-400">Buy</option>
                      <option value="sell" className="bg-black text-red-400">Sell</option>
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500"></div>
                    </div>
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 rounded transition-all duration-300 pointer-events-none"></div>
                  </div>
                </div>

                {/* Size Mode Filter */}
                <div className="flex-1">
                  <label
                    htmlFor="sizemode-filter"
                    className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono"
                  >
                    ◆ Filter by Size Mode
                  </label>
                  <div className="relative group">
                    <select
                      id="sizemode-filter"
                      value={sizeModeFilter}
                      onChange={(e) => setSizeModeFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                               focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                               hover:border-red-700 transition-all duration-300
                               appearance-none cursor-pointer backdrop-blur-sm"
                    >
                      <option value="all" className="bg-black text-red-400">All Modes</option>
                      <option value="percentage" className="bg-black text-red-400">Percentage</option>
                      <option value="flat_value" className="bg-black text-red-400">Flat Value</option>
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500"></div>
                    </div>
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 rounded transition-all duration-300 pointer-events-none"></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-end gap-3">
                  <button
                    onClick={() => {
                      setNameFilter('');
                      setSideFilter('all');
                      setSizeModeFilter('all');
                    }}
                    className="px-6 py-3 bg-red-900/30 border border-red-500/30 text-red-400 rounded font-mono text-sm uppercase tracking-wider
                             hover:bg-red-900/50 hover:border-red-500/50 transition-all duration-300
                             focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Filter status indicator */}
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 font-mono">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="uppercase tracking-wider">
                  Showing {filteredStrategies.length} of {strategies.length} configurations
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Configurations Table */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-red-500"></div>
            <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider font-mono">
              ◆ Configuration Database
            </h2>
            <div className="flex-1 h-px bg-red-900/30"></div>
          </div>

          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-lg"></div>

            <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg overflow-hidden shadow-2xl">
              {/* Corner tech elements */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500 z-10"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500 z-10"></div>

              {/* Table header */}
              <div className="bg-black/40 border-b border-red-900/30 px-6 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-700"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-900"></div>
                  </div>
                  <span className="text-sm font-mono text-red-500 uppercase tracking-wider">
                    Configuration Registry
                  </span>
                </div>
              </div>

              {/* Table content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-red-900/30 bg-black/20">
                      <th
                        onClick={() => handleSort('id')}
                        className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono cursor-pointer hover:bg-red-900/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          ID
                          <SortIcon field="id" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono cursor-pointer hover:bg-red-900/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Name
                          <SortIcon field="name" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Side</th>
                      <th
                        onClick={() => handleSort('condition_limit')}
                        className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono cursor-pointer hover:bg-red-900/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Condition
                          <SortIcon field="condition_limit" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('size_mode')}
                        className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono cursor-pointer hover:bg-red-900/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Size Mode
                          <SortIcon field="size_mode" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-900/20">
                    {paginatedStrategies.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="text-gray-600 font-mono text-sm">
                            {strategies.length === 0
                              ? '[NO CONFIGURATIONS FOUND]'
                              : '[NO CONFIGURATIONS MATCH FILTERS]'
                            }
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedStrategies.map((strategy) => (
                        <tr key={strategy.id} className="hover:bg-red-900/5 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                            {strategy.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-400 font-mono">
                            {strategy.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                              strategy.side === 'buy'
                                ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                                : 'bg-red-900/30 text-red-400 border border-red-500/30'
                            }`}>
                              {strategy.side === 'buy' ? '▲ BUY' : '▼ SELL'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                            {strategy.condition_limit || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                            {(strategy.size_mode || 'percentage') === 'percentage' ? 'Percentage' : 'Flat Value'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleConfigure(strategy.id)}
                                className="p-2 hover:bg-red-900/30 rounded transition-all duration-200 group/btn"
                                title="Configure"
                              >
                                <svg className="w-5 h-5 text-gray-400 group-hover/btn:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setStrategyToDelete(strategy)}
                                className="p-2 hover:bg-red-900/30 rounded transition-all duration-200 group/btn"
                                title="Delete"
                              >
                                <svg className="w-5 h-5 text-gray-400 group-hover/btn:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-black/20 border-t border-red-900/20 px-6 py-4">
                  <div className="flex justify-between items-center">
                    {/* Page info */}
                    <div className="text-sm text-gray-500 font-mono">
                      Showing <span className="text-red-400 font-bold">{((currentPage - 1) * recordsPerPage) + 1}</span> to{' '}
                      <span className="text-red-400 font-bold">
                        {Math.min(currentPage * recordsPerPage, filteredStrategies.length)}
                      </span>{' '}
                      of <span className="text-red-400 font-bold">{filteredStrategies.length}</span> configurations
                    </div>

                    {/* Pagination buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 text-red-400 rounded-lg font-mono text-sm uppercase tracking-wider
                                 hover:bg-red-900/30 hover:border-red-500/50 transition-all duration-300
                                 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gradient-to-br disabled:hover:from-gray-900 disabled:hover:via-black disabled:hover:to-gray-900
                                 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      >
                        « Prev
                      </button>
                      <span className="text-gray-400 font-mono text-sm">
                        <span className="text-red-500 font-bold">{currentPage}</span> / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-4 py-2 bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 text-red-400 rounded-lg font-mono text-sm uppercase tracking-wider
                                 hover:bg-red-900/30 hover:border-red-500/50 transition-all duration-300
                                 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gradient-to-br disabled:hover:from-gray-900 disabled:hover:via-black disabled:hover:to-gray-900
                                 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      >
                        Next »
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom decorations */}
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500 z-10"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500 z-10"></div>
            </div>
          </div>
        </div>

        {/* Tech footer decoration */}
        <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-red-500"></div>
          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
          <div className="w-24 h-px bg-red-500"></div>
          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-red-500"></div>
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
