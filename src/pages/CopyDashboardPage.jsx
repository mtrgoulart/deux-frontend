import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';

const TIME_RANGES = ['7d', '30d', 'all'];
const POSITIONS_PAGE_SIZE = 20;
const OPERATIONS_PAGE_SIZE = 50;

function formatDateTime(value) {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString();
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

function PnlValue({ value, suffix = 'USDT' }) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (!Number.isFinite(num)) return <span className="text-content-muted">—</span>;
    const positive = num >= 0;
    return (
        <span className={`font-mono font-bold ${positive ? 'text-success' : 'text-danger'}`}>
            {positive ? '+' : ''}{num.toFixed(2)}
            {suffix && <span className="text-xs text-content-muted ml-1">{suffix}</span>}
        </span>
    );
}

function StatusBadge({ status }) {
    const { t } = useTranslation();
    const isOpen = status === 'open';
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isOpen
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'bg-content-muted/15 text-content-muted border border-content-muted/30'
        }`}>
            {isOpen ? t('copyDashboard.statusOpen') : t('copyDashboard.statusClosed')}
        </span>
    );
}

function SideBadge({ side }) {
    const { t } = useTranslation();
    const isBuy = (side || '').toLowerCase() === 'buy';
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isBuy
                ? 'bg-success/15 text-success border border-success/30'
                : 'bg-danger/15 text-danger border border-danger/30'
        }`}>
            {isBuy ? t('copyExplore.buy') : t('copyExplore.sell')}
        </span>
    );
}

function KpiCard({ label, children }) {
    return (
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-1">
            <span className="text-[10px] text-content-muted uppercase tracking-wider">{label}</span>
            <div className="text-2xl font-mono font-bold text-content-primary">{children}</div>
        </div>
    );
}

