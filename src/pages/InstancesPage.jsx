import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import InstanceCreationForm from '../components/InstanceCreationForm';
import { TableSkeleton } from '../components/TableSkeleton';

function InstancesPage() {
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
  const [currentOperation, setCurrentOperation] = useState(null); // Guarda { instance, side }
  const [operationPercent, setOperationPercent] = useState('100');
  const [isSubmittingOperation, setIsSubmittingOperation] = useState(false);

  const [panicModalOpen, setPanicModalOpen] = useState(false);
  const [isStoppingAll, setIsStoppingAll] = useState(false);
  const [panicStatusMessage, setPanicStatusMessage] = useState('');

  const handleInstanceStatusChange = async (instance, action) => {
    if (
      (action === 'start' && instance.status !== 1) ||
      (action === 'stop' && instance.status !== 2)
    ) return;
  
    setLoadingStatusChange(true);
    setStatusMessage(action === 'start' ? 'Starting strategy...' : 'Stoping strategy...');
  
    try {
      await apiFetch(`/${action}_instance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: instance.id })
      });
  
      setStatusMessage(action === 'start' ? '✅ Strategy sucessfully started' : '🛑 Strategy sucessfully stoped');
      await queryClient.invalidateQueries(['instances', selectedApiKey]);
  
      setTimeout(() => {
        setLoadingStatusChange(false);
        setStatusMessage('');
      }, 2000);
    } catch (err) {
      console.error(`Erro ao ${action} instância:`, err);
      setStatusMessage(`❌ Erro ao ${action === 'start' ? 'iniciar' : 'parar'} a instância.`);
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
        alert(data.error || 'Erro ao deletar a instância.');
      }
    } catch (err) {
      console.error('Erro ao deletar instância:', err);
      alert('Erro ao deletar a instância.');
    } finally {
      setLoadingDelete(false);
      setInstanceToDelete(null);
    }
  };

  const handlePanicStop = async () => {
    setPanicModalOpen(false); // Fecha o modal de confirmação
    setIsStoppingAll(true); // Ativa a tela de carregamento
    // Mensagem mais descritiva para o usuário
    setPanicStatusMessage('Executing panic action: selling assets and stopping strategies...');

    try {
      const res = await apiFetch('/panic_button', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'An unknown error occurred during the panic action.');
      }

      setPanicStatusMessage(`✅ ${data.message}`);
      await queryClient.invalidateQueries(['instances', selectedApiKey]); 

      setTimeout(() => {
        setIsStoppingAll(false);
        setPanicStatusMessage('');
      }, 4000); 

    } catch (err) {
      console.error('Erro ao acionar o botão de pânico:', err);
      setPanicStatusMessage(`❌ Error during panic action: ${err.message}`);
      
      setTimeout(() => {
        setIsStoppingAll(false);
        setPanicStatusMessage('');
      }, 5000); // Aumenta o tempo do erro também
    }
  };

  const handleOpenOperationModal = (instance, side) => {
    // Apenas permite operação manual se a instância estiver rodando
    if (instance.status !== 2) {
      alert("Operações manuais só podem ser executadas em estratégias no estado 'Running'.");
      return;
    }
    setCurrentOperation({ instance, side });
    setOperationPercent('100'); // Reseta para o valor padrão
    setOperationModalOpen(true);
  };

  // --- FUNÇÃO PARA ENVIAR A OPERAÇÃO MANUAL PARA A API ---
  const handleConfirmOperation = async () => {
    if (!currentOperation) return;

    const percent = parseFloat(operationPercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      alert("Por favor, insira um percentual válido (ex: de 1 a 100).");
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
          symbol: currentOperation.instance.symbol, // O backend precisa do symbol
          perc_balance_operation: percent / 100, // Envia como decimal (ex: 50% -> 0.5)
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`✅ Ordem de ${currentOperation.side} enviada com sucesso! Task ID: ${data.task_id}`);
        setOperationModalOpen(false);
        setCurrentOperation(null);
      } else {
        alert(`❌ Erro ao enviar ordem: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Erro ao enviar operação manual:', err);
      alert('❌ Erro de comunicação ao enviar a ordem.');
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

  const handleEdit = (instance) => {
    setEditInstanceData({
      id: instance.id,
      name: instance.name,
      api_key: instance.api_key_id, // Corrigido para api_key_id, conforme seu backend
      symbol: instance.symbol,
      // Correção principal aqui: use os campos diretos da instância
      strategy_buy: instance.strategy_buy || '',
      strategy_sell: instance.strategy_sell || '',
      // Remova os campos _name, o formulário cuidará de buscá-los
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

  const tableHeaders = ["ID", "Name", "Symbol", "Status", "Manual Operation", "Created at", "Start date", "Actions"];

  return (
    <div className="p-4 sm:p-6 md:p-8 text-slate-200 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}>
          Strategy
        </h2>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative group">
          <select
            value={selectedApiKey}
            onChange={(e) => {
              setSelectedApiKey(e.target.value);
              localStorage.setItem('selectedApiKey', e.target.value);
            }}
            className="
              appearance-none 
              w-full bg-gray-800 text-white 
              border border-red-500/30
              py-2 pl-3 pr-10 rounded 
              transition-all duration-200 
              hover:border-red-500
              focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:shadow-[0_0_8px_rgba(239,68,68,0.5)]
            "
          >
            <option value="">Select API Key</option>
            {apiKeys.map(key => (
              <option key={key.api_key_id} value={key.api_key_id}>
                ({key.api_key_id}) {key.name}
              </option>
            ))}
          </select>
          
          <div className="
            pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 
            text-red-500/70 group-hover:text-red-500 transition-colors
          ">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
            </svg>
          </div>
        </div>

        <button 
          onClick={handleAdd} 
          className="px-4 py-2 font-semibold text-white rounded-md transition-all duration-300 transform bg-blue-600/90 hover:bg-blue-600 border border-blue-600/50 hover:border-blue-500 hover:-translate-y-px" 
          style={{ filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' }}
        >
          + Add strategy
        </button>

        <button 
          onClick={() => setPanicModalOpen(true)} 
          className="
            ml-auto px-4 py-2 font-semibold text-white uppercase tracking-wider rounded-md 
            bg-red-600 border border-red-500 
            transform transition-all duration-300 
            hover:scale-105 hover:bg-red-500
          "
          style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.7))' }}
        >
          Panic Stop
        </button>


      </div>

      {showAddForm && editInstanceData && <InstanceCreationForm 
        show={showAddForm}
        onClose={() => setShowAddForm(false)}
        apiKeys={apiKeys}
        initialData={editInstanceData}
        selectedApiKey={selectedApiKey}
      />}

      {isLoading ? (
        <TableSkeleton headers={tableHeaders} />
      ) : (
        <div className="overflow-x-auto bg-black/50 rounded-lg border border-gray-800">
          <table className="min-w-full table-fixed w-full">
            <thead className='border-b border-red-500/30'>
              <tr className="text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3 w-[6%]">ID</th>
                <th className="px-4 py-3 w-[16%]">Name</th>
                <th className="px-4 py-3 w-[12%]">Symbol</th>
                <th className="px-4 py-3 w-[11%]">Status</th>
                <th className="px-4 py-3 w-[14%]">Manual Op.</th>
                <th className="px-4 py-3 w-[13%]">Created</th>
                <th className="px-4 py-3 w-[13%]">Started</th> 
                <th className="px-4 py-3 w-[16%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {instances.map((instance) => (
                <tr key={instance.id} className="border-t border-gray-800/50 hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">{instance.id}</td>
                  <td className="px-4 py-2 whitespace-nowrap truncate" title={instance.name}>{instance.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap truncate">{instance.symbol}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${instance.status === 2 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-600/30 text-gray-400 border border-gray-500/30'}`}>
                      {instance.status === 2 ? 'Running' : 'Stopped'}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenOperationModal(instance, 'buy')} disabled={instance.status !== 2} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs">
                        Buy
                      </button>
                      <button onClick={() => handleOpenOperationModal(instance, 'sell')} disabled={instance.status !== 2} className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs">
                        Sell
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="text-sm">{formatDate(instance.created_at).datePart}</span>
                      <span className="text-xs text-gray-400">{formatDate(instance.created_at).timePart}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="text-sm">{formatDate(instance.start_date).datePart}</span>
                      <span className="text-xs text-gray-400">{formatDate(instance.start_date).timePart}</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-2 text-right">
                    <div className="flex gap-3 justify-end">
                      <img src="/icons/config.svg" alt="Configure" title={instance.status === 1 ? 'Configure' : 'Stop the strategy to be able to edit'} className={`w-6 h-6 transition-opacity ${instance.status === 1 ? 'cursor-pointer hover:opacity-75' : 'opacity-30 cursor-not-allowed'}`} onClick={() => { if (instance.status === 1) { handleEdit(instance); } }} />
                      <img src="/icons/play.svg" alt="Start" title="Start" className={`w-6 h-6 transition-opacity ${instance.status === 1 ? 'cursor-pointer hover:opacity-75' : 'opacity-30'}`} onClick={() => handleInstanceStatusChange(instance, 'start')} />
                      <img src="/icons/pause.svg" alt="Stop" title="Stop" className={`w-6 h-6 transition-opacity ${instance.status === 2 ? 'cursor-pointer hover:opacity-75' : 'opacity-30'}`} onClick={() => handleInstanceStatusChange(instance, 'stop')} />
                      <img src="/icons/trash.svg" alt="Remove" title="Remove" className={`w-6 h-6 transition-opacity ${instance.status === 1 ? 'cursor-pointer hover:opacity-75' : 'opacity-30'}`} onClick={() => { if (instance.status !== 1) return; setInstanceToDelete(instance); setConfirmDeleteOpen(true); }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-900 p-8 rounded-lg shadow-lg text-center max-w-sm w-full border border-red-500/30">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
            <p className="text-slate-300 mb-2">Do you really want to delete the instance:</p>
            <p className="text-red-400 font-bold truncate">ID: {instanceToDelete?.id || '--'}</p>
            <p className="text-gray-400 text-sm mb-4 italic truncate">{instanceToDelete?.name || '(no name)'}</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setConfirmDeleteOpen(false)} className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded">Cancel</button>
              <button onClick={handleDeleteInstance} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {operationModalOpen && currentOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-left max-w-sm w-full border border-red-500/30">
            <h3 className={`text-xl font-semibold mb-4 ${currentOperation.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
              Manual {currentOperation.side === 'buy' ? 'Buy' : 'Sell'} Order
            </h3>
            <div className='mb-4'>
              <p className="text-sm text-gray-400">Instance: <span className="font-bold text-white">{currentOperation.instance.name}</span></p>
              <p className="text-sm text-gray-400">Symbol: <span className="font-bold text-white">{currentOperation.instance.symbol}</span></p>
            </div>
            <label htmlFor="operationPercent" className="block mb-2 text-sm font-medium text-white">Percent of balance to use (%)</label>
            <div className="relative">
              <input type="number" id="operationPercent" value={operationPercent} onChange={(e) => setOperationPercent(e.target.value)} className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5" placeholder="Ex: 100" min="1" max="100" />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">%</span>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setOperationModalOpen(false)} disabled={isSubmittingOperation} className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded">Cancel</button>
              <button onClick={handleConfirmOperation} disabled={isSubmittingOperation} className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 disabled:bg-red-800 rounded">
                {isSubmittingOperation ? 'Sending...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {panicModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-900 p-8 rounded-lg shadow-lg text-center max-w-sm w-full border border-red-500/30">
            <h3 className="text-2xl font-bold text-red-500 mb-2">PANIC STOP</h3>
            <p className="text-white text-lg mb-4">
              This action will place a market order to sell the full token amount for each active strategy, and then immediately stop them.
            </p>
            <p className="text-gray-400 text-sm mb-6 italic">you can restart them any moment</p>
            <p className="text-white mb-6">Are you sure?</p>
            <div className="flex justify-center gap-4">
              <button onClick={handlePanicStop} className="px-6 py-2 rounded text-white font-bold bg-red-600 hover:bg-red-700">STOP ALL</button>
              <button onClick={() => setPanicModalOpen(false)} className="px-4 py-2 rounded text-white bg-gray-600 hover:bg-gray-700">Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {(loadingStatusChange || loadingDelete || isStoppingAll) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 px-8 py-6 rounded-lg shadow-lg text-white text-xl text-center">
            {statusMessage || (loadingDelete && "Deleting instance...") || panicStatusMessage}
          </div>
        </div>
      )}

    </div>
  );
}

export default InstancesPage;
