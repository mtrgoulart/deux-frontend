import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import DepositModal from '../components/DepositModal';
import { FullScreenLoader } from '../components/FullScreenLoader';

function WalletPage() {
  const [showDeposit, setShowDeposit] = useState(false);
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

  if (isLoading) return <FullScreenLoader isOpen={true} message="Loading wallet..." />;
  if (error) return <div className="p-4 text-red-500">Error loading wallet</div>;

  return (
    <div className="p-6 text-slate-200">
      <h1 className="text-3xl font-bold text-white mb-6"
          style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}>
        Platform Wallet
      </h1>

      {/* Wallet Address */}
      <div className="bg-black/50 rounded-lg border border-gray-800 p-4 mb-6">
        <p className="text-gray-400 text-sm mb-1">Wallet Address (Polygon)</p>
        <div className="flex items-center gap-3">
          <code className="text-white font-mono text-lg">{wallet?.address}</code>
          <button
            onClick={copyAddress}
            className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Deposit Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowDeposit(true)}
          className="px-8 py-4 bg-red-500/90 hover:bg-red-500 text-white font-semibold
                     rounded-lg border border-red-500/50 transition-all duration-300"
        >
          Deposit
        </button>
      </div>

      {/* Token Balances */}
      <div className="bg-black/50 rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Token Balances</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr className="text-left text-gray-400 text-sm">
              <th className="p-4">Token</th>
              <th className="p-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {wallet?.balances?.length === 0 ? (
              <tr>
                <td colSpan="2" className="p-8 text-center text-gray-500">
                  No tokens found. Deposit tokens to get started.
                </td>
              </tr>
            ) : (
              wallet?.balances?.map((token, i) => (
                <tr key={i} className="border-t border-gray-800/50 hover:bg-gray-900/30">
                  <td className="p-4 font-medium">{token.symbol}</td>
                  <td className="p-4 text-right font-mono">
                    {parseFloat(token.balance).toFixed(token.symbol === 'USDT' ? 2 : 6)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DepositModal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        address={wallet?.address}
      />
    </div>
  );
}

export default WalletPage;
