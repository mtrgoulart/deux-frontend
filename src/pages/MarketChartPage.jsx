import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import TradingChart from '../components/TradingChart';
import { apiFetch } from '../utils/api';

const AVAILABLE_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

const MarketChartPage = () => {
    // Estados para controlar os seletores
    const [symbol, setSymbol] = useState('');
    const [timeframe, setTimeframe] = useState('1h');

    // Usa React Query para buscar símbolos com cache
    const { data: symbols = [], isLoading: loading, error } = useQuery({
        queryKey: ['market-symbols'],
        queryFn: async () => {
            const response = await apiFetch('/market/symbols');

            if (!response) {
                throw new Error('No response from API');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Response is not JSON:', text.substring(0, 200));
                throw new Error('Backend returned HTML instead of JSON. Is Flask running on port 5003?');
            }

            const data = await response.json();

            if (data && data.length > 0) {
                // Define o primeiro símbolo quando os dados chegarem
                if (!symbol) {
                    setSymbol(data[0]);
                }
                return data;
            } else {
                console.warn('API returned empty array, using fallback symbols');
                const fallback = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
                if (!symbol) {
                    setSymbol(fallback[0]);
                }
                return fallback;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - dados considerados "frescos"
        cacheTime: 10 * 60 * 1000, // 10 minutes - tempo no cache
        refetchOnWindowFocus: false, // Não buscar novamente ao voltar para a janela
        retry: 1, // Tentar apenas 1 vez se falhar
    });

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative mb-8">
                        {/* Pulsing outer ring */}
                        <div className="w-24 h-24 mx-auto border-4 border-red-900/30 rounded-full animate-pulse"></div>
                        {/* Spinning middle ring */}
                        <div className="absolute inset-0 w-24 h-24 mx-auto border-t-4 border-r-4 border-red-500 rounded-full animate-spin"></div>
                        {/* Center dot */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 tracking-wider uppercase mb-2">
                        Initializing Terminal
                    </h2>
                    <p className="text-gray-600 font-mono text-sm tracking-wide">
                        [LOADING MARKET DATA...]
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
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-16 bg-gradient-to-b from-red-500 to-red-900"></div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600 tracking-wider uppercase">
                                Market Terminal
                            </h1>
                            <p className="text-gray-500 text-sm mt-1 font-mono tracking-wide">
                                REAL-TIME DATA SURVEILLANCE // {symbol || 'LOADING...'}
                            </p>
                        </div>
                    </div>
                    {/* Tech decoration lines */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
                        <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-red-500"></div>
                        <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-red-400"></div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 py-6">
                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-950/50 border-l-4 border-red-500 text-red-300 rounded-r font-mono text-sm backdrop-blur-sm">
                        <span className="text-red-500 font-bold">[ERROR]</span> {error.message || error}
                    </div>
                )}

                {/* Control Panel - Cyberpunk Style */}
                <div className="mb-6 relative">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-red-500/5 blur-xl rounded-lg"></div>

                    <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg p-6 shadow-2xl">
                        {/* Corner decorations */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>

                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Symbol Selector */}
                            <div className="flex-1">
                                <label
                                    htmlFor="symbol-select"
                                    className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono"
                                >
                                    ◆ Trading Pair
                                </label>
                                <div className="relative group">
                                    <select
                                        id="symbol-select"
                                        value={symbol}
                                        onChange={(e) => setSymbol(e.target.value)}
                                        className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-lg
                                                 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                                                 hover:border-red-700 transition-all duration-300
                                                 disabled:opacity-50 disabled:cursor-not-allowed
                                                 appearance-none cursor-pointer backdrop-blur-sm"
                                        disabled={symbols.length === 0}
                                    >
                                        {symbols.map(s => (
                                            <option key={s} value={s} className="bg-black text-red-400">
                                                {s}
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

                            {/* Timeframe Selector */}
                            <div className="flex-1">
                                <label
                                    htmlFor="timeframe-select"
                                    className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono"
                                >
                                    ◆ Time Interval
                                </label>
                                <div className="relative group">
                                    <select
                                        id="timeframe-select"
                                        value={timeframe}
                                        onChange={(e) => setTimeframe(e.target.value)}
                                        className="w-full px-4 py-3 bg-black/60 border border-red-900/50 text-red-400 rounded font-mono text-lg
                                                 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                                                 hover:border-red-700 transition-all duration-300
                                                 appearance-none cursor-pointer backdrop-blur-sm"
                                    >
                                        {AVAILABLE_TIMEFRAMES.map(t => (
                                            <option key={t} value={t} className="bg-black text-red-400">
                                                {t}
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
                        </div>

                        {/* Status indicator */}
                        <div className="mt-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-600 font-mono uppercase tracking-wider">LIVE FEED ACTIVE</span>
                        </div>
                    </div>
                </div>

                {/* Chart Container - Cyberpunk Frame */}
                <div className="relative">
                    {/* Outer glow */}
                    <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-lg"></div>

                    <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-red-900/50 rounded-lg overflow-hidden shadow-2xl">
                        {/* Corner tech elements */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500 z-10"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500 z-10"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500 z-10"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500 z-10"></div>

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
                                        Price Chart Analysis
                                    </span>
                                </div>
                                <div className="text-xs font-mono text-gray-600">
                                    {symbol} / {timeframe}
                                </div>
                            </div>
                        </div>

                        {/* The Chart */}
                        <div className="p-4 bg-gradient-to-br from-black/60 to-gray-900/60">
                            <TradingChart symbol={symbol} timeframe={timeframe} />
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
};

export default MarketChartPage;