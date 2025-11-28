// pages/ExplorePage.jsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import CopyCard from '../components/CopyCard';
import SubscriptionModal from '../components/SubscriptionModal';
import UnsubscribeModal from '../components/UnsubscribeModal';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-center items-center mt-8 gap-3">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-6 py-3 bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 text-red-400 rounded-lg font-mono text-sm uppercase tracking-wider
                         hover:bg-red-900/30 hover:border-red-500/50 transition-all duration-300
                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gradient-to-br disabled:hover:from-gray-900 disabled:hover:via-black disabled:hover:to-gray-900
                         focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
                « Prev
            </button>
            <span className="text-gray-400 font-mono text-sm">
                <span className="text-red-500 font-bold">{currentPage}</span> / {totalPages}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-6 py-3 bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 text-red-400 rounded-lg font-mono text-sm uppercase tracking-wider
                         hover:bg-red-900/30 hover:border-red-500/50 transition-all duration-300
                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gradient-to-br disabled:hover:from-gray-900 disabled:hover:via-black disabled:hover:to-gray-900
                         focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
                Next »
            </button>
        </div>
    );
};

function ExplorePage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [selectedCopy, setSelectedCopy] = useState(null);
    const queryClient = useQueryClient();
    const [copyToUnsubscribe, setCopyToUnsubscribe] = useState(null);
    const [isSubscribing, setIsSubscribing] = useState(false);

    const { data: exploreData, isLoading: isLoadingExplore } = useQuery({
        queryKey: ['explore_copytradings', currentPage],
        queryFn: async () => {
            const res = await apiFetch(`/explore_copytradings?page=${currentPage}&limit=24`);
            return res.json();
        },
        keepPreviousData: true,
    });

    const { data: userSubscriptions = [] } = useQuery({
        queryKey: ['copytrading_subscriptions'], 
        queryFn: async () => {
            const res = await apiFetch('/copytrading/subscriptions'); 
            const data = await res.json();
            return data.subscriptions || [];
        }
    });
    

    const subscribedCopyIds = useMemo(() => {
        if (!userSubscriptions.length) return new Set();
        const ids = userSubscriptions.map(sub => sub.copytrading_id_origin);
        return new Set(ids);
    }, [userSubscriptions]);

    const unsubscribeMutation = useMutation({
        mutationFn: (copyId) => apiFetch('/copytrading/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ copytrading_id_origin: copyId }), }),
        onSuccess: () => { console.log('Unsubscribed successfully!'); },
        onError: (error) => { alert("❌ Could not unsubscribe. Please try again."); },
        onSettled: () => {
            setCopyToUnsubscribe(null); 
            queryClient.invalidateQueries({ queryKey: ['copytrading_subscriptions', 'explore_copytradings'] });
        }
    });

    const subscribeMutation = useMutation({
        mutationFn: (payload) => 
            apiFetch('/copytrading/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
        onSuccess: () => { console.log('Subscription successful!'); },
        onError: (error) => { alert(`❌ Error: ${error.message}`); },
        onSettled: () => {
            setIsSubModalOpen(false); // Fecha o modal diretamente
            queryClient.invalidateQueries({ queryKey: ['copytrading_subscriptions', 'explore_copytradings'] });
        }
    });

    const handleExitAction = (copyItem) => {
        setCopyToUnsubscribe(copyItem);
    };

    const handlePrimaryAction = (copyItem) => { setSelectedCopy(copyItem); setIsSubModalOpen(true); };

    const isProcessing = unsubscribeMutation.isLoading || subscribeMutation.isLoading;

    let loadingText = 'Processing...';
    if (unsubscribeMutation.isLoading) {
        loadingText = 'Exiting configuration...';
    } else if (subscribeMutation.isLoading) {
        // Verifica se selectedCopy existe antes de acessar isEditing
        const isEditing = selectedCopy ? subscribedCopyIds.has(selectedCopy.id) : false;
        loadingText = isEditing ? 'Saving changes...' : 'Processing Subscription...';
    }

    return (
        <>
            {/* Processing Overlay */}
            {isProcessing && (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm z-[9999]">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 border-4 border-red-900/30 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-24 h-24 border-t-4 border-r-4 border-red-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 tracking-wider uppercase mb-2">
                        {loadingText}
                    </p>
                    <p className="text-gray-600 font-mono text-sm tracking-wide">
                        [PROCESSING REQUEST...]
                    </p>
                </div>
            )}

            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
                {/* Cyberpunk Header */}
                <div className="relative border-b border-red-900/50 bg-black/40 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-red-900/10"></div>
                    <div className="container mx-auto px-4 md:px-6 py-8 relative">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-1 h-16 bg-gradient-to-b from-red-500 to-red-900"></div>
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600 tracking-wider uppercase">
                                        Copy Trading Hub
                                    </h1>
                                    <p className="text-gray-500 text-sm mt-1 font-mono tracking-wide">
                                        EXPLORE STRATEGIES // {exploreData?.total_copytradings || 0} CONFIGURATIONS AVAILABLE
                                    </p>
                                </div>
                            </div>
                            {/* Subscriptions Badge */}
                            <div className="hidden md:flex items-center gap-3 bg-black/60 border border-red-900/50 rounded-lg px-6 py-3 backdrop-blur-sm">
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Active</span>
                                <span className="text-2xl font-bold font-mono text-red-400">
                                    {userSubscriptions.length}
                                </span>
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Subs</span>
                            </div>
                        </div>
                        {/* Tech decoration lines */}
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
                            <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-red-500"></div>
                            <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-red-400"></div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-4 md:px-6 py-8">
                    {isLoadingExplore ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <div className="relative mb-8 mx-auto">
                                    <div className="w-24 h-24 border-4 border-red-900/30 rounded-full animate-pulse"></div>
                                    <div className="absolute inset-0 w-24 h-24 border-t-4 border-r-4 border-red-500 rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 tracking-wider uppercase mb-2">
                                    Loading Strategies
                                </h2>
                                <p className="text-gray-600 font-mono text-sm tracking-wide">
                                    [FETCHING DATA...]
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Section Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-px bg-red-500"></div>
                                <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider font-mono">
                                    ◆ Available Strategies
                                </h2>
                                <div className="flex-1 h-px bg-red-900/30"></div>
                            </div>

                            {/* Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {exploreData?.copytradings.map(item => (
                                    <CopyCard
                                        key={item.id}
                                        {...item}
                                        isSubscribed={subscribedCopyIds.has(item.id)}
                                        onPrimaryAction={() => handlePrimaryAction(item)}
                                        onExitAction={() => handleExitAction(item)}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            <Pagination
                                currentPage={exploreData?.current_page || 1}
                                totalPages={exploreData?.total_pages || 1}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>

                {/* Tech footer decoration */}
                <div className="mt-8 flex items-center justify-center gap-2 opacity-30 pb-8">
                    <div className="w-12 h-px bg-gradient-to-r from-transparent to-red-500"></div>
                    <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                    <div className="w-24 h-px bg-red-500"></div>
                    <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                    <div className="w-12 h-px bg-gradient-to-l from-transparent to-red-500"></div>
                </div>
            </div>

            {/* 4. PASSAMOS AS PROPS CORRETAS PARA OS MODAIS */}
            {isSubModalOpen && selectedCopy && (
                <SubscriptionModal 
                    copyConfig={selectedCopy}
                    isEditing={subscribedCopyIds.has(selectedCopy.id)}
                    onClose={() => setIsSubModalOpen(false)}
                    isLoading={subscribeMutation.isLoading}
                    onConfirm={(payload) => subscribeMutation.mutate(payload)}
                />
            )}

            {copyToUnsubscribe && (
                <UnsubscribeModal
                    copyItem={copyToUnsubscribe}
                    isLoading={unsubscribeMutation.isLoading}
                    onClose={() => setCopyToUnsubscribe(null)}
                    onConfirm={() => unsubscribeMutation.mutate(copyToUnsubscribe.id)}
                />
            )}
        </>
    );
}

export default ExplorePage;