import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import CommissionHistory from '../components/CommissionHistory';
import { FullScreenLoader } from '../components/FullScreenLoader';

function MoaIndicator({ balances, t }) {
  const { data: config } = useQuery({
    queryKey: ['platform-config-moa'],
    queryFn: async () => {
      const res = await apiFetch('/admin/config');
      if (!res.ok) return null;
      const data = await res.json();
      return data.config || {};
    },
    retry: false,
  });

  if (!config) return null;
  if (config.moa_enabled !== 'true') return null;

  const moaAmount = parseFloat(config.moa_amount || 0);
  const moaToken = config.moa_token || 'USDT';
  const tokenBalance = balances?.find(b => b.symbol === moaToken);
  const balance = parseFloat(tokenBalance?.balance || 0);
  const percentage = moaAmount > 0 ? Math.min((balance / moaAmount) * 100, 100) : 100;
  const isBelowMoa = balance < moaAmount;

  return (
    <div className={`rounded-lg border p-4 mb-6 ${isBelowMoa ? 'bg-danger/10 border-danger/30' : 'bg-success/10 border-success/30'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-content">
          {t('wallet.moa.label')}
        </span>
        <span className={`text-sm font-bold ${isBelowMoa ? 'text-danger' : 'text-success'}`}>
          {balance.toFixed(2)} / {moaAmount.toFixed(2)} {moaToken}
        </span>
      </div>
      <div className="w-full bg-surface-raised rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${isBelowMoa ? 'bg-danger' : 'bg-success'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isBelowMoa && (
        <p className="text-xs text-danger mt-2">
          {t('wallet.moa.warning')}
        </p>
      )}
    </div>
  );
}

function WalletPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('balances');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: wallet, isLoading, error } = useQuery({
    queryKey: ['wallet-info'],
    queryFn: async () => {
      const res = await apiFetch('/wallet/info');
      if (!res.ok) throw new Error('Failed to fetch wallet');
      return res.json();
    },
  });

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet?.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <FullScreenLoader isOpen={true} message={t('wallet.loading')} />;
  if (error) return <div className="p-4 text-danger">{t('wallet.error')}</div>;

  const tabs = [
    { key: 'balances', label: t('wallet.tabs.balances') },
    { key: 'commissions', label: t('wallet.tabs.commissions') },
  ];

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
            {t('wallet.title')}
          </h1>
        </div>

        {/* MOA Indicator */}
        <MoaIndicator balances={wallet?.balances} t={t} />

        {/* Wallet Address */}
        <div className="bg-surface border border-border rounded-lg p-4 mb-6">
          <p className="text-xs text-content-muted mb-1">{t('wallet.addressLabel')}</p>
          <div className="flex items-center gap-3">
            <code className="text-content font-mono text-sm md:text-base">{wallet?.address}</code>
            <button
              onClick={copyAddress}
              className="px-3 py-1 text-xs bg-surface-raised hover:bg-surface-raised/80 border border-border rounded transition-colors text-content-muted"
            >
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowDeposit(true)}
            className="px-6 py-2.5 bg-success/20 text-success font-medium text-sm rounded-lg border border-success/30 hover:bg-success/30 transition-colors"
          >
            {t('wallet.deposit')}
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="px-6 py-2.5 bg-danger/20 text-danger font-medium text-sm rounded-lg border border-danger/30 hover:bg-danger/30 transition-colors"
          >
            {t('wallet.withdraw.button')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'text-accent border-accent'
                  : 'text-content-muted border-transparent hover:text-content'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'balances' && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-raised/30">
                  <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase">{t('wallet.token')}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase">{t('wallet.balance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {wallet?.balances?.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-6 py-8 text-center text-content-muted text-sm">
                      {t('wallet.noTokens')}
                    </td>
                  </tr>
                ) : (
                  wallet?.balances?.map((token, i) => (
                    <tr key={i} className="hover:bg-surface-raised/20">
                      <td className="px-6 py-4 text-sm font-medium text-content">{token.symbol}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-content">
                        {parseFloat(token.balance).toFixed(token.symbol === 'USDT' ? 2 : 6)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'commissions' && <CommissionHistory />}

        <DepositModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} address={wallet?.address} />
        <WithdrawModal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} />
      </div>
    </div>
  );
}

export default WalletPage;
