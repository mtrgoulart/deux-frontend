import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

const initialFormState = {
  id: '', name: '', side: '', strategy: '', percent: '',
  condition_limit: '', interval: '', simultaneous_operations: '',
  size_mode: 'percentage', flat_value: '',
};

const inputBase = `w-full px-3 py-2 bg-surface-primary border rounded text-sm text-content-primary
                   placeholder-content-muted focus:outline-none focus:ring-2 transition-all duration-300`;
const inputNormal = `border-border focus:border-border-accent focus:ring-accent/20 hover:border-border-accent`;
const inputError = `border-danger focus:border-danger focus:ring-danger/20`;

export function StrategyFormModal({ isOpen, onClose, onSave, initialData, formErrors = {} }) {
  const { t } = useTranslation();
  const [strategy, setStrategy] = useState(initialFormState);
  const isEditing = Boolean(initialData?.id);

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setStrategy({ ...initialData, strategy: initialData.strategy_uuid });
      } else {
        setStrategy({ ...initialFormState, strategy: uuidv4() });
      }
    }
  }, [isOpen, initialData, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStrategy(prev => ({ ...prev, [name]: value }));
  };

  const handlePositiveInt = (e) => {
    const { name, value } = e.target;
    if (value === '') {
      setStrategy(prev => ({ ...prev, [name]: '' }));
      return;
    }
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setStrategy(prev => ({ ...prev, [name]: String(parsed) }));
    }
  };

  const handlePercentChange = (e) => {
    const { value } = e.target;
    if (value === '') {
      setStrategy(prev => ({ ...prev, percent: '' }));
      return;
    }
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      setStrategy(prev => ({ ...prev, percent: String(parsed) }));
    }
  };

  const handleSave = () => {
    onSave(strategy);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-surface border border-border rounded-lg shadow-2xl">
          {/* Header */}
          <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
                  {isEditing ? t('configuration.editConfiguration') : t('configuration.newConfiguration')}
                </h3>
                <p className="text-content-muted text-xs mt-1 tracking-wide">
                  {isEditing ? t('configuration.editSubtitle') : t('configuration.newSubtitle')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-raised/50 rounded transition-all duration-200 group"
                title={t('configuration.close')}
              >
                <svg className="w-5 h-5 text-content-secondary group-hover:text-content-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Name and Side in a 2-column grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Name field with max 50 chars + counter */}
                <div>
                  <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                    {t('configuration.configName')}
                  </label>
                  <input
                    name="name"
                    value={strategy.name}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder={t('configuration.enterName')}
                    className={`${inputBase} ${formErrors.name ? inputError : inputNormal}`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {formErrors.name ? (
                      <p className="text-danger text-xs">{formErrors.name}</p>
                    ) : (
                      <span className="text-content-muted text-xs">{t('configuration.nameMaxLength')}</span>
                    )}
                    <span className="text-content-muted text-xs">{strategy.name.length}/50</span>
                  </div>
                </div>

                {/* Side selector - toggle buttons */}
                <div>
                  <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                    {t('configuration.tradeSide')}
                  </label>
                  <div className="flex gap-0">
                    <button
                      type="button"
                      onClick={() => setStrategy(prev => ({ ...prev, side: 'buy' }))}
                      className={`flex-1 px-3 py-2 text-sm font-semibold uppercase tracking-wider rounded-l transition-all duration-300
                        ${strategy.side === 'buy'
                          ? 'bg-success text-white border border-success'
                          : 'bg-surface-primary border border-border text-content-secondary hover:border-border-accent'
                        }`}
                    >
                      {t('configuration.buy')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStrategy(prev => ({ ...prev, side: 'sell' }))}
                      className={`flex-1 px-3 py-2 text-sm font-semibold uppercase tracking-wider rounded-r transition-all duration-300
                        ${strategy.side === 'sell'
                          ? 'bg-danger text-white border border-danger'
                          : 'bg-surface-primary border border-border text-content-secondary hover:border-border-accent'
                        }`}
                    >
                      {t('configuration.sell')}
                    </button>
                  </div>
                  {formErrors.side && <p className="text-danger text-xs mt-1">{formErrors.side}</p>}
                </div>
              </div>

              {/* UUID */}
              <div>
                <label className="block text-xs font-semibold text-content-muted mb-2 uppercase tracking-wider">
                  {t('configuration.strategyUuid')}
                </label>
                <input
                  value={strategy.strategy}
                  readOnly
                  className="w-full px-3 py-2 bg-surface-raised/50 border border-border-subtle text-content-muted rounded text-xs
                           cursor-not-allowed opacity-60"
                />
              </div>

              {/* Size Mode Section */}
              <div className="border-t border-border-subtle pt-4 mt-2">
                <h4 className="text-sm font-semibold text-content-accent mb-3 uppercase tracking-wider">
                  {t('configuration.positionSizing')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Size Mode - segmented toggle buttons with tooltips */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                      {t('configuration.sizingMode')}
                    </label>
                    <div className="flex gap-0">
                      <button
                        type="button"
                        onClick={() => setStrategy(prev => ({ ...prev, size_mode: 'percentage' }))}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold uppercase tracking-wider rounded-l transition-all duration-300
                          ${(strategy.size_mode || 'percentage') === 'percentage'
                            ? 'bg-accent text-white border border-accent'
                            : 'bg-surface-primary border border-border text-content-secondary hover:border-border-accent'
                          }`}
                      >
                        <span>{t('configuration.percentage')}</span>
                        <div className="relative group/tip">
                          <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold cursor-help
                            ${(strategy.size_mode || 'percentage') === 'percentage'
                              ? 'bg-white/20 text-white'
                              : 'bg-surface-raised text-content-muted'
                            }`}>?</span>
                          <div className="invisible group-hover/tip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 px-3 py-2 bg-surface-raised border border-border rounded shadow-lg text-xs text-content-primary normal-case tracking-normal font-normal z-10">
                            {t('configuration.sizingModeTipPercentage')}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStrategy(prev => ({ ...prev, size_mode: 'flat_value' }))}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold uppercase tracking-wider rounded-r transition-all duration-300
                          ${strategy.size_mode === 'flat_value'
                            ? 'bg-accent text-white border border-accent'
                            : 'bg-surface-primary border border-border text-content-secondary hover:border-border-accent'
                          }`}
                      >
                        <span>{t('configuration.flatValue')}</span>
                        <div className="relative group/tip">
                          <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold cursor-help
                            ${strategy.size_mode === 'flat_value'
                              ? 'bg-white/20 text-white'
                              : 'bg-surface-raised text-content-muted'
                            }`}>?</span>
                          <div className="invisible group-hover/tip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 px-3 py-2 bg-surface-raised border border-border rounded shadow-lg text-xs text-content-primary normal-case tracking-normal font-normal z-10">
                            {t('configuration.sizingModeTipFlatValue')}
                          </div>
                        </div>
                      </button>
                    </div>
                    {formErrors.size_mode && <p className="text-danger text-xs mt-1">{formErrors.size_mode}</p>}
                  </div>

                  {/* Conditional rendering based on size_mode */}
                  {(strategy.size_mode || 'percentage') === 'percentage' ? (
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                        {t('configuration.percentageLabel')}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          name="percent"
                          min={1}
                          max={100}
                          step={1}
                          value={strategy.percent || 1}
                          onChange={handlePercentChange}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-surface-raised accent-accent"
                        />
                        <div className="relative flex-shrink-0">
                          <input
                            type="number"
                            name="percent"
                            min={0}
                            max={100}
                            step={1}
                            value={strategy.percent || ''}
                            onChange={handlePercentChange}
                            className={`w-20 px-2 py-1 pr-6 bg-surface-primary border rounded text-sm text-content-primary text-right
                                       focus:outline-none focus:ring-2 transition-all duration-300
                                       ${formErrors.percent ? inputError : inputNormal}`}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-content-muted text-sm pointer-events-none">%</div>
                        </div>
                      </div>
                      {formErrors.percent && <p className="text-danger text-xs mt-1">{formErrors.percent}</p>}
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                        {t('configuration.flatValueLabel')}
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted text-sm">$</div>
                        <input
                          type="number"
                          name="flat_value"
                          value={strategy.flat_value || ''}
                          onChange={handleChange}
                          placeholder={t('configuration.flatValuePlaceholder')}
                          className={`${inputBase} pl-8 ${formErrors.flat_value ? inputError : inputNormal}`}
                        />
                      </div>
                      {formErrors.flat_value && <p className="text-danger text-xs mt-1">{formErrors.flat_value}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Execution Parameters Section */}
              <div className="border-t border-border-subtle pt-4 mt-2">
                <h4 className="text-sm font-semibold text-content-accent mb-3 uppercase tracking-wider">
                  {t('configuration.executionParameters')}
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {/* Condition Limit */}
                  <div>
                    <label className="block text-xs font-semibold text-content-accent mb-1 uppercase tracking-wider">
                      {t('configuration.conditionLabel')}
                    </label>
                    <p className="text-content-muted text-[11px] normal-case tracking-normal font-normal mb-2">
                      {t('configuration.conditionDescription')}
                    </p>
                    <input
                      type="number"
                      name="condition_limit"
                      min={0}
                      step={1}
                      value={strategy.condition_limit || ''}
                      onChange={handlePositiveInt}
                      onKeyDown={(e) => ['.', ',', '-', 'e'].includes(e.key) && e.preventDefault()}
                      placeholder={t('configuration.conditionPlaceholder')}
                      className={`${inputBase} ${formErrors.condition_limit ? inputError : inputNormal}`}
                    />
                    {formErrors.condition_limit && <p className="text-danger text-xs mt-1">{formErrors.condition_limit}</p>}
                  </div>

                  {/* Interval */}
                  <div>
                    <label className="block text-xs font-semibold text-content-accent mb-1 uppercase tracking-wider">
                      {t('configuration.interval')}
                    </label>
                    <p className="text-content-muted text-[11px] normal-case tracking-normal font-normal mb-2">
                      {t('configuration.intervalDescription')}
                    </p>
                    <input
                      type="number"
                      name="interval"
                      min={0}
                      step={1}
                      value={strategy.interval || ''}
                      onChange={handlePositiveInt}
                      onKeyDown={(e) => ['.', ',', '-', 'e'].includes(e.key) && e.preventDefault()}
                      placeholder={t('configuration.intervalPlaceholder')}
                      className={`${inputBase} ${formErrors.interval ? inputError : inputNormal}`}
                    />
                    {formErrors.interval && <p className="text-danger text-xs mt-1">{formErrors.interval}</p>}
                  </div>

                  {/* Simultaneous Operations */}
                  <div>
                    <label className="block text-xs font-semibold text-content-accent mb-1 uppercase tracking-wider">
                      {t('configuration.simultaneousOps')}
                    </label>
                    <p className="text-content-muted text-[11px] normal-case tracking-normal font-normal mb-2">
                      {t('configuration.simultaneousOpsDescription')}
                    </p>
                    <input
                      type="number"
                      name="simultaneous_operations"
                      min={0}
                      step={1}
                      value={strategy.simultaneous_operations || ''}
                      onChange={handlePositiveInt}
                      onKeyDown={(e) => ['.', ',', '-', 'e'].includes(e.key) && e.preventDefault()}
                      placeholder={t('configuration.simultaneousOpsPlaceholder')}
                      className={`${inputBase} ${formErrors.simultaneous_operations ? inputError : inputNormal}`}
                    />
                    {formErrors.simultaneous_operations && <p className="text-danger text-xs mt-1">{formErrors.simultaneous_operations}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-surface-raised/50 border-t border-border-subtle px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-surface-raised border border-border text-content-secondary rounded text-sm uppercase tracking-wider
                         hover:bg-surface-raised/80 hover:text-content-primary transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {t('configuration.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded text-sm uppercase tracking-wider font-bold
                         border border-accent transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface"
              >
                {isEditing ? t('configuration.saveChanges') : t('configuration.create')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
