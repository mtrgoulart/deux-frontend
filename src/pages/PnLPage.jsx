// src/pages/PnLPage.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Helper function to format volume with scientific notation if needed
const formatVolume = (volume) => {
    if (volume === 0) return '0';

    // Convert to string to check decimal places
    const volumeStr = volume.toString();
    const decimalIndex = volumeStr.indexOf('.');

    // If no decimal or less than 8 decimal places, show normally
    if (decimalIndex === -1 || volumeStr.length - decimalIndex <= 8) {
        return volume.toFixed(6);
    }

    // If very small number (more than 8 decimal places), use scientific notation
    if (Math.abs(volume) < 0.000001) {
        return volume.toExponential(4);
    }

    return volume.toFixed(6);
};

function PnLPage() {
    // Filter states
    const [selectedSymbol, setSelectedSymbol] = useState('all');
    const [selectedInstance, setSelectedInstance] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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

    // Fetch operations for P&L calculation
    const { data: operations = [], isLoading: operationsLoading } = useQuery({
        queryKey: ['dashboard-operations'],
        queryFn: async () => {
            const response = await apiFetch('/dashboard/operations');
            if (!response || !response.ok) return [];
            const data = await response.json();
            return data || [];
        },
        staleTime: 2 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Extract unique symbols from operations
    const uniqueSymbols = useMemo(() => {
        const symbolsSet = new Set();
        operations.forEach(op => symbolsSet.add(op.symbol));
        return Array.from(symbolsSet).sort();
    }, [operations]);

    // Filter operations by ALL filters (symbol, instance, date)
    const filteredOperations = useMemo(() => {
        return operations.filter(op => {
            // Symbol filter
            const symbolMatch = selectedSymbol === 'all' || op.symbol === selectedSymbol;

            // Instance filter
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
    }, [operations, selectedSymbol, selectedInstance, startDate, endDate]);

    // Calculate P&L metrics from filtered operations
    const filteredMetrics = useMemo(() => {
        // Group operations by symbol
        const symbolGroups = {};

        filteredOperations.forEach(op => {
            if (!symbolGroups[op.symbol]) {
                symbolGroups[op.symbol] = {
                    symbol: op.symbol,
                    buys: [],
                    sells: [],
                    total_operations: 0,
                    first_date: op.date,
                    last_date: op.date
                };
            }

            const group = symbolGroups[op.symbol];
            group.total_operations++;

            // Track first and last operation dates
            if (new Date(op.date) < new Date(group.first_date)) {
                group.first_date = op.date;
            }
            if (new Date(op.date) > new Date(group.last_date)) {
                group.last_date = op.date;
            }

            if (op.side === 'buy') {
                group.buys.push(op);
            } else {
                group.sells.push(op);
            }
        });

        // Calculate P&L for each symbol
        const metrics = Object.values(symbolGroups).map(group => {
            // Calculate totals for buys
            let total_usdt_spent = 0;
            let total_base_bought = 0;

            group.buys.forEach(buy => {
                // BUY: size is USDT spent
                total_usdt_spent += buy.size;
                // Calculate base currency bought: size / execution_price
                total_base_bought += buy.size / buy.execution_price;
            });

            // Calculate totals for sells
            let total_usdt_received = 0;
            let total_base_sold = 0;

            group.sells.forEach(sell => {
                // SELL: size is base currency sold
                total_base_sold += sell.size;
                // Calculate USDT received: size * execution_price
                total_usdt_received += sell.size * sell.execution_price;
            });

            // Calculate realized volume (minimum of bought and sold)
            const realized_base_volume = Math.min(total_base_bought, total_base_sold);

            let profit_loss = 0;
            let profit_loss_percentage = 0;

            if (total_base_bought > 0 && total_base_sold > 0 && realized_base_volume > 0) {
                // Average cost per base currency unit
                const avg_cost_per_base = total_usdt_spent / total_base_bought;

                // Average revenue per base currency unit
                const avg_revenue_per_base = total_usdt_received / total_base_sold;

                // Cost of what was sold (realized)
                const cost_of_sold = avg_cost_per_base * realized_base_volume;

                // Revenue from what was sold (realized)
                const revenue_from_sold = avg_revenue_per_base * realized_base_volume;

                // P&L = Revenue - Cost
                profit_loss = revenue_from_sold - cost_of_sold;

                // Return percentage
                profit_loss_percentage = (profit_loss / cost_of_sold) * 100;
            }

            // Calculate APY
            let apy = 0;
            if (group.first_date && group.last_date && profit_loss_percentage !== 0) {
                const time_diff = (new Date(group.last_date) - new Date(group.first_date)) / (1000 * 60 * 60 * 24);
                if (time_diff > 0) {
                    apy = (profit_loss_percentage / time_diff) * 365;
                }
            }

            return {
                symbol: group.symbol,
                total_operations: group.total_operations,
                total_buys: group.buys.length,
                total_sells: group.sells.length,
                total_usdt_spent: total_usdt_spent,
                total_base_bought: total_base_bought,
                total_base_sold: total_base_sold,
                total_usdt_received: total_usdt_received,
                profit_loss: profit_loss,
                profit_loss_percentage: profit_loss_percentage,
                apy: apy,
                realized_volume: realized_base_volume,
                unrealized_volume: Math.abs(total_base_bought - total_base_sold),
                first_operation_date: group.first_date,
                last_operation_date: group.last_date
            };
        });

        // Sort by P&L descending (best performers first)
        return metrics.sort((a, b) => b.profit_loss - a.profit_loss);
    }, [filteredOperations]);

    // Calculate total P&L
    const totalProfitLoss = filteredMetrics.reduce((sum, m) => sum + (m.profit_loss || 0), 0);
    const totalInvested = filteredMetrics.reduce((sum, m) => sum + (m.total_usdt_spent || 0), 0);
    const totalReturn = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    // Chart data - P&L by symbol
    const chartData = {
        labels: filteredMetrics.map(m => m.symbol),
        datasets: [
            {
                label: 'Profit/Loss (USDT)',
                data: filteredMetrics.map(m => m.profit_loss),
                backgroundColor: filteredMetrics.map(m =>
                    m.profit_loss >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'
                ),
                borderColor: filteredMetrics.map(m =>
                    m.profit_loss >= 0 ? '#22c55e' : '#ef4444'
                ),
                borderWidth: 2,
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
                        size: 11
                    }
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
        }
    };

    if (operationsLoading) {
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
                        Loading P&L Data
                    </h2>
                    <p className="text-gray-600 font-mono text-sm tracking-wide">
                        [CALCULATING PROFIT/LOSS...]
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
                                    Profit & Loss
                                </h1>
                                <p className="text-gray-500 text-sm mt-1 font-mono tracking-wide">
                                    PERFORMANCE ANALYTICS // {filteredMetrics.length} SYMBOLS TRACKED
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
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total P&L Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-red-500/5 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg p-5 shadow-2xl hover:border-red-700 transition-all">
                            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>
                            <div className="text-xs text-gray-600 uppercase tracking-wider mb-2 font-mono">Total Profit/Loss</div>
                            <div className={`text-3xl font-black ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)} USDT
                            </div>
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>
                        </div>
                    </div>

                    {/* Total Return % Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-red-500/5 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg p-5 shadow-2xl hover:border-red-700 transition-all">
                            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>
                            <div className="text-xs text-gray-600 uppercase tracking-wider mb-2 font-mono">Total Return %</div>
                            <div className={`text-3xl font-black ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                            </div>
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>
                        </div>
                    </div>

                    {/* Total Invested Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-red-500/5 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg p-5 shadow-2xl hover:border-red-700 transition-all">
                            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>
                            <div className="text-xs text-gray-600 uppercase tracking-wider mb-2 font-mono">Total Invested</div>
                            <div className="text-3xl font-black text-gray-300">
                                ${totalInvested.toFixed(2)} USDT
                            </div>
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>
                        </div>
                    </div>
                </div>

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
                        <div className="absolute inset-0 bg-red-500/5 blur-xl rounded-lg"></div>
                        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg p-5 shadow-2xl">
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
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500"></div>
                                        </div>
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
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500"></div>
                                        </div>
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
                                    Showing {filteredMetrics.length} of {uniqueSymbols.length} symbols
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* P&L Chart */}
                {filteredMetrics.length > 0 && (
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-px bg-red-500"></div>
                            <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider font-mono">
                                ◆ P&L by Symbol
                            </h2>
                            <div className="flex-1 h-px bg-red-900/30"></div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-lg"></div>
                            <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg overflow-hidden shadow-2xl">
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
                                                Profit/Loss Distribution
                                            </span>
                                        </div>
                                        <div className="text-xs font-mono text-gray-600">
                                            {filteredMetrics.length} symbols analyzed
                                        </div>
                                    </div>
                                </div>

                                {/* Chart content */}
                                <div className="p-6 bg-gradient-to-br from-black/60 to-gray-900/60">
                                    <div style={{ height: '300px' }}>
                                        <Bar data={chartData} options={chartOptions} />
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500 z-10"></div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500 z-10"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* P&L Table */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-px bg-red-500"></div>
                        <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider font-mono">
                            ◆ P&L Summary Table
                        </h2>
                        <div className="flex-1 h-px bg-red-900/30"></div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-lg"></div>
                        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg overflow-hidden shadow-2xl">
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
                                        Performance Overview
                                    </span>
                                </div>
                            </div>

                            {/* Table content */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-red-900/30 bg-black/20">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Symbol</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-red-500 uppercase tracking-wider font-mono">P&L (USDT)</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Return %</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-red-500 uppercase tracking-wider font-mono">APY %</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Operations</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-red-500 uppercase tracking-wider font-mono">Realized Volume</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-900/20">
                                        {filteredMetrics.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center">
                                                    <div className="text-gray-600 font-mono text-sm">
                                                        {operations.length === 0
                                                            ? '[NO OPERATIONS AVAILABLE]'
                                                            : '[NO DATA MATCHES FILTERS]'
                                                        }
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMetrics.map((metric) => (
                                                <tr key={metric.symbol} className="hover:bg-red-900/5 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-400 font-mono">
                                                        {metric.symbol}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold font-mono ${
                                                        metric.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                        {metric.profit_loss >= 0 ? '+' : ''}{metric.profit_loss.toFixed(2)}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold font-mono ${
                                                        metric.profit_loss_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                        {metric.profit_loss_percentage >= 0 ? '+' : ''}{metric.profit_loss_percentage.toFixed(2)}%
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold font-mono ${
                                                        metric.apy >= 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                        {metric.apy >= 0 ? '+' : ''}{metric.apy.toFixed(2)}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300 font-mono">
                                                        {metric.total_operations}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300 font-mono">
                                                        {formatVolume(metric.realized_volume)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

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

export default PnLPage;
