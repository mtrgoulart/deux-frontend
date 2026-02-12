import React from 'react';
import { useTranslation } from 'react-i18next';

export function ConfirmDeleteApiKeyModal({ isOpen, onClose, onConfirm, apiKey, isPending, error }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="relative w-full max-w-md">
        <div className="bg-surface border border-border rounded-lg shadow-2xl p-8">
          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <div className={`${error ? 'bg-danger-muted border-danger/50' : 'bg-danger-muted border-danger/50'} border rounded-full p-4`}>
              <svg className="w-12 h-12 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {!error ? (
            <>
              {/* Normal confirmation state */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-content-primary tracking-wider uppercase mb-4">
                  {t('apiKeys.deleteModalTitle')}
                </h3>
                <p className="text-content-secondary text-sm mb-4">
                  {t('apiKeys.deleteModalMessage')}
                </p>

                {/* API Key Info */}
                <div className="bg-surface-raised/50 border border-border-subtle rounded-lg p-4 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-content-muted uppercase tracking-wider">{t('apiKeys.name')}</span>
                    <span className="text-content-primary font-bold" title={apiKey?.name}>
                      {apiKey?.name || t('apiKeys.untitled')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-content-muted uppercase tracking-wider">{t('apiKeys.id')}</span>
                    <span className="text-content-secondary font-mono">
                      {apiKey?.api_key_id || '--'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-warning mt-4">
                  {t('apiKeys.deleteModalCannotUndo')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-surface-raised border border-border text-content-secondary rounded text-sm uppercase tracking-wider
                           hover:bg-surface-raised/80 hover:text-content-primary transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {t('apiKeys.deleteModalCancel')}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isPending}
                  className="flex-1 px-6 py-3 bg-danger hover:bg-danger/80 text-white rounded text-sm uppercase tracking-wider font-bold
                           border border-danger/50 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-danger/50 focus:ring-offset-2 focus:ring-offset-surface
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? t('apiKeys.deleteModalDeleting') : t('apiKeys.deleteModalConfirm')}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Error state */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-danger tracking-wider uppercase mb-4">
                  {t('apiKeys.deletionFailed')}
                </h3>
                <p className="text-content-secondary text-sm">
                  {error}
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-surface-raised border border-border text-content-secondary rounded text-sm uppercase tracking-wider
                           hover:bg-surface-raised/80 hover:text-content-primary transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {t('apiKeys.close')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
