import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const inputBase = `w-full px-3 py-2 bg-surface-primary border rounded text-sm text-content-primary
                   placeholder-content-muted focus:outline-none focus:ring-2 transition-all duration-300`;
const inputNormal = `border-border focus:border-border-accent focus:ring-accent/20 hover:border-border-accent`;
const inputError = `border-danger focus:border-danger focus:ring-danger/20`;

export function AddApiKeyForm({ isOpen, onClose, onSave, exchanges, isSaving }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    exchange_id: '',
    api_key: '',
    secret_key: '',
  });
  const [extraParams, setExtraParams] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', exchange_id: '', api_key: '', secret_key: '' });
      setExtraParams([]);
      setFormErrors({});
    }
  }, [isOpen]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExtraParamChange = (index, key, value) => {
    setExtraParams((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const addExtraParam = () => {
    setExtraParams([...extraParams, { key: '', value: '' }]);
  };

  const removeExtraParam = (index) => {
    setExtraParams(extraParams.filter((_, i) => i !== index));
  };

  const validateAndSave = (e) => {
    e.preventDefault();
    const errors = {};
    const safePattern = /^[a-zA-Z0-9_-]+$/;

    if (!formData.name.trim()) errors.name = t('apiKeys.errors.nameRequired');
    if (!formData.exchange_id) errors.exchange_id = t('apiKeys.errors.exchangeRequired');
    if (!formData.api_key.trim()) errors.api_key = t('apiKeys.errors.apiKeyRequired');
    if (!formData.secret_key.trim()) errors.secret_key = t('apiKeys.errors.secretKeyRequired');
    if (formData.api_key && !safePattern.test(formData.api_key)) errors.api_key = t('apiKeys.errors.invalidChars');
    if (formData.secret_key && !safePattern.test(formData.secret_key)) errors.secret_key = t('apiKeys.errors.invalidChars');
    extraParams.forEach((p, i) => {
      if (!p.key.trim() || !p.value.trim()) errors[`extra_${i}`] = t('apiKeys.errors.extraParamRequired');
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    onSave(formData, extraParams);
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
                  {t('apiKeys.addTitle')}
                </h3>
                <p className="text-content-muted text-xs mt-1 tracking-wide">
                  {t('apiKeys.addSubtitle')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-raised/50 rounded transition-all duration-200 group"
                title={t('apiKeys.close')}
              >
                <svg className="w-5 h-5 text-content-secondary group-hover:text-content-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={validateAndSave}>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                {/* Name and Exchange */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                      {t('apiKeys.formName')}
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder={t('apiKeys.formNamePlaceholder')}
                      className={`${inputBase} ${formErrors.name ? inputError : inputNormal}`}
                    />
                    {formErrors.name && <p className="text-danger text-xs mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="exchange_id" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                      {t('apiKeys.formExchange')}
                    </label>
                    <select
                      id="exchange_id"
                      name="exchange_id"
                      value={formData.exchange_id}
                      onChange={handleFormChange}
                      className={`${inputBase} appearance-none cursor-pointer ${formErrors.exchange_id ? inputError : inputNormal}`}
                    >
                      <option value="">{t('apiKeys.formSelectExchange')}</option>
                      {exchanges?.map((ex) => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                    {formErrors.exchange_id && <p className="text-danger text-xs mt-1">{formErrors.exchange_id}</p>}
                  </div>
                </div>

                {/* Credentials Section */}
                <div className="border-t border-border-subtle pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-content-accent mb-3 uppercase tracking-wider">
                    {t('apiKeys.credentials')}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="api_key" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                        {t('apiKeys.formApiKey')}
                      </label>
                      <input
                        id="api_key"
                        name="api_key"
                        value={formData.api_key}
                        onChange={handleFormChange}
                        placeholder={t('apiKeys.formApiKeyPlaceholder')}
                        className={`${inputBase} ${formErrors.api_key ? inputError : inputNormal}`}
                      />
                      {formErrors.api_key && <p className="text-danger text-xs mt-1">{formErrors.api_key}</p>}
                    </div>
                    <div>
                      <label htmlFor="secret_key" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                        {t('apiKeys.formSecretKey')}
                      </label>
                      <input
                        id="secret_key"
                        name="secret_key"
                        value={formData.secret_key}
                        onChange={handleFormChange}
                        placeholder={t('apiKeys.formSecretKeyPlaceholder')}
                        className={`${inputBase} ${formErrors.secret_key ? inputError : inputNormal}`}
                      />
                      {formErrors.secret_key && <p className="text-danger text-xs mt-1">{formErrors.secret_key}</p>}
                    </div>
                  </div>
                </div>

                {/* Additional Parameters Section */}
                <div className="border-t border-border-subtle pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-content-accent mb-3 uppercase tracking-wider">
                    {t('apiKeys.additionalParams')}
                  </h4>
                  {extraParams.map((param, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 mb-3 items-end">
                      <div>
                        <label htmlFor={`param_key_${index}`} className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                          {t('apiKeys.paramKey')}
                        </label>
                        <input
                          id={`param_key_${index}`}
                          type="text"
                          value={param.key}
                          onChange={(e) => handleExtraParamChange(index, 'key', e.target.value)}
                          className={`${inputBase} ${formErrors[`extra_${index}`] ? inputError : inputNormal}`}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label htmlFor={`param_value_${index}`} className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                            {t('apiKeys.paramValue')}
                          </label>
                          <input
                            id={`param_value_${index}`}
                            type="text"
                            value={param.value}
                            onChange={(e) => handleExtraParamChange(index, 'value', e.target.value)}
                            className={`${inputBase} ${formErrors[`extra_${index}`] ? inputError : inputNormal}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExtraParam(index)}
                          className="p-2 hover:bg-surface-raised/50 rounded transition-all duration-200 group/btn flex-shrink-0"
                          title={t('apiKeys.removeParam')}
                        >
                          <svg className="w-5 h-5 text-content-secondary group-hover/btn:text-danger transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      {formErrors[`extra_${index}`] && (
                        <p className="text-danger text-xs col-span-2 -mt-2">{formErrors[`extra_${index}`]}</p>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addExtraParam}
                    className="flex items-center gap-1.5 text-sm text-content-accent hover:text-content-primary transition-colors mt-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{t('apiKeys.newParam')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-surface-raised/50 border-t border-border-subtle px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-surface-raised border border-border text-content-secondary rounded text-sm uppercase tracking-wider
                           hover:bg-surface-raised/80 hover:text-content-primary transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {t('apiKeys.formCancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-5 py-2 rounded text-sm uppercase tracking-wider font-bold transition-all duration-300
                            focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface
                            ${isSaving
                              ? 'bg-surface-raised text-content-muted cursor-not-allowed border border-border'
                              : 'bg-accent hover:bg-accent-hover text-white border border-accent'
                            }`}
                >
                  {isSaving ? t('apiKeys.formSaving') : t('apiKeys.formSave')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
