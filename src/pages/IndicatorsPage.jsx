import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../utils/api';
import EditIndicatorModal from '../components/EditIndicatorModal';

function IndicatorsPage() {
  const [indicators, setIndicators] = useState([]);
  const [instances, setInstances] = useState([]);

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
  const [revealKey, setRevealKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // State for the Delete Confirmation modal
  const [indicatorToDelete, setIndicatorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIndicators = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/select_indicators_by_user');
      const data = await res.json();
      setIndicators(data.indicator_data || []);
    } catch (error) {
      console.error("Failed to fetch indicators:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInstances = async () => {
    try {
      const res = await apiFetch('/get_instances?api_key_id=all');
      const data = await res.json();
      setInstances(data.instances || []);
    } catch (error) {
      console.error("Failed to fetch instances:", error);
    }
  };

  useEffect(() => {
    fetchIndicators();
    fetchInstances();
  }, []);

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
      fetchIndicators();
    } catch (error) {
      console.error("Failed to delete indicator:", error);
      alert("Error deleting indicator.");
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
      fetchIndicators();
    } catch (error) {
        console.error("Save failed:", error);
        throw error;
    }
  };

  const handleViewKey = async (indicator) => {
    setShowKeyModal(true);
    setKeyModalData(indicator);
    setRevealKey(false);
    setCopySuccess(false);

    if (indicator.key) {
      return;
    }

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
        setIndicators(currentIndicators =>
          currentIndicators.map(ind =>
            ind.id === indicator.id ? { ...ind, key: fetchedKey } : ind
          )
        );
        setKeyModalData(prev => ({ ...prev, key: fetchedKey }));
      } else {
        alert(data.error || 'Error fetching the indicator key.');
        setShowKeyModal(false);
      }
    } catch (err) {
      alert('Error connecting to the server.');
      setShowKeyModal(false);
    } finally {
      setIsLoadingKey(false);
    }
  };

  const handleCopyKey = async () => {
    if (!keyModalData || !keyModalData.key || copySuccess) return;
    const textToCopy = `key:${keyModalData.key},side:${keyModalData.side}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy key: ', err);
      alert('Your browser does not support this function or permission was denied.');
    }
  };

  if (isLoading) {
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
            Loading Indicators
          </h2>
          <p className="text-gray-600 font-mono text-sm tracking-wide">
            [FETCHING INDICATOR DATA...]
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Cyberpunk Header */}
      <div className="relative border-b border-red-900/50 bg-black/40 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-red-900/10"></div>
        <div className="container mx-auto px-4 md:px-6 py-8 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1 h-16 bg-gradient-to-b from-red-500 to-red-900"></div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600 tracking-wider uppercase">
                  Indicators
                </h1>
                <p className="text-gray-500 text-sm mt-1 font-mono tracking-wide">
                  SIGNAL MANAGEMENT // {filteredIndicators.length} INDICATORS ACTIVE
                </p>
              </div>
            </div>
            {/* Add Indicator Button */}
            <button
              onClick={handleOpenAddModal}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 text-green-400 rounded font-mono text-sm uppercase tracking-wider
                       hover:bg-green-900/50 hover:border-green-500/50 transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-green-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Indicator
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* Instance Filter */}
                <div className="flex-1">
                  <label
                    htmlFor="instance-filter"
                    className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono"
                  >
                    ◆ Filter by Strategy
                  </label>
                  <div className="relative group">
                    <select
                      id="instance-filter"
                      value={instanceFilter}
                      onChange={(e) => setInstanceFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                               focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                               hover:border-red-700 transition-all duration-300
                               appearance-none cursor-pointer backdrop-blur-sm"
                    >
                      <option value="all" className="bg-black text-red-400">All Strategies</option>
                      {instances.map(instance => (
                        <option key={instance.id} value={instance.id} className="bg-black text-red-400">
                          ({instance.id}) {instance.name || 'Untitled'}
                        </option>
                      ))}
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500"></div>
                    </div>
                    {/* Hover glow */}
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

                {/* Mandatory Filter */}
                <div className="flex-1">
                  <label
                    htmlFor="mandatory-filter"
                    className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono"
                  >
                    ◆ Filter by Mandatory
                  </label>
                  <div className="relative group">
                    <select
                      id="mandatory-filter"
                      value={mandatoryFilter}
                      onChange={(e) => setMandatoryFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                               focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                               hover:border-red-700 transition-all duration-300
                               appearance-none cursor-pointer backdrop-blur-sm"
                    >
                      <option value="all" className="bg-black text-red-400">All</option>
                      <option value="yes" className="bg-black text-red-400">Yes</option>
                      <option value="no" className="bg-black text-red-400">No</option>
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500"></div>
                    </div>
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 rounded transition-all duration-300 pointer-events-none"></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => {
                    setNameFilter('');
                    setInstanceFilter('all');
                    setSideFilter('all');
                    setMandatoryFilter('all');
                  }}
                  className="px-6 py-3 bg-red-900/30 border border-red-500/30 text-red-400 rounded font-mono text-sm uppercase tracking-wider
                           hover:bg-red-900/50 hover:border-red-500/50 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  Clear All
                </button>
              </div>

              {/* Filter status indicator */}
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 font-mono">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="uppercase tracking-wider">
                  Showing {filteredIndicators.length} of {indicators.length} indicators
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicators Table */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-red-500"></div>
            <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider font-mono">
              ◆ Indicator Database
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
                    Signal Registry
                  </span>
                </div>
              </div>

              {/* Table content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-red-900/30 bg-black/20">
                      <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Strategy</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Side</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Mandatory</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Created At</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-900/20">
                    {paginatedIndicators.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="text-gray-600 font-mono text-sm">
                            {indicators.length === 0
                              ? '[NO INDICATORS FOUND]'
                              : '[NO INDICATORS MATCH FILTERS]'
                            }
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedIndicators.map((ind) => (
                        <tr key={ind.id} className="hover:bg-red-900/5 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                            {ind.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-400 font-mono">
                            {ind.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                            {ind.instance_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                              ind.side === 'buy'
                                ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                                : 'bg-red-900/30 text-red-400 border border-red-500/30'
                            }`}>
                              {ind.side === 'buy' ? '▲ BUY' : '▼ SELL'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                              ind.mandatory
                                ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                                : 'bg-gray-900/30 text-gray-400 border border-gray-500/30'
                            }`}>
                              {ind.mandatory ? '✓ YES' : '✗ NO'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                            {new Date(ind.created_at).toLocaleDateString()} {new Date(ind.created_at).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleViewKey(ind)}
                                className="p-2 hover:bg-red-900/30 rounded transition-all duration-200 group/btn"
                                title="View Key"
                              >
                                <svg className="w-5 h-5 text-gray-400 group-hover/btn:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(ind)}
                                className="p-2 hover:bg-red-900/30 rounded transition-all duration-200 group/btn"
                                title="Configure"
                              >
                                <svg className="w-5 h-5 text-gray-400 group-hover/btn:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setIndicatorToDelete(ind)}
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
                        {Math.min(currentPage * recordsPerPage, filteredIndicators.length)}
                      </span>{' '}
                      of <span className="text-red-400 font-bold">{filteredIndicators.length}</span> indicators
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

      {showModal && (
        <EditIndicatorModal
          indicator={selectedIndicator}
          instances={instances}
          onClose={handleCloseModal}
          onSave={handleSaveIndicator}
        />
      )}

      {showKeyModal && keyModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 p-6 rounded-lg shadow-xl max-w-lg w-full">
            {/* Corner decorations */}
            <div className="relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>

              <h3 className="text-xl font-semibold mb-1 text-red-500 font-mono uppercase tracking-wider">
                Indicator Key
              </h3>
              <p className="text-sm text-gray-400 mb-6 font-mono">
                {keyModalData.name} ({keyModalData.id})
              </p>

              {isLoadingKey ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                  <p className="ml-4 text-gray-300">Loading key...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-red-500 mb-1 font-mono">Message to Copy</label>
                    <div className="flex items-center gap-2">
                      <input
                        type={revealKey ? 'text' : 'password'}
                        readOnly
                        value={`key:${keyModalData.key || ''},side:${keyModalData.side}`}
                        className="flex-grow p-2 rounded bg-black/60 border border-red-900/50 text-red-400 font-mono"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setRevealKey(!revealKey)}
                          className="p-2 hover:bg-red-900/30 rounded transition-all duration-200"
                          title={revealKey ? 'Hide' : 'Show'}
                        >
                          <svg className="w-5 h-5 text-gray-400 hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {revealKey ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            ) : (
                              <>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </>
                            )}
                          </svg>
                        </button>
                        <button
                          onClick={handleCopyKey}
                          disabled={copySuccess}
                          className="p-2 hover:bg-red-900/30 rounded transition-all duration-200"
                          title={copySuccess ? 'Copied!' : 'Copy'}
                        >
                          <svg className={`w-5 h-5 transition-colors ${copySuccess ? 'text-green-400' : 'text-gray-400 hover:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {copySuccess ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-500 mb-1 font-mono">Key Only</label>
                    <div className="flex items-center gap-2">
                      <input
                        type={revealKey ? 'text' : 'password'}
                        readOnly
                        value={keyModalData.key || ''}
                        className="flex-grow p-2 rounded bg-black/60 border border-red-900/50 text-red-400 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="px-6 py-3 bg-red-900/30 border border-red-500/30 text-red-400 rounded font-mono text-sm uppercase tracking-wider
                           hover:bg-red-900/50 hover:border-red-500/50 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  disabled={isLoadingKey}
                >
                  Close
                </button>
              </div>

              {/* Bottom corner decorations */}
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {indicatorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="relative">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>

              {isDeleting ? (
                <div className="flex flex-col items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                  <p className="mt-4 text-gray-300 font-mono">Deleting indicator...</p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-red-500 font-mono uppercase tracking-wider">Confirm Deletion</h3>
                  <p className="text-gray-300 my-4 font-mono">
                    Are you sure you want to delete the indicator?
                    <br />
                    <strong className="text-red-400">{indicatorToDelete.name} (ID: {indicatorToDelete.id})</strong>
                  </p>
                  <p className="text-sm text-amber-400 font-mono">This action cannot be undone.</p>
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      onClick={() => setIndicatorToDelete(null)}
                      className="px-6 py-3 bg-gray-900/30 border border-gray-500/30 text-gray-400 rounded font-mono text-sm uppercase tracking-wider
                               hover:bg-gray-900/50 hover:border-gray-500/50 transition-all duration-300
                               focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="px-6 py-3 bg-red-900/30 border border-red-500/30 text-red-400 rounded font-mono text-sm uppercase tracking-wider
                               hover:bg-red-900/50 hover:border-red-500/50 transition-all duration-300
                               focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}

              {/* Bottom corner decorations */}
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndicatorsPage;
