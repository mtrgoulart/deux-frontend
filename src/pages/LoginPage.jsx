import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { ethers } from 'ethers';
import logoImage from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { FullScreenLoader } from '../components/FullScreenLoader';
import AnimatedBackground from '../components/AnimatedBackground';

function LoginPage() {
  const [totp, setTotp] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');
  const [pendingWalletData, setPendingWalletData] = useState(null);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pendingPasswordCredentials, setPendingPasswordCredentials] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const walletMutation = useMutation({
    mutationFn: async (totpCode) => {
      let walletData = pendingWalletData;

      // If no pending data, initiate fresh wallet connection
      if (!walletData) {
        if (typeof window.ethereum === 'undefined') {
          throw { code: 'NO_METAMASK' };
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const walletAddress = await signer.getAddress();
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        const nonceResponse = await apiFetch(`/auth/wallet-nonce?wallet_address=${walletAddress}`);
        if (nonceResponse.status === 429) {
          throw new Error(t('auth.errors.tooManyRequests'));
        }
        if (!nonceResponse.ok) {
          const errData = await nonceResponse.json().catch(() => ({}));
          throw new Error(errData.error || t('auth.errors.walletLoginFailed'));
        }
        const { nonce } = await nonceResponse.json();

        const domain = window.location.host;
        const origin = window.location.origin;
        const issuedAt = new Date().toISOString();
        const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        const siweMessage = [
          `${domain} wants you to sign in with your Ethereum account:`,
          walletAddress,
          '',
          'Sign in to TradeX',
          '',
          `URI: ${origin}`,
          'Version: 1',
          `Chain ID: ${chainId}`,
          `Nonce: ${nonce}`,
          `Issued At: ${issuedAt}`,
          `Expiration Time: ${expirationTime}`,
        ].join('\n');

        const signature = await signer.signMessage(siweMessage);

        walletData = { wallet_address: walletAddress, signature, message: siweMessage };
      }

      const body = { ...walletData };
      if (totpCode) body.totp = totpCode;

      const response = await apiFetch('/auth/wallet-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        throw new Error(t('auth.errors.tooManyRequests'));
      }

      const data = await response.json();

      if (data.requires_2fa) {
        return { requires_2fa: true, walletData };
      }

      if (response.ok && data.access_token) {
        return { access_token: data.access_token, refresh_token: data.refresh_token };
      }

      throw new Error(data.error || t('auth.errors.walletLoginFailed'));
    },
    onSuccess: (result) => {
      if (result.requires_2fa) {
        setPendingWalletData(result.walletData);
        setShow2FA(true);
        return;
      }
      login(result.access_token, result.refresh_token);
      navigate('/');
    },
    onError: (err) => {
      if (err.code === 'NO_METAMASK') {
        setError(t('auth.errors.metamaskNotInstalled'));
      } else if (err.code === 4001 || err.code === 'ACTION_REJECTED' || err.info?.error?.code === 4001) {
        setError(t('auth.errors.walletRejected'));
      } else {
        setError(err.message || t('auth.errors.walletLoginFailed'));
      }
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (totpCode) => {
      const creds = pendingPasswordCredentials || { username, password };
      const body = { username: creds.username, password: creds.password };
      if (totpCode) body.totp = totpCode;

      const response = await apiFetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        throw new Error(t('auth.errors.tooManyRequests'));
      }

      const data = await response.json();

      if (data.requires_2fa) {
        return { requires_2fa: true, credentials: creds };
      }

      if (response.ok && data.access_token) {
        return { access_token: data.access_token, refresh_token: data.refresh_token };
      }

      throw new Error(data.error || t('auth.errors.invalidCredentials'));
    },
    onSuccess: (result) => {
      if (result.requires_2fa) {
        setPendingPasswordCredentials(result.credentials);
        setShow2FA(true);
        return;
      }
      login(result.access_token, result.refresh_token);
      navigate('/');
    },
    onError: (err) => {
      setError(err.message || t('auth.errors.invalidCredentials'));
    },
  });

  const isLoading = walletMutation.isPending || passwordMutation.isPending;

  const handleWalletLogin = () => {
    setError('');
    walletMutation.mutate();
  };

  const handlePasswordLogin = (e) => {
    e.preventDefault();
    setError('');
    passwordMutation.mutate();
  };

  const handle2FASubmit = (e) => {
    e.preventDefault();
    setError('');
    const code = useRecovery ? recoveryCode : totp;
    if (pendingPasswordCredentials) {
      passwordMutation.mutate(code);
    } else {
      walletMutation.mutate(code);
    }
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

          {!show2FA ? (
            <>
              {!showPasswordLogin ? (
                <>
                  <button
                    type="button"
                    onClick={handleWalletLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg overflow-hidden
                               shadow-lg shadow-accent/20 hover:shadow-accent/40
                               hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
                               disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.9 6 10 6.9 10 8V16C10 17.1 10.9 18 12 18H21ZM12 16H22V8H12V16ZM15 15C15.6 15 16 14.6 16 14C16 13.4 15.6 13 15 13C14.4 13 14 13.4 14 14C14 14.6 14.4 15 15 15Z"/>
                    </svg>
                    {t('auth.connectWallet')}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowPasswordLogin(true); setError(''); }}
                    className="w-full mt-4 py-2 text-sm text-content-muted hover:text-content-secondary transition-colors"
                  >
                    {t('auth.passwordLoginToggle')}
                  </button>
                </>
              ) : (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-content-secondary text-sm mb-1">{t('auth.username')}</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('auth.usernamePlaceholder')}
                      className="w-full bg-surface-raised/50 border border-border rounded-lg py-3 px-4 text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      autoFocus
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-content-secondary text-sm mb-1">{t('auth.password')}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.passwordPlaceholder')}
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
                  <button
                    type="button"
                    onClick={() => { setShowPasswordLogin(false); setError(''); setUsername(''); setPassword(''); }}
                    className="w-full py-2 text-sm text-content-muted hover:text-content-secondary transition-colors"
                  >
                    {t('auth.backToWalletLogin')}
                  </button>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={handle2FASubmit} className="space-y-5">
              <div>
                <p className="text-content-secondary text-sm mb-3 text-center">
                  {useRecovery ? t('twoFactor.recoveryCodePlaceholder') : t('twoFactor.enterCode')}
                </p>
                {useRecovery ? (
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="XXXXXXXX"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                    className="w-full bg-surface-raised/50 border border-border rounded-lg py-3 px-4 text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-center text-2xl tracking-[0.3em] font-mono"
                    autoFocus
                    required
                  />
                ) : (
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder={t('twoFactor.codePlaceholder')}
                    value={totp}
                    onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-surface-raised/50 border border-border rounded-lg py-3 px-4 text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus
                    required
                  />
                )}
                <div className="flex justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => { setShow2FA(false); setTotp(''); setRecoveryCode(''); setUseRecovery(false); setError(''); setPendingWalletData(null); setPendingPasswordCredentials(null); }}
                    className="text-content-muted text-xs hover:text-content-secondary transition-colors"
                  >
                    {t('twoFactor.backToLogin')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUseRecovery(!useRecovery); setError(''); }}
                    className="text-content-muted text-xs hover:text-content-secondary transition-colors"
                  >
                    {useRecovery ? t('twoFactor.enterCode') : t('twoFactor.useRecoveryCode')}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full py-3 font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg overflow-hidden
                           shadow-lg shadow-accent/20 hover:shadow-accent/40
                           hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
              >
                <span className="relative z-10">
                  {t('twoFactor.verify')}
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
