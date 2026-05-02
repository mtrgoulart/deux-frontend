import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';

function formatDateTime(value) {
    if (!value) return '-';
    try {
        const d = new Date(value);
        return d.toLocaleString();
    } catch {
        return String(value);
    }
}

function formatNumber(value, digits = 4) {
    if (value === null || value === undefined) return '-';
    const num = Number(value);
    if (Number.isNaN(num)) return '-';
    return num.toLocaleString(undefined, {
        maximumFractionDigits: digits,
        minimumFractionDigits: 0,
    });
}

function OperationsModal({ position, onClose }) {
    const { t } = useTranslation();

    const { data, isLoading } = useQuery({
        queryKey: ['position_operations', position?.id],
        queryFn: async () => {
            const res = await apiFetch(`/positions/${position.id}/operations`);
            return res.json();
        },
        enabled: !!position?.id,
    });

    const operations = data?.operations || [];

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="max-w-2xl w-full bg-surface border border-border rounded-lg shadow-2xl overflow-hidden">
                <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent uppercase tracking-wider">
                            {t('copyExplore.operationsTitle')}
                        </h3>
                        <p className="text-xs text-content-muted mt-1 font-mono">
                            {position?.symbol} <span className="text-content-accent">// #{position?.id}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-content-muted hover:text-content-primary text-xl leading-none px-2"
                        aria-label={t('copyExplore.close')}
                    >
                        ×
                    </button>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="py-8 text-center text-content-muted text-sm">
                            {t('copyExplore.loadingOperations')}
                        </div>
                    ) : operations.length === 0 ? (
                        <div className="py-8 text-center text-content-muted text-sm">
                            {t('copyExplore.noOperations')}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-content-muted uppercase tracking-wider border-b border-border-subtle">
                                        <th className="text-left py-2 px-3 font-semibold">{t('copyExplore.side')}</th>
                                        <th className="text-left py-2 px-3 font-semibold">{t('copyExplore.date')}</th>
                                        <th className="text-right py-2 px-3 font-semibold">{t('copyExplore.size')}</th>
                                        <th className="text-right py-2 px-3 font-semibold">{t('copyExplore.price')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {operations.map(op => {
                                        const isBuy = (op.side || '').toLowerCase() === 'buy';
                                        const price = op.execution_price ?? op.price;
                                        return (
                                            <tr key={op.id} className="border-b border-border-subtle/50 hover:bg-surface-raised/30">
                                                <td className="py-2 px-3">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                                        isBuy
                                                            ? 'bg-success/15 text-success border border-success/30'
                                                            : 'bg-danger/15 text-danger border border-danger/30'
                                                    }`}>
                                                        {isBuy ? t('copyExplore.buy') : t('copyExplore.sell')}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-content-secondary font-mono text-xs">
                                                    {formatDateTime(op.date)}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-content-primary">
                                                    {formatNumber(op.size, 6)}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-content-primary">
                                                    {formatNumber(price, 4)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="bg-surface-raised/30 border-t border-border-subtle px-6 py-3 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-surface-raised border border-border text-content-secondary rounded-lg text-sm uppercase tracking-wider
                                 hover:text-content-primary transition-colors
                                 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                        {t('copyExplore.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default OperationsModal;
