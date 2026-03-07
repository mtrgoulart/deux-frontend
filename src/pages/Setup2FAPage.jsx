import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Setup2FAPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const setupMutation = useMutation({
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
      setSuccess(true);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const statusQuery = useQuery({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      const response = await apiFetch('/auth/2fa/status');
      if (!response) throw new Error('Failed');
      return response.json();
    },
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="bg-surface border border-border rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-content-primary">
            {t('twoFactor.setupTitle')}
          </h1>
          <p className="text-content-muted text-sm mt-2">
            {t('twoFactor.setupDescription')}
          </p>
        </div>

        {error && (
          <div className="bg-danger-muted border border-danger/30 text-danger p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-content-primary mb-2">
              {t('twoFactor.setupInitiated')}
            </h2>
            <p className="text-content-muted text-sm mb-6">
              {t('twoFactor.setupNextLogin')}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t('twoFactor.done')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {statusQuery.data?.enabled && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm text-center">
                {t('twoFactor.alreadyEnabled')}
              </div>
            )}

            <p className="text-content-secondary text-sm">
              {t('twoFactor.setupInstructions')}
            </p>

            <button
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isPending}
              className="group relative w-full py-3 font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg overflow-hidden
                         shadow-lg shadow-accent/20 hover:shadow-accent/40
                         hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="relative z-10">
                {setupMutation.isPending ? t('twoFactor.settingUp') : t('twoFactor.enableButton')}
              </span>
            </button>

            <button
              onClick={() => navigate(-1)}
              className="w-full py-2 text-content-muted text-sm hover:text-content-secondary transition-colors"
            >
              {t('twoFactor.cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Setup2FAPage;
