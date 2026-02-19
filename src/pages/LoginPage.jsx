import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { ethers } from 'ethers';
import logoImage from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { FullScreenLoader } from '../components/FullScreenLoader';
import AnimatedBackground from '../components/AnimatedBackground';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }) => {
      const response = await apiFetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.token) return data.token;
        throw new Error(t('auth.errors.noToken'));
      }
      const errorData = await response.json().catch(() => ({ error: t('auth.errors.invalidCredentials') }));
      throw new Error(errorData.error);
    },
    onSuccess: (token) => {
      login(token);
      navigate('/');
    },
    onError: (err) => {
      setError(err.message || t('auth.errors.invalidCredentials'));
    },
  });

  const walletMutation = useMutation({
    mutationFn: async () => {
      if (typeof window.ethereum === 'undefined') {
        throw { code: 'NO_METAMASK' };
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      const message = `Please sign this message to log in. Nonce: ${Date.now()}`;
      const signature = await signer.signMessage(message);

      const response = await apiFetch('/auth/wallet-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress, signature, message }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.access_token) return data.access_token;
        throw new Error(t('auth.errors.noToken'));
      }
      const errorData = await response.json().catch(() => ({ error: t('auth.errors.unknownError') }));
      throw new Error(errorData.error || t('auth.errors.walletLoginFailed'));
    },
    onSuccess: (token) => {
      login(token);
      navigate('/');
    },
    onError: (err) => {
      if (err.code === 'NO_METAMASK') {
        setError(t('auth.errors.metamaskNotInstalled'));
      } else if (err.code === 4001) {
        setError(t('auth.errors.walletRejected'));
      } else {
        setError(err.message || t('auth.errors.walletLoginFailed'));
      }
    },
  });

  const isLoading = loginMutation.isPending || walletMutation.isPending;

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ username, password });
  };

  const handleWalletLogin = () => {
    setError('');
    walletMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative">
      <AnimatedBackground />

      <FullScreenLoader
        isOpen={isLoading}
        message={t('auth.authenticating')}
      />

      <div className="w-full max-w-md mx-auto animate-slide-in-scale">
        <div className="bg-surface/60 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8">
          <img
            src={logoImage}
            alt={t('auth.logoAlt')}
            className="w-[15.6rem] h-auto mx-auto mb-8"
          />

          {error && (
            <div className="bg-danger-muted border border-danger/30 text-danger p-3 rounded-lg mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
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
              <input
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-raised/50 border border-border rounded-lg py-3 px-4 text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full py-3 font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg overflow-hidden
                         shadow-lg shadow-accent/20 hover:shadow-accent/40
                         hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="relative z-10">{t('auth.loginButton')}</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </button>
          </form>

          <div className="flex items-center my-6">
            <hr className="flex-grow border-border" />
            <span className="mx-4 text-content-muted text-sm">{t('auth.or')}</span>
            <hr className="flex-grow border-border" />
          </div>

          <button
            type="button"
            onClick={handleWalletLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 font-bold text-content-secondary bg-surface-raised/50 border-2 border-border rounded-lg
                       hover:border-accent hover:text-content-primary hover:shadow-lg hover:shadow-accent/20
                       hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
                       disabled:opacity-50 disabled:pointer-events-none"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.9 6 10 6.9 10 8V16C10 17.1 10.9 18 12 18H21ZM12 16H22V8H12V16ZM15 15C15.6 15 16 14.6 16 14C16 13.4 15.6 13 15 13C14.4 13 14 13.4 14 14C14 14.6 14.4 15 15 15Z"/>
            </svg>
            {t('auth.walletLogin')}
          </button>

          <p className="text-center text-content-muted text-sm mt-6">
            {t('auth.noAccount')}{' '}
            <Link
              to="/register"
              className="text-content-accent hover:text-accent font-medium transition-colors"
            >
              {t('auth.registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
