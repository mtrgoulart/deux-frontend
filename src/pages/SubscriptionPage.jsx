import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await apiFetch('/get_subscriptions');
      const data = await res.json();
      return data.subscriptions || [];
    }
  });

  const handleUnsubscribe = async () => {
    if (!confirmDelete) return;
    setLoadingDelete(true);
    try {
      const res = await apiFetch('/unsubscribe_instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharing_id: confirmDelete.sharing_id })
      });

      if (res.ok) {
        await queryClient.invalidateQueries(['subscriptions']);
        setConfirmDelete(null);
      } else {
        alert('Erro ao remover inscrição');
      }
    } catch (err) {
      alert('Erro na requisição de remoção');
    } finally {
      setLoadingDelete(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-semibold mb-6">Minhas Inscrições</h2>

      {isLoading ? (
        <p>Carregando inscrições...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto bg-gray-800 rounded text-sm">
            <thead>
              <tr className="bg-gray-700 text-left">
                <th className="px-4 py-2">Nome da Instância</th>
                <th className="px-4 py-2">Símbolo</th>
                <th className="px-4 py-2">Criador</th>
                <th className="px-4 py-2">Data da Inscrição</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((item) => (
                <tr key={item.sharing_id} className="border-t border-gray-700">
                  <td className="px-4 py-2 whitespace-nowrap">{item.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{item.symbol}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{item.creator}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(item.subscription_date)}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setConfirmDelete(item)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Confirmar Remoção</h3>
            <p className="text-white mb-2">Tem certeza que deseja remover sua inscrição da instância:</p>
            <p className="text-red-400 font-bold">{confirmDelete.name}</p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleUnsubscribe}
                disabled={loadingDelete}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
              >
                {loadingDelete ? 'Removendo...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionsPage;