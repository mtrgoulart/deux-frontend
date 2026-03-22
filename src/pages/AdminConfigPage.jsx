import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { FullScreenLoader } from '../components/FullScreenLoader';
import TradingBarsLoader from '../components/TradingBarsLoader';

const CONFIG_LABELS = {
  commission_rate: { label: 'adminConfig.commissionRate', type: 'number', step: '0.01' },
  moa_amount: { label: 'adminConfig.moaAmount', type: 'number', step: '1' },
  moa_token: { label: 'adminConfig.moaToken', type: 'text' },
  commission_token: { label: 'adminConfig.commissionToken', type: 'text' },
  commission_token_address: { label: 'adminConfig.commissionTokenAddress', type: 'text' },
  master_wallet_address: { label: 'adminConfig.masterWalletAddress', type: 'text' },
};

function AdminConfigPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');

  const { data: configData, isLoading } = useQuery({
    queryKey: ['admin-config'],
    queryFn: async () => {
      const res = await apiFetch('/admin/config');
      const data = await res.json();
      return data.config || {};
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const res = await apiFetch(`/admin/config/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-config']);
      setEditingKey(null);
      setEditValue('');
      setError('');
    },
    onError: (err) => setError(err.message),
  });

  const startEdit = (key, currentValue) => {
    setEditingKey(key);
    setEditValue(currentValue);
    setError('');
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
    setError('');
  };

  const saveEdit = () => {
    updateMutation.mutate({ key: editingKey, value: editValue });
  };

  if (isLoading) {
    return <TradingBarsLoader title={t('adminConfig.loading')} subtitle="" />;
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <FullScreenLoader isOpen={updateMutation.isPending} message={t('adminConfig.saving')} />

      <div className="container mx-auto px-4 md:px-6 py-6">
        <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
            {t('adminConfig.title')}
          </h1>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-raised/30">
                <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">
                  {t('adminConfig.key')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">
                  {t('adminConfig.value')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">
                  {t('adminConfig.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {Object.entries(configData || {}).map(([key, value]) => {
                const meta = CONFIG_LABELS[key] || { label: key, type: 'text' };
                const isEditing = editingKey === key;

                return (
                  <tr key={key} className="hover:bg-surface-raised/20">
                    <td className="px-6 py-4 text-sm text-content-accent font-medium">
                      {t(meta.label, key)}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type={meta.type}
                          step={meta.step}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="bg-surface-raised border border-border rounded px-3 py-1.5 text-sm text-content w-full max-w-xs focus:border-accent focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm text-content font-mono">{value}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={saveEdit}
                            className="px-3 py-1.5 text-xs font-medium bg-success/20 text-success border border-success/30 rounded hover:bg-success/30 transition-colors"
                          >
                            {t('common.save')}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 text-xs font-medium bg-surface-raised text-content-muted border border-border rounded hover:bg-surface-raised/80 transition-colors"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(key, value)}
                          className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent border border-accent/30 rounded hover:bg-accent/30 transition-colors"
                        >
                          {t('common.edit')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminConfigPage;
