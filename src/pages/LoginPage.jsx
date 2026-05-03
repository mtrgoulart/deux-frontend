import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { ethers } from 'ethers';
import logoImage from '../assets/logo.png';
import metamaskLogo from '../assets/metamask.svg';
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

  const isLoading = walletMutation.isPending;

  const handleWalletLogin = () => {
    setError('');
    walletMutation.mutate();
  };

  const handle2FASubmit = (e) => {
    e.preventDefault();
    setError('');
    const code = useRecovery ? recoveryCode : totp;
    walletMutation.mutate(code);
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
            <button
              type="button"
              onClick={handleWalletLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 font-bold text-gray-900 bg-white rounded-lg
                         border border-gray-200 shadow-sm
                         hover:bg-gray-50 hover:shadow-md
                         active:scale-[0.98] transition-all duration-200
                         disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>{t('auth.connectWallet')}</span>
              <img src={metamaskLogo} alt="MetaMask" className="w-6 h-6 flex-shrink-0" />
            </button>
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
                    onClick={() => { setShow2FA(false); setTotp(''); setRecoveryCode(''); setUseRecovery(false); setError(''); setPendingWalletData(null); }}
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