function TimeRangeFilter({ value, onChange }) {
    const { t } = useTranslation();
    return (
        <div className="inline-flex items-center bg-surface border border-border rounded-lg p-1 gap-1">
            {TIME_RANGES.map(range => (
                <button
                    key={range}
                    onClick={() => onChange(range)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                        value === range
                            ? 'bg-accent text-white'
                            : 'text-content-secondary hover:text-content-primary'
                    }`}
                >
                    {t(`copyDashboard.timeRange.${range}`)}
                </button>
            ))}
        </div>
    );
}

function SubscriptionCard({ subscription, isSelected, onSelect }) {
    const { t } = useTranslation();
    const pnl = Number(subscription.realized_pnl ?? 0);
    return (
        <button
            onClick={onSelect}
            className={`text-left bg-surface border rounded-lg p-4 transition-all hover:-translate-y-0.5 ${
                isSelected
                    ? 'border-accent ring-2 ring-accent/30'
                    : 'border-border hover:border-border-accent'
            }`}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                    <div className="font-bold text-content-primary truncate" title={subscription.copytrading_name}>
                        {subscription.copytrading_name}
                    </div>
                    <div className="text-xs text-content-muted truncate">
                        {t('copyExplore.by')} <span className="text-content-accent font-bold">{subscription.creator_name}</span>
                    </div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-bold flex-shrink-0 px-2 py-0.5 rounded ${
                    subscription.subscription_active
                        ? 'bg-success/15 text-success border border-success/30'
                        : 'bg-content-muted/15 text-content-muted border border-content-muted/30'
                }`}>
                    {subscription.subscription_active ? t('copyDashboard.active') : t('copyDashboard.paused')}
                </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="text-[10px] text-content-muted uppercase tracking-wider">
                    {t('copyDashboard.kpis.realizedPnl')}
                </span>
                <PnlValue value={pnl} />
            </div>
            <div className="text-[10px] text-content-muted">
                {t('copyDashboard.openClosed', {
                    open: subscription.open_positions ?? 0,
                    closed: subscription.closed_positions ?? 0,
                })}
            </div>
        </button>
    );
}

function PositionsTable({ copytradingId, timeRange }) {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['user_copytrading_real_positions', copytradingId, timeRange, page],
        queryFn: async () => {
            const res = await apiFetch(
                `/copytrading/dashboard/${copytradingId}/positions?page=${page}&limit=${POSITIONS_PAGE_SIZE}&time_range=${timeRange}`
            );
            return res.json();
        },
        keepPreviousData: true,
    });

    const positions = data?.positions || [];
    const totalPages = data?.total_pages || 0;
    const totalCount = data?.total_count || 0;

    if (isLoading && positions.length === 0) {
        return <div className="py-12 text-center text-content-muted text-sm">{t('copyExplore.loadingPositions')}</div>;
    }
    if (positions.length === 0) {
        return <div className="py-12 text-center text-content-muted text-sm">{t('copyDashboard.noPositions')}</div>;
    }

    return (
        <div className="flex flex-col">
            <div className="overflow-auto">
                <table className="w-full text-xs">
                    <thead className="bg-surface-raised/40 border-b border-border-subtle">
                        <tr className="text-content-muted uppercase tracking-wider">
                            <th className="text-left py-2 px-3 font-semibold">{t('copyExplore.entryDate')}</th>
                            <th className="text-left py-2 px-3 font-semibold">{t('copyExplore.closeDate')}</th>
                            <th className="text-left py-2 px-3 font-semibold">{t('copyDashboard.symbol')}</th>
                            <th className="text-left py-2 px-3 font-semibold">{t('copyDashboard.statusLabel')}</th>
                            <th className="text-right py-2 px-3 font-semibold">{t('copyExplore.buyPrice')}</th>
                            <th className="text-right py-2 px-3 font-semibold">{t('copyExplore.sellPrice')}</th>
                            <th className="text-right py-2 px-3 font-semibold">{t('copyDashboard.pnlUsdt')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.map(pos => (
                            <tr key={pos.id} className="border-b border-border-subtle/50 hover:bg-surface-raised/30">
                                <td className="py-2 px-3 text-content-secondary font-mono">{formatDateTime(pos.created_at)}</td>
                                <td className="py-2 px-3 text-content-secondary font-mono">{formatDateTime(pos.closed_at)}</td>
                                <td className="py-2 px-3 font-mono text-content-primary">{pos.symbol}</td>
                                <td className="py-2 px-3"><StatusBadge status={pos.status} /></td>
                                <td className="py-2 px-3 text-right font-mono text-content-primary">{formatNumber(pos.buy_price, 4)}</td>
                                <td className="py-2 px-3 text-right font-mono text-content-primary">{formatNumber(pos.sell_price, 4)}</td>
                                <td className="py-2 px-3 text-right">
                                    {pos.pnl !== null ? <PnlValue value={pos.pnl} suffix="" /> : <span className="text-content-muted">—</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pager page={page} totalPages={totalPages} totalCount={totalCount} pageSize={POSITIONS_PAGE_SIZE} onChange={setPage} />
        </div>
    );
}

function OperationsTable({ copytradingId, timeRange }) {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['user_copytrading_real_operations', copytradingId, timeRange, page],
        queryFn: async () => {
            const res = await apiFetch(
                `/copytrading/dashboard/${copytradingId}/operations?page=${page}&limit=${OPERATIONS_PAGE_SIZE}&time_range=${timeRange}`
            );
            return res.json();
        },
        keepPreviousData: true,
    });

    const operations = data?.operations || [];
    const totalPages = data?.total_pages || 0;
    const totalCount = data?.total_count || 0;

    if (isLoading && operations.length === 0) {
        return <div className="py-12 text-center text-content-muted text-sm">{t('copyExplore.loadingOperations')}</div>;
    }
    if (operations.length === 0) {
        return <div className="py-12 text-center text-content-muted text-sm">{t('copyDashboard.noOperations')}</div>;
    }

    return (
        <div className="flex flex-col">
            <div className="overflow-auto">
                <table className="w-full text-xs">
                    <thead className="bg-surface-raised/40 border-b border-border-subtle">
                        <tr className="text-content-muted uppercase tracking-wider">
                            <th className="text-left py-2 px-3 font-semibold">{t('copyExplore.date')}</th>
                            <th className="text-left py-2 px-3 font-semibold">{t('copyExplore.side')}</th>
                            <th className="text-left py-2 px-3 font-semibold">{t('copyDashboard.symbol')}</th>
                            <th className="text-right py-2 px-3 font-semibold">{t('copyExplore.size')}</th>
                            <th className="text-right py-2 px-3 font-semibold">{t('copyExplore.price')}</th>
                            <th className="text-left py-2 px-3 font-semibold">{t('copyDashboard.statusLabel')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operations.map(op => {
                            const price = op.execution_price ?? op.price;
                            return (
                                <tr key={op.id} className="border-b border-border-subtle/50 hover:bg-surface-raised/30">
                                    <td className="py-2 px-3 text-content-secondary font-mono">{formatDateTime(op.date)}</td>
                                    <td className="py-2 px-3"><SideBadge side={op.side} /></td>
                                    <td className="py-2 px-3 font-mono text-content-primary">{op.symbol}</td>
                                    <td className="py-2 px-3 text-right font-mono text-content-primary">{formatNumber(op.size, 6)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-content-primary">{formatNumber(price, 4)}</td>
                                    <td className="py-2 px-3 text-content-muted text-[10px] uppercase tracking-wider">{op.status || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <Pager page={page} totalPages={totalPages} totalCount={totalCount} pageSize={OPERATIONS_PAGE_SIZE} onChange={setPage} />
        </div>
    );
}

function Pager({ page, totalPages, totalCount, pageSize, onChange }) {
    const { t } = useTranslation();
    if (totalCount === 0) return null;
    return (
        <div className="px-4 py-2 border-t border-border-subtle bg-surface-raised/40 flex items-center justify-between text-xs">
            <span className="text-content-muted">
                {t('common.showing')}{' '}
                <span className="text-content-accent font-bold font-mono">{((page - 1) * pageSize) + 1}</span>
                {' '}{t('common.to')}{' '}
                <span className="text-content-accent font-bold font-mono">{Math.min(page * pageSize, totalCount)}</span>
                {' '}{t('common.of')}{' '}
                <span className="text-content-accent font-bold font-mono">{totalCount}</span>
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-2.5 py-1 bg-surface border border-border text-content-secondary rounded hover:bg-surface-raised hover:text-content-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    {t('common.prev')}
                </button>
                <span className="text-content-secondary font-mono">
                    <span className="text-content-accent font-bold">{page}</span> / {totalPages || 1}
                </span>
                <button
                    onClick={() => onChange(Math.min(totalPages || 1, page + 1))}
                    disabled={page >= totalPages}
                    className="px-2.5 py-1 bg-surface border border-border text-content-secondary rounded hover:bg-surface-raised hover:text-content-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    {t('common.next')}
                </button>
            </div>
        </div>
    );
}

function CopyDashboardPage() {
    const { t } = useTranslation();
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedCopytradingId, setSelectedCopytradingId] = useState(null);
    const [activeTab, setActiveTab] = useState('positions');

    const { data, isLoading } = useQuery({
        queryKey: ['copytrading_dashboard', timeRange],
        queryFn: async () => {
            const res = await apiFetch(`/copytrading/dashboard?time_range=${timeRange}`);
            return res.json();
        },
        keepPreviousData: true,
    });

    const kpis = data?.kpis || { total_realized_pnl: 0, total_open_positions: 0, active_subscriptions: 0 };
    const subscriptions = data?.subscriptions || [];
    const selected = subscriptions.find(s => s.copytrading_id === selectedCopytradingId) || null;

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-content-primary uppercase tracking-wider">
                    {t('copyDashboard.title')}
                </h1>
                <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard label={t('copyDashboard.kpis.realizedPnl')}>
                    <PnlValue value={kpis.total_realized_pnl} />
                </KpiCard>
                <KpiCard label={t('copyDashboard.kpis.openPositions')}>
                    <span className="text-content-primary">{kpis.total_open_positions}</span>
                </KpiCard>
                <KpiCard label={t('copyDashboard.kpis.activeSubscriptions')}>
                    <span className="text-content-primary">{kpis.active_subscriptions}</span>
                </KpiCard>
            </div>

            {/* My Subscriptions */}
            <div>
                <h2 className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
                    {t('copyDashboard.mySubscriptions')}
                </h2>
                {isLoading ? (
                    <div className="py-12 text-center text-content-muted text-sm">
                        {t('copyExplore.loadingDescription')}
                    </div>
                ) : subscriptions.length === 0 ? (
                    <div className="py-12 text-center text-content-muted text-sm border border-border rounded-lg">
                        {t('copyDashboard.empty')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {subscriptions.map(s => (
                            <SubscriptionCard
                                key={s.copytrading_id}
                                subscription={s}
                                isSelected={selectedCopytradingId === s.copytrading_id}
                                onSelect={() => {
                                    setSelectedCopytradingId(s.copytrading_id);
                                    setActiveTab('positions');
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Detail panel */}
            {selected && (
                <div className="bg-surface border border-border rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-border-subtle bg-surface-raised/40 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-content-primary truncate">
                                {selected.copytrading_name}
                            </h3>
                            <p className="text-xs text-content-muted">
                                {t('copyExplore.by')} <span className="text-content-accent font-bold">{selected.creator_name}</span>
                            </p>
                        </div>
                        <div className="inline-flex items-center bg-surface border border-border rounded-lg p-1 gap-1 flex-shrink-0">
                            {['positions', 'operations'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                                        activeTab === tab
                                            ? 'bg-accent text-white'
                                            : 'text-content-secondary hover:text-content-primary'
                                    }`}
                                >
                                    {t(`copyDashboard.tabs.${tab}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                    {activeTab === 'positions' ? (
                        <PositionsTable copytradingId={selected.copytrading_id} timeRange={timeRange} />
                    ) : (
                        <OperationsTable copytradingId={selected.copytrading_id} timeRange={timeRange} />
                    )}
                </div>
            )}
        </div>
    );
}

export default CopyDashboardPage;
