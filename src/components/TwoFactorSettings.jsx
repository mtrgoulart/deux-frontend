import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';

function TwoFactorSettings() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      const response = await apiFetch('/auth/2fa/status');
      if (!response) throw new Error('Failed');
      return response.json();
    },
  });

  const enableMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch('/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response) throw new Error(t('auth.errors.serverError'));
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setSuccess(t('twoFactor.enableSuccess'));
      setError('');
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
    },
    onError: (err) => {
      setError(err.message);
      setSuccess('');
    },
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch('/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response) throw new Error(t('auth.errors.serverError'));
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setSuccess(t('twoFactor.disableSuccess'));
      setError('');
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
    },
    onError: (err) => {
      setError(err.message);
      setSuccess('');
    },
  });

  const isEnabled = statusQuery.data?.enabled;
  const isLoading = enableMutation.isPending || disableMutation.isPending;

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-lg font-bold text-content-primary">
          {t('twoFactor.settingsTitle')}
        </h3>
      </div>

      <p className="text-content-muted text-sm mb-4">
        {t('twoFactor.settingsDescription')}
      </p>

      {error && (
        <div className="bg-danger-muted border border-danger/30 text-danger p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      <div className="flex items-center justify-between p-4 bg-surface-raised/50 rounded-lg">
        <div>
          <p className="text-content-primary font-medium">
            {t('twoFactor.totpLabel')}
          </p>
          <p className="text-content-muted text-xs mt-1">
            {isEnabled ? t('twoFactor.statusEnabled') : t('twoFactor.statusDisabled')}
          </p>
        </div>
        <div>
          {statusQuery.isLoading ? (
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          ) : isEnabled ? (
            <button
              onClick={() => {
                if (window.confirm(t('twoFactor.confirmDisable'))) {
                  disableMutation.mutate();
                }
              }}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-danger bg-danger/10 border border-danger/30 rounded-lg hover:bg-danger/20 transition-all disabled:opacity-50"
            >
              {t('twoFactor.disableButton')}
            </button>
          ) : (
            <button
              onClick={() => enableMutation.mutate()}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {t('twoFactor.enableButton')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TwoFactorSettings;
