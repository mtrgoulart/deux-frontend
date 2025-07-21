import { useState, useEffect } from 'react';

export function AddApiKeyForm({ isOpen, onClose, onSave, exchanges, isSaving }) {
  const [formData, setFormData] = useState({
    name: '',
    exchange_id: '',
    api_key: '',
    secret_key: '',
  });
  const [extraParams, setExtraParams] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Reseta o formulário quando ele é fechado/aberto
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

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.exchange_id) errors.exchange_id = "Exchange is required";
    if (!formData.api_key.trim()) errors.api_key = "API Key is required";
    if (!formData.secret_key.trim()) errors.secret_key = "Secret Key is required";
    if (formData.api_key && !safePattern.test(formData.api_key)) errors.api_key = "Invalid characters";
    if (formData.secret_key && !safePattern.test(formData.secret_key)) errors.secret_key = "Invalid characters";
    extraParams.forEach((p, i) => {
      if (!p.key.trim() || !p.value.trim()) errors[`extra_${i}`] = "Please fill in both key and value";
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    onSave(formData, extraParams);
  };

  if (!isOpen) return null;

  // Estilos (podem ser movidos para um arquivo central se preferir)
  const inputStyle = "w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500";
  const labelStyle = "block text-sm font-medium text-gray-400 mb-1";
  const buttonPrimaryStyle = "px-4 py-2 font-semibold text-white rounded-md transition-all duration-300 transform focus:outline-none";
  const buttonSecondaryStyle = `${buttonPrimaryStyle} bg-transparent border-2 border-gray-700 hover:bg-red-500 hover:border-red-500`;

  return (
    <div className="bg-black/30 backdrop-blur-sm p-6 mb-6 rounded-lg border border-red-500/20">
      <form onSubmit={validateAndSave} className="grid grid-cols-2 gap-x-4 gap-y-5">
        <div>
          <label htmlFor="name" className={labelStyle}>Name</label>
          <input id="name" name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g., My Binance Key" className={inputStyle} required />
        </div>
        <div>
          <label htmlFor="exchange_id" className={labelStyle}>Exchange</label>
          <select id="exchange_id" name="exchange_id" value={formData.exchange_id} onChange={handleFormChange} className={inputStyle} required>
            <option value="">Select an Exchange</option>
            {exchanges?.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="api_key" className={labelStyle}>API Key</label>
          <input id="api_key" name="api_key" value={formData.api_key} onChange={handleFormChange} placeholder="Your API Key" className={inputStyle} required />
        </div>
        <div>
          <label htmlFor="secret_key" className={labelStyle}>Secret Key</label>
          <input id="secret_key" name="secret_key" value={formData.secret_key} onChange={handleFormChange} placeholder="Your Secret Key" className={inputStyle} required />
        </div>
        <div className="col-span-2 mt-2">
            <h3 className="mb-2 text-sm text-gray-400">Additional Parameters (if needed)</h3>
            {extraParams.map((param, index) => (
            <div key={index} className="grid grid-cols-2 gap-x-2 gap-y-1 mb-2 items-end">
                <div>
                    <label htmlFor={`param_key_${index}`} className={labelStyle}>Parameter Key</label>
                    <input id={`param_key_${index}`} type="text" value={param.key} onChange={(e) => handleExtraParamChange(index, 'key', e.target.value)} className={inputStyle} />
                </div>
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                    <label htmlFor={`param_value_${index}`} className={labelStyle}>Parameter Value</label>
                    <input id={`param_value_${index}`} type="text" value={param.value} onChange={(e) => handleExtraParamChange(index, 'value', e.target.value)} className={inputStyle} />
                    </div>
                    <button type="button" onClick={() => removeExtraParam(index)} className="bg-red-800 hover:bg-red-700 text-white font-bold h-10 w-10 rounded flex-shrink-0">-</button>
                </div>
            </div>
            ))}
            <button type="button" onClick={addExtraParam} className="bg-slate-700 hover:bg-slate-600 text-sm px-3 py-1 rounded mt-2">+ New Parameter</button>
        </div>
        <div className="col-span-2 flex justify-end gap-4 mt-4">
          <button type="button" onClick={onClose} className={buttonSecondaryStyle}>Cancel</button>
          {/* O botão agora usa a prop 'isSaving' para ser desabilitado */}
          <button type="submit" disabled={isSaving} className={`${buttonPrimaryStyle} ${isSaving ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'}`}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {Object.values(formErrors).length > 0 && (
            <div className="col-span-2 text-sm text-red-400 mt-2">
                {Object.values(formErrors).map((error, i) => <p key={i}>* {error}</p>)}
            </div>
        )}
      </form>
    </div>
  );
}