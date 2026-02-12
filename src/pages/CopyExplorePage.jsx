import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import CopyCard from '../components/CopyCard';
import SubscriptionModal from '../components/SubscriptionModal';
import UnsubscribeModal from '../components/UnsubscribeModal';
import TradingBarsLoader from '../components/TradingBarsLoader';
import { FullScreenLoader } from '../components/FullScreenLoader';
import Pagination from '../components/Pagination';

function ExplorePage() {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [selectedCopy, setSelectedCopy] = useState(null);
    const queryClient = useQueryClient();
    const [copyToUnsubscribe, setCopyToUnsubscribe] = useState(null);

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

    // Fetch chart data for all visible copytradings
    const copytradingIds = useMemo(() => {
        return exploreData?.copytradings?.map(ct => ct.id) || [];
    }, [exploreData]);

    const chartQueries = useQueries({
        queries: copytradingIds.map(id => ({
            queryKey: ['copytrading_chart', id],
            queryFn: async () => {
                const res = await apiFetch(`/copytrading/${id}/chart`);
                const data = await res.json();
                return { id, chartData: data.chart_data || [] };
            },
            staleTime: 5 * 60 * 1000,
            enabled: copytradingIds.length > 0,
        })),
    });

    // Map chart data by copytrading id
    const chartDataMap = useMemo(() => {
        const map = {};
        chartQueries.forEach(query => {
            if (query.data) {
                map[query.data.id] = query.data.chartData;
            }
        });
        return map;
    }, [chartQueries]);

    const subscribedCopyIds = useMemo(() => {
        if (!userSubscriptions.length) return new Set();
        const ids = userSubscriptions.map(sub => sub.copytrading_id_origin);
        return new Set(ids);
    }, [userSubscriptions]);

    const unsubscribeMutation = useMutation({
        mutationFn: (copyId) => apiFetch('/copytrading/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ copytrading_id_origin: copyId }), }),
        onError: () => { alert(t('copyExplore.unsubscribeError')); },
        onSettled: () => {
            setCopyToUnsubscribe(null);
            queryClient.invalidateQueries({ queryKey: ['copytrading_subscriptions', 'explore_copytradings'] });
        }
    });

    const subscribeMutation = useMutation({
        mutationFn: (payload) =>
            apiFetch('/copytrading/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
        onError: (error) => { alert(`Error: ${error.message}`); },
        onSettled: () => {
            setIsSubModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['copytrading_subscriptions', 'explore_copytradings'] });
        }
    });

    const handleExitAction = (copyItem) => {
        setCopyToUnsubscribe(copyItem);
    };

    const handlePrimaryAction = (copyItem) => { setSelectedCopy(copyItem); setIsSubModalOpen(true); };

    const isProcessing = unsubscribeMutation.isLoading || subscribeMutation.isLoading;

    let loadingText = t('copyExplore.processing');
    if (unsubscribeMutation.isLoading) {
        loadingText = t('copyExplore.exitingConfiguration');
    } else if (subscribeMutation.isLoading) {
        const isEditing = selectedCopy ? subscribedCopyIds.has(selectedCopy.id) : false;
        loadingText = isEditing ? t('copyExplore.savingChanges') : t('copyExplore.processingSubscription');
    }

    const totalItems = exploreData?.total_copytradings || 0;
    const totalPages = exploreData?.total_pages || 1;

    return (
        <>
            <FullScreenLoader isOpen={isProcessing} message={loadingText} />

            <div className="min-h-screen bg-surface-primary">
                <div className="container mx-auto px-4 md:px-6 py-6">
                    {/* Header card */}
                    <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
                                    {t('copyExplore.title')}
                                </h1>
                            </div>
                            <div className="hidden md:flex items-center gap-3 bg-surface-primary border border-border rounded-lg px-5 py-3">
                                <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">{t('copyExplore.activeSubscriptions')}</span>
                                <span className="text-2xl font-bold font-mono text-content-accent">
                                    {userSubscriptions.length}
                                </span>
                                <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">{t('copyExplore.subscriptions')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    {isLoadingExplore ? (
                        <TradingBarsLoader title={t('copyExplore.loadingTitle')} subtitle={t('copyExplore.loadingDescription')} />
                    ) : (
                        <div className="bg-surface border border-border rounded-lg overflow-hidden">
                            {/* Section header bar */}
                            <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-content-secondary uppercase tracking-wider">
                                    {t('copyExplore.availableStrategies')}
                                </h2>
                            </div>

                            {/* Cards grid */}
                            <div className="p-6">
                                {exploreData?.copytradings?.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {exploreData.copytradings.map(item => (
                                            <CopyCard
                                                key={item.id}
                                                id={item.id}
                                                name={item.name}
                                                creator={item.creator}
                                                apy={item.apy}
                                                chartData={chartDataMap[item.id] || []}
                                                isSubscribed={subscribedCopyIds.has(item.id)}
                                                onPrimaryAction={() => handlePrimaryAction(item)}
                                                onExitAction={() => handleExitAction(item)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-content-muted">
                                        {t('copyExplore.noStrategies')}
                                    </div>
                                )}
                            </div>

                            {/* Pagination footer */}
                            <div className="bg-surface-raised/30 border-t border-border-subtle px-6 py-4">
                                <Pagination
                                    currentPage={exploreData?.current_page || 1}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    itemsPerPage={24}
                                    totalItems={totalItems}
                                    itemLabel={t('copyExplore.strategiesLabel')}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
