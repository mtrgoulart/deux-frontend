import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Setup2FAPage() {
  const [step, setStep] = useState('check'); // check, setup, verify, recovery, done
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [savedConfirmation, setSavedConfirmation] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableUseRecovery, setDisableUseRecovery] = useState(false);
  const [error, setError] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const statusQuery = useQuery({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      const response = await apiFetch('/auth/2fa/status');
      if (!response) throw new Error('Failed');
      return response.json();
    },
    onSuccess: (data) => {
      setStep(data.enabled ? 'check' : 'check');
    },
  });

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
    onSuccess: (data) => {
      setQrCode(data.qr_code_base64);
      setSecret(data.secret);
      setStep('setup');
      setError('');
    },
    onError: (err) => setError(err.message),
  });

  const verifyMutation = useMutation({
    mutationFn: async (code) => {
      const response = await apiFetch('/auth/2fa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!response) throw new Error(t('auth.errors.serverError'));
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setRecoveryCodes(data.recovery_codes);
      setStep('recovery');
      setError('');
    },
    onError: (err) => setError(err.message),
  });

  const disableMutation = useMutation({
    mutationFn: async (code) => {
      const response = await apiFetch('/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!response) throw new Error(t('auth.errors.serverError'));
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      statusQuery.refetch();
      setDisableCode('');
      setError('');
    },
    onError: (err) => setError(err.message),
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleCopyAll = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
  };

  const handleDownload = () => {
    const content = `Deux Recovery Codes\n${'='.repeat(30)}\n\n${recoveryCodes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deux-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const isEnabled = statusQuery.data?.enabled;

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

        {/* Status check — 2FA already enabled */}
        {step === 'check' && isEnabled && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm text-center">
              {t('twoFactor.alreadyEnabled')}
            </div>

            <p className="text-content-muted text-xs text-center">
              {t('twoFactor.disableConfirm')}
            </p>

            <div className="space-y-3">
              {disableUseRecovery ? (
                <input
                  type="text"
                  maxLength={8}
                  placeholder="XXXXXXXX"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  className="w-full bg-surface-raised/50 border border-border rounded-lg py-3 px-4 text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-center text-xl tracking-[0.3em] font-mono"
                />
              ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder={t('twoFactor.codePlaceholder')}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-surface-raised/50 border border-border rounded-lg py-3 px-4 text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-center text-xl tracking-[0.3em] font-mono"
                />
              )}

              <button
                onClick={() => { setError(''); disableMutation.mutate(disableCode); }}
                disabled={(disableUseRecovery ? disableCode.length !== 8 : disableCode.length !== 6) || disableMutation.isPending}
                className="w-full py-3 font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {disableMutation.isPending ? t('twoFactor.settingUp') : t('twoFactor.disableButton')}
              </button>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => navigate(-1)}
                className="text-content-muted text-xs hover:text-content-secondary transition-colors"
              >
                {t('twoFactor.cancel')}
              </button>
              <button
                onClick={() => { setDisableUseRecovery(!disableUseRecovery); setDisableCode(''); setError(''); }}
                className="text-content-muted text-xs hover:text-content-secondary transition-colors"
              >
                {disableUseRecovery ? t('twoFactor.useAuthenticatorCode') : t('twoFactor.lostDevice')}
              </button>
            </div>
          </div>
        )}

        {/* Status check — 2FA not enabled */}
        {step === 'check' && !isEnabled && (
          <div className="space-y-4">
            <p className="text-content-secondary text-sm">
              {t('twoFactor.setupInstructions')}
            </p>
            <button
              onClick={() => { setError(''); setupMutation.mutate(); }}
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

        {/* Setup step — show QR code */}
        {step === 'setup' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-content-secondary text-sm mb-4">
                {t('twoFactor.scanQRCode')}
              </p>
              <div className="bg-white rounded-xl p-4 inline-block mx-auto">
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="TOTP QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div>
              <p className="text-content-muted text-xs mb-2">{t('twoFactor.manualEntry')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-surface-raised/50 border border-border rounded-lg py-2 px-3 text-content-primary text-sm font-mono break-all select-all">
                  {secret}
                </code>
                <button
                  onClick={handleCopySecret}
                  className="px-3 py-2 text-xs font-medium text-content-secondary bg-surface-raised/50 border border-border rounded-lg hover:text-content-primary transition-colors"
                >
                  {secretCopied ? t('twoFactor.copied') : t('twoFactor.copyAll')}
                </button>
              </div>
            </div>

            <div>
              <p className="text-content-secondary text-sm mb-2">{t('twoFactor.verifySetupCode')}</p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder={t('twoFactor.codePlaceholder')}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-surface-raised/50 border border-border rounded-lg py-3 px-4 text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />
            </div>

            <button
              onClick={() => { setError(''); verifyMutation.mutate(verifyCode); }}
              disabled={verifyCode.length !== 6 || verifyMutation.isPending}
              className="w-full py-3 font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg
                         hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {verifyMutation.isPending ? t('twoFactor.settingUp') : t('twoFactor.verify')}
            </button>

            <button
              onClick={() => { setStep('check'); setError(''); }}
              className="w-full py-2 text-content-muted text-sm hover:text-content-secondary transition-colors"
            >
              {t('twoFactor.cancel')}
            </button>
          </div>
        )}

        {/* Recovery codes step */}
        {step === 'recovery' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-content-primary mb-2">
                {t('twoFactor.recoveryCodes')}
              </h2>
              <p className="text-content-muted text-sm">
                {t('twoFactor.recoveryCodesWarning')}
              </p>
            </div>

            <div className="bg-surface-raised/50 border border-border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, i) => (
                  <code key={i} className="text-content-primary text-sm font-mono text-center py-1">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyAll}
                className="flex-1 py-2 text-sm font-medium text-content-secondary bg-surface-raised/50 border border-border rounded-lg hover:text-content-primary transition-colors"
              >
                {t('twoFactor.copyAll')}
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 py-2 text-sm font-medium text-content-secondary bg-surface-raised/50 border border-border rounded-lg hover:text-content-primary transition-colors"
              >
                {t('twoFactor.download')}
              </button>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={savedConfirmation}
                onChange={(e) => setSavedConfirmation(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              <span className="text-content-secondary text-sm">
                {t('twoFactor.savedConfirmation')}
              </span>
            </label>

            <button
              onClick={() => { setStep('done'); statusQuery.refetch(); }}
              disabled={!savedConfirmation}
              className="w-full py-3 font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg
                         hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {t('twoFactor.done')}
            </button>
          </div>
        )}

        {/* Done step */}
        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-content-primary">
              {t('twoFactor.enableSuccess')}
            </h2>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t('twoFactor.done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Setup2FAPage;
