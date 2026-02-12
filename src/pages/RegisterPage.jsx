import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import logoImage from '../assets/logo.png';
import { FullScreenLoader } from '../components/FullScreenLoader';
import AnimatedBackground from '../components/AnimatedBackground';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const registerMutation = useMutation({
    mutationFn: async ({ username, password }) => {
      const response = await apiFetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) return data;
      throw new Error(data.error || t('auth.errors.registrationFailed'));
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    },
    onError: (err) => {
      setError(err.message || t('auth.errors.serverError'));
    },
  });

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    registerMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative">
      <AnimatedBackground />

      <FullScreenLoader
        isOpen={registerMutation.isPending}
        message={t('auth.creatingAccount')}
      />

      <div className="w-full max-w-md mx-auto animate-slide-in-scale">
        <div className="bg-surface/60 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8">
          {success ? (
            <div className="flex flex-col items-center py-8 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-content-primary mb-2">
                {t('auth.registrationSuccess')}
              </h2>
              <p className="text-content-muted text-sm">
                {t('auth.redirecting')}
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
                  {t('auth.createAccount')}
                </h1>
                <p className="text-content-muted text-sm mt-2">{t('auth.joinPlatform')}</p>
              </div>

              {error && (
                <div className="bg-danger-muted border border-danger/30 text-danger p-3 rounded-lg mb-6 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-2 tracking-wide">
                    {t('auth.username')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('auth.usernamePlaceholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-surface-raised/50 border border-border rounded-lg py-3 px-4 text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-2 tracking-wide">
                    {t('auth.password')}
                  </label>
                  <input
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-raised/50 border border-border rounded-lg py-3 px-4 text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-2 tracking-wide">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full bg-surface-raised/50 border border-border rounded-lg py-3 px-4 text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="group relative w-full py-3 font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg overflow-hidden
                             shadow-lg shadow-accent/20 hover:shadow-accent/40
                             hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span className="relative z-10">{t('auth.registerButton')}</span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </button>
              </form>

              <p className="text-center text-content-muted text-sm mt-6">
                {t('auth.haveAccount')}{' '}
                <Link
                  to="/login"
                  className="text-content-accent hover:text-accent font-medium transition-colors"
                >
                  {t('auth.loginLink')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
