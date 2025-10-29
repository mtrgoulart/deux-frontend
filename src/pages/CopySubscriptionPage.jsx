// src/pages/CopySubscriptionPage.jsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { TableSkeleton } from '../components/TableSkeleton';
import SubscriptionModal from '../components/SubscriptionModal'; // Reutilizando seu modal existente

function CopySubscriptionPage() {
  const queryClient = useQueryClient();

  // Estados para controlar os modais
  const [showEditModal, setShowEditModal] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState(null);
  const [subscriptionToExit, setSubscriptionToExit] = useState(null);
  
  const [statusMessage, setStatusMessage] = useState('');

  // 1. Query para buscar os dados das inscrições do usuário
  // A rota /api/copytrading/subscriptions já existe em seu routes.py
  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ['copytrading_subscriptions'],
    queryFn: async () => {
      const res = await apiFetch('/copytrading/subscriptions');
      const data = await res.json();
      return data.subscriptions || [];
    },
  });

  // 2. Mutação para ATUALIZAR uma inscrição (usada pelo modal)
  // Esta mutação será passada para o SubscriptionModal via prop 'onConfirm'
  // A rota /api/copytrading/subscribe (manage_copytrading_subscription) funciona como um "upsert", ideal para edição
  const updateSubscriptionMutation = useMutation({
    mutationFn: (payload) => 
      apiFetch('/copytrading/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setStatusMessage('✅ Subscription updated successfully!');
      queryClient.invalidateQueries(['copytrading_subscriptions']);
      setShowEditModal(false);
      setTimeout(() => setStatusMessage(''), 2000);
    },
    onError: async (error) => {
        const errData = await error.response?.json();
        setStatusMessage(`❌ Error: ${errData?.error || 'Failed to update.'}`);
        setTimeout(() => setStatusMessage(''), 3000);
    }
  });


  // 3. Mutação para SAIR de uma inscrição
  // A rota /api/copytrading/unsubscribe já existe em seu routes.py
  const exitSubscriptionMutation = useMutation({
    mutationFn: (copytradingIdOrigin) =>
      apiFetch('/copytrading/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copytrading_id_origin: copytradingIdOrigin }),
      }),
    onSuccess: () => {
      setStatusMessage('✅ Unsubscribed successfully!');
      queryClient.invalidateQueries(['copytrading_subscriptions']);
      setSubscriptionToExit(null); // Fecha o modal de confirmação
      setTimeout(() => setStatusMessage(''), 2000);
    },
    onError: (error) => {
      setStatusMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 3000);
    },
  });

  const handleReview = (subscription) => {
    // Prepara os dados para o modal. O modal espera um objeto 'copyConfig'.
    const copyConfigForModal = {
        id: subscription.copytrading_id_origin,
        name: subscription.copytrading_name,
        // O modal pode precisar de mais campos, adicione-os aqui se necessário
        // creator: subscription.creator_name, // Exemplo, se o dado vier da API
    };
    setSubscriptionToEdit(copyConfigForModal);
    setShowEditModal(true);
  };

  const handleExitConfirm = () => {
    if (subscriptionToExit) {
      exitSubscriptionMutation.mutate(subscriptionToExit.copytrading_id_origin);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const tableHeaders = ["ID", "Copy Name", "Status", "Subscription Date", "Actions"];

  return (
    <div className="p-4 sm:p-6 md:p-8 text-slate-200 animate-fade-in">
        {/* Modal de Edição (reutilizando SubscriptionModal) */}
        {showEditModal && (
            <SubscriptionModal
                isEditing={true}
                copyConfig={subscriptionToEdit}
                onClose={() => setShowEditModal(false)}
                onConfirm={(payload) => updateSubscriptionMutation.mutate(payload)}
                isLoading={updateSubscriptionMutation.isLoading}
            />
        )}

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.6)' }}>
          My Subscriptions
        </h2>
      </div>

      {isLoadingSubscriptions ? (
        <TableSkeleton headers={tableHeaders} />
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-10 bg-black/30 rounded-lg border border-gray-800">
            <p className="text-gray-400">You have no active subscriptions.</p>
            <p className="text-sm text-gray-500 mt-2">Go to the Explore page to find new copytrading configurations.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-black/50 rounded-lg border border-gray-800">
          <table className="min-w-full w-full">
            <thead className='border-b border-blue-500/30'>
              <tr className="text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3 w-[10%]">ID</th>
                <th className="px-4 py-3 w-[50%]">Copy Name</th>
                <th className="px-4 py-3 w-[15%]">Status</th>
                <th className="px-4 py-3 w-[25%]">Subscription Date</th>
                <th className="px-4 py-3 w-[15%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-t border-gray-800/50 hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{sub.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap truncate" title={sub.copytrading_name}>{sub.copytrading_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sub.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-600/30 text-gray-400 border border-gray-500/30'}`}>
                      {sub.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(sub.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-4 justify-end items-center">
                      <img
                        src="/icons/config.svg" alt="Review" title="Review Subscription"
                        className="w-6 h-6 cursor-pointer hover:opacity-75"
                        onClick={() => handleReview(sub)}
                      />
                      <img
                        src="/icons/trash.svg" alt="Exit" title="Exit Subscription"
                        className="w-6 h-6 cursor-pointer hover:opacity-75"
                        onClick={() => setSubscriptionToExit(sub)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Confirmação para Sair */}
      {subscriptionToExit && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-900 p-8 rounded-lg shadow-lg text-center max-w-sm w-full border border-red-500/30">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Exit</h3>
            <p className="text-slate-300 mb-2">Do you really want to unsubscribe from:</p>
            <p className="text-red-400 font-bold truncate">{subscriptionToExit.copytrading_name}</p>
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={() => setSubscriptionToExit(null)} className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded">Cancel</button>
              <button onClick={handleExitConfirm} disabled={exitSubscriptionMutation.isLoading} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded disabled:bg-red-800">
                {exitSubscriptionMutation.isLoading ? 'Exiting...' : 'Confirm Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tela de Status Global */}
      {(statusMessage) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
          <div className="bg-gray-900 px-8 py-6 rounded-lg shadow-lg text-white text-xl text-center">
            <p>{statusMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CopySubscriptionPage;