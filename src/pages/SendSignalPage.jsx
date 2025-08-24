import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { FullScreenLoader } from '../components/FullScreenLoader';

function SendSignalPage() {
  const [selectedInstance, setSelectedInstance] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [filteredIndicators, setFilteredIndicators] = useState([]);
  const [apiResponse, setApiResponse] = useState({ message: null, type: null });
  const [backendResponseData, setBackendResponseData] = useState(null);

  const { data: instances, isLoading: loadingInstances } = useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const res = await apiFetch('/get_instances?api_key_id=all');
      const json = await res.json();
      return json.instances || [];
    },
  });

  const { data: allIndicators, isLoading: loadingIndicators } = useQuery({
    queryKey: ['indicators'],
    queryFn: async () => {
      const res = await apiFetch('/select_indicators_by_user');
      const json = await res.json();
      return json.indicator_data || [];
    },
  });

  useEffect(() => {
    if (selectedInstance && allIndicators) {
      const filtered = allIndicators.filter(
        (indicator) => indicator.instance_id.toString() === selectedInstance
      );
      setFilteredIndicators(filtered);
      setSelectedIndicator('');
    } else {
      setFilteredIndicators([]);
    }
  }, [selectedInstance, allIndicators]);

  const sendSignalMutation = useMutation({
    mutationFn: (indicatorId) => {
      return apiFetch('/send_indicator_signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicator_id: indicatorId }),
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setApiResponse({ message: data.message || 'Signal sent successfully!', type: 'success' });
      setBackendResponseData(data);
    },
    onError: async (error) => {
      try {
        const errData = await error.response.json();
        setApiResponse({ message: errData.error || 'An unknown error occurred.', type: 'error' });
        setBackendResponseData(errData);
      } catch {
        const errorInfo = { error: 'Failed to connect to the server or parse the response.' };
        setApiResponse({ message: errorInfo.error, type: 'error' });
        setBackendResponseData(errorInfo);
      }
    },
    onSettled: () => {
      setTimeout(() => setApiResponse({ message: null, type: null }), 5000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setBackendResponseData(null);
    if (!selectedIndicator) return;
    sendSignalMutation.mutate(selectedIndicator);
  };

  const isButtonDisabled = !selectedInstance || !selectedIndicator || sendSignalMutation.isLoading;

  return (
    <>
      <FullScreenLoader isOpen={sendSignalMutation.isLoading} message="Sending signal..." />
      <div className="p-4 text-slate-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}>
            Send Manual Signal
          </h2>
        </div>

        <div className="max-w-2xl mx-auto bg-black/50 p-8 rounded-lg border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seletor de Instância */}
            <div>
              <label htmlFor="instance-select" className="block text-sm font-medium text-gray-400 mb-2">
                1. Select Instance
              </label>
              <select
                id="instance-select"
                value={selectedInstance}
                onChange={(e) => setSelectedInstance(e.target.value)}
                disabled={loadingInstances}
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              >
                <option value="">{loadingInstances ? 'Loading instances...' : 'Select an instance'}</option>
                {instances?.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    ({inst.id}) - {inst.name || 'Untitled'}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Indicador (condicional) */}
            {selectedInstance && (
              <div className="animate-fade-in">
                <label htmlFor="indicator-select" className="block text-sm font-medium text-gray-400 mb-2">
                  2. Select Indicator
                </label>
                <select
                  id="indicator-select"
                  value={selectedIndicator}
                  onChange={(e) => setSelectedIndicator(e.target.value)}
                  disabled={loadingIndicators || filteredIndicators.length === 0}
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                >
                  <option value="">
                    {loadingIndicators ? 'Loading indicators...' : 
                     filteredIndicators.length === 0 ? 'No indicators for this instance' : 'Select an indicator'}
                  </option>
                  {filteredIndicators.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      ({ind.id}) - {ind.name} [{ind.side.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botão de Envio */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isButtonDisabled}
                className={`w-full py-3 font-semibold text-white rounded-md transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center
                  ${isButtonDisabled 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-500 hover:-translate-y-px'}`}
              >
                {/* ATUALIZAÇÃO: Adiciona um spinner animado durante o carregamento */}
                {sendSignalMutation.isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Signal</span>
                )}
              </button>
            </div>
          </form>

          {/* Mensagem de Resposta Rápida */}
          {apiResponse.message && (
            <div className={`mt-6 p-4 rounded-md text-center animate-fade-in
              ${apiResponse.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
            >
              {apiResponse.message}
            </div>
          )}

          {/* Quadro com a resposta completa do Backend */}
          {backendResponseData && (
            <div className="mt-8 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                Backend Response
              </h3>
              <div className="bg-gray-900 p-4 rounded-md border border-gray-700 max-h-96 overflow-y-auto">
                <pre className="text-sm text-white whitespace-pre-wrap break-words">
                  <code>{JSON.stringify(backendResponseData, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SendSignalPage;