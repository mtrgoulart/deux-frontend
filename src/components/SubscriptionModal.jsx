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
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="relative max-w-2xl w-full">
                {/* Outer glow */}
                <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-lg"></div>

                {/* Modal container */}
                <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg shadow-2xl overflow-hidden">
                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500 z-10"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500 z-10"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500 z-10"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500 z-10"></div>

                    {/* Header */}
                    <div className="bg-black/40 border-b border-red-900/30 px-6 py-4 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-700"></div>
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-900"></div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400 uppercase tracking-wider font-mono">
                                    {isEditing ? '◆ Review Subscription' : '◆ Copy Strategy'}
                                </h3>
                                <p className="text-sm text-gray-500 font-mono mt-1">
                                    {copyConfig.name} <span className="text-red-500">// by {copyConfig.creator}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 bg-gradient-to-br from-black/60 to-gray-900/60">
                        {/* Configuration inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* API Key selector */}
                            <div>
                                <label className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono">
                                    ◆ API Key
                                </label>
                                <select
                                    value={selectedApiKey}
                                    onChange={e => setSelectedApiKey(e.target.value)}
                                    disabled={isEditing}
                                    className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded-lg font-mono text-sm
                                             focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                                             hover:border-red-700 transition-all duration-300
                                             disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="" className="bg-black text-red-400">-- Select API Key --</option>
                                    {apiKeys.map(key => (
                                        <option key={key.api_key_id} value={key.api_key_id} className="bg-black text-red-400">
                                            {key.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Max investment */}
                            <div>
                                <label className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono">
                                    ◆ Max USDT Investment
                                </label>
                                <input
                                    type="number"
                                    value={sizeAmount}
                                    onChange={e => setSizeAmount(e.target.value)}
                                    className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded-lg font-mono text-sm
                                             focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                                             hover:border-red-700 transition-all duration-300"
                                    placeholder="e.g., 10.50"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Sharings selection */}
                        <div>
                            <label className="block text-xs font-bold text-red-500 mb-3 uppercase tracking-widest font-mono">
                                ◆ Select Sharings to Subscribe
                            </label>
                            <div className="bg-black/60 border border-red-900/50 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                                {isLoadingDetails ? (
                                    <p className="p-4 text-center text-gray-500 font-mono text-sm">Loading sharings...</p>
                                ) : (
                                    details?.sharings?.map(sharing => {
                                        const isSelected = selectedSharings.includes(sharing.id);
                                        return (
                                            <div
                                                key={sharing.id}
                                                onClick={() => handleToggleSharing(sharing.id)}
                                                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-3 border ${
                                                    isSelected
                                                        ? 'bg-red-900/30 border-red-500/50 text-red-300'
                                                        : 'bg-gray-900/50 border-red-900/20 hover:bg-gray-900/80 hover:border-red-900/40 text-gray-400'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded-sm border-2 flex-shrink-0 transition-all ${
                                                    isSelected ? 'bg-red-500 border-red-400' : 'border-gray-600'
                                                }`}>
                                                    {isSelected && (
                                                        <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>
                                                    )}
                                                </div>
                                                <span className="font-bold font-mono truncate">{sharing.instance_name}</span>
                                                <span className="text-xs text-gray-600 ml-auto font-mono">({sharing.symbol})</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer actions */}
                    <div className="bg-black/40 border-t border-red-900/30 px-6 py-4 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-red-900/50 text-gray-400 rounded-lg font-mono text-sm uppercase tracking-wider
                                     hover:bg-red-900/20 hover:border-red-700/50 hover:text-red-400 transition-all duration-300
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmCopy}
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 border border-red-500 text-white rounded-lg font-mono text-sm uppercase tracking-wider font-bold
                                     hover:from-red-500 hover:to-red-600 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300
                                     disabled:opacity-50 disabled:cursor-wait
                                     focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        >
                            {isLoading ? (isEditing ? 'Saving...' : 'Copying...') : (isEditing ? '◆ Save Changes' : '◆ Copy Trading')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SubscriptionModal;