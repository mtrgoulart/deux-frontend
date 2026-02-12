import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import Pagination from '../components/Pagination';
import DateRangeFilter from '../components/DateRangeFilter';
import TradingBarsLoader from '../components/TradingBarsLoader';
import RefreshButton from '../components/RefreshButton';

function PositionsPage() {
    const { t } = useTranslation();

    // Filter states
    const [selectedSymbol, setSelectedSymbol] = useState('all');
    const [selectedInstance, setSelectedInstance] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const { startDate, setStartDate, endDate, setEndDate, setRelativeDateRange, datePresets } = useDateRangeFilter();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 25;

    // Fetch instances (strategies)
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

    // Fetch positions data
    const { data: positions = [], isLoading, isFetching: positionsFetching, refetch: refetchPositions } = useQuery({
        queryKey: ['positions'],
        queryFn: async () => {
            const response = await apiFetch('/positions');
            if (!response || !response.ok) {
                throw new Error('Failed to fetch positions');
            }
            const data = await response.json();
            return data.positions || [];
        },
        staleTime: 2 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Extract unique symbols from positions
    const uniqueSymbols = useMemo(() => {
        const symbolsSet = new Set();
        positions.forEach(p => symbolsSet.add(p.symbol));
        return Array.from(symbolsSet).sort();
    }, [positions]);

    // Filter positions based on selections
    const filteredPositions = useMemo(() => {
        return positions.filter(p => {
            const symbolMatch = selectedSymbol === 'all' || p.symbol === selectedSymbol;
            const instanceMatch = selectedInstance === 'all' || p.instance_id === parseInt(selectedInstance);
            const statusMatch = selectedStatus === 'all' || p.status === selectedStatus;

            let dateMatch = true;
            if (startDate || endDate) {
                const pDate = p.created_at ? p.created_at.split('T')[0] : '';
                if (startDate && pDate < startDate) dateMatch = false;
                if (endDate && pDate > endDate) dateMatch = false;
            }

            return symbolMatch && instanceMatch && statusMatch && dateMatch;
        });
    }, [positions, selectedSymbol, selectedInstance, selectedStatus, startDate, endDate]);

    // Summary stats from filtered positions
    const summaryStats = useMemo(() => {
        const openCount = filteredPositions.filter(p => p.status === 'open').length;
        const closedCount = filteredPositions.filter(p => p.status === 'closed').length;
        const totalPnl = filteredPositions
            .filter(p => p.pnl !== null && p.pnl !== undefined)
            .reduce((sum, p) => sum + p.pnl, 0);
        return { openCount, closedCount, totalPnl };
    }, [filteredPositions]);

    // Paginate filtered positions
    const paginatedPositions = useMemo(() => {
        const startIndex = (currentPage - 1) * recordsPerPage;
        return filteredPositions.slice(startIndex, startIndex + recordsPerPage);
    }, [filteredPositions, currentPage, recordsPerPage]);

    const totalPages = Math.ceil(filteredPositions.length / recordsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedSymbol, selectedInstance, selectedStatus, startDate, endDate]);

    if (isLoading) {
        return (
            <TradingBarsLoader
                title={t('positions.loadingTitle')}
                subtitle={t('positions.loadingDescription')}
            />
        );
    }

    return (
        <div className="min-h-screen bg-surface-primary">
            {/* Header */}
            <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold uppercase tracking-wide bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
                        {t('positions.title')}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-surface-primary rounded-lg px-4 py-2 border border-border-subtle">
                            <span className="text-xs text-content-muted uppercase tracking-wider">{t('positions.open')}</span>
                            <span className="text-lg font-bold font-mono text-content-primary">{summaryStats.openCount}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-surface-primary rounded-lg px-4 py-2 border border-border-subtle">
                            <span className="text-xs text-content-muted uppercase tracking-wider">{t('positions.closed')}</span>
                            <span className="text-lg font-bold font-mono text-content-primary">{summaryStats.closedCount}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-surface-primary rounded-lg px-5 py-2.5 border border-border-subtle">
                            <span className="text-xs text-content-muted uppercase tracking-wider">{t('positions.totalPnl')}</span>
                            <span className={`text-2xl font-bold font-mono ${summaryStats.totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                                {summaryStats.totalPnl >= 0 ? '+' : ''}{summaryStats.totalPnl.toFixed(2)} USDT
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Filters */}
                <div>
                    <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                        {t('positions.filters')}
                    </h2>

                    <div className="bg-surface border border-border rounded-lg p-5">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Symbol Filter */}
                            <div className="flex-1">
                                <label
                                    htmlFor="symbol-filter"
                                    className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider"
                                >
                                    {t('positions.filterBySymbol')}
                                </label>
                                <select
                                    id="symbol-filter"
                                    value={selectedSymbol}
                                    onChange={(e) => setSelectedSymbol(e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                                             focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-accent/20
                                             hover:border-content-muted transition-colors
                                             appearance-none cursor-pointer"
                                >
                                    <option value="all">{t('positions.allSymbols')}</option>
                                    {uniqueSymbols.map(symbol => (
                                        <option key={symbol} value={symbol}>{symbol}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Strategy (Instance) Filter */}
                            <div className="flex-1">
                                <label
                                    htmlFor="strategy-filter"
                                    className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider"
                                >
                                    {t('positions.filterByStrategy')}
                                </label>
                                <select
                                    id="strategy-filter"
                                    value={selectedInstance}
                                    onChange={(e) => setSelectedInstance(e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                                             focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-accent/20
                                             hover:border-content-muted transition-colors
                                             appearance-none cursor-pointer"
                                >
                                    <option value="all">{t('positions.allStrategies')}</option>
                                    {instances.map(instance => (
                                        <option key={instance.id} value={instance.id}>
                                            ({instance.id}) {instance.name || 'Untitled'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div className="flex-1">
                                <label
                                    htmlFor="status-filter"
                                    className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider"
                                >
                                    {t('positions.filterByStatus')}
                                </label>
                                <select
                                    id="status-filter"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                                             focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-accent/20
                                             hover:border-content-muted transition-colors
                                             appearance-none cursor-pointer"
                                >
                                    <option value="all">{t('positions.allStatuses')}</option>
                                    <option value="open">{t('positions.statusOpen')}</option>
                                    <option value="closed">{t('positions.statusClosed')}</option>
                                </select>
                            </div>

                            {/* Clear All Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSelectedSymbol('all');
                                        setSelectedInstance('all');
                                        setSelectedStatus('all');
                                        setStartDate('');
                                        setEndDate('');
                                    }}
                                    className="px-6 py-3 bg-surface-raised border border-border text-content-secondary rounded text-sm
                                             hover:bg-surface-raised hover:text-content-primary transition-colors
                                             focus:outline-none focus:ring-2 focus:ring-accent/20"
                                >
                                    {t('positions.clearAll')}
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
                                {t('positions.showing')} {filteredPositions.length} {t('positions.of')} {positions.length} {t('positions.positionsLabel')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Positions Table */}
                <div>
                    <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                        {t('positions.positionHistory')}
                    </h2>

                    <div className="bg-surface border border-border rounded-lg overflow-hidden">
                        {/* Table header bar */}
                        <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3 flex items-center justify-between">
                            <span className="text-sm text-content-accent">
                                {t('positions.positionLog')}
                            </span>
                            <RefreshButton onClick={refetchPositions} isRefreshing={positionsFetching} label={t('common.refresh')} />
                        </div>

                        {/* Table content */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border-subtle bg-surface-raised/30">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('positions.symbol')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('positions.strategy')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-content-muted uppercase tracking-wider">{t('positions.qty')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-content-muted uppercase tracking-wider">{t('positions.buyPrice')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-content-muted uppercase tracking-wider">{t('positions.sellPrice')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-content-muted uppercase tracking-wider">{t('positions.pnl')}</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-content-muted uppercase tracking-wider">{t('positions.status')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('positions.entryDate')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('positions.closeDate')}</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y divide-border-subtle transition-opacity duration-300 ${positionsFetching && !isLoading ? 'opacity-40' : ''}`}>
                                    {paginatedPositions.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-12 text-center">
                                                <div className="text-content-muted text-sm">
                                                    {positions.length === 0
                                                        ? t('positions.noPositions')
                                                        : t('positions.noMatchingPositions')
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedPositions.map((pos) => (
                                            <tr key={pos.id} className="hover:bg-surface-raised/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-content-accent font-mono">
                                                    {pos.symbol}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary">
                                                    {pos.instance_name || `#${pos.instance_id}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-content-secondary font-mono">
                                                    {pos.base_qty != null ? pos.base_qty.toFixed(6) : '--'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-content-secondary font-mono">
                                                    {pos.buy_price != null ? `$${pos.buy_price.toFixed(2)}` : '--'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-content-secondary font-mono">
                                                    {pos.sell_price != null ? `$${pos.sell_price.toFixed(2)}` : '--'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold font-mono">
                                                    {pos.pnl != null ? (
                                                        <span className={pos.pnl >= 0 ? 'text-success' : 'text-danger'}>
                                                            {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                                                        </span>
                                                    ) : '--'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {pos.status === 'open' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-success-muted text-success border border-success/30">
                                                            {t('positions.statusOpen')}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-surface-raised/50 border border-border-subtle text-content-secondary">
                                                            {t('positions.statusClosed')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                                                    {pos.created_at
                                                        ? `${new Date(pos.created_at).toLocaleDateString()} ${new Date(pos.created_at).toLocaleTimeString()}`
                                                        : '--'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                                                    {pos.closed_at
                                                        ? `${new Date(pos.closed_at).toLocaleDateString()} ${new Date(pos.closed_at).toLocaleTimeString()}`
                                                        : '--'}
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
                                totalItems={filteredPositions.length}
                                itemLabel={t('positions.positionsLabel')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PositionsPage;
