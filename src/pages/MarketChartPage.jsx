import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import TradingChart from '../components/TradingChart';
import TradingBarsLoader from '../components/TradingBarsLoader';
import { apiFetch } from '../utils/api';

const AVAILABLE_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

const MarketChartPage = () => {
    const { t } = useTranslation();

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
            <div className="min-h-screen bg-surface-primary">
                <TradingBarsLoader
                    title={t('marketData.loadingTitle')}
                    subtitle={t('marketData.loadingDescription')}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-primary">
            <div className="container mx-auto px-4 md:px-6 py-6">

                {/* Section 1: Header */}
                <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600">
                                {t('marketData.title')}
                            </h1>
                            <p className="text-content-muted text-sm mt-1">
                                {t('marketData.subtitle')}
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="px-3 py-1 bg-surface-primary border border-border rounded text-content-secondary text-sm font-medium">
                                {symbol || '—'}
                            </span>
                            <span className="px-3 py-1 bg-surface-primary border border-border rounded text-content-secondary text-sm font-medium">
                                {timeframe}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
                        <span className="font-semibold">{t('marketData.errorPrefix')}:</span> {error.message || error}
                    </div>
                )}

                {/* Section 2: Chart Settings */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-content-primary mb-3">
                        {t('marketData.filters')}
                    </h2>
                    <div className="bg-surface border border-border rounded-lg p-5">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Symbol Selector */}
                            <div className="flex-1">
                                <label
                                    htmlFor="symbol-select"
                                    className="block text-sm font-medium text-content-secondary mb-2"
                                >
                                    {t('marketData.tradingPair')}
                                </label>
                                <select
                                    id="symbol-select"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value)}
                                    className="w-full px-3 py-2 bg-surface-primary border border-border text-content-primary rounded-lg text-sm
                                             focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30
                                             disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={symbols.length === 0}
                                >
                                    {symbols.map(s => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Timeframe Selector */}
                            <div className="flex-1">
                                <label
                                    htmlFor="timeframe-select"
                                    className="block text-sm font-medium text-content-secondary mb-2"
                                >
                                    {t('marketData.timeInterval')}
                                </label>
                                <select
                                    id="timeframe-select"
                                    value={timeframe}
                                    onChange={(e) => setTimeframe(e.target.value)}
                                    className="w-full px-3 py-2 bg-surface-primary border border-border text-content-primary rounded-lg text-sm
                                             focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
                                >
                                    {AVAILABLE_TIMEFRAMES.map(tf => (
                                        <option key={tf} value={tf}>
                                            {tf}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Chart Content */}
                <div>
                    <h2 className="text-lg font-semibold text-content-primary mb-3">
                        {t('marketData.chartSection')}
                    </h2>
                    <div className="bg-surface border border-border rounded-lg overflow-hidden">
                        {/* Chart header bar */}
                        <div className="border-b border-border px-6 py-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-content-primary">
                                    {t('marketData.chartHeader')}
                                </span>
                                <span className="text-xs text-content-muted">
                                    {symbol} / {timeframe}
                                </span>
                            </div>
                        </div>

                        {/* The Chart */}
                        <div className="p-4">
                            <TradingChart symbol={symbol} timeframe={timeframe} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MarketChartPage;
