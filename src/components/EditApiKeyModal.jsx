import { useState, useEffect } from 'react';

export function EditApiKeyModal({ isOpen, onClose, onSave, apiKeyToEdit, isSaving }) {
  const [name, setName] = useState('');
  
  // Extrai os parâmetros adicionais do objeto da API Key
  const additionalParams = apiKeyToEdit?.api_credentials
    ? Object.entries(apiKeyToEdit.api_credentials)
        .filter(([key]) => key !== 'api_key' && key !== 'secret_key')
        .map(([key, value]) => ({ key, value }))
    : [];

  // Popula o formulário com o nome da chave selecionada para edição
  useEffect(() => {
    if (apiKeyToEdit) {
      setName(apiKeyToEdit.name || '');
    }
  }, [apiKeyToEdit]);

  const handleSave = () => {
    // Passa o ID e o novo nome para o componente pai salvar
    onSave(apiKeyToEdit.api_key_id, name);
  };
  
  if (!isOpen) return null;

  // Estilos
  const inputStyle = "w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500";
  const labelStyle = "block text-sm font-medium text-gray-400 mb-1";
  const buttonPrimaryStyle = "px-4 py-2 font-semibold text-white rounded-md transition-all duration-300 transform focus:outline-none";
  const buttonSecondaryStyle = `${buttonPrimaryStyle} bg-transparent border-2 border-gray-700 hover:bg-red-500 hover:border-red-500`;
  const disabledInputStyle = `${inputStyle} opacity-50 cursor-not-allowed`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-xl w-full max-w-lg border border-red-500/30">
        <h3 className="text-xl font-semibold mb-4 text-white">Edit API Key</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="edit_name" className={labelStyle}>Name</label>
            <input id="edit_name" name="name" value={name} onChange={(e) => setName(e.target.value)} className={inputStyle} />
          </div>
          <div>
            <label className={labelStyle}>API Key</label>
            <input value={apiKeyToEdit?.api_credentials?.api_key} disabled className={disabledInputStyle} />
          </div>
          <div>
            <label className={labelStyle}>Secret Key</label>
            <input value={apiKeyToEdit?.api_credentials?.secret_key} disabled className={disabledInputStyle} />
          </div>

          {/* Renderiza os parâmetros adicionais se existirem */}
          {additionalParams.length > 0 && (
            <div>
              <h4 className="text-sm mb-2 text-gray-400">Additional Parameters</h4>
              {additionalParams.map((param, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className={labelStyle}>Parameter Key</label>
                    <input value={param.key} disabled className={disabledInputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>Parameter Value</label>
                    <input value={param.value} disabled className={disabledInputStyle} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button onClick={onClose} className={buttonSecondaryStyle}>Cancel</button>
            <button onClick={handleSave} disabled={isSaving} className={`${buttonPrimaryStyle} bg-green-600 hover:bg-green-700`}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}