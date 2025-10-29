import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { FullScreenLoader } from '../components/FullScreenLoader';

// Um componente simples para exibir o saldo formatado
const BalanceDisplay = ({ balanceData }) => {
  if (!balanceData || balanceData.length === 0) {
    return <p className="text-gray-400">Nenhum saldo encontrado ou a carteira está vazia.</p>;
  }

  // Filtra apenas as moedas com saldo maior que zero
  const filteredBalances = balanceData.filter(asset => parseFloat(asset.free) > 0);

  if (filteredBalances.length === 0) {
    return <p className="text-gray-400">Nenhuma moeda com saldo positivo encontrada.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {filteredBalances.map(asset => (
        <div key={asset.asset} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <p className="text-lg font-bold text-white">{asset.asset}</p>
          <p className="text-md text-green-400">{parseFloat(asset.free).toFixed(6)}</p>
          <p className="text-xs text-gray-500">Disponível</p>
        </div>
      ))}
    </div>
  );
};


function BalancePage() {
  const [selectedApiKeyId, setSelectedApiKeyId] = useState('');

  // 1. Hook para buscar a lista de API Keys do usuário (será cacheado)
  const { data: apiKeys, isLoading: isLoadingApiKeys } = useQuery({
    queryKey: ['userApiKeys'], // Chave de cache para esta query
    queryFn: async () => {
      const res = await apiFetch('/get_user_apikeys');
      const json = await res.json();
      return json.user_apikeys || [];
    },
    staleTime: 5 * 60 * 1000, // Mantém os dados "frescos" por 5 minutos
  });

  // Memoiza o objeto da API Key selecionada para evitar recálculos
  const selectedApiKey = useMemo(() => {
    return apiKeys?.find(key => key.api_key_id.toString() === selectedApiKeyId);
  }, [apiKeys, selectedApiKeyId]);

  // 2. Hook para buscar o saldo. Ele só será ativado quando a função `fetchBalance` for chamada.
  const { 
    data: balanceResponse, 
    isLoading: isFetchingBalance, 
    refetch: fetchBalance,
    isError,
    error
  } = useQuery({
    // A chave de cache inclui o ID da API Key, então cada saldo é cacheado separadamente
    queryKey: ['liveBalance', selectedApiKey?.api_key_id], 
    queryFn: async () => {
      if (!selectedApiKey) return null;
      const res = await apiFetch(`/exchanges/live_balance?exchange_id=${selectedApiKey.exchange_id}&api_key_id=${selectedApiKey.api_key_id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch balance');
      return json;
    },
    // IMPORTANTE: Desabilitado por padrão. Só roda quando `fetchBalance` é chamado.
    enabled: false, 
    // Após uma busca bem-sucedida, não refaça a busca por 5 minutos, mesmo que o botão seja clicado.
    staleTime: 5 * 60 * 1000, 
    retry: false // Não tenta novamente em caso de erro, espera o usuário clicar de novo
  });

  const handleFetchBalance = (e) => {
    e.preventDefault();
    if (selectedApiKey) {
      fetchBalance(); // Aciona a busca de saldo
    }
  };

  const isButtonDisabled = !selectedApiKeyId || isFetchingBalance;

  return (
    <>
      <FullScreenLoader isOpen={isFetchingBalance} message="Buscando saldo na exchange..." />
      <div className="p-4 text-slate-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}>
            Live Account Balance
          </h2>
        </div>

        <div className="max-w-4xl mx-auto bg-black/50 p-8 rounded-lg border border-gray-800">
          <form onSubmit={handleFetchBalance} className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            {/* Seletor de API Key */}
            <div className="w-full">
              <label htmlFor="apikey-select" className="block text-sm font-medium text-gray-400 mb-2">
                Select API Key
              </label>
              <select
                id="apikey-select"
                value={selectedApiKeyId}
                onChange={(e) => setSelectedApiKeyId(e.target.value)}
                disabled={isLoadingApiKeys}
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              >
                <option value="">{isLoadingApiKeys ? 'Carregando chaves...' : 'Selecione uma chave API'}</option>
                {apiKeys?.map((key) => (
                  <option key={key.api_key_id} value={key.api_key_id}>
                    {key.name || `Key #${key.api_key_id}`} ({key.exchange_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Botão de Busca */}
            <div className="w-full sm:w-auto pt-0 sm:pt-7">
              <button
                type="submit"
                disabled={isButtonDisabled}
                className={`w-full py-3 px-6 font-semibold text-white rounded-md transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center
                  ${isButtonDisabled 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-500 hover:-translate-y-px'}`}
              >
                {isFetchingBalance ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Buscando...</span>
                  </>
                ) : (
                  <span>Get Balance</span>
                )}
              </button>
            </div>
          </form>

          {/* Área de Resultado */}
          <div className="mt-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-300 mb-4 border-b border-gray-700 pb-2">
                Carteira Spot
              </h3>
              {/* Se houver erro, exibe a mensagem de erro */}
              {isError && (
                 <div className="p-4 rounded-md text-center bg-red-500/20 text-red-300">
                    {error.message || "Ocorreu um erro ao buscar o saldo."}
                 </div>
              )}

              {/* Se a busca foi bem-sucedida, exibe os saldos */}
              {balanceResponse?.success && (
                <BalanceDisplay balanceData={balanceResponse.data} />
              )}
          </div>
        </div>
      </div>
    </>
  );
}

export default BalancePage;