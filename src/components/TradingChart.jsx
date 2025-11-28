import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createChart } from 'lightweight-charts';
import { apiFetch } from '../utils/api';
import { MoonLoader } from 'react-spinners';


// Componente que renderiza o gráfico de candlestick
const TradingChart = ({ symbol, timeframe }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);

    // --- EFEITO 1: Inicialização do Gráfico ---
    // Este efeito roda apenas uma vez para criar o gráfico
    useEffect(() => {
        if (!chartContainerRef.current) return;

        try {
            // Configuração responsiva do gráfico (lightweight-charts v5.x format)
            // DARK THEME to match site design
            const chart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: 550,
                layout: {
                    background: { type: 'solid', color: '#1a1a1a' },
                    textColor: '#d1d5db',
                },
                grid: {
                    vertLines: { color: '#2d3748' },
                    horzLines: { color: '#2d3748' },
                },
                timeScale: {
                    borderColor: '#374151',
                    timeVisible: true,
                    secondsVisible: false,
                },
            });

            chartRef.current = chart;

            // Try multiple API versions (v4/v5 compatibility)
            try {
                let candleSeries;

                // Try v4/v5 string-based API first
                if (typeof chart.addSeries === 'function') {
                    console.log('Using addSeries (v4/v5 string-based API)');
                    candleSeries = chart.addSeries('Candlestick', {
                        upColor: '#26a69a',
                        downColor: '#ef5350',
                        borderVisible: false,
                        wickUpColor: '#26a69a',
                        wickDownColor: '#ef5350',
                    });
                }
                // Fallback to v3 typed API
                else if (typeof chart.addCandlestickSeries === 'function') {
                    console.log('Using addCandlestickSeries (v3 typed API)');
                    candleSeries = chart.addCandlestickSeries({
                        upColor: '#26a69a',
                        downColor: '#ef5350',
                        borderVisible: false,
                        wickUpColor: '#26a69a',
                        wickDownColor: '#ef5350',
                    });
                } else {
                    console.error('No suitable method found on chart');
                    console.log('Chart methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(chart)));
                    throw new Error('Neither addSeries nor addCandlestickSeries available');
                }

                candleSeriesRef.current = candleSeries;
            } catch (seriesError) {
                console.error('Failed to add candlestick series:', seriesError);
            }
        } catch (err) {
            console.error('Error initializing chart:', err);
        }

        // Observer para redimensionamento responsivo
        const resizeObserver = new ResizeObserver(entries => {
            if (chartRef.current && entries.length > 0) {
                const { width } = entries[0].contentRect;
                chartRef.current.applyOptions({ width });
            }
        });
        resizeObserver.observe(chartContainerRef.current);

        // Função de limpeza
        return () => {
            resizeObserver.disconnect();
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, []); // Roda 1 vez

    // --- React Query: Busca e Atualização de Dados com Cache ---
    // Busca os dados OHLCV com cache automático
    const { data: chartData, isLoading, error } = useQuery({
        queryKey: ['chart-data', symbol, timeframe],
        queryFn: async () => {
            // 1. Monta os parâmetros da URL
            const params = new URLSearchParams({
                symbol: symbol,
                timeframe: timeframe,
                limit: 500
            });

            // 2. Chama a apiFetch (apiFetch já adiciona /api, então não incluímos aqui)
            const response = await apiFetch(`/charts/ohlcv?${params.toString()}`);

            // 3. Verifica se a resposta é válida
            if (!response) {
                throw new Error('No response from API');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 4. Verifica se é JSON antes de parsear
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Response is not JSON:', text.substring(0, 200));
                throw new Error('Backend returned HTML instead of JSON. Is Flask running on the correct port?');
            }

            // 5. Converte a resposta para JSON
            const data = await response.json();

            if (!data || data.length === 0) {
                throw new Error('No data available for this symbol/timeframe');
            }

            return data;
        },
        enabled: !!symbol && !!timeframe && !!candleSeriesRef.current,
        staleTime: 2 * 60 * 1000, // 2 minutes - dados considerados "frescos"
        cacheTime: 10 * 60 * 1000, // 10 minutes - tempo no cache
        refetchOnWindowFocus: false, // Não buscar novamente ao voltar para a janela
        retry: 1, // Tentar apenas 1 vez se falhar
    });

    // --- React Query: Busca operações do usuário para exibir como markers ---
    const { data: operations = [] } = useQuery({
        queryKey: ['chart-operations', symbol],
        queryFn: async () => {
            if (!symbol) return [];

            const params = new URLSearchParams({ symbol });
            const response = await apiFetch(`/market/operations?${params.toString()}`);

            if (!response || !response.ok) {
                console.warn('Failed to fetch operations, continuing without markers');
                return [];
            }

            const data = await response.json();
            return data || [];
        },
        enabled: !!symbol && !!candleSeriesRef.current,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 0, // Don't retry if operations fail - non-critical feature
    });

    // --- EFEITO: Atualizar o gráfico quando os dados mudarem ---
    useEffect(() => {
        if (chartData && candleSeriesRef.current) {
            candleSeriesRef.current.setData(chartData);
            chartRef.current.timeScale().fitContent();
        } else if (!chartData && candleSeriesRef.current) {
            candleSeriesRef.current.setData([]);
        }
    }, [chartData]);

    // --- EFEITO: Adicionar markers de operações (buy/sell) no gráfico ---
    useEffect(() => {
        if (!candleSeriesRef.current || !operations || operations.length === 0) {
            // Limpa markers se não houver operações
            if (candleSeriesRef.current) {
                candleSeriesRef.current.setMarkers([]);
            }
            return;
        }

        // Transforma operações em markers do lightweight-charts
        const markers = operations.map(op => ({
            time: op.time,
            position: op.side === 'buy' ? 'belowBar' : 'aboveBar',
            color: op.side === 'buy' ? '#10b981' : '#ef4444', // Green for buy, red for sell
            shape: op.side === 'buy' ? 'arrowUp' : 'arrowDown',
            text: `${op.side.toUpperCase()} @ ${op.price.toFixed(2)}`
        }));

        // Aplica os markers ao gráfico
        candleSeriesRef.current.setMarkers(markers);

        console.log(`[TradingChart] Applied ${markers.length} operation markers to chart`);
    }, [operations]);

    return (
        <div className="relative" style={{ height: '550px' }}>
            {/* Feedback de Loading */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                    <div className="text-center">
                        <MoonLoader color="#ef4444" size={60} />
                        <p className="text-red-500 font-mono text-sm mt-4 tracking-wider uppercase">
                            Loading Chart Data...
                        </p>
                    </div>
                </div>
            )}

            {/* Feedback de Erro */}
            {!isLoading && error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-10">
                    <div className="text-center px-6">
                        <div className="w-16 h-16 mx-auto mb-4 border-4 border-red-500 rounded-full flex items-center justify-center">
                            <span className="text-red-500 text-2xl font-bold">!</span>
                        </div>
                        <p className="text-red-500 font-mono text-sm mb-2 uppercase tracking-wider">
                            [System Error]
                        </p>
                        <p className="text-red-400 font-medium max-w-md">
                            {error.message}
                        </p>
                    </div>
                </div>
            )}

            {/* O Container do Gráfico */}
            <div
                ref={chartContainerRef}
                className="w-full h-full"
            />
        </div>
    );
};

export default TradingChart;