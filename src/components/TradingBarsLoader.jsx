import React from 'react';

function TradingBarsLoader({ title, subtitle }) {
    return (
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 10rem)' }}>
            <div className="text-center">
                {/* Trading bar chart loader */}
                <div className="flex items-end justify-center gap-1.5 h-12 mb-6">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="w-2 rounded-full bg-gradient-to-t from-teal-600 to-teal-400"
                            style={{
                                animation: 'trading-bars 1.2s ease-in-out infinite',
                                animationDelay: `${i * 0.15}s`,
                                height: '20%',
                            }}
                        />
                    ))}
                    <style>{`
                        @keyframes trading-bars {
                            0%, 100% { height: 20%; opacity: 0.4; }
                            50% { height: 100%; opacity: 1; }
                        }
                    `}</style>
                </div>
                <h2 className="text-xl font-semibold text-content-primary mb-2">
                    {title}
                </h2>
                <p className="text-content-muted text-sm">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

export default TradingBarsLoader;
