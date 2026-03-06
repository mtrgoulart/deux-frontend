import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';

function SubscriptionModal({ copyConfig, isEditing, onClose, onConfirm, isLoading }) {
    const { t } = useTranslation();
    // Per-sharing config: { [sharingId]: { selected, size_mode, size_value } }
    const [sharingConfigs, setSharingConfigs] = useState({});
    const [selectedApiKey, setSelectedApiKey] = useState('');
    const [sizeAmount, setSizeAmount] = useState('10');

    const { data: apiKeys = [] } = useQuery({ queryKey: ['user_apikeys'], queryFn: async () => { const res = await apiFetch('/get_user_apikeys'); return (await res.json()).user_apikeys || []; }});
    const { data: details, isLoading: isLoadingDetails } = useQuery({ queryKey: ['copytrading_details', copyConfig.id], queryFn: async () => { const res = await apiFetch(`/copytrading/${copyConfig.id}`); return res.json(); }});
    const { data: userSubscriptionsData, isLoading: isLoadingSubscriptions } = useQuery({ queryKey: ['copytrading_subscriptions'], queryFn: async () => { const res = await apiFetch('/copytrading/subscriptions'); const data = await res.json(); return data.subscriptions || []; }, enabled: isEditing, });

    useEffect(() => {
        if (!isEditing && details?.sharings) {
            // New subscription: select all sharings with default percentage 100
            const configs = {};
            details.sharings.forEach(s => {
                configs[s.id] = { selected: true, size_mode: 'percentage', size_value: '100' };
            });
            setSharingConfigs(configs);
            return;
        }

        if (isEditing && !isLoadingSubscriptions && userSubscriptionsData?.length > 0) {
            const primarySub = userSubscriptionsData.find(sub => sub.copytrading_id_origin === copyConfig.id);

            if (primarySub) {
                setSelectedApiKey(primarySub.api_key_id);
                setSizeAmount(primarySub.max_amount_size || '10');

                // Populate from subscribed_sharings (jsonb array)
                const configs = {};
                // Initialize all sharings as unselected
                if (details?.sharings) {
                    details.sharings.forEach(s => {
                        configs[s.id] = { selected: false, size_mode: 'percentage', size_value: '100' };
                    });
                }
                // Mark subscribed ones with their config
                if (primarySub.subscribed_sharings) {
                    primarySub.subscribed_sharings.forEach(s => {
                        configs[s.sharing_id] = {
                            selected: true,
                            size_mode: s.size_mode || 'percentage',
                            size_value: String(s.size_amount || 100)
                        };
                    });
                }
                setSharingConfigs(configs);
            }
        }
    }, [isEditing, details, userSubscriptionsData, isLoadingSubscriptions, copyConfig.id]);

    const handleToggleSharing = (sharingId) => {
        setSharingConfigs(prev => ({
            ...prev,
            [sharingId]: {
                ...prev[sharingId],
                selected: !prev[sharingId]?.selected,
                size_mode: prev[sharingId]?.size_mode || 'percentage',
                size_value: prev[sharingId]?.size_value || '100'
            }
        }));
    };

    const handleSharingConfigChange = (sharingId, field, value) => {
        setSharingConfigs(prev => ({
            ...prev,
            [sharingId]: { ...prev[sharingId], [field]: value }
        }));
    };

    const isPercentageInvalid = (config) => {
        if (config.size_mode !== 'percentage') return false;
        const val = parseFloat(config.size_value);
        return isNaN(val) || val < 0 || val > 100;
    };

    const handleConfirmCopy = () => {
        if (!selectedApiKey) { alert(t('copyExplore.selectApiKeyAlert')); return; }
        const numericSize = parseFloat(sizeAmount);
        if (isNaN(numericSize) || numericSize <= 0) { alert(t('copyExplore.validInvestmentAlert')); return; }

        const selectedEntries = Object.entries(sharingConfigs).filter(([_, c]) => c.selected);
        if (selectedEntries.length === 0) { alert(t('copyExplore.selectSharingAlert')); return; }

        // Validate per-sharing size values
        for (const [id, config] of selectedEntries) {
            const val = parseFloat(config.size_value);
            if (isNaN(val) || val <= 0) {
                alert(t('copyExplore.validSizeValueAlert'));
                return;
            }
            if (config.size_mode === 'percentage' && (val < 0 || val > 100)) {
                alert(t('copyExplore.percentageRangeAlert'));
                return;
            }
        }

        const payload = {
            copytrading_id_origin: copyConfig.id,
            sharings: selectedEntries.map(([id, c]) => ({
                sharing_id: parseInt(id),
                size_mode: c.size_mode,
                size_value: parseFloat(c.size_value)
            })),
            api_key_id: selectedApiKey,
            size_amount: numericSize,
        };

        onConfirm(payload);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full bg-surface border border-border rounded-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-4">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent uppercase tracking-wider">
                        {isEditing ? t('copyExplore.reviewSubscription') : t('copyExplore.copyStrategy')}
                    </h3>
                    <p className="text-sm text-content-muted mt-1">
                        {copyConfig.name} <span className="text-content-accent">// {t('copyExplore.by')} {copyConfig.creator}</span>
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* API Key selector */}
                        <div>
                            <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                                {t('copyExplore.apiKey')}
                            </label>
                            <select
                                value={selectedApiKey}
                                onChange={e => setSelectedApiKey(e.target.value)}
                                disabled={isEditing}
                                className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">{t('copyExplore.selectApiKey')}</option>
                                {apiKeys.map(key => (
                                    <option key={key.api_key_id} value={key.api_key_id}>
                                        {key.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Max investment */}
                        <div>
                            <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                                {t('copyExplore.maxInvestment')}
                            </label>
                            <input
                                type="number"
                                value={sizeAmount}
                                onChange={e => setSizeAmount(e.target.value)}
                                className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                                         transition-colors"
                                placeholder={t('copyExplore.investmentPlaceholder')}
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Sharings selection with per-sharing sizing */}
                    <div>
                        <label className="block text-xs font-semibold text-content-accent mb-3 uppercase tracking-wider">
                            {t('copyExplore.selectSharings')}
                        </label>
                        <div className="bg-surface-primary border border-border rounded-lg p-3 max-h-80 overflow-y-auto space-y-2">
                            {isLoadingDetails ? (
                                <div className="py-6 flex flex-col items-center gap-3">
                                    <div className="flex items-end justify-center gap-1 h-8">
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 rounded-full bg-gradient-to-t from-teal-600 to-teal-400"
                                                style={{
                                                    animation: 'sharings-loader 1.2s ease-in-out infinite',
                                                    animationDelay: `${i * 0.15}s`,
                                                    height: '20%',
                                                }}
                                            />
                                        ))}
                                        <style>{`
                                            @keyframes sharings-loader {
                                                0%, 100% { height: 20%; opacity: 0.4; }
                                                50% { height: 100%; opacity: 1; }
                                            }
                                        `}</style>
                                    </div>
                                    <p className="text-content-muted text-sm">{t('copyExplore.loadingSharings')}</p>
                                </div>
                            ) : (
                                details?.sharings?.map(sharing => {
                                    const config = sharingConfigs[sharing.id] || {};
                                    const isSelected = !!config.selected;
                                    const pnl = sharing.pnl || 0;
                                    const percentInvalid = isSelected && isPercentageInvalid(config);
                                    return (
                                        <div
                                            key={sharing.id}
                                            onClick={() => handleToggleSharing(sharing.id)}
                                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                                                isSelected
                                                    ? 'bg-accent-muted border-border-accent text-content-primary'
                                                    : 'bg-surface border-border hover:bg-surface-raised hover:border-border-accent/50 text-content-secondary'
                                            }`}
                                        >
                                            {/* Top row: checkbox + name + symbol badge */}
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-sm border-2 flex-shrink-0 transition-all ${
                                                    isSelected ? 'bg-accent border-accent' : 'border-content-muted'
                                                }`}>
                                                    {isSelected && (
                                                        <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="font-bold truncate block">{sharing.instance_name}</span>
                                                    <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-mono bg-surface-raised/60 text-content-muted rounded">
                                                        {sharing.symbol}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Bottom section: PnL + Sizing (only when selected) */}
                                            {isSelected && (
                                                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border-subtle" onClick={e => e.stopPropagation()}>
                                                    {/* PnL column */}
                                                    <div>
                                                        <span className="text-xs text-content-muted uppercase tracking-wider">{t('copyExplore.pnl')}</span>
                                                        <div className="mt-1">
                                                            <span className={`text-base font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                {pnl >= 0 ? '+' : ''}{typeof pnl === 'number' ? pnl.toFixed(2) : pnl}
                                                            </span>
                                                            <span className="text-xs text-content-muted ml-1">USDT</span>
                                                        </div>
                                                    </div>

                                                    {/* Sizing column */}
                                                    <div>
                                                        <span className="text-xs text-content-muted uppercase tracking-wider">{t('copyExplore.sizing')}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <select
                                                                value={config.size_mode || 'percentage'}
                                                                onChange={e => handleSharingConfigChange(sharing.id, 'size_mode', e.target.value)}
                                                                className="px-2 py-1.5 bg-surface border border-border text-content-primary rounded text-xs
                                                                         focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                                                            >
                                                                <option value="percentage">{t('copyExplore.percentage')}</option>
                                                                <option value="flat_value">{t('copyExplore.flatValue')}</option>
                                                            </select>
                                                            <input
                                                                type="number"
                                                                value={config.size_value || ''}
                                                                onChange={e => handleSharingConfigChange(sharing.id, 'size_value', e.target.value)}
                                                                className={`w-20 px-2 py-1.5 bg-surface border text-content-primary rounded text-xs
                                                                         focus:outline-none focus:ring-1 transition-colors ${
                                                                    percentInvalid
                                                                        ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                                                                        : 'border-border focus:border-accent focus:ring-accent/20'
                                                                }`}
                                                                placeholder={config.size_mode === 'flat_value' ? 'USDT' : '%'}
                                                                min="0"
                                                                {...(config.size_mode === 'percentage' ? { max: '100' } : {})}
                                                            />
                                                            <span className="text-xs text-content-muted">
                                                                {config.size_mode === 'flat_value' ? 'USDT' : '%'}
                                                            </span>
                                                        </div>
                                                        {percentInvalid && (
                                                            <p className="text-xs text-red-400 mt-1">0-100%</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="bg-surface-raised/30 border-t border-border-subtle px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-surface-raised border border-border text-content-secondary rounded-lg text-sm uppercase tracking-wider
                                 hover:text-content-primary transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                        {t('copyExplore.cancel')}
                    </button>
                    <button
                        onClick={handleConfirmCopy}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm uppercase tracking-wider font-bold
                                 transition-colors
                                 disabled:opacity-50 disabled:cursor-wait
                                 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                        {isLoading ? (isEditing ? t('copyExplore.saving') : t('copyExplore.copying')) : (isEditing ? t('copyExplore.saveChanges') : t('copyExplore.copyTrading'))}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SubscriptionModal;
