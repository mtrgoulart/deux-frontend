import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import InstanceCreationForm from '../components/InstanceCreationForm';

function StrategyPage() {
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
  const [operationPercent, setOperationPercent] = useState('100');
  const [isSubmittingOperation, setIsSubmittingOperation] = useState(false);

  const [panicModalOpen, setPanicModalOpen] = useState(false);
  const [isStoppingAll, setIsStoppingAll] = useState(false);
  const [panicStatusMessage, setPanicStatusMessage] = useState('');

  // Resume modal states
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [resumeStatusMessage, setResumeStatusMessage] = useState('');

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  const handleInstanceStatusChange = async (instance, action) => {
    if (
      (action === 'start' && instance.status !== 1) ||
      (action === 'stop' && instance.status !== 2)
    ) return;

    // Block starting instances when in panic mode
    if (action === 'start' && isPanicActive) {
      alert('❌ Cannot start instances while in PANIC MODE. Please use the Resume button to exit panic mode first.');
      return;
    }

    setLoadingStatusChange(true);
    setStatusMessage(action === 'start' ? 'Starting strategy...' : 'Stopping strategy...');

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

      setStatusMessage(action === 'start' ? '✅ Strategy successfully started' : '🛑 Strategy successfully stopped');
      await queryClient.invalidateQueries(['instances', selectedApiKey]);

      setTimeout(() => {
        setLoadingStatusChange(false);
        setStatusMessage('');
      }, 2000);
    } catch (err) {
      console.error(`Error ${action} instance:`, err);
      setStatusMessage(`❌ ${err.message}`);
      setTimeout(() => {
        setLoadingStatusChange(false);
        setStatusMessage('');
      }, 3000);
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
        alert(data.error || 'Error deleting the instance.');
      }
    } catch (err) {
      console.error('Error deleting instance:', err);
      alert('Error deleting the instance.');
    } finally {
      setLoadingDelete(false);
      setInstanceToDelete(null);
    }
  };

  const handlePanicStop = async () => {
    setPanicModalOpen(false);
    setIsStoppingAll(true);
    setPanicStatusMessage('Executing panic action: selling assets and stopping strategies...');

    try {
      const res = await apiFetch('/panic_button', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'An unknown error occurred during the panic action.');
      }

      setPanicStatusMessage(`✅ ${data.message}`);
      await queryClient.invalidateQueries(['instances', selectedApiKey]);
      await queryClient.invalidateQueries(['panicState']);

      // Force immediate refetch of panic state
      await refetchPanicState();

      setTimeout(() => {
        setIsStoppingAll(false);
        setPanicStatusMessage('');
      }, 4000);

    } catch (err) {
      console.error('Error triggering panic button:', err);
      setPanicStatusMessage(`❌ Error during panic action: ${err.message}`);

      setTimeout(() => {
        setIsStoppingAll(false);
        setPanicStatusMessage('');
      }, 5000);
    }
  };

  const handleResumeWithRestart = async () => {
    setResumeModalOpen(false);
    setIsResuming(true);
    setResumeStatusMessage('Resuming from panic mode and restarting strategies...');

    try {
      const res = await apiFetch('/resume_from_panic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restart_instances: true })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'An unknown error occurred during resume.');
      }

      setResumeStatusMessage(`✅ ${data.message}`);
      await queryClient.invalidateQueries(['instances', selectedApiKey]);
      await queryClient.invalidateQueries(['panicState']);

      // Force immediate refetch of panic state
      await refetchPanicState();

      setTimeout(() => {
        setIsResuming(false);
        setResumeStatusMessage('');
      }, 4000);

    } catch (err) {
      console.error('Error resuming from panic:', err);
      setResumeStatusMessage(`❌ Error during resume: ${err.message}`);

      setTimeout(() => {
        setIsResuming(false);
        setResumeStatusMessage('');
      }, 5000);
    }
  };

  const handleResumeWithoutRestart = async () => {
    setResumeModalOpen(false);
    setIsResuming(true);
    setResumeStatusMessage('Exiting panic mode without restarting strategies...');

    try {
      const res = await apiFetch('/resume_from_panic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restart_instances: false })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'An unknown error occurred during resume.');
      }

      setResumeStatusMessage(`✅ ${data.message}`);
      await queryClient.invalidateQueries(['panicState']);

      // Force immediate refetch of panic state
      await refetchPanicState();

      setTimeout(() => {
        setIsResuming(false);
        setResumeStatusMessage('');
      }, 4000);

    } catch (err) {
      console.error('Error resuming from panic:', err);
      setResumeStatusMessage(`❌ Error during resume: ${err.message}`);

      setTimeout(() => {
        setIsResuming(false);
        setResumeStatusMessage('');
      }, 5000);
    }
  };

  const handleOpenOperationModal = (instance, side) => {
    if (instance.status !== 2) {
      alert("Manual operations can only be executed on strategies in 'Running' state.");
      return;
    }
    setCurrentOperation({ instance, side });
    setOperationPercent('100');
    setOperationModalOpen(true);
  };

  const handleConfirmOperation = async () => {
    if (!currentOperation) return;

    const percent = parseFloat(operationPercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      alert("Please enter a valid percentage (e.g., 1 to 100).");
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
        alert(`✅ ${currentOperation.side} order sent successfully! Task ID: ${data.task_id}`);
        setOperationModalOpen(false);
        setCurrentOperation(null);
      } else {
        alert(`❌ Error sending order: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error sending manual operation:', err);
      alert('❌ Communication error when sending the order.');
    } finally {
      setIsSubmittingOperation(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return { datePart: '-', timePart: '' };
    const date = new Date(dateString);

    const datePart = date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const timePart = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });

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

  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['instances', selectedApiKey],
    queryFn: async () => {
      const res = await apiFetch(`/get_instances?api_key_id=${selectedApiKey}`);
      const data = await res.json();
      return data.instances || [];
    },
    enabled: !!selectedApiKey,
  });

  // Panic state query
  const { data: panicState = null, refetch: refetchPanicState } = useQuery({
    queryKey: ['panicState'],
    queryFn: async () => {
      const res = await apiFetch('/panic_state');
      const data = await res.json();
      return data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds to keep state current
  });

  const isPanicActive = panicState?.is_panic_active || false;

  // Filter instances
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

  // Paginate filtered instances
  const paginatedInstances = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredInstances.slice(startIndex, endIndex);
  }, [filteredInstances, currentPage, recordsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredInstances.length / recordsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, symbolFilter, statusFilter, selectedApiKey]);

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
            Loading Strategies
          </h2>
          <p className="text-gray-600 font-mono text-sm tracking-wide">
            [FETCHING STRATEGY DATA...]
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
                  Instances
                </h1>
                <p className="text-gray-500 text-sm mt-1 font-mono tracking-wide">
                  ACTIVE CONTROL // {filteredInstances.length} STRATEGIES DEPLOYED
                </p>
              </div>
            </div>
            {/* Panic Stop / Resume Button */}
            {isPanicActive ? (
              <button
                onClick={() => setResumeModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-green-900/50 to-green-800/50 border border-green-500/50 text-green-400 rounded font-mono text-sm uppercase tracking-wider
                         hover:bg-green-900/70 hover:border-green-500/70 transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-green-500/20 animate-pulse"
                style={{ filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.7))' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resume
              </button>
            ) : (
              <button
                onClick={() => setPanicModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-red-900/50 to-red-800/50 border border-red-500/50 text-red-400 rounded font-mono text-sm uppercase tracking-wider
                         hover:bg-red-900/70 hover:border-red-500/70 transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-red-500/20 animate-pulse"
                style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.7))' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Panic Stop
              </button>
            )}
          </div>
          {/* Tech decoration lines */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-red-500"></div>
            <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-red-400"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Panic Mode Warning Banner */}
        {isPanicActive && (
          <div className="relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/30 via-yellow-800/40 to-yellow-900/30 animate-pulse"></div>
            <div className="absolute inset-0 bg-yellow-500/10 blur-xl"></div>

            <div className="relative bg-gradient-to-r from-yellow-900/50 via-yellow-800/50 to-yellow-900/50 border-2 border-yellow-500/70 rounded-lg p-4 shadow-2xl">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-400"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-400"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-400"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-400"></div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Warning icon with pulse */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/50 blur-lg rounded-full animate-pulse"></div>
                    <svg className="relative w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-yellow-400 font-mono uppercase tracking-wider flex items-center gap-2">
                      ⚠ PANIC MODE ACTIVE
                    </h3>
                    <p className="text-yellow-200 text-sm font-mono mt-1">
                      {panicState?.total_instances_stopped || 0} instance{panicState?.total_instances_stopped !== 1 ? 's' : ''} stopped.
                      Manual start is disabled. Use Resume button to exit panic mode.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setResumeModalOpen(true)}
                  className="px-6 py-3 bg-green-900/70 border-2 border-green-500/70 text-green-400 rounded font-mono text-sm uppercase tracking-wider font-bold
                           hover:bg-green-900/90 hover:border-green-500/90 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-green-500/50 whitespace-nowrap"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.6))' }}
                >
                  ▶ RESUME
                </button>
              </div>
            </div>
          </div>
        )}

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
                {/* API Key Filter */}
                <div className="flex-1">
                  <label
                    htmlFor="apikey-filter"
                    className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono"
                  >
                    ◆ Filter by API Key
                  </label>
                  <div className="relative group">
                    <select
                      id="apikey-filter"
                      value={selectedApiKey}
                      onChange={(e) => {
                        setSelectedApiKey(e.target.value);
                        localStorage.setItem('selectedApiKey', e.target.value);
                      }}
                      className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                               focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                               hover:border-red-700 transition-all duration-300
                               appearance-none cursor-pointer backdrop-blur-sm"
                    >
                      <option value="" className="bg-black text-red-400">Select API Key</option>
                      {apiKeys.map(key => (
                        <option key={key.api_key_id} value={key.api_key_id} className="bg-black text-red-400">
                          ({key.api_key_id}) {key.name}
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

                {/* Symbol Filter */}
                <div className="flex-1">
                  <label
                    htmlFor="symbol-filter"
                    className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono"
                  >
                    ◆ Filter by Symbol
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      id="symbol-filter"
                      value={symbolFilter}
                      onChange={(e) => setSymbolFilter(e.target.value)}
                      placeholder="Search by symbol..."
                      className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                               placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                               hover:border-red-700 transition-all duration-300 backdrop-blur-sm"
                    />
                    <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 rounded transition-all duration-300 pointer-events-none"></div>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex-1">
                  <label
                    htmlFor="status-filter"
                    className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono"
                  >
                    ◆ Filter by Status
                  </label>
                  <div className="relative group">
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                               focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                               hover:border-red-700 transition-all duration-300
                               appearance-none cursor-pointer backdrop-blur-sm"
                    >
                      <option value="all" className="bg-black text-red-400">All Status</option>
                      <option value="running" className="bg-black text-red-400">Running</option>
                      <option value="stopped" className="bg-black text-red-400">Stopped</option>
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
                  onClick={handleAdd}
                  className="px-6 py-3 bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 text-green-400 rounded font-mono text-sm uppercase tracking-wider
                           hover:bg-green-900/50 hover:border-green-500/50 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Strategy
                </button>
                <button
                  onClick={() => {
                    setNameFilter('');
                    setSymbolFilter('');
                    setStatusFilter('all');
                  }}
                  className="px-6 py-3 bg-red-900/30 border border-red-500/30 text-red-400 rounded font-mono text-sm uppercase tracking-wider
                           hover:bg-red-900/50 hover:border-red-500/50 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  Clear Filters
                </button>
              </div>

              {/* Filter status indicator */}
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 font-mono">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="uppercase tracking-wider">
                  Showing {filteredInstances.length} of {instances.length} strategies
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Instances Table */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-red-500"></div>
            <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider font-mono">
              ◆ Strategy Registry
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
                    Deployed Strategies
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
                      <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Symbol</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Manual Op.</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Created</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Started</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-900/20">
                    {paginatedInstances.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="text-gray-600 font-mono text-sm">
                            {instances.length === 0
                              ? '[NO STRATEGIES FOUND]'
                              : '[NO STRATEGIES MATCH FILTERS]'
                            }
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedInstances.map((instance) => (
                        <tr key={instance.id} className="hover:bg-red-900/5 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                            {instance.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-400 font-mono">
                            {instance.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                            {instance.symbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                              instance.status === 2
                                ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                                : 'bg-gray-900/30 text-gray-400 border border-gray-500/30'
                            }`}>
                              {instance.status === 2 ? '● RUNNING' : '○ STOPPED'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleOpenOperationModal(instance, 'buy')}
                                disabled={instance.status !== 2}
                                className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all duration-200
                                         bg-green-900/30 text-green-400 border border-green-500/30
                                         hover:bg-green-900/50 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                BUY
                              </button>
                              <button
                                onClick={() => handleOpenOperationModal(instance, 'sell')}
                                disabled={instance.status !== 2}
                                className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all duration-200
                                         bg-red-900/30 text-red-400 border border-red-500/30
                                         hover:bg-red-900/50 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                SELL
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-300 font-mono">{formatDate(instance.created_at).datePart}</span>
                              <span className="text-xs text-gray-500 font-mono">{formatDate(instance.created_at).timePart}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-300 font-mono">{formatDate(instance.start_date).datePart}</span>
                              <span className="text-xs text-gray-500 font-mono">{formatDate(instance.start_date).timePart}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => { if (instance.status === 1) { handleEdit(instance); } }}
                                disabled={instance.status !== 1}
                                className="p-2 hover:bg-red-900/30 rounded transition-all duration-200 group/btn disabled:opacity-30 disabled:cursor-not-allowed"
                                title={instance.status === 1 ? 'Configure' : 'Stop the strategy to edit'}
                              >
                                <svg className="w-5 h-5 text-gray-400 group-hover/btn:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleInstanceStatusChange(instance, 'start')}
                                disabled={instance.status !== 1 || isPanicActive}
                                className={`p-2 rounded transition-all duration-200 group/btn disabled:opacity-30 disabled:cursor-not-allowed ${
                                  isPanicActive && instance.status === 1
                                    ? 'bg-yellow-900/20 border border-yellow-500/30'
                                    : 'hover:bg-red-900/30'
                                }`}
                                title={
                                  isPanicActive && instance.status === 1
                                    ? "⚠ Cannot start - PANIC MODE ACTIVE. Use Resume button to exit panic mode."
                                    : instance.status !== 1
                                    ? "Instance must be stopped to start"
                                    : "Start instance"
                                }
                              >
                                <svg className={`w-5 h-5 transition-colors ${
                                  isPanicActive && instance.status === 1
                                    ? 'text-yellow-400'
                                    : 'text-gray-400 group-hover/btn:text-green-400'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleInstanceStatusChange(instance, 'stop')}
                                disabled={instance.status !== 2}
                                className="p-2 hover:bg-red-900/30 rounded transition-all duration-200 group/btn disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Stop"
                              >
                                <svg className="w-5 h-5 text-gray-400 group-hover/btn:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => { if (instance.status === 1) { setInstanceToDelete(instance); setConfirmDeleteOpen(true); } }}
                                disabled={instance.status !== 1}
                                className="p-2 hover:bg-red-900/30 rounded transition-all duration-200 group/btn disabled:opacity-30 disabled:cursor-not-allowed"
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
                        {Math.min(currentPage * recordsPerPage, filteredInstances.length)}
                      </span>{' '}
                      of <span className="text-red-400 font-bold">{filteredInstances.length}</span> instances
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

      {showAddForm && editInstanceData && (
        <InstanceCreationForm
          show={showAddForm}
          onClose={() => setShowAddForm(false)}
          apiKeys={apiKeys}
          initialData={editInstanceData}
          selectedApiKey={selectedApiKey}
        />
      )}

      {confirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="relative">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>

              <h3 className="text-xl font-semibold text-red-500 font-mono uppercase tracking-wider">Confirm Deletion</h3>
              <p className="text-gray-300 my-4 font-mono">
                Do you really want to delete the strategy:
                <br />
                <strong className="text-red-400">ID: {instanceToDelete?.id || '--'}</strong>
                <br />
                <span className="text-gray-400 text-sm italic">{instanceToDelete?.name || '(no name)'}</span>
              </p>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="px-6 py-3 bg-gray-900/30 border border-gray-500/30 text-gray-400 rounded font-mono text-sm uppercase tracking-wider
                           hover:bg-gray-900/50 hover:border-gray-500/50 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteInstance}
                  className="px-6 py-3 bg-red-900/30 border border-red-500/30 text-red-400 rounded font-mono text-sm uppercase tracking-wider
                           hover:bg-red-900/50 hover:border-red-500/50 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  Confirm
                </button>
              </div>

              {/* Bottom corner decorations */}
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>
            </div>
          </div>
        </div>
      )}

      {operationModalOpen && currentOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="relative">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>

              <h3 className={`text-xl font-semibold mb-4 font-mono uppercase tracking-wider ${
                currentOperation.side === 'buy' ? 'text-green-400' : 'text-red-400'
              }`}>
                Manual {currentOperation.side === 'buy' ? 'Buy' : 'Sell'} Order
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-400 font-mono">Instance: <span className="font-bold text-white">{currentOperation.instance.name}</span></p>
                <p className="text-sm text-gray-400 font-mono">Symbol: <span className="font-bold text-white">{currentOperation.instance.symbol}</span></p>
              </div>
              <label htmlFor="operationPercent" className="block mb-2 text-sm font-medium text-red-500 font-mono uppercase">Percent of balance to use (%)</label>
              <div className="relative">
                <input
                  type="number"
                  id="operationPercent"
                  value={operationPercent}
                  onChange={(e) => setOperationPercent(e.target.value)}
                  className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                           focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  placeholder="Ex: 100"
                  min="1"
                  max="100"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">%</span>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setOperationModalOpen(false)}
                  disabled={isSubmittingOperation}
                  className="px-6 py-3 bg-gray-900/30 border border-gray-500/30 text-gray-400 rounded font-mono text-sm uppercase tracking-wider
                           hover:bg-gray-900/50 hover:border-gray-500/50 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOperation}
                  disabled={isSubmittingOperation}
                  className="px-6 py-3 bg-red-900/30 border border-red-500/30 text-red-400 rounded font-mono text-sm uppercase tracking-wider
                           hover:bg-red-900/50 hover:border-red-500/50 transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed
                           focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {isSubmittingOperation ? 'Sending...' : 'Confirm'}
                </button>
              </div>

              {/* Bottom corner decorations */}
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>
            </div>
          </div>
        </div>
      )}

      {panicModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="relative">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>

              <h3 className="text-2xl font-bold text-red-500 mb-2 font-mono uppercase tracking-wider">PANIC STOP</h3>
              <p className="text-white text-lg mb-4 font-mono">
                This action will place a market order to sell the full token amount for each active strategy, and then immediately stop them.
              </p>
              <p className="text-gray-400 text-sm mb-6 italic font-mono">You can restart them at any moment</p>
              <p className="text-white mb-6 font-mono">Are you sure?</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setPanicModalOpen(false)}
                  className="px-6 py-3 bg-gray-900/30 border border-gray-500/30 text-gray-400 rounded font-mono text-sm uppercase tracking-wider
                           hover:bg-gray-900/50 hover:border-gray-500/50 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePanicStop}
                  className="px-6 py-3 bg-red-900/50 border border-red-500/50 text-red-400 rounded font-mono text-sm uppercase tracking-wider font-bold
                           hover:bg-red-900/70 hover:border-red-500/70 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  STOP ALL
                </button>
              </div>

              {/* Bottom corner decorations */}
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>
            </div>
          </div>
        </div>
      )}

      {resumeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-green-900/50 p-6 rounded-lg shadow-xl max-w-lg w-full">
            <div className="relative">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-500"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-500"></div>

              <h3 className="text-2xl font-bold text-green-500 mb-3 font-mono uppercase tracking-wider">RESUME FROM PANIC MODE</h3>

              {/* Show list of instances that will be restarted */}
              {panicState?.instances_stopped && panicState.instances_stopped.length > 0 ? (
                <>
                  <p className="text-white text-lg mb-3 font-mono">
                    The following {panicState.instances_stopped.length} instance{panicState.instances_stopped.length > 1 ? 's were' : ' was'} stopped by panic mode:
                  </p>
                  <div className="bg-black/40 border border-green-900/30 rounded p-3 mb-4 max-h-48 overflow-y-auto">
                    {panicState.instances_stopped.map((instance) => (
                      <div key={instance.id} className="text-green-400 text-sm font-mono py-1">
                        • {instance.name} ({instance.symbol})
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm mb-6 font-mono">
                    Choose an option:
                  </p>
                </>
              ) : (
                <p className="text-white text-lg mb-6 font-mono">
                  No instances were stopped by panic mode.
                </p>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleResumeWithRestart}
                  className="w-full px-6 py-3 bg-green-900/50 border border-green-500/50 text-green-400 rounded font-mono text-sm uppercase tracking-wider font-bold
                           hover:bg-green-900/70 hover:border-green-500/70 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  ▶ Resume & Restart All Strategies
                </button>
                <button
                  onClick={handleResumeWithoutRestart}
                  className="w-full px-6 py-3 bg-yellow-900/30 border border-yellow-500/30 text-yellow-400 rounded font-mono text-sm uppercase tracking-wider
                           hover:bg-yellow-900/50 hover:border-yellow-500/50 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                >
                  ✓ Resume Without Restarting
                </button>
                <button
                  onClick={() => setResumeModalOpen(false)}
                  className="w-full px-6 py-3 bg-gray-900/30 border border-gray-500/30 text-gray-400 rounded font-mono text-sm uppercase tracking-wider
                           hover:bg-gray-900/50 hover:border-gray-500/50 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                >
                  Cancel
                </button>
              </div>

              {/* Bottom corner decorations */}
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-500"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-500"></div>
            </div>
          </div>
        </div>
      )}

      {(loadingStatusChange || loadingDelete || isStoppingAll || isResuming) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 px-8 py-6 rounded-lg shadow-lg text-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
              <p className="text-white text-xl font-mono">
                {statusMessage || (loadingDelete && "Deleting strategy...") || panicStatusMessage || resumeStatusMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StrategyPage;
