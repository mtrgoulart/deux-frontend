import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function EditIndicatorModal({ indicator, instances, onClose, onSave }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditMode = indicator && !!indicator.id;

  useEffect(() => {
    setFormData({
      id: indicator.id || undefined,
      name: indicator.name || '',
      instance_id: indicator.instance_id || '',
      side: indicator.side || 'buy',
      mandatory: indicator.mandatory || false,
      delay_seconds: indicator.delay_seconds || null,
    });
  }, [indicator]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('indicator.validation.nameRequired');
    } else if (!/^[a-zA-Z0-9\s]+$/.test(formData.name)) {
      newErrors.name = t('indicator.validation.nameAlphanumeric');
    }
    if (!isEditMode && !formData.instance_id) {
      newErrors.instance_id = t('indicator.validation.strategyRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await onSave(formData);
      setIsLoading(false);
      setShowSuccessMessage(true);
      setTimeout(() => {
        onClose();
        setShowSuccessMessage(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save indicator:', error);
      alert(t('indicator.formSaveError'));
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent"></div>
          <p className="text-content-secondary mt-4">{t('indicator.formSaving')}</p>
        </div>
      );
    }

    if (showSuccessMessage) {
      return (
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <svg className="w-16 h-16 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 className="text-2xl font-semibold text-success mt-4">{t('indicator.formSavedSuccess')}</h4>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-5">
          {isEditMode && (
            <div className="grid grid-cols-2 gap-x-4">
              <div>
                <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('indicator.formId')}
                </label>
                <input
                  type="text"
                  readOnly
                  value={indicator.id}
                  className="w-full px-3 py-2 bg-surface-raised border border-border text-content-muted rounded text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('indicator.formStrategyId')}
                </label>
                <input
                  type="text"
                  readOnly
                  value={indicator.instance_id}
                  className="w-full px-3 py-2 bg-surface-raised border border-border text-content-muted rounded text-sm cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {!isEditMode && (
            <div>
              <label htmlFor="instance_id" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                {t('indicator.formStrategy')}
              </label>
              <select
                id="instance_id"
                value={formData.instance_id}
                onChange={(e) => setFormData({ ...formData, instance_id: e.target.value })}
                className={`w-full px-3 py-2 bg-surface-primary border text-content-primary rounded text-sm
                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ${
                           errors.instance_id ? 'border-danger' : 'border-border'
                         }`}
              >
                <option value="">{t('indicator.formSelectStrategy')}</option>
                {instances.map(inst => (
                  <option key={inst.id} value={inst.id}>({inst.id}) - {inst.name}</option>
                ))}
              </select>
              {errors.instance_id && <p className="text-danger text-xs mt-1">{errors.instance_id}</p>}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
              {t('indicator.formName')}
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 bg-surface-primary border text-content-primary rounded text-sm
                       focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ${
                         errors.name ? 'border-danger' : 'border-border'
                       }`}
              placeholder={t('indicator.formNamePlaceholder')}
            />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="side" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
              {t('indicator.formSide')}
            </label>
            <select
              id="side"
              value={formData.side}
              onChange={(e) => setFormData({ ...formData, side: e.target.value })}
              className="w-full px-3 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm
                       focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="buy">{t('indicator.formBuy')}</option>
              <option value="sell">{t('indicator.formSell')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="delay_seconds" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
              {t('indicator.formSignalDelay')}
            </label>
            <select
              id="delay_seconds"
              value={formData.delay_seconds ?? ''}
              onChange={(e) => setFormData({ ...formData, delay_seconds: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm
                       focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">{t('indicator.formDelayNone')}</option>
              <option value="5">{t('indicator.formDelay5s')}</option>
              <option value="10">{t('indicator.formDelay10s')}</option>
              <option value="60">{t('indicator.formDelay1m')}</option>
              <option value="900">{t('indicator.formDelay15m')}</option>
              <option value="3600">{t('indicator.formDelay1h')}</option>
            </select>
          </div>

          <div className="bg-surface-primary border border-border p-4 rounded-lg flex items-center justify-between">
            <label htmlFor="mandatory" className="font-medium text-content-primary text-sm cursor-pointer">
              {t('indicator.formMandatory')}
              <span className="block text-xs text-content-muted font-normal mt-1">
                {t('indicator.formMandatoryDescription')}
              </span>
            </label>
            <input
              id="mandatory"
              type="checkbox"
              checked={formData.mandatory}
              onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
              className="h-5 w-5 rounded border-border bg-surface-primary text-accent focus:ring-2 focus:ring-accent/20 cursor-pointer"
            />
          </div>

          {isEditMode && (
            <div>
              <label className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                {t('indicator.formCreatedAt')}
              </label>
              <input
                type="text"
                readOnly
                value={new Date(indicator.created_at).toLocaleString()}
                className="w-full px-3 py-2 bg-surface-raised border border-border text-content-muted rounded text-sm cursor-not-allowed"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-surface-raised border border-border text-content-secondary rounded text-sm font-medium
                     hover:bg-surface-raised/80 transition-colors"
          >
            {t('indicator.formCancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded text-sm font-medium transition-colors"
          >
            {t('indicator.formSave')}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface border border-border rounded-lg shadow-2xl p-8 max-w-lg w-full">
        <h3 className="text-xl font-bold text-content-primary mb-6">
          {isEditMode ? t('indicator.editTitle') : t('indicator.addTitle')}
        </h3>
        {renderContent()}
      </div>
    </div>
  );
}

export default EditIndicatorModal;
