import React, { useState } from 'react';
import TradingChart from '../components/TradingChart'; // Nosso novo componente

// Você pode buscar essa lista da sua API no futuro, se desejar
const MOCK_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'LINK/USDT'];
const AVAILABLE_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

const MarketChartPage = () => {
    // Estados para controlar os seletores
    const [symbol, setSymbol] = useState(MOCK_SYMBOLS[0]);
    const [timeframe, setTimeframe] = useState(AVAILABLE_TIMEFRAMES[3]); // Default '1h'

    return (
        <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-3xl font-bold text-white mb-6 tracking-wide">
                Market data
            </h1>

            {/* Seção de Controles (Seletores) */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
                
                {/* Seletor de Símbolo */}
                <div className="flex-1">
                    <label 
                        htmlFor="symbol-select" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Symbols
                    </label>
                    <select
                        id="symbol-select"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                    >
                        {MOCK_SYMBOLS.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* Seletor de Timeframe */}
                <div className="flex-1">
                    <label 
                        htmlFor="timeframe-select" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Timeframe
                    </label>
                    <select
                        id="timeframe-select"
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                    >
                        {AVAILABLE_TIMEFRAMES.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* O Gráfico */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <TradingChart symbol={symbol} timeframe={timeframe} />
            </div>
        </div>
    );
};

export default MarketChartPage;