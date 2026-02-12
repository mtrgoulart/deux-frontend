// src/pages/OperationsPage.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import Pagination from '../components/Pagination';
import DateRangeFilter from '../components/DateRangeFilter';
import TradingBarsLoader from '../components/TradingBarsLoader';
import RefreshButton from '../components/RefreshButton';

function OperationsPage() {
    const { t } = useTranslation();

    // Filter states
    const [selectedSymbol, setSelectedSymbol] = useState('all');
    const [selectedInstance, setSelectedInstance] = useState('all');
    const { startDate, setStartDate, endDate, setEndDate, setRelativeDateRange, datePresets } = useDateRangeFilter();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 25;

    // Metrics pagination state
    const [metricsPage, setMetricsPage] = useState(1);
    const metricsPerPage = 6;

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

    // Fetch operations data
    const { data: operations = [], isLoading: operationsLoading, isFetching: operationsFetching, refetch: refetchOperations } = useQuery({
        queryKey: ['dashboard-operations'],
        queryFn: async () => {
            const response = await apiFetch('/dashboard/operations');
            if (!response || !response.ok) {
                throw new Error('Failed to fetch operations');
            }
            const data = await response.json();
            return data || [];
        },
        staleTime: 2 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Fetch metrics data (APY, P&L by symbol)
    const { data: metrics = [], isLoading: metricsLoading } = useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => {
            const response = await apiFetch('/dashboard/metrics');
            if (!response || !response.ok) {
                throw new Error('Failed to fetch metrics');
            }
            const data = await response.json();
            return data || [];
        },
        staleTime: 2 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const isLoading = operationsLoading || metricsLoading;

    // Extract unique symbols from operations and metrics
    const uniqueSymbols = useMemo(() => {
        const symbolsSet = new Set();
        operations.forEach(op => symbolsSet.add(op.symbol));
        metrics.forEach(m => symbolsSet.add(m.symbol));
        return Array.from(symbolsSet).sort();
    }, [operations, metrics]);

    // Filter operations based on selections
    const filteredOperations = useMemo(() => {
        const filtered = operations.filter(op => {
            const symbolMatch = selectedSymbol === 'all' || op.symbol === selectedSymbol;
            const instanceMatch = selectedInstance === 'all' || op.instance_id === parseInt(selectedInstance);

            // Date filtering
            let dateMatch = true;
            if (startDate || endDate) {
                const opDate = new Date(op.date).toISOString().split('T')[0];
                if (startDate && opDate < startDate) dateMatch = false;
                if (endDate && opDate > endDate) dateMatch = false;
            }

            return symbolMatch && instanceMatch && dateMatch;
        });

        // Sort by date descending (most recent first)
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [operations, selectedSymbol, selectedInstance, startDate, endDate]);

    // Paginate filtered operations
    const paginatedOperations = useMemo(() => {
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        return filteredOperations.slice(startIndex, endIndex);
    }, [filteredOperations, currentPage, recordsPerPage]);

    // Calculate total pages
    const totalPages = Math.ceil(filteredOperations.length / recordsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedSymbol, selectedInstance, startDate, endDate]);

    // Export CSV handler
    const handleExportCSV = async () => {
        try {
            // Prepare filter data (use empty strings instead of null to avoid PostgreSQL type issues)
            const filters = {
                symbol: selectedSymbol || 'all',
                instance_id: selectedInstance || 'all',
                start_date: startDate || '',
                end_date: endDate || ''
            };

            const response = await apiFetch('/operations/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filters)
            });

            if (!response || !response.ok) {
                alert('Failed to export CSV. Please try again.');
                return;
            }

            // Get the CSV blob and trigger download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Extract filename from Content-Disposition header if available
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'operations_export.csv';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('An error occurred while exporting CSV. Please try again.');
        }
    };

    // Filter metrics based on symbol selection
    const filteredMetrics = useMemo(() => {
        if (selectedSymbol === 'all') return metrics;
        return metrics.filter(m => m.symbol === selectedSymbol);
    }, [metrics, selectedSymbol]);

    // Paginate metrics
    const paginatedMetrics = useMemo(() => {
        const start = (metricsPage - 1) * metricsPerPage;
        return filteredMetrics.slice(start, start + metricsPerPage);
    }, [filteredMetrics, metricsPage]);
    const totalMetricsPages = Math.ceil(filteredMetrics.length / metricsPerPage);

    // Reset metrics page when symbol filter changes
    useEffect(() => {
        setMetricsPage(1);
    }, [selectedSymbol]);

    // Calculate total P&L from filtered metrics
    const totalProfitLoss = filteredMetrics.reduce((sum, m) => sum + (m.profit_loss || 0), 0);
    const totalOperations = filteredOperations.length;

    if (isLoading) {
        return (
            <TradingBarsLoader
                title={t('operations.loadingTitle')}
                subtitle={t('operations.loadingDescription')}
            />
        );
    }

    return (
        <div className="min-h-screen bg-surface-primary">
            {/* Header */}
            <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold uppercase tracking-wide bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
                        {t('operations.title')}
                    </h1>
                    <div className="flex items-center gap-3 bg-surface-primary rounded-lg px-5 py-2.5 border border-border-subtle">
                        <span className="text-xs text-content-muted uppercase tracking-wider">{t('operations.totalPnl')}</span>
                        <span className={`text-2xl font-bold font-mono ${totalProfitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                            {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)} USDT
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* APY Metrics Cards */}
                {filteredMetrics.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                            {t('operations.performanceBySymbol')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedMetrics.map((metric) => (
                                <div key={metric.symbol} className="bg-surface border border-border rounded-lg p-4 hover:border-border-accent/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 transition-all duration-200">
                                    {/* Symbol header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-base font-bold text-content-accent font-mono tracking-wider">{metric.symbol}</h3>
                                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                                    </div>

                                    {/* APY display */}
                                    <div className="mb-3">
                                        <div className="text-xs text-content-muted uppercase tracking-wider mb-1">{t('operations.annualYield')}</div>
                                        <div className={`text-2xl font-black font-mono ${metric.apy >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {metric.apy >= 0 ? '+' : ''}{metric.apy}%
                                        </div>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-surface-raised/50 rounded p-2 border border-border-subtle">
                                            <div className="text-content-muted text-xs uppercase">{t('operations.pnl')}</div>
                                            <div className={`font-bold font-mono ${metric.profit_loss >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {metric.profit_loss >= 0 ? '+' : ''}{metric.profit_loss.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="bg-surface-raised/50 rounded p-2 border border-border-subtle">
                                            <div className="text-content-muted text-xs uppercase">{t('operations.returnPercent')}</div>
                                            <div className={`font-bold font-mono ${metric.profit_loss_percentage >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {metric.profit_loss_percentage >= 0 ? '+' : ''}{metric.profit_loss_percentage}%
                                            </div>
                                        </div>
                                        <div className="bg-surface-raised/50 rounded p-2 border border-border-subtle">
                                            <div className="text-content-muted text-xs uppercase">{t('operations.operationsCount')}</div>
                                            <div className="text-content-primary font-bold font-mono">{metric.total_operations}</div>
                                        </div>
                                        <div className="bg-surface-raised/50 rounded p-2 border border-border-subtle">
                                            <div className="text-content-muted text-xs uppercase">{t('operations.volume')}</div>
                                            <div className="text-content-primary font-bold font-mono">{metric.realized_volume.toFixed(4)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Metrics Pagination */}
                        <div className="mt-4">
                            <Pagination
                                currentPage={metricsPage}
                                totalPages={totalMetricsPages}
                                onPageChange={setMetricsPage}
                                itemsPerPage={metricsPerPage}
                                totalItems={filteredMetrics.length}
                            />
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div>
                    <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                        {t('operations.filters')}
                    </h2>

                    <div className="bg-surface border border-border rounded-lg p-5">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Symbol Filter */}
                            <div className="flex-1">
                                <label
                                    htmlFor="symbol-filter"
                                    className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider"
                                >
                                    {t('operations.filterBySymbol')}
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
                                    <option value="all">{t('operations.allSymbols')}</option>
                                    {uniqueSymbols.map(symbol => (
                                        <option key={symbol} value={symbol}>
                                            {symbol}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Strategy (Instance) Filter */}
                            <div className="flex-1">
                                <label
                                    htmlFor="strategy-filter"
                                    className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider"
                                >
                                    {t('operations.filterByStrategy')}
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
                                    <option value="all">{t('operations.allStrategies')}</option>
                                    {instances.map(instance => (
                                        <option key={instance.id} value={instance.id}>
                                            ({instance.id}) {instance.name || 'Untitled'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-end gap-3">
                                <button
                                    onClick={handleExportCSV}
                                    className="px-6 py-3 bg-success-muted border border-success/30 text-success rounded text-sm
                                             hover:bg-success/20 hover:border-success/50 transition-colors
                                             focus:outline-none focus:ring-2 focus:ring-success/20
                                             flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {t('operations.exportCsv')}
                                </button>
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
                                    {t('operations.clearAll')}
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
                                {t('operations.showing')} {filteredOperations.length} {t('operations.of')} {operations.length} {t('operations.operationsCount').toLowerCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Operations Table */}
                <div>
                    <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                        {t('operations.operationHistory')}
                    </h2>

                    <div className="bg-surface border border-border rounded-lg overflow-hidden">
                        {/* Table header bar */}
                        <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3 flex items-center justify-between">
                            <span className="text-sm text-content-accent">
                                {t('operations.executionLog')}
                            </span>
                            <RefreshButton onClick={refetchOperations} isRefreshing={operationsFetching} label={t('common.refresh')} />
                        </div>

                        {/* Table content */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border-subtle bg-surface-raised/30">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('operations.date')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('operations.symbol')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">{t('operations.side')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-content-muted uppercase tracking-wider">{t('operations.size')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-content-muted uppercase tracking-wider">{t('operations.price')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-content-muted uppercase tracking-wider">{t('operations.total')}</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-content-muted uppercase tracking-wider">{t('operations.status')}</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y divide-border-subtle transition-opacity duration-300 ${operationsFetching && !operationsLoading ? 'opacity-40' : ''}`}>
                                    {paginatedOperations.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center">
                                                <div className="text-content-muted text-sm">
                                                    {operations.length === 0
                                                        ? t('operations.noOperations')
                                                        : t('operations.noMatchingOperations')
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedOperations.map((op) => (
                                            <tr key={op.id} className="hover:bg-surface-raised/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary font-mono">
                                                    {new Date(op.date).toLocaleDateString()} {new Date(op.date).toLocaleTimeString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-content-accent font-mono">
                                                    {op.symbol}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                                        op.side === 'buy'
                                                            ? 'bg-success-muted text-success border border-success/30'
                                                            : 'bg-danger-muted text-danger border border-danger/30'
                                                    }`}>
                                                        {op.side === 'buy' ? t('operations.buy') : t('operations.sell')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-content-secondary font-mono">
                                                    {op.size.toFixed(6)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-content-secondary font-mono">
                                                    ${op.execution_price.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-content-primary font-mono">
                                                    ${op.side === 'buy'
                                                        ? op.size.toFixed(2)  // BUY: size is already in USDT
                                                        : (op.size * op.execution_price).toFixed(2)  // SELL: size * price = USDT
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-raised/50 border border-border-subtle text-xs text-content-secondary">
                                                        <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                                                        {op.status}
                                                    </span>
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
                                totalItems={filteredOperations.length}
                                itemLabel={t('operations.operationsCount').toLowerCase()}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OperationsPage;
