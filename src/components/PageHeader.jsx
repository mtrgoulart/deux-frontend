import React from 'react';

export function PageHeader({ onAddStrategy }) {
  return (
    <div className="flex justify-between items-center mb-8">
      {/* ✅ Traduzido */}
      <h2 className="text-3xl font-bold text-white tracking-wider" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.4)' }}>
        Strategies
      </h2>
      <button
        onClick={onAddStrategy}
        className="px-5 py-2 text-sm font-semibold text-white bg-red-600/80 border border-red-500/50 rounded-md
                   hover:bg-red-600 hover:shadow-[0_0_15px_rgba(239,68,68,0.6)] transition-all duration-300"
      >
        {/* ✅ Traduzido */}
        Add Strategy
      </button>
    </div>
  );
}