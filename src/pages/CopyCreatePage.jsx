import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import CopyCreationForm from '../components/CopyCreationForm';
import { TableSkeleton } from '../components/TableSkeleton';

// Componente para os botões de paginação (sem alterações)
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex justify-end items-center mt-4 gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

function CopyCreatePage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editCopyData, setEditCopyData] = useState(null);
  const [copyToDelete, setCopyToDelete] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loadingStatusChange, setLoadingStatusChange] = useState(false); // NOVO
  const [loadingDelete, setLoadingDelete] = useState(false);
  

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const { data: copytradings = [], isLoading } = useQuery({
    queryKey: ['copytradings'],
    queryFn: async () => {
      const res = await apiFetch('/copytradings');
      const data = await res.json();
      return data.copytradings || [];
    },
  });
  
  const totalPages = Math.ceil(copytradings.length / itemsPerPage);
  const paginatedData = copytradings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Mutação para deletar com feedback aprimorado
  const deleteMutation = useMutation({
    mutationFn: (copytradingId) => 
      apiFetch('/remove_copytrading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copytrading_id: copytradingId }),
      }),
    onSuccess: () => {
      setStatusMessage('✅ Configuration deleted successfully!');
      queryClient.invalidateQueries(['copytradings']);
      setCopyToDelete(null); // Fecha o modal de confirmação
      setTimeout(() => setStatusMessage(''), 2000); // Limpa a mensagem após 2 segundos
    },
    onError: (error) => {
        setStatusMessage(`❌ Error: ${error.message}`);
        setTimeout(() => setStatusMessage(''), 3000); // Limpa a mensagem após 3 segundos
    }
  });

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

  const tableHeaders = ["ID", "Name", "Status", "Creation Date", "Actions"];

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleStatusChange = async (copyItem, action) => {
    if (
      (action === 'start' && copyItem.status === 1) ||
      (action === 'stop' && copyItem.status === 0)
    ) return;
  
    setLoadingStatusChange(true);
    setStatusMessage(action === 'start' ? 'Starting configuration...' : 'Stopping configuration...');
  
    try {
      await apiFetch(`/${action}_copytrading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copytrading_id: copyItem.id })
      });
  
      setStatusMessage(action === 'start' ? '✅ Configuration started' : '🛑 Configuration stopped');
      await queryClient.invalidateQueries(['copytradings']);
  
      setTimeout(() => {
        setLoadingStatusChange(false);
        setStatusMessage('');
      }, 2000);
    } catch (err) {
      const errorData = await err.response?.json();
      setStatusMessage(`❌ Error: ${errorData?.error || 'Operation failed'}`);
      setTimeout(() => {
        setLoadingStatusChange(false);
        setStatusMessage('');
      }, 3000);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 text-slate-200 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}>
          Copy Trading
        </h2>
        <button 
          onClick={handleAdd} 
          className="px-4 py-2 font-semibold text-white rounded-md transition-all duration-300 transform bg-blue-600/90 hover:bg-blue-600 border border-blue-600/50 hover:border-blue-500 hover:-translate-y-px" 
          style={{ filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' }}
        >
          + Add New
        </button>
      </div>

      {showForm && <CopyCreationForm 
        show={showForm}
        onClose={() => setShowForm(false)}
        initialData={editCopyData}
      />}

      {isLoading ? (
        <TableSkeleton headers={tableHeaders} />
      ) : (
        <>
          <div className="overflow-x-auto bg-black/50 rounded-lg border border-gray-800">
            <table className="min-w-full table-fixed w-full">
              {/* ... Thead e Tbody da tabela (sem alterações) ... */}
              <thead className='border-b border-red-500/30'>
                <tr className="text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 w-[10%]">ID</th>
                  <th className="px-4 py-3 w-[50%]">Name</th>
                  <th className="px-4 py-3 w-[15%]">Status</th>
                  <th className="px-4 py-3 w-[25%]">Creation Date</th>
                  <th className="px-4 py-3 w-[15%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="border-t border-gray-800/50 hover:bg-gray-900/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{item.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap truncate" title={item.name}>{item.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 1 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-600/30 text-gray-400 border border-gray-500/30'}`}>
                        {item.status === 1 ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-4 justify-end items-center">
                        <img 
                            src="/icons/config.svg" alt="Configure" 
                            title={item.status != 1 ? 'Configure' : 'Stop the configuration to be able to edit'} 
                            className={`w-6 h-6 transition-opacity ${item.status != 1 ? 'cursor-pointer hover:opacity-75' : 'opacity-30 cursor-not-allowed'}`} 
                            onClick={() => { if (item.status != 1) handleEdit(item); }} 
                        />
                        <img 
                            src="/icons/play.svg" alt="Start" title="Start" 
                            className={`w-6 h-6 transition-opacity ${item.status == 0 ? 'cursor-pointer hover:opacity-75' : 'opacity-30 cursor-not-allowed'}`} 
                            onClick={() => handleStatusChange(item, 'start')} 
                        />
                        <img 
                            src="/icons/pause.svg" alt="Stop" title="Stop" 
                            className={`w-6 h-6 transition-opacity ${item.status == 1 ? 'cursor-pointer hover:opacity-75' : 'opacity-30 cursor-not-allowed'}`} 
                            onClick={() => handleStatusChange(item, 'stop')} 
                        />
                        <img 
                            src="/icons/trash.svg" alt="Remove" title="Remove" 
                            className={`w-6 h-6 transition-opacity ${item.status != 1 ? 'cursor-pointer hover:opacity-75' : 'opacity-30 cursor-not-allowed'}`} 
                            onClick={() => { if (item.status != 1) setCopyToDelete(item); }} 
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Modal de Confirmação para Deletar (sem alterações) */}
      {copyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-900 p-8 rounded-lg shadow-lg text-center max-w-sm w-full border border-red-500/30">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
            <p className="text-slate-300 mb-2">Do you really want to delete this configuration?</p>
            <p className="text-red-400 font-bold truncate">{copyToDelete.name}</p>
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={() => setCopyToDelete(null)} className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded">Cancel</button>
              <button onClick={handleDelete} disabled={deleteMutation.isLoading} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded disabled:bg-red-800">
                {deleteMutation.isLoading ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NOVA TELA DE CARREGAMENTO GLOBAL --- */}
      {(loadingDelete || loadingStatusChange || statusMessage) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
          <div className="bg-gray-900 px-8 py-6 rounded-lg shadow-lg text-white text-xl text-center">
            <p>{statusMessage || (loadingDelete && "Deleting configuration...")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CopyCreatePage;