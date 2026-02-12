import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function IndicatorKeyModal({ isOpen, onClose, indicator, isLoadingKey }) {
  const { t } = useTranslation();
  const [revealKey, setRevealKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen || !indicator) return null;

  const handleCopyKey = async () => {
    if (!indicator.key || copySuccess) return;
    const textToCopy = `key:${indicator.key},side:${indicator.side}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy key: ', err);
      alert(t('indicator.keyModalCopyError'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface border border-border rounded-lg shadow-2xl p-8 max-w-lg w-full">
        <h3 className="text-xl font-bold text-content-primary mb-1">
          {t('indicator.keyModalTitle')}
        </h3>
        <p className="text-sm text-content-muted mb-6">
          {indicator.name} ({indicator.id})
        </p>

        {isLoadingKey ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent"></div>
            <p className="ml-4 text-content-secondary">{t('indicator.keyModalLoadingKey')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                {t('indicator.keyModalMessageToCopy')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type={revealKey ? 'text' : 'password'}
                  readOnly
                  value={`key:${indicator.key || ''},side:${indicator.side}`}
                  className="flex-grow px-3 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm font-mono
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setRevealKey(!revealKey)}
                    className="p-2 hover:bg-surface-raised rounded transition-colors"
                    title={revealKey ? t('indicator.keyModalHide') : t('indicator.keyModalShow')}
                  >
                    <svg className="w-5 h-5 text-content-muted hover:text-content-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {revealKey ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={handleCopyKey}
                    disabled={copySuccess}
                    className="p-2 hover:bg-surface-raised rounded transition-colors"
                    title={copySuccess ? t('indicator.keyModalCopied') : t('indicator.keyModalCopy')}
                  >
                    <svg className={`w-5 h-5 transition-colors ${copySuccess ? 'text-success' : 'text-content-muted hover:text-content-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {copySuccess ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                {t('indicator.keyModalKeyOnly')}
              </label>
              <input
                type={revealKey ? 'text' : 'password'}
                readOnly
                value={indicator.key || ''}
                className="w-full px-3 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm font-mono
                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            disabled={isLoadingKey}
            className="px-5 py-2.5 bg-surface-raised border border-border text-content-secondary rounded text-sm font-medium
                     hover:bg-surface-raised/80 transition-colors disabled:opacity-50"
          >
            {t('indicator.keyModalClose')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default IndicatorKeyModal;
