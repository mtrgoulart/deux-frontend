import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

import { FullScreenLoader } from '../components/FullScreenLoader';
import { PageHeader } from '../components/PageHeader';
import { StrategiesTable } from '../components/StrategiesTable';
import { StrategyFormModal } from '../components/StrategyFormModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

// ✅ Função de validação com mensagem em inglês
const validateStrategy = (strategy) => {
  const errors = {};
  const requiredFields = ['name', 'side', 'percent', 'condition_limit', 'interval', 'simultaneous_operations'];
  
  requiredFields.forEach(field => {
    if (!strategy[field] && strategy[field] !== 0) {
      errors[field] = 'Field is required.';
    }
  });

  return errors;
}

function StrategiesPage() {
  const queryClient = useQueryClient();

  const [editingStrategy, setEditingStrategy] = useState(null);
  const [strategyToDelete, setStrategyToDelete] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
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
        // ✅ Alerta traduzido
        alert("An error occurred while saving the strategy.");
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

  const sortedStrategies = useMemo(() => {
    return [...strategies].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [strategies, sortField, sortDirection]);

  const handleSort = (field) => {
    const newDirection = (field === sortField && sortDirection === 'asc') ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
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
          percent: data.percent * 100,
        };
        setEditingStrategy(formattedData);
        setIsFormOpen(true);
      } else {
        // ✅ Alerta traduzido
        alert(data.error || "Could not load the strategy data.");
      }
    } catch (error) {
      console.error("Error configuring strategy:", error);
      // ✅ Alerta traduzido
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

    const payload = {
      ...strategyFromForm,
      id: strategyFromForm.id || undefined,
      percent: parseFloat(strategyFromForm.percent) / 100,
    };
    
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
  // ✅ Mensagens do loader traduzidas
  const loaderMessage = () => {
    if (isLoadingParameters) return "Loading parameters...";
    if (isMutating) return "Processing your request...";
    return "";
  };

  return (
    <div className="p-6 text-white animate-fade-in">
      <FullScreenLoader isOpen={showLoader} message={loaderMessage()} />

      <PageHeader onAddStrategy={handleAdd} />

      <StrategiesTable
        strategies={sortedStrategies}
        isLoading={isLoadingStrategies}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        onConfigure={handleConfigure}
        onDelete={(strategy) => setStrategyToDelete(strategy)}
      />
      
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

export default StrategiesPage;