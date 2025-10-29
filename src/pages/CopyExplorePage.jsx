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
        <div className="flex justify-center items-center mt-8 gap-2">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-800 rounded-md disabled:opacity-50">« Prev</button>
            <span className="text-gray-400">Page {currentPage} of {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="px-4 py-2 bg-gray-800 rounded-md disabled:opacity-50">Next »</button>
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
            {/* 3. ESTE LOADING AGORA TEM UMA FONTE ÚNICA E CONFIÁVEL DA VERDADE */}
            {isProcessing && (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 z-[9999]">
                    <div className="w-16 h-16 border-4 border-solid border-gray-600 border-t-red-500 rounded-full animate-spin"></div>
                    <p className="text-white text-xl mt-4">{loadingText}</p>
                </div>
            )}

            <div className="p-4 sm:p-6 md:p-8 text-slate-200 animate-fade-in relative">
                <h2 className="text-3xl font-bold text-white mb-8" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}>
                    Explore Copy Tradings
                </h2>
                {isLoadingExplore ? ( <p>Loading...</p> ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {exploreData?.copytradings.map(item => ( <CopyCard key={item.id} {...item} isSubscribed={subscribedCopyIds.has(item.id)} onPrimaryAction={() => handlePrimaryAction(item)} onExitAction={() => handleExitAction(item)} /> ))}
                        </div>
                        <Pagination currentPage={exploreData?.current_page || 1} totalPages={exploreData?.total_pages || 1} onPageChange={setCurrentPage} />
                    </>
                )}
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