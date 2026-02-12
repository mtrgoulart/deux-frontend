import { useTranslation } from 'react-i18next';

function UnsubscribeModal({ copyItem, onClose, onConfirm, isLoading }) {
  const { t } = useTranslation();

  if (!copyItem) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-4">
          <h3 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent uppercase tracking-wider">
            {t('copyExplore.confirmExit')}
          </h3>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning-muted border-2 border-warning/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-content-secondary mb-3 text-sm">
              {t('copyExplore.exitConfirmMessage')}
            </p>
            <div className="bg-surface-primary border border-border rounded-lg p-4 mb-2">
              <p className="text-content-accent font-bold truncate" title={copyItem.name}>
                {copyItem.name}
              </p>
            </div>
            <p className="text-xs text-content-muted uppercase tracking-wider">
              {t('copyExplore.warningCannotUndo')}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-surface-raised/30 border-t border-border-subtle px-6 py-4 flex justify-center gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 bg-surface-raised border border-border text-content-secondary rounded-lg text-sm uppercase tracking-wider
                     hover:text-content-primary transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {t('copyExplore.cancelButton')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2.5 bg-danger hover:bg-danger/80 text-white rounded-lg text-sm uppercase tracking-wider font-bold
                     transition-colors
                     disabled:opacity-50 disabled:cursor-wait
                     focus:outline-none focus:ring-2 focus:ring-danger/20"
          >
            {isLoading ? t('copyExplore.exiting') : t('copyExplore.confirmExitButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnsubscribeModal;
