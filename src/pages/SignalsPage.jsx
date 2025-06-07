import { useState, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

function SignalsPage() {
  const [selectedInstance, setSelectedInstance] = useState('');
  const observerRef = useRef();

  const { data: instances = [] } = useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const res = await apiFetch('/get_instances?api_key_id=all'); // adapte conforme necessário
      const json = await res.json();
      return json.instances || [];
    },
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['signals', selectedInstance],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        instance_id: selectedInstance || '',
        offset: pageParam,
        limit: 30,
      });
      const res = await apiFetch(`/get_signals_data?${params}`);
      return res.json();
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.signals?.length === 30) {
        return pages.length * 30;
      }
      return undefined;
    },
    enabled: true,
  });

  const handleObserver = useCallback((node) => {
    if (isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });

    if (node) observerRef.current.observe(node);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Sinais Recebidos</h2>
            <select
            className="bg-gray-800 p-2 rounded text-white"
            value={selectedInstance}
            onChange={(e) => {
                setSelectedInstance(e.target.value);
                refetch(); // refaz busca ao trocar filtro
            }}
            >
            <option value="">Todas Instâncias</option>
            {instances.map((inst) => (
                <option key={inst.id} value={inst.id}>
                ({inst.id}) - {inst.name || 'Sem nome'}
                </option>
            ))}
            </select>
      </div>

      <div className="overflow-y-auto max-h-[75vh] border border-gray-700 rounded">
        <table className="min-w-full text-sm bg-gray-800">
          <thead className="bg-gray-700 sticky top-0">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Symbol</th>
              <th className="px-4 py-2">Side</th>
              <th className="px-4 py-2">Indicator</th>
              <th className="px-4 py-2">Criado em</th>
              <th className="px-4 py-2">Operação</th>
              <th className="px-4 py-2">Instância</th>
            </tr>
          </thead>
          <tbody>
            {data?.pages.flatMap(page => page.signals || []).map(signal => (
              <tr key={signal.id} className="border-t border-gray-700">
                <td className="px-4 py-2">{signal.id}</td>
                <td className="px-4 py-2">{signal.symbol}</td>
                <td className="px-4 py-2">{signal.side}</td>
                <td className="px-4 py-2">{signal.indicator}</td>
                <td className="px-4 py-2">{new Date(signal.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">{signal.operation}</td>
                <td className="px-4 py-2">{signal.instance_id}</td>
              </tr>
            ))}
            <tr ref={handleObserver}>
              <td colSpan="7" className="px-4 py-2 text-center text-gray-400">
                {isFetchingNextPage ? 'Carregando mais...' : ' '}
              </td>
            </tr>
          </tbody>
        </table>
        {isLoading && <p className="text-center p-4">Carregando sinais...</p>}
      </div>
    </div>
  );
}

export default SignalsPage;
