// pages/CopyDetailPage.jsx

import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import Pagination from '../components/Pagination';
import DateRangeFilter from '../components/DateRangeFilter';
import TradingBarsLoader from '../components/TradingBarsLoader';
import RefreshButton from '../components/RefreshButton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function CopyDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 50;

    // Filter states
    const [selectedSymbol, setSelectedSymbol] = useState('all');
    const { startDate, setStartDate, endDate, setEndDate, setRelativeDateRange, datePresets } = useDateRangeFilter();

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedSymbol, startDate, endDate]);

    // Fetch copytrading details
    const { data: detailsData, isLoading: isLoadingDetails } = useQuery({
        queryKey: ['copytrading_details', id],
        queryFn: async () => {
            const res = await apiFetch(`/copytrading/${id}`);
            return res.json();
        },
    });

    // Extract unique symbols from sharings
    const uniqueSymbols = useMemo(() => {
        if (!detailsData?.sharings) return [];
        const symbolsSet = new Set();
        detailsData.sharings.forEach(s => {
            if (s.symbol) symbolsSet.add(s.symbol);
        });
        return Array.from(symbolsSet).sort();
    }, [detailsData]);

    // Build query params for date filters
    const dateParams = useMemo(() => {
        const params = new URLSearchParams();
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
        return params.toString();
    }, [startDate, endDate]);

    // Fetch chart data
    const { data: chartResponse, isLoading: isLoadingChart } = useQuery({
        queryKey: ['copytrading_chart', id, startDate, endDate],
        queryFn: async () => {
            const url = `/copytrading/${id}/chart${dateParams ? `?${dateParams}` : ''}`;
            const res = await apiFetch(url);
            return res.json();
        },
    });

    // Fetch positions with pagination and filters
    const { data: positionsData, isLoading: isLoadingPositions, isFetching: positionsFetching, refetch: refetchPositions } = useQuery({
        queryKey: ['copytrading_positions', id, currentPage, selectedSymbol, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: currentPage,
                limit: limit,
                symbol: selectedSymbol,
            });
            if (startDate) params.set('start_date', startDate);
            if (endDate) params.set('end_date', endDate);
            const res = await apiFetch(`/copytrading/${id}/positions?${params.toString()}`);
            return res.json();
        },
        keepPreviousData: true,
    });

    const chartData = chartResponse?.chart_data || [];
    const positions = positionsData?.positions || [];
    const totalPages = positionsData?.total_pages || 1;
    const totalCount = positionsData?.total_count || 0;

    // Summary stats from positions
    const summaryStats = useMemo(() => {
        const openCount = positions.filter(p => p.status === 'open').length;
        const closedCount = positions.filter(p => p.status === 'closed').length;
        return { openCount, closedCount };
    }, [positions]);

    // Chart configuration
    const hasChartData = chartData.length > 0;
    const lastPnl = hasChartData ? chartData[chartData.length - 1].pnl : 0;
    const chartColor = lastPnl >= 0 ? '#4ade80' : '#f87171';

    const lineChartData = hasChartData ? {
        labels: chartData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
            label: t('copyDetail.pnlChartLabel'),
            data: chartData.map(d => d.pnl),
            borderColor: chartColor,
            backgroundColor: `${chartColor}20`,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2,
        }]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#9ca3af',
                    font: { size: 11 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                titleColor: '#e5e7eb',
                bodyColor: '#fff',
                borderColor: 'rgba(128, 128, 128, 0.3)',
                borderWidth: 1,
                callbacks: {
                    label: (context) => `P&L: $${context.parsed.y.toFixed(2)}`
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#9ca3af', font: { size: 10 } },
                grid: { color: 'rgba(128, 128, 128, 0.12)' }
            },
            y: {
                ticks: {
                    color: '#9ca3af',
                    font: { size: 10 },
                    callback: (value) => `$${value}`
                },
                grid: { color: 'rgba(128, 128, 128, 0.12)' }
            }
        }
    };

    const isLoading = isLoadingDetails || isLoadingChart || isLoadingPositions;

    if (isLoading && !positionsData) {
        return (
            <div className="bg-surface-primary">
                <TradingBarsLoader title={t('copyDetail.loadingTitle')} subtitle={t('copyDetail.loadingSubtitle')} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-primary">
            {/* Header */}
            <div className="container mx-auto px-4 md:px-6 py-6">
                <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/copy/explore')}
                                className="px-4 py-2 bg-surface-raised border border-border text-content-secondary rounded-lg text-sm
                                         hover:bg-surface-raised/80 hover:text-content-primary transition-colors
                                         focus:outline-none focus:ring-2 focus:ring-accent/20"
                            >
                                &larr; {t('copyDetail.back')}
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
                                    {detailsData?.name || t('copyDetail.defaultTitle')}
                                </h1>
                                <p className="text-content-muted text-sm mt-1">
                                    {t('copyDetail.subtitle', { count: totalCount })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3 bg-surface-primary rounded-lg px-4 py-2 border border-border-subtle">
                                <span className="text-xs text-content-muted uppercase tracking-wider">{t('copyDetail.openPositions')}</span>
                                <span className="text-lg font-bold font-mono text-content-primary">{summaryStats.openCount}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-surface-primary rounded-lg px-4 py-2 border border-border-subtle">
                                <span className="text-xs text-content-muted uppercase tracking-wider">{t('copyDetail.closedPositions')}</span>
                                <span className="text-lg font-bold font-mono text-content-primary">{summaryStats.closedCount}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-surface-primary rounded-lg px-5 py-2.5 border border-border-subtle">
                                <span className="text-xs text-content-muted uppercase tracking-wider">{t('copyDetail.totalPnl')}</span>
                                <span className={`text-2xl font-bold font-mono ${lastPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {lastPnl >= 0 ? '+' : ''}${lastPnl.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* P&L Chart Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                            {t('copyDetail.pnlTrend')}
                        </h2>

                        <div className="bg-surface border border-border rounded-lg p-6">
                            {hasChartData ? (
                                <div className="h-64 md:h-80">
                                    <Line data={lineChartData} options={chartOptions} />
                                </div>
                            ) : (
                                <div className="h-64 md:h-80 flex items-center justify-center">
                                    <p className="text-content-muted text-sm">{t('copyDetail.noChartData')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filters */}
                    <div>
                        <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                            {t('copyDetail.filters')}
                        </h2>

                        <div className="bg-surface border border-border rounded-lg p-5">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Symbol Filter */}
                                <div className="flex-1">
                                    <label
                                        htmlFor="symbol-filter"
                                        className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider"
                                    >
                                        {t('copyDetail.filterBySymbol')}
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
                                        <option value="all">{t('copyDetail.allSymbols')}</option>
                                        {uniqueSymbols.map(symbol => (
                                            <option key={symbol} value={symbol}>{symbol}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Clear All Button */}
                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setSelectedSymbol('all');
                                            setStartDate('');
                                            setEndDate('');
                                        }}
                                        className="px-6 py-3 bg-surface-raised border border-border text-content-secondary rounded text-sm
                                                 hover:bg-surface-raised hover:text-content-primary transition-colors
                                                 focus:outline-none focus:ring-2 focus:ring-accent/20"
                                    >
                                        {t('copyDetail.clearFilters')}
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
                                    {t('copyDetail.showingPositions', { count: positions.length, total: totalCount })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Position History Table */}
                    <div>
                        <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                            {t('copyDetail.positionHistory')}
                        </h2>

                        <div className="bg-surface border border-border rounded-lg overflow-hidden">
                            {/* Table header bar */}
                            <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3 flex items-center justify-between">
                                <span className="text-sm text-content-accent uppercase tracking-wider">
                                    {t('copyDetail.positionLog')}
                                </span>
                                <RefreshButton onClick={refetchPositions} isRefreshing={positionsFetching} label={t('common.refresh')} />
                            </div>

                            {positions.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-border-subtle bg-surface-raised/30">
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.symbol')}</th>
                                                    <th className="px-6 py-4 text-center text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.status')}</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.qty')}</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.buyPrice')}</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.sellPrice')}</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.pnl')}</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.entryDate')}</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.closeDate')}</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.instance')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y divide-border-subtle transition-opacity duration-300 ${positionsFetching && !isLoadingPositions ? 'opacity-40' : ''}`}>
                                                {positions.map((pos) => (
                                                    <tr key={pos.id} className="hover:bg-surface-raised/30 transition-colors group">
                                                        <td className="px-6 py-4 text-sm font-mono font-bold text-content-accent">{pos.symbol}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            {pos.status === 'open' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-success-muted text-success border border-success/30">
                                                                    {t('copyDetail.statusOpen')}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-surface-raised/50 border border-border-subtle text-content-secondary">
                                                                    {t('copyDetail.statusClosed')}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-mono text-content-secondary text-right">
                                                            {pos.base_qty != null ? pos.base_qty.toFixed(6) : '--'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-mono text-content-secondary text-right">
                                                            {pos.buy_price != null ? `$${pos.buy_price.toFixed(2)}` : '--'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-mono text-content-secondary text-right">
                                                            {pos.sell_price != null ? `$${pos.sell_price.toFixed(2)}` : '--'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-mono font-bold text-right">
                                                            {pos.pnl != null ? (
                                                                <span className={pos.pnl >= 0 ? 'text-success' : 'text-danger'}>
                                                                    {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                                                                </span>
                                                            ) : '--'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-mono text-content-secondary">
                                                            {pos.created_at
                                                                ? new Date(pos.created_at).toLocaleString('en-US', {
                                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                })
                                                                : '--'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-mono text-content-secondary">
                                                            {pos.closed_at
                                                                ? new Date(pos.closed_at).toLocaleString('en-US', {
                                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                })
                                                                : '--'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-content-secondary">
                                                            {pos.instance_name}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="bg-surface-raised/30 border-t border-border-subtle px-6 py-4">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={setCurrentPage}
                                            itemsPerPage={limit}
                                            totalItems={totalCount}
                                            itemLabel={t('copyDetail.positionsLabel')}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <p className="text-content-muted text-sm">{t('copyDetail.noPositions')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CopyDetailPage;
