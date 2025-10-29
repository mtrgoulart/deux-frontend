import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

// --- ADICIONADO: Componente de Overlay, igual ao do InstanceCreationForm.jsx ---
function SavingOverlay({ isSaving }) {
  if (!isSaving) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-[100]">
      <div className="w-16 h-16 border-4 border-solid border-gray-600 border-t-red-500 rounded-full animate-spin"></div>
      <p className="text-white text-xl mt-4 font-semibold">Saving...</p>
      <p className="text-gray-300 mt-1">Please, wait.</p>
    </div>
  );
}

// Ícones (sem alterações)
const AddIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg> );
const RemoveIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg> );

function CopyCreationForm({ show, onClose, initialData }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [selectedSharings, setSelectedSharings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false); // <-- NOVO ESTADO MANUAL

  // Hooks useQuery, useEffect, useMemo, etc. (sem alterações)
  const { data: availableSharings = [], isLoading: isLoadingSharings } = useQuery({ queryKey: ['user_sharings'], queryFn: async () => { const res = await apiFetch('/user_sharings'); const data = await res.json(); return data.sharings || []; } });
  const { data: details } = useQuery({ queryKey: ['copytrading_details', initialData?.id], queryFn: async () => { const res = await apiFetch(`/copytrading/${initialData.id}`); return res.json(); }, enabled: !!initialData?.id });
  useEffect(() => { if (initialData) { setName(initialData.name || ''); if (details) { setSelectedSharings(details.sharing_ids || []); } } else { setName(''); setSelectedSharings([]); } }, [initialData, details]);
  const handleAddSharing = (sharingId) => { setSelectedSharings(prev => [...prev, sharingId]); };
  const handleRemoveSharing = (sharingId) => { setSelectedSharings(prev => prev.filter(id => id !== sharingId)); };
  const { filteredAvailable, selectedObjects } = useMemo(() => { const lowercasedFilter = searchTerm.toLowerCase(); const filteredAvailable = availableSharings.filter(sharing => !selectedSharings.includes(sharing.id)).filter(sharing => sharing.instance_name.toLowerCase().includes(lowercasedFilter)); const selectedObjects = selectedSharings.map(id => availableSharings.find(s => s.id === id)).filter(Boolean); return { filteredAvailable, selectedObjects }; }, [searchTerm, availableSharings, selectedSharings]);

  // --- ATUALIZAÇÃO: useMutation agora controla o estado 'isSaving' ---
  const saveMutation = useMutation({
    mutationFn: async (newCopyData) => {
        setIsSaving(true); // Ativa o overlay
        const endpoint = initialData?.id ? '/update_copytrading' : '/save_copytrading';
        const res = await apiFetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCopyData),
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to save configuration');
        }
        return res.json();
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['copytradings']);
        queryClient.invalidateQueries(['copytrading_details', initialData?.id]);
        onClose();
    },
    onError: (error) => {
        alert(`Error saving configuration: ${error.message}`);
    },
    onSettled: () => {
        setIsSaving(false); // Desativa o overlay (sucesso ou erro)
    }
  });

  const handleSubmit = (e) => { e.preventDefault(); const payload = { name, sharing_ids: selectedSharings }; if (initialData?.id) { payload.id = initialData.id; } saveMutation.mutate(payload); };

  if (!show) return null;

  return (
    <>
      {/* --- ADICIONADO: Renderiza o overlay aqui --- */}
      <SavingOverlay isSaving={isSaving} />

      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40 animate-fade-in">
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-left max-w-3xl w-full border border-red-500/30">
          <h3 className="text-xl font-semibold mb-6 text-white">{initialData ? 'Edit' : 'Create'} Copy Configuration</h3>
          <form onSubmit={handleSubmit}>
            {/* O resto do formulário permanece o mesmo, mas os botões agora usam 'isSaving' */}
            <div className="mb-6"><label htmlFor="copyName" className="block mb-2 text-sm font-medium text-white">Configuration Name</label><input type="text" id="copyName" value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5" required /></div>
            <div className="grid grid-cols-2 gap-6"><div><label className="block mb-2 text-sm font-medium text-white">Available Sharings ({filteredAvailable.length})</label><input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5 mb-2" /><div className="bg-gray-800 border border-gray-700 rounded-lg p-2 h-64 overflow-y-auto">{isLoadingSharings ? <p className="p-4 text-center text-gray-400">Loading...</p> : filteredAvailable.length > 0 ? (filteredAvailable.map(sharing => (<div key={sharing.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-700/50"><div><p className="text-sm font-medium text-gray-200">{sharing.instance_name}</p><p className="text-xs text-gray-400">by {sharing.user_name}</p></div><button type="button" onClick={() => handleAddSharing(sharing.id)} className="text-green-400 hover:text-green-300 p-1 rounded-full hover:bg-green-500/20"><AddIcon /></button></div>))) : (<p className="p-4 text-center text-gray-500 text-sm">No available sharings found.</p>)}</div></div><div><label className="block mb-2 text-sm font-medium text-white">Selected Sharings ({selectedObjects.length})</label><div className="bg-gray-950/50 border border-gray-700 rounded-lg p-2 h-[18.5rem] overflow-y-auto">{selectedObjects.length > 0 ? (selectedObjects.map(sharing => (<div key={sharing.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-700/50"><div><p className="text-sm font-medium text-gray-200">{sharing.instance_name}</p><p className="text-xs text-gray-400">by {sharing.user_name}</p></div><button type="button" onClick={() => handleRemoveSharing(sharing.id)} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20"><RemoveIcon /></button></div>))) : (<div className="flex items-center justify-center h-full"><p className="text-center text-gray-500 text-sm">Add sharings from the left panel.</p></div>)}</div></div></div>
            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded disabled:bg-blue-800 disabled:cursor-not-allowed">
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CopyCreationForm;