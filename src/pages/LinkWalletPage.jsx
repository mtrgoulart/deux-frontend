import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { ethers } from 'ethers';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';

function LinkWalletPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, login, updateUser } = useAuth();
  const refreshToken = localStorage.getItem('refreshToken');

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (typeof window.ethereum === 'undefined') {
        throw { code: 'NO_METAMASK' };
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Get nonce
      const nonceResponse = await apiFetch(`/auth/wallet-nonce?wallet_address=${walletAddress}`);
      if (nonceResponse.status === 429) {
        throw new Error(t('auth.errors.tooManyRequests'));
      }
      if (!nonceResponse.ok) {
        const errData = await nonceResponse.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get nonce');
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
        'Link wallet to TradeX account',
        '',
        `URI: ${origin}`,
        'Version: 1',
        `Chain ID: ${chainId}`,
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
        `Expiration Time: ${expirationTime}`,
      ].join('\n');

      const signature = await signer.signMessage(siweMessage);

      const response = await apiFetch('/auth/link-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature,
          message: siweMessage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to link wallet');
      }
      return { ...data, walletAddress };
    },
    onSuccess: async (result) => {
      setSuccess(true);
      // Update user context immediately so ProtectedRoute stops redirecting
      updateUser({ walletAddress: result.walletAddress });
      // Also refresh tokens so the new JWT includes wallet_address from Keycloak
      try {
        const res = await apiFetch('/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (res.ok) {
          const data = await res.json();
          login(data.access_token, data.refresh_token);
        }
      } catch {
        // Token refresh failed — walletAddress is already set in context
      }
      setTimeout(() => navigate('/'), 2000);
    },
    onError: (err) => {
      if (err.code === 'NO_METAMASK') {
        setError(t('auth.errors.metamaskNotInstalled'));
      } else if (err.code === 4001 || err.code === 'ACTION_REJECTED' || err.info?.error?.code === 4001) {
        setError(t('auth.errors.walletRejected'));
      } else {
        setError(err.message || 'Failed to link wallet');
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative">
      <AnimatedBackground />

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
                Wallet Linked Successfully!
              </h2>
              <p className="text-content-muted text-sm">
                Redirecting...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-warning" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.9 6 10 6.9 10 8V16C10 17.1 10.9 18 12 18H21ZM12 16H22V8H12V16ZM15 15C15.6 15 16 14.6 16 14C16 13.4 15.6 13 15 13C14.4 13 14 13.4 14 14C14 14.6 14.4 15 15 15Z"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-content-primary mb-2">
                  {t('auth.linkWallet')}
                </h1>
                <p className="text-content-muted text-sm">
                  {t('auth.linkWalletDescription')}
                </p>
              </div>

              {error && (
                <div className="bg-danger-muted border border-danger/30 text-danger p-3 rounded-lg mb-6 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => { setError(''); linkMutation.mutate(); }}
                disabled={linkMutation.isPending}
                className="w-full flex items-center justify-center gap-3 py-3 font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg overflow-hidden
                           shadow-lg shadow-accent/20 hover:shadow-accent/40
                           hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
                           disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.9 6 10 6.9 10 8V16C10 17.1 10.9 18 12 18H21ZM12 16H22V8H12V16ZM15 15C15.6 15 16 14.6 16 14C16 13.4 15.6 13 15 13C14.4 13 14 13.4 14 14C14 14.6 14.4 15 15 15Z"/>
                </svg>
                {linkMutation.isPending ? t('auth.walletConnecting') : t('auth.connectWallet')}
              </button>

              {!user?.walletAddress && (
                <p className="mt-4 text-center text-content-muted text-xs">
                  {t('auth.walletRequired')}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LinkWalletPage;
