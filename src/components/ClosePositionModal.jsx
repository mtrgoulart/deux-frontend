import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';

function PnlDisplay({ pnl }) {
  if (pnl === null || pnl === undefined) return <span className="text-content-muted">--</span>;
  const isProfit = pnl >= 0;
  return (
    <span className={`font-bold font-mono ${isProfit ? 'text-success' : 'text-danger'}`}>
      {isProfit ? '+' : ''}{pnl.toFixed(2)} USDT
    </span>
  );
}

export default function ClosePositionModal({ isOpen, onClose, onSystemClose, onManualClose, position, allOpenPositions, isSubmitting }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('system');
  const [executionPrice, setExecutionPrice] = useState('');
  const [executedAt, setExecutedAt] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Fetch latest price when modal opens
  useEffect(() => {
    if (isOpen && position) {
      setActiveTab('system');
      setExecutionPrice('');
      setCurrentPrice(null);
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setExecutedAt(now.toISOString().slice(0, 16));

      // Fetch current price from oracle
      setPriceLoading(true);
      apiFetch(`/latest_price?symbol=${encodeURIComponent(position.symbol)}`)
        .then(res => res.json())
        .then(data => setCurrentPrice(data.price))
        .catch(() => setCurrentPrice(null))
        .finally(() => setPriceLoading(false));
    }
  }, [isOpen, position]);

  const summary = useMemo(() => {
    if (!allOpenPositions || allOpenPositions.length === 0) return { totalQty: 0, avgBuyPrice: 0 };
    const totalQty = allOpenPositions.reduce((sum, p) => sum + (p.base_qty || 0), 0);
    const totalCost = allOpenPositions.reduce((sum, p) => sum + ((p.buy_price || 0) * (p.base_qty || 0)), 0);
    const avgBuyPrice = totalQty > 0 ? totalCost / totalQty : 0;
    return { totalQty, avgBuyPrice };
  }, [allOpenPositions]);

  // System close P&L: based on current oracle price
  const systemPnl = useMemo(() => {
    if (currentPrice === null || summary.totalQty === 0) return null;
    return (currentPrice - summary.avgBuyPrice) * summary.totalQty;
  }, [currentPrice, summary]);

  // Manual close P&L: based on user-entered price
  const manualPnl = useMemo(() => {
    const price = parseFloat(executionPrice);
    if (!price || price <= 0 || summary.totalQty === 0) return null;
    return (price - summary.avgBuyPrice) * summary.totalQty;
  }, [executionPrice, summary]);

  if (!isOpen || !position) return null;

  const baseCurrency = position.base_currency || position.symbol?.split(/[-/]/)[0];
  const canManualSubmit = executionPrice && parseFloat(executionPrice) > 0 && executedAt;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-surface border border-border rounded-lg shadow-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold tracking-wider uppercase text-content-primary">
              {t('positions.closePositionTitle')}
            </h3>
            <button onClick={onClose} disabled={isSubmitting} className="text-content-muted hover:text-content-primary text-2xl leading-none">&times;</button>
          </div>

          {/* Position Summary */}
          <div className="bg-surface-primary border border-border-subtle rounded-lg p-4 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-content-muted uppercase tracking-wider">{t('positions.symbol')}</p>
                <p className="font-bold text-content-primary font-mono text-lg">{position.symbol}</p>
              </div>
              <div>
                <p className="text-xs text-content-muted uppercase tracking-wider">{t('positions.strategy')}</p>
                <p className="font-bold text-content-primary">{position.instance_name || `#${position.instance_id}`}</p>
              </div>
              <div>
                <p className="text-xs text-content-muted uppercase tracking-wider">{t('positions.totalQty')}</p>
                <p className="font-bold text-content-primary font-mono">{summary.totalQty.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-xs text-content-muted uppercase tracking-wider">{t('positions.avgBuyPrice')}</p>
                <p className="font-bold text-content-primary font-mono">${summary.avgBuyPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Open Positions Table */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-content-accent uppercase tracking-wider mb-2">
              {t('positions.openPositionsToClose')} ({allOpenPositions.length})
            </p>
            <div className="bg-surface-primary border border-border-subtle rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-raised/30">
                    <th className="px-3 py-2 text-left text-content-muted uppercase">{t('positions.qty')}</th>
                    <th className="px-3 py-2 text-right text-content-muted uppercase">{t('positions.buyPrice')}</th>
                    <th className="px-3 py-2 text-right text-content-muted uppercase">{t('positions.entryDate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {allOpenPositions.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 font-mono text-content-primary">{p.base_qty?.toFixed(6)}</td>
                      <td className="px-3 py-2 text-right font-mono text-content-secondary">{p.buy_price != null ? `$${p.buy_price.toFixed(2)}` : '--'}</td>
                      <td className="px-3 py-2 text-right text-content-secondary">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-1 mb-5 bg-surface-primary rounded-lg p-1 border border-border-subtle">
            <button
              onClick={() => setActiveTab('system')}
              className={`flex-1 py-2 rounded text-sm font-semibold transition-colors
                ${activeTab === 'system' ? 'bg-accent text-white' : 'text-content-secondary hover:text-content-primary'}`}
            >
              {t('positions.systemClose')}
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 rounded text-sm font-semibold transition-colors
                ${activeTab === 'manual' ? 'bg-warning text-white' : 'text-content-secondary hover:text-content-primary'}`}
            >
              {t('positions.manualClose')}
            </button>
          </div>

          {/* System Close Tab */}
          {activeTab === 'system' && (
            <div>
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-5 space-y-2">
                <p className="text-sm text-accent font-medium">
                  {t('positions.systemCloseWarning')}
                </p>
                <p className="text-sm text-content-primary">
                  {t('positions.sellQty')}: <span className="font-bold font-mono">{summary.totalQty.toFixed(6)}</span> {baseCurrency}
                </p>
                <p className="text-sm text-content-primary">
                  {t('positions.currentPrice')}: {priceLoading
                    ? <span className="inline-block w-16 h-4 bg-surface-raised rounded animate-pulse align-middle" />
                    : currentPrice != null
                      ? <span className="font-bold font-mono">${currentPrice.toFixed(2)}</span>
                      : <span className="text-content-muted">--</span>
                  }
                </p>
                <p className="text-sm text-content-primary">
                  {t('positions.estimatedPnl')}: {priceLoading
                    ? <span className="inline-block w-24 h-4 bg-surface-raised rounded animate-pulse align-middle" />
                    : <PnlDisplay pnl={systemPnl} />
                  }
                </p>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-surface-raised border border-border text-content-secondary rounded text-sm uppercase tracking-wider
                           hover:bg-surface-raised/80 hover:text-content-primary transition-all duration-300"
                >
                  {t('positions.closeCancel')}
                </button>
                <button
                  onClick={() => onSystemClose(position.instance_id)}
                  disabled={isSubmitting}
                  className="px-6 py-3 text-white rounded text-sm uppercase tracking-wider font-bold
                           bg-accent hover:bg-accent-hover border border-accent/50 transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('positions.closing') : t('positions.closeConfirm')}
                </button>
              </div>
            </div>
          )}

          {/* Manual Close Tab */}
          {activeTab === 'manual' && (
            <div>
              <p className="text-sm text-content-muted mb-2">
                {t('positions.manualCloseDescription')}
              </p>
              <p className="text-sm text-content-primary mb-4">
                {t('positions.sellQty')}: <span className="font-bold font-mono">{summary.totalQty.toFixed(6)}</span> {baseCurrency}
              </p>
              <div className="space-y-4 mb-4">
                <div>
                  <label htmlFor="execution-price" className="block mb-2 text-xs font-semibold text-content-accent uppercase tracking-wider">
                    {t('positions.executionPrice')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-content-muted">$</span>
                    <input
                      type="number"
                      id="execution-price"
                      value={executionPrice}
                      onChange={(e) => setExecutionPrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                               focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                      placeholder="0.00"
                      min="0"
                      step="any"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="executed-at" className="block mb-2 text-xs font-semibold text-content-accent uppercase tracking-wider">
                    {t('positions.executionDate')}
                  </label>
                  <input
                    type="datetime-local"
                    id="executed-at"
                    value={executedAt}
                    onChange={(e) => setExecutedAt(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
              {/* Live P&L estimate */}
              <div className="bg-surface-primary border border-border-subtle rounded-lg p-3 mb-5">
                <p className="text-sm text-content-primary">
                  {t('positions.estimatedPnl')}: <PnlDisplay pnl={manualPnl} />
                </p>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-surface-raised border border-border text-content-secondary rounded text-sm uppercase tracking-wider
                           hover:bg-surface-raised/80 hover:text-content-primary transition-all duration-300"
                >
                  {t('positions.closeCancel')}
                </button>
                <button
                  onClick={() => onManualClose({
                    instance_id: position.instance_id,
                    execution_price: parseFloat(executionPrice),
                    executed_at: new Date(executedAt).toISOString(),
                  })}
                  disabled={isSubmitting || !canManualSubmit}
                  className="px-6 py-3 text-white rounded text-sm uppercase tracking-wider font-bold
                           bg-warning hover:bg-warning/80 border border-warning/50 transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('positions.closing') : t('positions.closeConfirm')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
