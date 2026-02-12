import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import Pagination from '../components/Pagination';
import DateRangeFilter from '../components/DateRangeFilter';
import TradingBarsLoader from '../components/TradingBarsLoader';

function SignalsPage() {
    const { t } = useTranslation();

    // Filter states
    const [selectedSymbol, setSelectedSymbol] = useState('all');
    const [selectedInstance, setSelectedInstance] = useState('all');
    const { startDate, setStartDate, endDate, setEndDate, setRelativeDateRange, datePresets } = useDateRangeFilter();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 25;

    // Fetch instances
    const { data: instances = [] } = useQuery({
        queryKey: ['instances'],
        queryFn: async () => {
            const response = await apiFetch('/get_instances?api_key_id=all');
            if (!response || !response.ok) return [];
            const data = await response.json();
            return data.instances || [];
        },
        staleTime: 5 * 60 * 1000,
    });

    // Fetch all signals in one shot (backend ignores offset/limit)
    const { data: allSignals = [], isLoading } = useQuery({
        queryKey: ['signals'],
        queryFn: async () => {
            const response = await apiFetch('/get_signals_data');
            if (!response || !response.ok) {
                throw new Error('Failed to fetch signals');
            }
            const data = await response.json();
            return data.signals || [];
        },
        staleTime: 2 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Extract unique symbols from signals
    const uniqueSymbols = useMemo(() => {
        const symbolsSet = new Set();
        allSignals.forEach(s => symbolsSet.add(s.symbol));
        return Array.from(symbolsSet).sort();
    }, [allSignals]);

    // Filter signals based on selections
    const filteredSignals = useMemo(() => {
        const filtered = allSignals.filter(signal => {
            const symbolMatch = selectedSymbol === 'all' || signal.symbol === selectedSymbol;
            const instanceMatch = selectedInstance === 'all' || signal.instance_id === parseInt(selectedInstance);

            // Date filtering
            let dateMatch = true;
            if (startDate || endDate) {
                const signalDate = new Date(signal.created_at).toISOString().split('T')[0];
                if (startDate && signalDate < startDate) dateMatch = false;
                if (endDate && signalDate > endDate) dateMatch = false;
            }

            return symbolMatch && instanceMatch && dateMatch;
        });

        // Sort by created_at descending (most recent first)
        return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [allSignals, selectedSymbol, selectedInstance, startDate, endDate]);

    // Paginate filtered signals
    const paginatedSignals = useMemo(() => {
        const startIndex = (currentPage - 1) * recordsPerPage;
        return filteredSignals.slice(startIndex, startIndex + recordsPerPage);
    }, [filteredSignals, currentPage, recordsPerPage]);

    // Calculate total pages
    const totalPages = Math.ceil(filteredSignals.length / recordsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedSymbol, selectedInstance, startDate, endDate]);

    if (isLoading) {
        return (
            <TradingBarsLoader
                title={t('signals.loadingTitle')}
                subtitle={t('signals.loadingDescription')}
            />
        );
    }

    return (
        <div className="min-h-screen bg-surface-primary">
            {/* Header */}
            <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold uppercase tracking-wide bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
                        {t('signals.title')}
                    </h1>
                    <div className="flex items-center gap-3 bg-surface-primary rounded-lg px-5 py-2.5 border border-border-subtle">
                        <span className="text-xs text-content-muted uppercase tracking-wider">{t('signals.totalSignals')}</span>
                        <span className="text-2xl font-bold font-mono text-content-accent">
                            {filteredSignals.length}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Filters */}
                <div>
                    <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                        {t('signals.filters')}
                    </h2>

                    <div className="bg-surface border border-border rounded-lg p-5">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Symbol Filter */}
                            <div className="flex-1">
                                <label
                                    htmlFor="signal-symbol-filter"
                                    className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider"
                                >
                                    {t('signals.filterBySymbol')}
                                </label>
                                <select
                                    id="signal-symbol-filter"
                                    value={selectedSymbol}
                                    onChange={(e) => setSelectedSymbol(e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                                             focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-accent/20
                                             hover:border-content-muted transition-colors
                                             appearance-none cursor-pointer"
                                >
                                    <option value="all">{t('signals.allSymbols')}</option>
                                    {uniqueSymbols.map(symbol => (
                                        <option key={symbol} value={symbol}>
                                            {symbol}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Instance Filter */}
                            <div className="flex-1">
                                <label
                                    htmlFor="signal-instance-filter"
                                    className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider"
                                >
                                    {t('signals.filterByInstance')}
                                </label>
                                <select
                                    id="signal-instance-filter"
                                    value={selectedInstance}
                                    onChange={(e) => setSelectedInstance(e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                                             focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-accent/20
                                             hover:border-content-muted transition-colors
                                             appearance-none cursor-pointer"
                                >
                                    <option value="all">{t('signals.allInstances')}</option>
                                    {instances.map(instance => (
                                        <option key={instance.id} value={instance.id}>
                                            ({instance.id}) {instance.name || t('signals.noName')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear All Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSelectedSymbol('all');
                                        setSelectedInstance('all');
                                        setStartDate('');
                                        setEndDate('');
                                    }}
                                    className="px-6 py-3 bg-surface-raised border border-border text-content-secondary rounded text-sm
                                             hover:bg-surface-raised hover:text-content-primary transition-colors
                                             focus:outline-none focus:ring-2 focus:ring-accent/20"
                                >
                                    {t('signals.clearAll')}
                                </button>
                            </div>
                        </div>

                        <DateRangeFilter
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={setStartDate}
                            onEndDateChange={setEndDate}
                            onPresetChange={setRelativeDateRange}
                            datePresets={datePresets}
                        />

                        {/* Filter status indicator */}
                        <div className="mt-3 flex items-center gap-2 text-xs text-content-muted">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                            <span>
                                {t('common.showing')} {filteredSignals.length} {t('common.of')} {allSignals.length} {t('signals.title').toLowerCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Signals Table */}
                <div>
                    <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                        {t('signals.signalHistory')}
                    </h2>

                    <div className="bg-surface border border-border rounded-lg overflow-hidden">
                        {/* Table header bar */}
                        <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3">
                            <span className="text-sm text-content-accent">
                                {t('signals.signalLog')}
                            </span>
                        </div>

                        {/* Table content */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border-subtle bg-surface-raised/30">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('signals.id')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('signals.symbol')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('signals.side')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('signals.indicator')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('signals.createdAt')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('signals.operation')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('signals.instance')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {paginatedSignals.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center">
                                                <div className="text-content-muted text-sm">
                                                    {allSignals.length === 0
                                                        ? t('signals.noSignals')
                                                        : t('signals.noMatchingSignals')
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedSignals.map((signal) => (
                                            <tr key={signal.id} className="hover:bg-surface-raised/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                                                    {signal.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-content-accent font-mono">
                                                    {signal.symbol}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                                        signal.side === 'buy'
                                                            ? 'bg-success-muted text-success border border-success/30'
                                                            : 'bg-danger-muted text-danger border border-danger/30'
                                                    }`}>
                                                        {signal.side === 'buy' ? t('signals.buy') : t('signals.sell')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                                                    {signal.indicator}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                                                    {new Date(signal.created_at).toLocaleDateString()} {new Date(signal.created_at).toLocaleTimeString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary">
                                                    {signal.operation}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                                                    {signal.instance_id}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="bg-surface-raised/30 border-t border-border-subtle px-6 py-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                itemsPerPage={recordsPerPage}
                                totalItems={filteredSignals.length}
                                itemLabel={t('signals.title').toLowerCase()}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignalsPage;
