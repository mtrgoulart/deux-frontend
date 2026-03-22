import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import TradingBarsLoader from '../components/TradingBarsLoader';

const STATUS_STYLES = {
  transferred: 'bg-success/20 text-success',
  pending: 'bg-warning/20 text-warning',
  failed: 'bg-danger/20 text-danger',
  insufficient_balance: 'bg-danger/20 text-danger',
};

function AdminCommissionsPage() {
  const { t } = useTranslation();

  const { data: summaryData } = useQuery({
    queryKey: ['admin-commission-summary'],
    queryFn: async () => {
      const res = await apiFetch('/admin/commissions/summary');
      const data = await res.json();
      return data.summary || {};
    },
  });

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['admin-commissions'],
    queryFn: async () => {
      const res = await apiFetch('/admin/commissions');
      const data = await res.json();
      return data.commissions || [];
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (isLoading) {
    return <TradingBarsLoader title={t('adminCommissions.loading')} subtitle="" />;
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="container mx-auto px-4 md:px-6 py-6">
        <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
            {t('adminCommissions.title')}
          </h1>
        </div>

        {/* Summary Cards */}
        {summaryData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {['transferred', 'pending', 'failed', 'insufficient_balance'].map((status) => {
              const s = summaryData[status] || { count: 0, total: 0 };
              return (
                <div key={status} className="bg-surface border border-border rounded-lg p-4">
                  <p className="text-xs text-content-muted uppercase tracking-wider mb-1">
                    {t(`wallet.commission.status.${status}`)}
                  </p>
                  <p className="text-2xl font-bold text-content">{s.count}</p>
                  <p className="text-sm text-content-muted font-mono">
                    {parseFloat(s.total || 0).toFixed(2)} USDT
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* All Commissions Table */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-raised/30">
                  <th className="px-4 py-3 text-left text-xs font-bold text-content-muted uppercase">{t('adminCommissions.user')}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-content-muted uppercase">{t('wallet.commission.date')}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-content-muted uppercase">{t('wallet.commission.profit')}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-content-muted uppercase">{t('wallet.commission.rate')}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-content-muted uppercase">{t('wallet.commission.amount')}</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-content-muted uppercase">{t('wallet.commission.statusLabel')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {commissions.length === 0 ? (
                  <tr><td colSpan="6" className="px-4 py-8 text-center text-content-muted">{t('adminCommissions.noCommissions')}</td></tr>
                ) : (
                  commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-raised/20">
                      <td className="px-4 py-3 text-sm text-content font-medium">
                        {c.username || `User #${c.user_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-content">{formatDate(c.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-content">
                        {parseFloat(c.profit).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-content-muted">
                        {(parseFloat(c.commission_rate) * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-medium text-content">
                        {parseFloat(c.commission_amount).toFixed(2)} {c.commission_token}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${STATUS_STYLES[c.status] || 'bg-surface-raised text-content-muted'}`}>
                          {t(`wallet.commission.status.${c.status}`, c.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminCommissionsPage;
