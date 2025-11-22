import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import { apiFetch } from '../utils/api';
import { MoonLoader } from 'react-spinners'; // Um spinner para feedback


// Componente que renderiza o gráfico de candlestick
const TradingChart = ({ symbol, timeframe }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- EFEITO 1: Inicialização do Gráfico ---
    // Este efeito roda apenas uma vez para criar o gráfico
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {width: 400, height: 300});
        console.log("Objeto do Gráfico Criado:", chart);
        
        chartRef.current = chart;

        // Esta linha agora deve funcionar, pois 'chart' é o objeto correto
        const candleSeries = chart.addSeries(LineSeries);
        candleSeriesRef.current = candleSeries;

        // Função de limpeza
        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, []); // Roda 1 vez

    // --- EFEITO 2: Busca e Atualização de Dados ---
    // Este efeito roda sempre que o símbolo ou o timeframe mudar
    useEffect(() => {
        if (!symbol || !timeframe || !candleSeriesRef.current) {
            return; 
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {

                // 1. Monta os parâmetros da URL
                const params = new URLSearchParams({
                    symbol: symbol,
                    timeframe: timeframe,
                    limit: 500
                });
                
                // 2. Chama a apiFetch (que é baseada em fetch)
                // Note que /api/charts/ohlcv vira /charts/ohlcv porque apiFetch já adiciona o /api
                const response = await apiFetch(`/api/charts/ohlcv?${params.toString()}`);

                // 3. Converte a resposta para JSON
                const chartData = await response.json();
                
                // --- Fim da Correção ---

                if (chartData && chartData.length > 0) {
                    candleSeriesRef.current.setData(chartData);
                    chartRef.current.timeScale().fitContent();
                } else {
                    candleSeriesRef.current.setData([]);
                }
                
            } catch (error) {
                console.error("Erro ao buscar dados do gráfico:", error);
                setError("Não foi possível carregar os dados do gráfico.");
                candleSeriesRef.current.setData([]); 
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

    }, [symbol, timeframe]);

    return (
        <div className="relative" style={{ height: '550px' }}>
            {/* Feedback de Loading */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                    <MoonLoader color="#4F46E5" size={50} />
                </div>
            )}
            
            {/* Feedback de Erro */}
            {!isLoading && error && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                    <span className="text-red-500 font-medium">{error}</span>
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