// src/pages/CopySubscriptionPage.jsx

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { FullScreenLoader } from '../components/FullScreenLoader';
import Pagination from '../components/Pagination';
import TradingBarsLoader from '../components/TradingBarsLoader';
import RefreshButton from '../components/RefreshButton';
import SubscriptionModal from '../components/SubscriptionModal';
import UnsubscribeModal from '../components/UnsubscribeModal';

function CopySubscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState(null);
  const [subscriptionToExit, setSubscriptionToExit] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 25;

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions, isFetching: subscriptionsFetching, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['copytrading_subscriptions'],
    queryFn: async () => {
      const res = await apiFetch('/copytrading/subscriptions');
      const data = await res.json();
      return data.subscriptions || [];
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: (payload) =>
      apiFetch('/copytrading/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['copytrading_subscriptions']);
      setShowEditModal(false);
    },
    onError: (error) => {
      console.error('Update subscription failed', error);
    },
  });

  const exitSubscriptionMutation = useMutation({
    mutationFn: (copytradingIdOrigin) =>
      apiFetch('/copytrading/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copytrading_id_origin: copytradingIdOrigin }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['copytrading_subscriptions']);
      setSubscriptionToExit(null);
    },
    onError: (error) => {
      console.error('Exit subscription failed', error);
    },
  });

  const paginatedSubscriptions = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return subscriptions.slice(startIndex, startIndex + recordsPerPage);
  }, [subscriptions, currentPage, recordsPerPage]);

  const totalPages = Math.ceil(subscriptions.length / recordsPerPage);

  const handleReview = (subscription) => {
    setSubscriptionToEdit({
      id: subscription.copytrading_id_origin,
      name: subscription.copytrading_name,
    });
    setShowEditModal(true);
  };

  const handleExitConfirm = () => {
    if (subscriptionToExit) {
      exitSubscriptionMutation.mutate(subscriptionToExit.copytrading_id_origin);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isMutating = updateSubscriptionMutation.isPending || exitSubscriptionMutation.isPending;

  if (isLoadingSubscriptions) {
    return (
      <div className="bg-surface-primary">
        <TradingBarsLoader title={t('copySubscription.loadingTitle')} subtitle={t('copySubscription.loadingSubtitle')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <FullScreenLoader isOpen={isMutating} message={t('copySubscription.processing')} />

      {/* Edit Modal */}
      {showEditModal && (
        <SubscriptionModal
          isEditing={true}
          copyConfig={subscriptionToEdit}
          onClose={() => setShowEditModal(false)}
          onConfirm={(payload) => updateSubscriptionMutation.mutate(payload)}
          isLoading={updateSubscriptionMutation.isPending}
        />
      )}

      {/* Exit Modal */}
      <UnsubscribeModal
        copyItem={subscriptionToExit ? { name: subscriptionToExit.copytrading_name } : null}
        onClose={() => setSubscriptionToExit(null)}
        onConfirm={handleExitConfirm}
        isLoading={exitSubscriptionMutation.isPending}
      />

      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
            {t('copySubscription.title')}
          </h1>
        </div>

        <div className="space-y-6">
          {/* Subscriptions Table */}
          <div>
            <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
              {t('copySubscription.database')}
            </h2>

            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              {/* Table header bar */}
              <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3 flex items-center justify-between">
                <span className="text-sm text-content-accent uppercase tracking-wider">
                  {t('copySubscription.registry')}
                </span>
                <RefreshButton onClick={refetchSubscriptions} isRefreshing={subscriptionsFetching} label={t('common.refresh')} />
              </div>

              {/* Table content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-raised/30">
                      <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copySubscription.id')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copySubscription.copyName')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copySubscription.creator')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copySubscription.status')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copySubscription.subscriptionDate')}</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('copySubscription.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-border-subtle transition-opacity duration-300 ${subscriptionsFetching && !isLoadingSubscriptions ? 'opacity-40' : ''}`}>
                    {paginatedSubscriptions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="text-content-muted text-sm">
                            {t('copySubscription.noSubscriptions')}
                          </div>
                          <div className="text-content-muted text-xs mt-1">
                            {t('copySubscription.noSubscriptionsHint')}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedSubscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-surface-raised/30 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                            {sub.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-content-primary truncate max-w-xs" title={sub.copytrading_name}>
                            {sub.copytrading_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary">
                            {sub.creator_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                              sub.is_active
                                ? 'bg-success-muted text-success'
                                : 'bg-surface-raised text-content-muted border border-border-subtle'
                            }`}>
                              {sub.is_active ? t('copySubscription.active') : t('copySubscription.inactive')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                            {formatDate(sub.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => navigate(`/copy/details/${sub.copytrading_id_origin}`)}
                                className="p-2 hover:bg-surface-raised/50 rounded transition-all duration-200 group/btn"
                                title={t('copySubscription.viewDetails')}
                              >
                                <svg className="w-5 h-5 text-content-secondary group-hover/btn:text-content-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleReview(sub)}
                                className="p-2 hover:bg-surface-raised/50 rounded transition-all duration-200 group/btn"
                                title={t('copySubscription.review')}
                              >
                                <svg className="w-5 h-5 text-content-secondary group-hover/btn:text-content-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setSubscriptionToExit(sub)}
                                className="p-2 hover:bg-surface-raised/50 rounded transition-all duration-200 group/btn"
                                title={t('copySubscription.exit')}
                              >
                                <svg className="w-5 h-5 text-content-secondary group-hover/btn:text-content-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-surface-raised/30 border-t border-border-subtle px-6 py-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={recordsPerPage}
                  totalItems={subscriptions.length}
                  itemLabel={t('copySubscription.subscriptionsLabel')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CopySubscriptionPage;
