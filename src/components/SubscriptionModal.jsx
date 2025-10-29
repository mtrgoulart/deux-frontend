// components/SubscriptionModal.jsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query'; // useMutation e useQueryClient foram removidos daqui
import { apiFetch } from '../utils/api';

// 1. As props mudaram: onConfirm e isLoading são as novas props importantes
function SubscriptionModal({ copyConfig, isEditing, onClose, onConfirm, isLoading }) {
    const [selectedSharings, setSelectedSharings] = useState([]);
    const [selectedApiKey, setSelectedApiKey] = useState('');
    const [sizeAmount, setSizeAmount] = useState('10');
    
    // As queries para buscar dados para o formulário continuam aqui
    const { data: apiKeys = [] } = useQuery({ queryKey: ['user_apikeys'], queryFn: async () => { const res = await apiFetch('/get_user_apikeys'); return (await res.json()).user_apikeys || []; }});
    const { data: details, isLoading: isLoadingDetails } = useQuery({ queryKey: ['copytrading_details', copyConfig.id], queryFn: async () => { const res = await apiFetch(`/copytrading/${copyConfig.id}`); return res.json(); }});
    const { data: userSubscriptionsData, isLoading: isLoadingSubscriptions } = useQuery({ queryKey: ['copytrading_subscriptions'], queryFn: async () => { const res = await apiFetch('/copytrading/subscriptions'); const data = await res.json(); return data.subscriptions || []; }, enabled: isEditing, });

    // O useEffect para preencher o formulário continua o mesmo
    useEffect(() => {
        if (!isEditing && details?.sharing_ids) {
            setSelectedSharings(details.sharing_ids);
            return;
        }

        if (isEditing && !isLoadingSubscriptions && userSubscriptionsData?.length > 0) {
            const primarySub = userSubscriptionsData.find(sub => sub.copytrading_id_origin === copyConfig.id);
            
            if (primarySub) {
                setSelectedApiKey(primarySub.api_key_id);
                setSizeAmount(primarySub.max_amount_size || '10');
                
                if (primarySub.subscribed_sharing_ids) {
                    setSelectedSharings(primarySub.subscribed_sharing_ids);
                }
            }
        }
    }, [isEditing, details, userSubscriptionsData, isLoadingSubscriptions, copyConfig.id]);
    
    const handleToggleSharing = (sharingId) => {
        setSelectedSharings(prev => prev.includes(sharingId) ? prev.filter(id => id !== sharingId) : [...prev, sharingId]);
    };

    const handleConfirmCopy = () => {
        if (!selectedApiKey) { alert('Please select an API Key.'); return; }
        const numericSize = parseFloat(sizeAmount);
        if (isNaN(numericSize) || numericSize <= 0) { alert('Please enter a valid investment value.'); return; }
        if (selectedSharings.length === 0) { alert('Please select at least one sharing to copy.'); return; }

        const payload = {
            copytrading_id_origin: copyConfig.id,
            sharing_ids: selectedSharings,
            api_key_id: selectedApiKey,
            size_amount: numericSize,
        };

        // Chama a função que foi passada pela ExplorePage
        onConfirm(payload); 
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-lg w-full border border-red-500/30">
                {/* O conteúdo do modal não muda... */}
                <h3 className="text-xl font-semibold mb-1 text-white">{isEditing ? 'Review Subscription' : 'Copy'}: {copyConfig.name}</h3>
                <p className="text-sm text-gray-400 mb-6">by {copyConfig.creator}</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Select your API Key</label>
                        <select value={selectedApiKey} onChange={e => setSelectedApiKey(e.target.value)} disabled={isEditing} className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 disabled:opacity-60 disabled:cursor-not-allowed">
                            <option value="">-- Select --</option>
                            {apiKeys.map(key => <option key={key.api_key_id} value={key.api_key_id}>{key.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Max investment USDT value</label>
                        <div className="relative">
                            <input type="number" value={sizeAmount} onChange={e => setSizeAmount(e.target.value)} className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-red-500 focus:border-red-500" placeholder="e.g., 10.50" min="0" />
                        </div>
                    </div>
                </div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Sharings to Subscribe</label>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 max-h-60 overflow-y-auto space-y-1">
                    {isLoadingDetails ? <p className="p-4 text-center text-gray-400">Loading sharings...</p> : details?.sharings?.map(sharing => { const isSelected = selectedSharings.includes(sharing.id); return ( <div key={sharing.id} onClick={() => handleToggleSharing(sharing.id)} className={`p-2 rounded-md cursor-pointer transition-colors flex items-center gap-3 ${isSelected ? 'bg-blue-600/80 text-white' : 'bg-gray-700/50 hover:bg-gray-700'}`}> <div className={`w-4 h-4 rounded-sm border-2 flex-shrink-0 ${isSelected ? 'bg-blue-400 border-blue-200' : 'border-gray-500'}`}></div> <span className="font-medium truncate">{sharing.instance_name}</span> <span className="text-gray-400 ml-2">({sharing.symbol})</span> </div> ) })}
                </div>
                
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} disabled={isLoading} className="px-5 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50">Cancel</button>
                    <button onClick={handleConfirmCopy} disabled={isLoading} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold text-white transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed">
                        {isLoading ? (isEditing ? 'Saving...' : 'Copying...') : (isEditing ? 'Save' : 'Copy Trading')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SubscriptionModal;