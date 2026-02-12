import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const inputBase = `w-full px-3 py-2 bg-surface-primary border rounded text-sm text-content-primary
                   placeholder-content-muted focus:outline-none focus:ring-2 transition-all duration-300`;
const inputNormal = `border-border focus:border-border-accent focus:ring-accent/20 hover:border-border-accent`;
const readOnlyInput = `w-full px-3 py-2 bg-surface-raised/50 border border-border-subtle text-content-muted rounded text-sm
                       cursor-not-allowed opacity-60`;

export function EditApiKeyModal({ isOpen, onClose, onSave, apiKeyToEdit, isSaving }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const additionalParams = apiKeyToEdit?.api_credentials
    ? Object.entries(apiKeyToEdit.api_credentials)
        .filter(([key]) => key !== 'api_key' && key !== 'secret_key')
        .map(([key, value]) => ({ key, value }))
    : [];

  useEffect(() => {
    if (apiKeyToEdit) {
      setName(apiKeyToEdit.name || '');
    }
  }, [apiKeyToEdit]);

  const handleSave = () => {
    onSave(apiKeyToEdit.api_key_id, name);
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
                  {t('apiKeys.editTitle')}
                </h3>
                <p className="text-content-muted text-xs mt-1 tracking-wide">
                  {t('apiKeys.editSubtitle')}
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
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Name (editable) */}
              <div>
                <label htmlFor="edit_name" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                  {t('apiKeys.editName')}
                </label>
                <input
                  id="edit_name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputBase} ${inputNormal}`}
                />
              </div>

              {/* Credentials Section (read-only) */}
              <div className="border-t border-border-subtle pt-4 mt-2">
                <h4 className="text-sm font-semibold text-content-accent mb-3 uppercase tracking-wider">
                  {t('apiKeys.credentials')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content-muted mb-2 uppercase tracking-wider">
                      {t('apiKeys.editApiKey')}
                    </label>
                    <input
                      value={apiKeyToEdit?.api_credentials?.api_key}
                      readOnly
                      className={readOnlyInput}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-muted mb-2 uppercase tracking-wider">
                      {t('apiKeys.editSecretKey')}
                    </label>
                    <input
                      value={apiKeyToEdit?.api_credentials?.secret_key}
                      readOnly
                      className={readOnlyInput}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Parameters (read-only) */}
              {additionalParams.length > 0 && (
                <div className="border-t border-border-subtle pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-content-accent mb-3 uppercase tracking-wider">
                    {t('apiKeys.additionalParams')}
                  </h4>
                  {additionalParams.map((param, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-content-muted mb-2 uppercase tracking-wider">
                          {t('apiKeys.paramKey')}
                        </label>
                        <input value={param.key} readOnly className={readOnlyInput} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-content-muted mb-2 uppercase tracking-wider">
                          {t('apiKeys.paramValue')}
                        </label>
                        <input value={param.value} readOnly className={readOnlyInput} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                {t('apiKeys.formCancel')}
              </button>
              <button
                onClick={handleSave}
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
        </div>
      </div>
    </div>
  );
}
