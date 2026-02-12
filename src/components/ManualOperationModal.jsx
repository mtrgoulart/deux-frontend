import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function ManualOperationModal({ isOpen, onClose, onConfirm, operation, isSubmitting }) {
  const { t } = useTranslation();
  const [operationPercent, setOperationPercent] = useState('100');

  // Reset percent when modal opens
  useEffect(() => {
    if (isOpen) setOperationPercent('100');
  }, [isOpen]);

  if (!isOpen || !operation) return null;

  const isBuy = operation.side === 'buy';
  const sideLabel = isBuy ? t('instance.buy') : t('instance.sell');

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="relative w-full max-w-md">
        <div className="bg-surface border border-border rounded-lg shadow-2xl p-8">
          <h3 className={`text-2xl font-bold mb-4 tracking-wider uppercase ${isBuy ? 'text-success' : 'text-danger'}`}>
            {t('instance.operationModalTitle', { side: sideLabel })}
          </h3>

          <div className="mb-4 space-y-1">
            <p className="text-sm text-content-secondary">
              {t('instance.operationModalInstance')}: <span className="font-bold text-content-primary">{operation.instance.name}</span>
            </p>
            <p className="text-sm text-content-secondary">
              {t('instance.operationModalSymbol')}: <span className="font-bold text-content-primary">{operation.instance.symbol}</span>
            </p>
          </div>

          <label htmlFor="operationPercent" className="block mb-2 text-xs font-semibold text-content-accent uppercase tracking-wider">
            {t('instance.operationModalPercent')}
          </label>
          <div className="relative">
            <input
              type="number"
              id="operationPercent"
              value={operationPercent}
              onChange={(e) => setOperationPercent(e.target.value)}
              className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                       focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder={t('instance.operationModalPlaceholder')}
              min="1"
              max="100"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-content-muted">%</span>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-surface-raised border border-border text-content-secondary rounded text-sm uppercase tracking-wider
                       hover:bg-surface-raised/80 hover:text-content-primary transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {t('instance.operationModalCancel')}
            </button>
            <button
              onClick={() => onConfirm(operationPercent)}
              disabled={isSubmitting}
              className={`px-6 py-3 text-white rounded text-sm uppercase tracking-wider font-bold
                       border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface
                       ${isBuy
                         ? 'bg-success hover:bg-success/80 border-success/50 focus:ring-success/50'
                         : 'bg-danger hover:bg-danger/80 border-danger/50 focus:ring-danger/50'
                       }`}
            >
              {isSubmitting ? t('instance.operationModalSending') : t('instance.operationModalConfirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
