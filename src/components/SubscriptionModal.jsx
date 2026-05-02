import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import OperationsModal from './OperationsModal';

function formatDateTime(value) {
    if (!value) return '-';
    try {
        const d = new Date(value);
        return d.toLocaleString();
    } catch {
        return String(value);
    }
}

function formatNumber(value, digits = 4) {
    if (value === null || value === undefined) return '-';
    const num = Number(value);
    if (Number.isNaN(num)) return '-';
    return num.toLocaleString(undefined, {
        maximumFractionDigits: digits,
        minimumFractionDigits: 0,
    });
}

function PnlValue({ value }) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    const safe = Number.isFinite(num) ? num : 0;
    const positive = safe >= 0;
    return (
        <span className={`font-mono font-bold ${positive ? 'text-success' : 'text-danger'}`}>
            {positive ? '+' : ''}{safe.toFixed(2)}
            <span className="text-xs text-content-muted ml-1">USDT</span>
        </span>
    );
}

function PercentReturn({ value }) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    const safe = Number.isFinite(num) ? num : 0;
    const positive = safe >= 0;
    return (
        <span className={`font-mono font-bold ${positive ? 'text-success' : 'text-danger'}`}>
            {positive ? '+' : ''}{safe.toFixed(2)}%
        </span>
    );
}

const POSITIONS_PAGE_SIZE = 10;

