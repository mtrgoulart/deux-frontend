import { useTranslation } from 'react-i18next';

export function ResumeFromPanicModal({ isOpen, onClose, onResumeWithRestart, onResumeWithoutRestart, panicState }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const stoppedInstances = panicState?.instances_stopped || [];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="relative w-full max-w-lg">
        <div className="bg-surface border border-border rounded-lg shadow-2xl p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-success-muted border border-success/50 rounded-full p-4">
              <svg className="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-success text-center tracking-wider uppercase mb-4">
            {t('instance.resumeModalTitle')}
          </h3>

          {stoppedInstances.length > 0 ? (
            <>
              <p className="text-content-primary text-sm mb-3">
                {t('instance.resumeModalListTitle', { count: stoppedInstances.length })}
              </p>
              <div className="bg-surface-raised/50 border border-border-subtle rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
                {stoppedInstances.map((instance) => (
                  <div key={instance.id} className="text-success text-sm py-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-success rounded-full flex-shrink-0"></span>
                    {instance.name} ({instance.symbol})
                  </div>
                ))}
              </div>
              <p className="text-content-secondary text-sm mb-6">
                {t('instance.resumeModalChooseOption')}
              </p>
            </>
          ) : (
            <p className="text-content-primary text-sm mb-6 text-center">
              {t('instance.resumeModalNoInstances')}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={onResumeWithRestart}
              className="w-full px-6 py-3 bg-success hover:bg-success/80 text-white rounded text-sm uppercase tracking-wider font-bold
                       border border-success/50 transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-success/50"
            >
              {t('instance.resumeModalWithRestart')}
            </button>
            <button
              onClick={onResumeWithoutRestart}
              className="w-full px-6 py-3 bg-warning-muted border border-warning/50 text-warning rounded text-sm uppercase tracking-wider
                       hover:bg-warning-muted/80 transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-warning/20"
            >
              {t('instance.resumeModalWithoutRestart')}
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-surface-raised border border-border text-content-secondary rounded text-sm uppercase tracking-wider
                       hover:bg-surface-raised/80 hover:text-content-primary transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {t('instance.resumeModalCancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
