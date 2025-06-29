import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import StrategyCard from '../components/StrategyCard';
import EnhancedStrategyWizard from '../components/strategycreation/EnhancedStrategyWizard';
import MessageDisplay from '../components/IndicatorManagement/MessageDisplay';

function StrategiesPage() {
  const [isWizardVisible, setWizardVisible] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loadingStatusChange, setLoadingStatusChange] = useState(false);

  const queryClient = useQueryClient();

  const { data: strategies = [], isLoading, error } = useQuery({
    queryKey: ['instances', searchTerm],
    queryFn: async () => {
      const endpoint = searchTerm 
        ? `/search_strategies?query=${searchTerm}` // TODO: This should probably search instances
        : '/get_instances?api_key_id=all';
      const res = await apiFetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch instances');
      const data = await res.json();
      // The endpoint returns { instances: [...] } or { strategies: [...] }
      return data.instances || data.strategies || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ strategy, action }) => {
      setLoadingStatusChange(true);
      const endpoint = action === 'start' ? '/start_instance' : '/stop_instance';
      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ instance_id: strategy.id }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} strategy`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['strategies']);
      setMessage({ text: 'Status changed successfully!', type: 'success' });
    },
    onError: (error) => {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    },
    onSettled: () => {
      setLoadingStatusChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (strategyId) => {
      const res = await apiFetch('/delete_strategy', {
        method: 'POST',
        body: JSON.stringify({ id: strategyId }),
      });
      if (!res.ok) throw new Error('Failed to delete strategy');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['strategies']);
      setMessage({ text: 'Strategy deleted successfully!', type: 'success' });
    },
    onError: (error) => {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    },
  });

  const handleEdit = (strategy) => {
    setSelectedStrategy(strategy);
    setWizardVisible(true);
  };

  const handleDelete = (strategy) => {
    if (window.confirm(`Are you sure you want to delete the strategy "${strategy.name}"?`)) {
      deleteMutation.mutate(strategy.id);
    }
  };

  const handleStatusChange = (strategy, action) => {
    mutation.mutate({ strategy, action });
  };

  const handleWizardClose = () => {
    setWizardVisible(false);
    setSelectedStrategy(null);
    queryClient.invalidateQueries(['strategies']);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      1: { text: 'Stopped', color: 'bg-red-500' },
      2: { text: 'Running', color: 'bg-green-500' },
      3: { text: 'Processing', color: 'bg-yellow-500' },
    };
    const { text, color } = statusConfig[status] || { text: 'Unknown', color: 'bg-gray-500' };
    return (
      <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${color}`}>
        {text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) return <div className="text-center p-4">Loading strategies...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">My Strategies</h1>
      
      {message.text && <MessageDisplay message={message.text} type={message.type} onDismiss={() => setMessage({ text: '', type: '' })} />}

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search strategies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 rounded bg-gray-700 text-white"
        />
        <button
          onClick={() => {
            setSelectedStrategy(null);
            setWizardVisible(true);
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          New Strategy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onEdit={handleEdit}
            getStatusBadge={getStatusBadge}
            formatDate={formatDate}
            loadingStatusChange={loadingStatusChange}
          />
        ))}
      </div>

      {isWizardVisible && (
        <EnhancedStrategyWizard
          showCreateForm={isWizardVisible}
          setShowCreateForm={setWizardVisible}
          instanceToEdit={selectedStrategy}
          onStrategyCreatedOrEdited={handleWizardClose}
        />
      )}
    </div>
  );
}

export default StrategiesPage;