// src/pages/OperationsPage.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { MoonLoader } from 'react-spinners';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

function OperationsPage() {
    // Filter states
    const [selectedSymbol, setSelectedSymbol] = useState('all');
    const [selectedInstance, setSelectedInstance] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 25;

    // Helper function to set relative date ranges
    const setRelativeDateRange = (period) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (period) {
            case 'today':
                setStartDate(today.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay()); // Sunday
                setStartDate(weekStart.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                setStartDate(monthStart.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'year':
                const yearStart = new Date(today.getFullYear(), 0, 1);
                setStartDate(yearStart.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'all':
                setStartDate('');
                setEndDate('');
                break;
            default:
                break;
        }
    };

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
    const { data: operations = [], isLoading: operationsLoading } = useQuery({
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

    // Filter metrics based on symbol selection
    const filteredMetrics = useMemo(() => {
        if (selectedSymbol === 'all') return metrics;
        return metrics.filter(m => m.symbol === selectedSymbol);
    }, [metrics, selectedSymbol]);

    // Calculate total P&L from filtered metrics
    const totalProfitLoss = filteredMetrics.reduce((sum, m) => sum + (m.profit_loss || 0), 0);
    const totalOperations = filteredOperations.length;

    // Calculate cumulative P&L over time for chart
    const cumulativePnLData = useMemo(() => {
        if (filteredOperations.length === 0) return { labels: [], data: [] };

        // Sort operations by date
        const sortedOps = [...filteredOperations].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        const labels = [];
        const data = [];
        let cumulativePnL = 0;

        sortedOps.forEach(op => {
            // Calculate P&L impact of this operation
            if (op.side === 'buy') {
                // BUY: spending USDT (negative impact)
                cumulativePnL -= op.size;
            } else {
                // SELL: receiving USDT (positive impact)
                cumulativePnL += (op.size * op.execution_price);
            }

            // Format date for display
            const date = new Date(op.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: sortedOps.length > 30 ? undefined : 'numeric' // Show year only if fewer operations
            });

            labels.push(formattedDate);
            data.push(cumulativePnL);
        });

        return { labels, data };
    }, [filteredOperations]);

    // Chart configuration
    const chartData = {
        labels: cumulativePnLData.labels,
        datasets: [
            {
                label: 'Cumulative P&L (USDT)',
                data: cumulativePnLData.data,
                fill: true,
                borderColor: '#ef4444',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
                    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
                    return gradient;
                },
                borderWidth: 3,
                tension: 0.4,
                pointRadius: filteredOperations.length > 50 ? 0 : 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#000',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#ef4444',
                pointHoverBorderWidth: 3,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#ef4444',
                    font: {
                        family: 'monospace',
                        size: 12,
                        weight: 'bold'
                    },
                    padding: 15,
                    usePointStyle: true,
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: '#ef4444',
                bodyColor: '#fff',
                borderColor: '#ef4444',
                borderWidth: 1,
                padding: 12,
                titleFont: {
                    family: 'monospace',
                    size: 13,
                    weight: 'bold'
                },
                bodyFont: {
                    family: 'monospace',
                    size: 12
                },
                callbacks: {
                    label: (context) => {
                        const value = context.parsed.y;
                        const sign = value >= 0 ? '+' : '';
                        return `P&L: ${sign}$${value.toFixed(2)} USDT`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(239, 68, 68, 0.1)',
                    drawBorder: false,
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        family: 'monospace',
                        size: 10
                    },
                    maxRotation: 45,
                    minRotation: 45,
                    autoSkip: true,
                    maxTicksLimit: 15
                },
                border: {
                    color: '#374151'
                }
            },
            y: {
                grid: {
                    color: 'rgba(239, 68, 68, 0.1)',
                    drawBorder: false,
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        family: 'monospace',
                        size: 11
                    },
                    callback: (value) => {
                        const sign = value >= 0 ? '+' : '';
                        return `${sign}$${value.toFixed(0)}`;
                    }
                },
                border: {
                    color: '#374151'
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 mx-auto border-4 border-red-900/30 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-24 h-24 mx-auto border-t-4 border-r-4 border-red-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 tracking-wider uppercase mb-2">
                        Loading Dashboard
                    </h2>
                    <p className="text-gray-600 font-mono text-sm tracking-wide">
                        [ANALYZING OPERATIONS...]
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            {/* Cyberpunk Header */}
            <div className="relative border-b border-red-900/50 bg-black/40 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-red-900/10"></div>
                <div className="container mx-auto px-4 md:px-6 py-8 relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-1 h-16 bg-gradient-to-b from-red-500 to-red-900"></div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600 tracking-wider uppercase">
                                    Operations Hub
                                </h1>
                                <p className="text-gray-500 text-sm mt-1 font-mono tracking-wide">
                                    PERFORMANCE ANALYTICS // {totalOperations} OPERATIONS TRACKED
                                </p>
                            </div>
                        </div>
                        {/* Total P&L Badge */}
                        <div className="hidden md:flex items-center gap-3 bg-black/60 border border-red-900/50 rounded-lg px-6 py-3 backdrop-blur-sm">
                            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Total P&L</span>
                            <span className={`text-2xl font-bold font-mono ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)} USDT
                            </span>
                        </div>
                    </div>
                    {/* Tech decoration lines */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
                        <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-red-500"></div>
                        <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-red-400"></div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 py-6 space-y-6">
                {/* APY Metrics Cards */}
                {filteredMetrics.length > 0 && (
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-px bg-red-500"></div>
                            <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider font-mono">
                                ◆ Performance by Symbol
                            </h2>
                            <div className="flex-1 h-px bg-red-900/30"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredMetrics.map((metric) => (
                                <div key={metric.symbol} className="relative group">
                                    {/* Glow effect */}
                                    <div className="absolute inset-0 bg-red-500/5 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg p-5 shadow-2xl hover:border-red-700 transition-all">
                                        {/* Corner decorations */}
                                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
                                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>

                                        {/* Symbol header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-red-400 font-mono tracking-wider">{metric.symbol}</h3>
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                        </div>

                                        {/* APY display */}
                                        <div className="mb-4">
                                            <div className="text-xs text-gray-600 uppercase tracking-wider mb-1 font-mono">Annual Yield</div>
                                            <div className={`text-3xl font-black ${metric.apy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {metric.apy >= 0 ? '+' : ''}{metric.apy}%
                                            </div>
                                        </div>

                                        {/* Stats grid */}
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="bg-black/40 rounded p-2 border border-red-900/20">
                                                <div className="text-gray-600 text-xs uppercase font-mono">P&L</div>
                                                <div className={`font-bold ${metric.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {metric.profit_loss >= 0 ? '+' : ''}{metric.profit_loss.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="bg-black/40 rounded p-2 border border-red-900/20">
                                                <div className="text-gray-600 text-xs uppercase font-mono">Return %</div>
                                                <div className={`font-bold ${metric.profit_loss_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {metric.profit_loss_percentage >= 0 ? '+' : ''}{metric.profit_loss_percentage}%
                                                </div>
                                            </div>
                                            <div className="bg-black/40 rounded p-2 border border-red-900/20">
                                                <div className="text-gray-600 text-xs uppercase font-mono">Operations</div>
                                                <div className="text-gray-300 font-bold">{metric.total_operations}</div>
                                            </div>
                                            <div className="bg-black/40 rounded p-2 border border-red-900/20">
                                                <div className="text-gray-600 text-xs uppercase font-mono">Volume</div>
                                                <div className="text-gray-300 font-bold">{metric.realized_volume.toFixed(4)}</div>
                                            </div>
                                        </div>

                                        {/* Bottom decorations */}
                                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-px bg-red-500"></div>
                        <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider font-mono">
                            ◆ Filters
                        </h2>
                        <div className="flex-1 h-px bg-red-900/30"></div>
                    </div>

                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-red-500/5 blur-xl rounded-lg"></div>

                        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg p-5 shadow-2xl">
                            {/* Corner decorations */}
                            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>

                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Symbol Filter */}
                                <div className="flex-1">
                                    <label
                                        htmlFor="symbol-filter"
                                        className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono"
                                    >
                                        ◆ Filter by Symbol
                                    </label>
                                    <div className="relative group">
                                        <select
                                            id="symbol-filter"
                                            value={selectedSymbol}
                                            onChange={(e) => setSelectedSymbol(e.target.value)}
                                            className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                                                     focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                                                     hover:border-red-700 transition-all duration-300
                                                     appearance-none cursor-pointer backdrop-blur-sm"
                                        >
                                            <option value="all" className="bg-black text-red-400">All Symbols</option>
                                            {uniqueSymbols.map(symbol => (
                                                <option key={symbol} value={symbol} className="bg-black text-red-400">
                                                    {symbol}
                                                </option>
                                            ))}
                                        </select>
                                        {/* Custom dropdown arrow */}
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500"></div>
                                        </div>
                                        {/* Hover glow */}
                                        <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 rounded transition-all duration-300 pointer-events-none"></div>
                                    </div>
                                </div>

                                {/* Strategy (Instance) Filter */}
                                <div className="flex-1">
                                    <label
                                        htmlFor="strategy-filter"
                                        className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono"
                                    >
                                        ◆ Filter by Strategy
                                    </label>
                                    <div className="relative group">
                                        <select
                                            id="strategy-filter"
                                            value={selectedInstance}
                                            onChange={(e) => setSelectedInstance(e.target.value)}
                                            className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                                                     focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                                                     hover:border-red-700 transition-all duration-300
                                                     appearance-none cursor-pointer backdrop-blur-sm"
                                        >
                                            <option value="all" className="bg-black text-red-400">All Strategies</option>
                                            {instances.map(instance => (
                                                <option key={instance.id} value={instance.id} className="bg-black text-red-400">
                                                    ({instance.id}) {instance.name || 'Untitled'}
                                                </option>
                                            ))}
                                        </select>
                                        {/* Custom dropdown arrow */}
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500"></div>
                                        </div>
                                        {/* Hover glow */}
                                        <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 rounded transition-all duration-300 pointer-events-none"></div>
                                    </div>
                                </div>

                                {/* Clear Filters Button */}
                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setSelectedSymbol('all');
                                            setSelectedInstance('all');
                                            setStartDate('');
                                            setEndDate('');
                                        }}
                                        className="px-6 py-3 bg-red-900/30 border border-red-500/30 text-red-400 rounded font-mono text-sm uppercase tracking-wider
                                                 hover:bg-red-900/50 hover:border-red-500/50 transition-all duration-300
                                                 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            {/* Date Filter Section */}
                            <div className="mt-6 pt-6 border-t border-red-900/30">
                                <label className="block text-xs font-bold text-red-500 mb-3 uppercase tracking-widest font-mono">
                                    ◆ Filter by Date Range
                                </label>

                                {/* Relative Time Presets */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {[
                                        { label: 'Today', value: 'today' },
                                        { label: 'This Week', value: 'week' },
                                        { label: 'This Month', value: 'month' },
                                        { label: 'This Year', value: 'year' },
                                        { label: 'All Time', value: 'all' }
                                    ].map((preset) => (
                                        <button
                                            key={preset.value}
                                            onClick={() => setRelativeDateRange(preset.value)}
                                            className={`px-4 py-2 rounded font-mono text-xs uppercase tracking-wider transition-all duration-300
                                                     focus:outline-none focus:ring-2 focus:ring-red-500/20 ${
                                                preset.value === 'all' && !startDate && !endDate
                                                    ? 'bg-red-500 text-black border border-red-500 font-bold'
                                                    : 'bg-black/60 border border-red-900/50 text-red-400 hover:bg-red-900/30 hover:border-red-500/50'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Date Range */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label
                                            htmlFor="start-date"
                                            className="block text-xs text-gray-600 mb-2 uppercase tracking-wider font-mono"
                                        >
                                            From Date
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="date"
                                                id="start-date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                                                         focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                                                         hover:border-red-700 transition-all duration-300 backdrop-blur-sm
                                                         [color-scheme:dark]"
                                            />
                                            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 rounded transition-all duration-300 pointer-events-none"></div>
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <label
                                            htmlFor="end-date"
                                            className="block text-xs text-gray-600 mb-2 uppercase tracking-wider font-mono"
                                        >
                                            To Date
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="date"
                                                id="end-date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-sm
                                                         focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                                                         hover:border-red-700 transition-all duration-300 backdrop-blur-sm
                                                         [color-scheme:dark]"
                                            />
                                            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 rounded transition-all duration-300 pointer-events-none"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Active date range indicator */}
                                {(startDate || endDate) && (
                                    <div className="mt-3 flex items-center gap-2 text-xs text-red-400 font-mono">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="uppercase tracking-wider">
                                            Active: {startDate || '...'} to {endDate || '...'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Filter status indicator */}
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 font-mono">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                <span className="uppercase tracking-wider">
                                    Showing {filteredOperations.length} of {operations.length} operations
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cumulative P&L Chart */}
                {filteredOperations.length > 0 && (
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-px bg-red-500"></div>
                            <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider font-mono">
                                ◆ Cumulative P&L Over Time
                            </h2>
                            <div className="flex-1 h-px bg-red-900/30"></div>
                        </div>

                        <div className="relative">
                            {/* Outer glow */}
                            <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-lg"></div>

                            <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg overflow-hidden shadow-2xl">
                                {/* Corner tech elements */}
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500 z-10"></div>
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500 z-10"></div>

                                {/* Chart title bar */}
                                <div className="bg-black/40 border-b border-red-900/30 px-6 py-3 backdrop-blur-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500"></div>
                                                <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-700"></div>
                                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-900"></div>
                                            </div>
                                            <span className="text-sm font-mono text-red-500 uppercase tracking-wider">
                                                Net Worth Progression
                                            </span>
                                        </div>
                                        <div className="text-xs font-mono text-gray-600">
                                            {filteredOperations.length} operations tracked
                                        </div>
                                    </div>
                                </div>

                                {/* Chart content */}
                                <div className="p-6 bg-gradient-to-br from-black/60 to-gray-900/60">
                                    <div style={{ height: '300px' }}>
                                        <Line data={chartData} options={chartOptions} />
                                    </div>
                                </div>

                                {/* Bottom decorations */}
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500 z-10"></div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500 z-10"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Operations Table */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-px bg-red-500"></div>
                        <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider font-mono">
                            ◆ Operation History
                        </h2>
                        <div className="flex-1 h-px bg-red-900/30"></div>
                    </div>

                    <div className="relative">
                        {/* Outer glow */}
                        <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-lg"></div>

                        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg overflow-hidden shadow-2xl">
                            {/* Corner tech elements */}
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500 z-10"></div>
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500 z-10"></div>

                            {/* Table header */}
                            <div className="bg-black/40 border-b border-red-900/30 px-6 py-3 backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-700"></div>
                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-900"></div>
                                    </div>
                                    <span className="text-sm font-mono text-red-500 uppercase tracking-wider">
                                        Execution Log
                                    </span>
                                </div>
                            </div>

                            {/* Table content */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-red-900/30 bg-black/20">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Symbol</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Side</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Size</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Price</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Total</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-900/20">
                                        {paginatedOperations.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center">
                                                    <div className="text-gray-600 font-mono text-sm">
                                                        {operations.length === 0
                                                            ? '[NO OPERATIONS FOUND]'
                                                            : '[NO OPERATIONS MATCH FILTERS]'
                                                        }
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedOperations.map((op) => (
                                                <tr key={op.id} className="hover:bg-red-900/5 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                                                        {new Date(op.date).toLocaleDateString()} {new Date(op.date).toLocaleTimeString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-400 font-mono">
                                                        {op.symbol}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                                            op.side === 'buy'
                                                                ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                                                                : 'bg-red-900/30 text-red-400 border border-red-500/30'
                                                        }`}>
                                                            {op.side === 'buy' ? '▲ BUY' : '▼ SELL'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300 font-mono">
                                                        {op.size.toFixed(6)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300 font-mono">
                                                        ${op.execution_price.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-200 font-mono">
                                                        ${op.side === 'buy'
                                                            ? op.size.toFixed(2)  // BUY: size is already in USDT
                                                            : (op.size * op.execution_price).toFixed(2)  // SELL: size * price = USDT
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black/40 border border-red-900/30 text-xs text-gray-400 font-mono uppercase">
                                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
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
                            {totalPages > 1 && (
                                <div className="bg-black/20 border-t border-red-900/20 px-6 py-4">
                                    <div className="flex justify-between items-center">
                                        {/* Page info */}
                                        <div className="text-sm text-gray-500 font-mono">
                                            Showing <span className="text-red-400 font-bold">{((currentPage - 1) * recordsPerPage) + 1}</span> to{' '}
                                            <span className="text-red-400 font-bold">
                                                {Math.min(currentPage * recordsPerPage, filteredOperations.length)}
                                            </span>{' '}
                                            of <span className="text-red-400 font-bold">{filteredOperations.length}</span> operations
                                        </div>

                                        {/* Pagination buttons */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 text-red-400 rounded-lg font-mono text-sm uppercase tracking-wider
                                                         hover:bg-red-900/30 hover:border-red-500/50 transition-all duration-300
                                                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gradient-to-br disabled:hover:from-gray-900 disabled:hover:via-black disabled:hover:to-gray-900
                                                         focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                            >
                                                « Prev
                                            </button>
                                            <span className="text-gray-400 font-mono text-sm">
                                                <span className="text-red-500 font-bold">{currentPage}</span> / {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage >= totalPages}
                                                className="px-4 py-2 bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 text-red-400 rounded-lg font-mono text-sm uppercase tracking-wider
                                                         hover:bg-red-900/30 hover:border-red-500/50 transition-all duration-300
                                                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gradient-to-br disabled:hover:from-gray-900 disabled:hover:via-black disabled:hover:to-gray-900
                                                         focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                            >
                                                Next »
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bottom decorations */}
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500 z-10"></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500 z-10"></div>
                        </div>
                    </div>
                </div>

                {/* Tech footer decoration */}
                <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
                    <div className="w-12 h-px bg-gradient-to-r from-transparent to-red-500"></div>
                    <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                    <div className="w-24 h-px bg-red-500"></div>
                    <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                    <div className="w-12 h-px bg-gradient-to-l from-transparent to-red-500"></div>
                </div>
            </div>
        </div>
    );
}

export default OperationsPage;
