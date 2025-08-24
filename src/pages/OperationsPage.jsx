import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { TableSkeleton } from '../components/TableSkeleton';
// Para os ícones de ordenação, você precisará instalar a biblioteca react-icons:
// npm install react-icons
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

function OperationsPage() {
  const [selectedInstance, setSelectedInstance] = useState('');
  const tableHeaders = ["ID", "Date", "Symbol", "Side", "Size", "Price", "Status"];
  // Estado para controlar a coluna e a direção da ordenação
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // 1. Busca a lista de todas as instâncias disponíveis para popular o seletor.
  const { data: instances, isLoading: loadingInstances } = useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const res = await apiFetch('/get_instances?api_key_id=all');
      const json = await res.json();
      return json.instances || [];
    },
  });

  // 2. Efeito para selecionar a primeira instância da lista por padrão.
  useEffect(() => {
    if (!selectedInstance && instances && instances.length > 0) {
      setSelectedInstance(instances[0].id);
    }
  }, [instances, selectedInstance]);

  // 3. Busca as operações para a instância que está selecionada.
  const { data: operations, isLoading: loadingOperations } = useQuery({
    queryKey: ['operations', selectedInstance],
    queryFn: async () => {
      const params = new URLSearchParams({ instance_id: selectedInstance });
      const res = await apiFetch(`/operations?${params}`);
      const json = await res.json();
      return json.operations || [];
    },
    enabled: !!selectedInstance,
  });

  // 4. Lógica de Ordenação
  const sortedOperations = useMemo(() => {
    if (!operations || operations.length === 0) return [];
    
    const sorted = [...operations];
    sorted.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [operations, sortConfig]);

  // 5. Função para lidar com o clique no cabeçalho
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 6. Componente auxiliar para renderizar o ícone de ordenação
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <FaSort className="inline-block ml-1 text-gray-600" />;
    }
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="inline-block ml-1" /> : 
      <FaSortDown className="inline-block ml-1" />;
  };
  
  // Formata a data para uma leitura mais amigável
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Componente para o cabeçalho da tabela clicável
  const SortableHeader = ({ columnKey, children }) => (
    <th className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors" onClick={() => handleSort(columnKey)}>
      {children} <SortIcon columnKey={columnKey} />
    </th>
  );

  return (
    <div className="p-4 text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}>
          Operations
        </h2>
        <div className="flex items-center gap-4">
            <label htmlFor="instance_selector" className="text-sm text-gray-400">Strategy:</label>
            <select
                id="instance_selector"
                className="bg-gray-900 border border-gray-700 p-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                value={selectedInstance}
                onChange={(e) => setSelectedInstance(e.target.value)}
                disabled={loadingInstances || (instances && instances.length === 0)}
            >
                <option value="">{loadingInstances ? 'Loading...' : 'Select strategy'}</option>
                {instances?.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                        ({inst.id}) - {inst.name || 'Untitled'}
                    </option>
                ))}
            </select>
        </div>
      </div>

      {loadingOperations ? <TableSkeleton rows={5} headers={tableHeaders} />: (
        <div className="overflow-x-auto bg-black/50 rounded-lg border border-gray-800">
          <table className="min-w-full table-auto">
            <thead className='border-b border-red-500/30'>
              <tr className="text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">
                <SortableHeader columnKey="id">ID</SortableHeader>
                <SortableHeader columnKey="date">Date</SortableHeader>
                <SortableHeader columnKey="symbol">Symbol</SortableHeader>
                <SortableHeader columnKey="side">Side</SortableHeader>
                <SortableHeader columnKey="size">Size</SortableHeader>
                <SortableHeader columnKey="price">Price</SortableHeader>
                <SortableHeader columnKey="status">Status</SortableHeader>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {sortedOperations.length > 0 ? (
                sortedOperations.map((op) => (
                  <tr key={op.id} className="border-t border-gray-800/50 hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{op.id}</td>
                    <td className="px-6 py-4">{formatDate(op.date)}</td>
                    <td className="px-6 py-4">{op.symbol}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block w-full text-center px-3 py-1 text-xs font-bold rounded-md
                        ${op.side.toUpperCase() === 'BUY' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'}`
                      }>
                        {op.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">{op.size}</td>
                    <td className="px-6 py-4">{op.price}</td>
                    <td className="px-6 py-4">{op.status}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-800/50">
                  <td colSpan="7" className="text-center py-10 text-gray-500">
                    No operations found for this instance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OperationsPage;