function PositionsTable({ copytradingId, sharing, onShowOperations }) {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [sharing?.id]);

    const { data, isLoading } = useQuery({
        queryKey: ['sharing_owner_positions', copytradingId, sharing?.id, page],
        queryFn: async () => {
            const res = await apiFetch(
                `/copytrading/${copytradingId}/sharing/${sharing.id}/positions?page=${page}&limit=${POSITIONS_PAGE_SIZE}`
            );
            return res.json();
        },
        enabled: !!sharing?.id && !!copytradingId,
        keepPreviousData: true,
    });

    const positions = data?.positions || [];
    const totalPages = data?.total_pages || 0;
    const totalCount = data?.total_count || 0;

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-border-subtle bg-surface-raised/40">
                <h4 className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                    {t('copyExplore.ownerPositions')}
                </h4>
                <p className="text-xs text-content-muted mt-0.5">
                    {sharing?.symbol} <span className="text-content-accent">// {sharing?.instance_name}</span>
                    <span className="ml-2 text-content-muted">· {t('copyExplore.closedPositionsOnly')}</span>
                </p>
            </div>

            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <div className="py-8 text-center text-content-muted text-sm">
                        {t('copyExplore.loadingPositions')}
                    </div>
                ) : positions.length === 0 ? (
                    <div className="py-8 text-center text-content-muted text-sm">
                        {t('copyExplore.noPositions')}
                    </div>
                ) : (
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-surface-raised/80 backdrop-blur z-10">
                            <tr className="text-content-muted uppercase tracking-wider border-b border-border-subtle">
                                <th className="text-left py-2 px-3 font-semibold">{t('copyExplore.entryDate')}</th>
                                <th className="text-left py-2 px-3 font-semibold">{t('copyExplore.closeDate')}</th>
                                <th className="text-right py-2 px-3 font-semibold">{t('copyExplore.buyPrice')}</th>
                                <th className="text-right py-2 px-3 font-semibold">{t('copyExplore.sellPrice')}</th>
                                <th className="text-right py-2 px-3 font-semibold">{t('copyExplore.cycleReturn')}</th>
                                <th className="text-right py-2 px-3 font-semibold">{t('copyExplore.operations')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions.map(pos => (
                                <tr key={pos.id} className="border-b border-border-subtle/50 hover:bg-surface-raised/30">
                                    <td className="py-2 px-3 text-content-secondary font-mono">{formatDateTime(pos.created_at)}</td>
                                    <td className="py-2 px-3 text-content-secondary font-mono">{formatDateTime(pos.closed_at)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-content-primary">{formatNumber(pos.buy_price, 4)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-content-primary">{formatNumber(pos.sell_price, 4)}</td>
                                    <td className="py-2 px-3 text-right">
                                        <PercentReturn value={pos.return_pct} />
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                        <button
                                            onClick={() => onShowOperations(pos)}
                                            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded
                                                     bg-surface border border-border text-content-secondary
                                                     hover:bg-surface-raised hover:text-content-primary hover:border-border-accent
                                                     transition-colors"
                                        >
                                            {t('copyExplore.operations')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {totalCount > 0 && (
                <div className="px-4 py-2 border-t border-border-subtle bg-surface-raised/40 flex items-center justify-between text-xs">
                    <span className="text-content-muted">
                        {t('common.showing')}{' '}
                        <span className="text-content-accent font-bold font-mono">{((page - 1) * POSITIONS_PAGE_SIZE) + 1}</span>
                        {' '}{t('common.to')}{' '}
                        <span className="text-content-accent font-bold font-mono">{Math.min(page * POSITIONS_PAGE_SIZE, totalCount)}</span>
                        {' '}{t('common.of')}{' '}
                        <span className="text-content-accent font-bold font-mono">{totalCount}</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-2.5 py-1 bg-surface border border-border text-content-secondary rounded
                                     hover:bg-surface-raised hover:text-content-primary
                                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('common.prev')}
                        </button>
                        <span className="text-content-secondary font-mono">
                            <span className="text-content-accent font-bold">{page}</span> / {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                            disabled={page >= totalPages}
                            className="px-2.5 py-1 bg-surface border border-border text-content-secondary rounded
                                     hover:bg-surface-raised hover:text-content-primary
                                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('common.next')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function SharingCard({
    sharing,
    config,
    isSelected,
    onToggle,
    onConfigChange,
    onShowDetail,
    isDetailActive,
    onApplySizingToAll,
    canApplyToAll,
}) {
    const { t } = useTranslation();
    const pnl = sharing.pnl || 0;
    const virtualPct = Number(sharing.virtual_return_pct ?? 0);
    const cyclesTotal = Number(sharing.cycles_total ?? 0);
    const cyclesScoreable = Number(sharing.cycles_scoreable ?? 0);
    const insufficientData = cyclesScoreable === 0;
    const percentInvalid = isSelected
        && config?.size_mode === 'percentage'
        && (() => {
            const v = parseFloat(config.size_value);
            return isNaN(v) || v < 0 || v > 100;
        })();

    return (
        <div
            className={`p-3 rounded-lg border transition-all duration-200 ${
                isDetailActive
                    ? 'border-accent bg-accent-muted/40 ring-2 ring-accent/30'
                    : isSelected
                        ? 'bg-accent-muted/20 border-border-accent'
                        : 'bg-surface border-border hover:border-border-accent/50'
            }`}
        >
            {/* Identity row: checkbox + (symbol/return) + (instance name/cycles) */}
            <div className="flex items-start gap-3 cursor-pointer" onClick={onToggle}>
                <div className={`mt-1 w-4 h-4 rounded-sm border-2 flex-shrink-0 transition-all ${
                    isSelected ? 'bg-accent border-accent' : 'border-content-muted'
                }`}>
                    {isSelected && (
                        <div className="w-full h-full flex items-center justify-center text-white text-[10px] leading-none">✓</div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <span className="font-bold text-content-primary text-base font-mono truncate">
                            {sharing.symbol}
                        </span>
                        <span
                            className={`text-base font-mono font-bold flex-shrink-0 ${
                                insufficientData
                                    ? 'text-content-muted'
                                    : virtualPct >= 0 ? 'text-success' : 'text-danger'
                            }`}
                            title={t('copyExplore.compoundedNote')}
                        >
                            {insufficientData
                                ? '—'
                                : `${virtualPct >= 0 ? '+' : ''}${virtualPct.toFixed(2)}%`}
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs text-content-muted truncate" title={sharing.instance_name}>
                            {sharing.instance_name}
                        </span>
                        <span className="text-[10px] text-content-muted flex-shrink-0">
                            {cyclesTotal === 0
                                ? t('copyExplore.noCyclesYet')
                                : t('copyExplore.cyclesCoverage', { scoreable: cyclesScoreable, total: cyclesTotal })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Subtle action row: Detail link + PnL footnote */}
            <div className="mt-2 flex items-center justify-between text-[10px]">
                <button
                    onClick={(e) => { e.stopPropagation(); onShowDetail(); }}
                    className={`uppercase tracking-wider font-bold transition-colors ${
                        isDetailActive
                            ? 'text-accent'
                            : 'text-content-accent hover:text-accent'
                    }`}
                >
                    {t('copyExplore.detail')} →
                </button>
                {pnl !== 0 && (
                    <span className="text-content-muted font-mono">
                        {t('copyExplore.pnl')}: {pnl >= 0 ? '+' : ''}{typeof pnl === 'number' ? pnl.toFixed(2) : pnl} USDT
                    </span>
                )}
            </div>

            {/* Sizing controls (only when selected) */}
            {isSelected && (
                <div className="mt-3 pt-3 border-t border-border-subtle">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-content-muted uppercase tracking-wider font-bold">
                            {t('copyExplore.sizing')}
                        </span>
                        {canApplyToAll && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onApplySizingToAll(); }}
                                className="text-[10px] text-content-accent hover:text-accent uppercase tracking-wider font-bold transition-colors"
                                title={t('copyExplore.applyToAllTooltip')}
                            >
                                {t('copyExplore.applyToAll')} →
                            </button>
                        )}
                    </div>
                    <div className="flex items-stretch gap-2">
                        <select
                            value={config?.size_mode || 'percentage'}
                            onChange={e => onConfigChange('size_mode', e.target.value)}
                            className="px-2.5 py-2 bg-surface border border-border text-content-primary rounded text-xs
                                     focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                        >
                            <option value="percentage">{t('copyExplore.percentage')}</option>
                            <option value="flat_value">{t('copyExplore.flatValue')}</option>
                        </select>
                        <input
                            type="number"
                            value={config?.size_value || ''}
                            onChange={e => onConfigChange('size_value', e.target.value)}
                            className={`flex-1 px-3 py-2 bg-surface border text-content-primary rounded text-sm font-mono
                                     focus:outline-none focus:ring-1 transition-colors ${
                                percentInvalid
                                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                                    : 'border-border focus:border-accent focus:ring-accent/20'
                            }`}
                            placeholder={config?.size_mode === 'flat_value' ? 'USDT' : '%'}
                            min="0"
                            {...(config?.size_mode === 'percentage' ? { max: '100' } : {})}
                        />
                        <span className="text-xs text-content-muted self-center w-10 text-right font-mono uppercase">
                            {config?.size_mode === 'flat_value' ? 'USDT' : '%'}
                        </span>
                    </div>
                    {percentInvalid && (
                        <p className="text-xs text-red-400 mt-1">0-100%</p>
                    )}
                </div>
            )}
        </div>
    );
}

function SubscriptionModal({ copyConfig, isEditing, onClose, onConfirm, isLoading }) {
    const { t } = useTranslation();
    const [sharingConfigs, setSharingConfigs] = useState({});
    const [selectedApiKey, setSelectedApiKey] = useState('');
    const [sizeAmount, setSizeAmount] = useState('10');
    const [activeDetailSharingId, setActiveDetailSharingId] = useState(null);
    const [operationsForPosition, setOperationsForPosition] = useState(null);

    const { data: apiKeys = [] } = useQuery({
        queryKey: ['user_apikeys'],
        queryFn: async () => {
            const res = await apiFetch('/get_user_apikeys');
            return (await res.json()).user_apikeys || [];
        },
    });

    const { data: details, isLoading: isLoadingDetails } = useQuery({
        queryKey: ['copytrading_details', copyConfig.id],
        queryFn: async () => {
            const res = await apiFetch(`/copytrading/${copyConfig.id}`);
            return res.json();
        },
    });

    const { data: userSubscriptionsData, isLoading: isLoadingSubscriptions } = useQuery({
        queryKey: ['copytrading_subscriptions'],
        queryFn: async () => {
            const res = await apiFetch('/copytrading/subscriptions');
            const data = await res.json();
            return data.subscriptions || [];
        },
        enabled: isEditing,
    });

    useEffect(() => {
        if (!isEditing && details?.sharings) {
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

                const configs = {};
                if (details?.sharings) {
                    details.sharings.forEach(s => {
                        configs[s.id] = { selected: false, size_mode: 'percentage', size_value: '100' };
                    });
                }
                if (primarySub.subscribed_sharings) {
                    primarySub.subscribed_sharings.forEach(s => {
                        const mode = s.size_mode || 'percentage';
                        const rawAmount = s.size_amount || 100;
                        const displayValue = mode === 'percentage' && rawAmount <= 1
                            ? rawAmount * 100
                            : rawAmount;
                        configs[s.sharing_id] = {
                            selected: true,
                            size_mode: mode,
                            size_value: String(displayValue),
                        };
                    });
                }
                setSharingConfigs(configs);
            }
        }
    }, [isEditing, details, userSubscriptionsData, isLoadingSubscriptions, copyConfig.id]);

    const sharings = details?.sharings || [];

    const totalPnl = useMemo(() => {
        if (typeof details?.total_pnl === 'number') return details.total_pnl;
        return sharings.reduce((acc, s) => acc + (Number(s.pnl) || 0), 0);
    }, [details, sharings]);

    const virtualReturnPct = Number(details?.virtual_return_pct ?? 0);
    const cyclesScoreable = Number(details?.cycles_scoreable ?? 0);
    const cyclesTotal = Number(details?.cycles_total ?? 0);

    const ownerName = details?.creator_name || copyConfig.creator || '-';
    const subscriberCount = details?.subscriber_count ?? null;
    const copyName = details?.name || copyConfig.name;

    const handleToggleSharing = (sharingId) => {
        setSharingConfigs(prev => ({
            ...prev,
            [sharingId]: {
                ...prev[sharingId],
                selected: !prev[sharingId]?.selected,
                size_mode: prev[sharingId]?.size_mode || 'percentage',
                size_value: prev[sharingId]?.size_value || '100',
            },
        }));
    };

    const handleSharingConfigChange = (sharingId, field, value) => {
        setSharingConfigs(prev => ({
            ...prev,
            [sharingId]: { ...prev[sharingId], [field]: value },
        }));
    };

    const selectedCount = sharings.filter(s => sharingConfigs[s.id]?.selected).length;
    const allSelected = sharings.length > 0 && selectedCount === sharings.length;
    const indeterminate = selectedCount > 0 && selectedCount < sharings.length;

    const handleSelectAll = () => {
        setSharingConfigs(prev => {
            const next = { ...prev };
            if (allSelected) {
                sharings.forEach(s => {
                    next[s.id] = { ...next[s.id], selected: false };
                });
            } else {
                sharings.forEach(s => {
                    next[s.id] = {
                        ...next[s.id],
                        selected: true,
                        size_mode: next[s.id]?.size_mode || 'percentage',
                        size_value: next[s.id]?.size_value || '100',
                    };
                });
            }
            return next;
        });
    };

    const handleApplySizingToAll = (sourceSharingId) => {
        const source = sharingConfigs[sourceSharingId];
        if (!source) return;
        setSharingConfigs(prev => {
            const next = { ...prev };
            Object.entries(prev).forEach(([id, cfg]) => {
                if (cfg?.selected) {
                    next[id] = {
                        ...cfg,
                        size_mode: source.size_mode,
                        size_value: source.size_value,
                    };
                }
            });
            return next;
        });
    };

    const handleConfirmCopy = () => {
        if (!selectedApiKey) { alert(t('copyExplore.selectApiKeyAlert')); return; }
        const numericSize = parseFloat(sizeAmount);
        if (isNaN(numericSize) || numericSize <= 0) { alert(t('copyExplore.validInvestmentAlert')); return; }

        const selectedEntries = Object.entries(sharingConfigs).filter(([_, c]) => c.selected);
        if (selectedEntries.length === 0) { alert(t('copyExplore.selectSharingAlert')); return; }

        for (const [, config] of selectedEntries) {
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
                size_value: parseFloat(c.size_value),
            })),
            api_key_id: selectedApiKey,
            size_amount: numericSize,
        };

        onConfirm(payload);
    };

    const activeSharing = useMemo(
        () => sharings.find(s => s.id === activeDetailSharingId) || null,
        [sharings, activeDetailSharingId]
    );

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-7xl max-h-[92vh] bg-surface border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col">
                {/* ============================ HEADER FRAME ============================ */}
                <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent uppercase tracking-wider truncate">
                                {copyName}
                            </h3>
                            <div className="text-xs text-content-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>
                                    <span className="text-content-muted uppercase tracking-wider">{t('copyExplore.owner')}:</span>{' '}
                                    <span className="text-content-accent font-bold">{ownerName}</span>
                                </span>
                                {subscriberCount !== null && (
                                    <span>
                                        <span className="text-content-muted uppercase tracking-wider">{t('copyExplore.subscribers')}:</span>{' '}
                                        <span className="text-content-accent font-bold font-mono">{subscriberCount}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Strategy Return % pill (primary) + Owner realized PnL (secondary) */}
                        <div className="flex flex-col items-end gap-1">
                            <div className="bg-surface border border-border rounded-lg px-4 py-2 flex flex-col items-end min-w-[180px]"
                                 title={t('copyExplore.compoundedNote')}>
                                <span className="text-[10px] text-content-muted uppercase tracking-wider">{t('copyExplore.strategyReturn')}</span>
                                {cyclesScoreable === 0 ? (
                                    <span className="font-mono font-bold text-content-muted">—</span>
                                ) : (
                                    <PercentReturn value={virtualReturnPct} />
                                )}
                                <span className="text-[10px] text-content-muted mt-0.5">
                                    {cyclesTotal === 0
                                        ? t('copyExplore.noCyclesYet')
                                        : t('copyExplore.cyclesCoverage', { scoreable: cyclesScoreable, total: cyclesTotal })}
                                </span>
                            </div>
                            {totalPnl !== 0 && (
                                <div className="text-[11px] text-content-muted flex items-center gap-1.5">
                                    <span className="uppercase tracking-wider">{t('copyExplore.totalPnl')}:</span>
                                    <PnlValue value={totalPnl} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Header inputs row */}
                    <div className={`grid ${isEditing ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4 mt-4`}>
                        {!isEditing && (
                            <div>
                                <label className="block text-xs font-semibold text-content-accent mb-1.5 uppercase tracking-wider">
                                    {t('copyExplore.apiKey')}
                                </label>
                                <select
                                    value={selectedApiKey}
                                    onChange={e => setSelectedApiKey(e.target.value)}
                                    className="w-full px-3 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm
                                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                                >
                                    <option value="">{t('copyExplore.selectApiKey')}</option>
                                    {apiKeys.map(key => (
                                        <option key={key.api_key_id} value={key.api_key_id}>
                                            {key.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <label className="block text-xs font-semibold text-content-accent uppercase tracking-wider">
                                    {t('copyExplore.maxInvestment')}
                                </label>
                                <span
                                    className="relative group inline-flex items-center justify-center w-4 h-4 rounded-full
                                             bg-surface-raised border border-border text-content-muted text-[10px] font-bold cursor-help"
                                    aria-label={t('copyExplore.maxInvestmentTooltip')}
                                >
                                    ?
                                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64
                                                   bg-surface-primary border border-border rounded-lg px-3 py-2 text-[11px] text-content-secondary
                                                   shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity normal-case tracking-normal
                                                   z-30">
                                        {t('copyExplore.maxInvestmentTooltip')}
                                    </span>
                                </span>
                            </div>
                            <input
                                type="number"
                                value={sizeAmount}
                                onChange={e => setSizeAmount(e.target.value)}
                                className="w-full px-3 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm
                                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                                placeholder={t('copyExplore.investmentPlaceholder')}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* ============================ BODY: LEFT + RIGHT FRAMES ============================ */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* LEFT FRAME: strategies list */}
                    <div className="border-b lg:border-b-0 lg:border-r border-border-subtle flex flex-col min-h-0">
                        <div className="px-4 py-3 border-b border-border-subtle bg-surface-raised/40 flex items-center justify-between gap-3">
                            <h4 className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                                {t('copyExplore.strategies')}
                            </h4>
                            {sharings.length > 0 && (
                                <div
                                    className="flex items-center gap-2 cursor-pointer group select-none"
                                    onClick={handleSelectAll}
                                    role="checkbox"
                                    aria-checked={allSelected ? 'true' : indeterminate ? 'mixed' : 'false'}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === ' ' || e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSelectAll();
                                        }
                                    }}
                                >
                                    <span className="text-[10px] text-content-secondary uppercase tracking-wider font-bold group-hover:text-content-primary transition-colors">
                                        {t('copyExplore.selectAll')}
                                    </span>
                                    <div className={`w-4 h-4 rounded-sm border-2 flex-shrink-0 transition-all flex items-center justify-center ${
                                        allSelected
                                            ? 'bg-accent border-accent'
                                            : indeterminate
                                                ? 'bg-accent/40 border-accent'
                                                : 'border-content-muted group-hover:border-content-secondary'
                                    }`}>
                                        {allSelected && (
                                            <span className="text-white text-[10px] leading-none">✓</span>
                                        )}
                                        {indeterminate && (
                                            <span className="block w-2 h-0.5 bg-white"></span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-content-muted font-mono whitespace-nowrap">
                                        {t('copyExplore.selectedOfTotal', { selected: selectedCount, total: sharings.length })}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {isLoadingDetails ? (
                                <div className="py-8 text-center text-content-muted text-sm">
                                    {t('copyExplore.loadingSharings')}
                                </div>
                            ) : sharings.length === 0 ? (
                                <div className="py-8 text-center text-content-muted text-sm">
                                    {t('copyExplore.noSharings')}
                                </div>
                            ) : (
                                sharings.map(sharing => {
                                    const config = sharingConfigs[sharing.id] || {};
                                    const isSelected = !!config.selected;
                                    return (
                                        <SharingCard
                                            key={sharing.id}
                                            sharing={sharing}
                                            config={config}
                                            isSelected={isSelected}
                                            isDetailActive={activeDetailSharingId === sharing.id}
                                            onToggle={() => handleToggleSharing(sharing.id)}
                                            onConfigChange={(field, value) => handleSharingConfigChange(sharing.id, field, value)}
                                            onShowDetail={() => setActiveDetailSharingId(sharing.id)}
                                            onApplySizingToAll={() => handleApplySizingToAll(sharing.id)}
                                            canApplyToAll={selectedCount > 1}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT FRAME: positions table */}
                    <div className="flex flex-col min-h-0 bg-surface-primary/40">
                        {activeSharing ? (
                            <PositionsTable
                                copytradingId={copyConfig.id}
                                sharing={activeSharing}
                                onShowOperations={(pos) => setOperationsForPosition(pos)}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-8">
                                <p className="text-sm text-content-muted text-center max-w-xs">
                                    {t('copyExplore.selectStrategyToView')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ============================ FOOTER ============================ */}
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
                        {isLoading
                            ? (isEditing ? t('copyExplore.saving') : t('copyExplore.copying'))
                            : (isEditing ? t('copyExplore.saveChanges') : t('copyExplore.copyTrading'))}
                    </button>
                </div>
            </div>

            {operationsForPosition && (
                <OperationsModal
                    position={operationsForPosition}
                    onClose={() => setOperationsForPosition(null)}
                />
            )}
        </div>
    );
}

export default SubscriptionModal;
