import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';

function Verify2FAPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const pendingUsername = sessionStorage.getItem('pending2faUsername');

  const verifyMutation = useMutation({
    mutationFn: async (totp) => {
      const response = await apiFetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: pendingUsername,
          password: sessionStorage.getItem('pending2faPassword'),
          totp,
        }),
      });
      if (!response) throw new Error(t('auth.errors.serverError'));
      const data = await response.json();
      if (data.access_token) return data;
      throw new Error(data.error || t('twoFactor.invalidCode'));
    },
    onSuccess: (data) => {
      sessionStorage.removeItem('pending2faUsername');
      sessionStorage.removeItem('pending2faPassword');
      login(data.access_token, data.refresh_token);
      navigate('/');
    },
    onError: (err) => {
      setError(err.message || t('twoFactor.invalidCode'));
      setCode('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (code.length === 6) {
      verifyMutation.mutate(code);
    }
  };

  if (!pendingUsername) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative">
      <AnimatedBackground />
      <div className="w-full max-w-md mx-auto animate-slide-in-scale">
        <div className="bg-surface/60 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-content-primary">
              {t('twoFactor.verifyTitle')}
            </h1>
            <p className="text-content-muted text-sm mt-2">
              {t('twoFactor.enterCode')}
            </p>
          </div>

          {error && (
            <div className="bg-danger-muted border border-danger/30 text-danger p-3 rounded-lg mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-surface-raised/50 border border-border rounded-lg py-4 px-4 text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-center text-3xl tracking-[0.5em] font-mono"
              autoFocus
              required
            />
            <button
              type="submit"
              disabled={code.length !== 6 || verifyMutation.isPending}
              className="group relative w-full py-3 font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg overflow-hidden
                         shadow-lg shadow-accent/20 hover:shadow-accent/40
                         hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="relative z-10">{t('twoFactor.verify')}</span>
            </button>
          </form>

          <button
            onClick={() => navigate('/login')}
            className="w-full mt-4 text-content-muted text-sm hover:text-content-secondary transition-colors"
          >
            {t('twoFactor.backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Verify2FAPage;
