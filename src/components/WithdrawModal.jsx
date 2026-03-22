import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';

function WithdrawModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [token] = useState('USDT');
  const [error, setError] = useState('');

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          token,
          destination_address: destination,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['wallet-info']);
      setAmount('');
      setDestination('');
      setError('');
      onClose(data.tx_hash);
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError(t('wallet.withdraw.invalidAmount'));
      return;
    }
    if (!destination || !/^0x[0-9a-fA-F]{40}$/.test(destination)) {
      setError(t('wallet.withdraw.invalidAddress'));
      return;
    }

    withdrawMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-surface border border-border rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-content mb-4">
          {t('wallet.withdraw.title')}
        </h2>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger rounded px-3 py-2 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-content-muted mb-1">
              {t('wallet.withdraw.amount')} ({token})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-content focus:border-accent focus:outline-none"
              disabled={withdrawMutation.isPending}
            />
          </div>

          <div>
            <label className="block text-sm text-content-muted mb-1">
              {t('wallet.withdraw.destination')}
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="0x..."
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-content font-mono text-sm focus:border-accent focus:outline-none"
              disabled={withdrawMutation.isPending}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-4 py-2 text-sm bg-surface-raised text-content-muted border border-border rounded hover:bg-surface-raised/80 transition-colors"
              disabled={withdrawMutation.isPending}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-danger/90 text-white font-medium rounded hover:bg-danger transition-colors disabled:opacity-50"
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? t('wallet.withdraw.processing') : t('wallet.withdraw.confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WithdrawModal;
