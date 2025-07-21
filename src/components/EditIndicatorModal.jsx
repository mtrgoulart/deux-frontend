import { useState, useEffect } from 'react';

function EditIndicatorModal({ indicator, instances, onClose, onSave }) {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Determines if it's in "edit" or "add" mode
  const isEditMode = indicator && !!indicator.id;

  useEffect(() => {
    // Sets form data based on the current mode
    setFormData({
      id: indicator.id || undefined,
      name: indicator.name || '',
      instance_id: indicator.instance_id || '',
      side: indicator.side || 'buy',
      mandatory: indicator.mandatory || false,
    });
  }, [indicator]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required.';
    } else if (!/^[a-zA-Z0-9\s]+$/.test(formData.name)) {
      newErrors.name = 'Name can only contain letters and numbers.';
    }
    
    // Validates Strategy ID only in creation mode
    if (!isEditMode && !formData.instance_id) {
      newErrors.instance_id = 'Strategy is required.';
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
      alert('Error saving indicator. Please try again.');
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          <p className="ml-4 text-gray-300 mt-4">Saving...</p>
        </div>
      );
    }

    if (showSuccessMessage) {
      return (
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h4 className="text-2xl font-semibold text-green-400 mt-4">Saved Successfully!</h4>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-5">
          {isEditMode && (
            <div className="grid grid-cols-2 gap-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">ID</label>
                <input type="text" readOnly value={indicator.id} className="w-full p-2 rounded bg-gray-700 cursor-not-allowed text-gray-300"/>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-400 mb-1">Strategy ID</label>
                 <input type="text" readOnly value={indicator.instance_id} className="w-full p-2 rounded bg-gray-700 cursor-not-allowed text-gray-300"/>
              </div>
            </div>
          )}
          
          {!isEditMode && (
              <div>
                <label htmlFor="instance_id" className="block text-sm font-medium text-gray-300 mb-1">Strategy</label>
                <select
                  id="instance_id"
                  value={formData.instance_id}
                  onChange={(e) => setFormData({ ...formData, instance_id: e.target.value })}
                  className={`w-full p-2 rounded bg-gray-900 text-white focus:ring-cyan-500 focus:border-cyan-500 ${errors.instance_id ? 'border border-red-500' : 'border-gray-600'}`}
                >
                  <option value="">Select a Strategy</option>
                  {instances.map(inst => (
                    <option key={inst.id} value={inst.id}>({inst.id}) - {inst.name}</option>
                  ))}
                </select>
                {errors.instance_id && <p className="text-red-500 text-xs mt-1">{errors.instance_id}</p>}
              </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input id="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className={`w-full p-2 rounded bg-gray-900 text-white focus:ring-cyan-500 focus:border-cyan-500 ${errors.name ? 'border border-red-500' : 'border-gray-600'}`}
                   placeholder="Indicator Name" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="side" className="block text-sm font-medium text-gray-300 mb-1">Side</label>
            <select id="side" value={formData.side} onChange={(e) => setFormData({ ...formData, side: e.target.value })}
                    className="w-full p-2 rounded bg-gray-900 text-white border-gray-600 focus:ring-cyan-500 focus:border-cyan-500">
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 flex items-center justify-between">
              <label htmlFor="mandatory" className="font-medium text-gray-200 text-base cursor-pointer">
                  Mandatory Indicator
                  <span className="block text-xs text-gray-400 font-normal mt-1">If enabled, this indicator is required for the strategy's signal.</span>
              </label>
              <div className="flex items-center">
                    <input
                      id="mandatory"
                      type="checkbox"
                      checked={formData.mandatory}
                      onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                      className="h-5 w-5 rounded border-gray-500 bg-gray-700 text-cyan-500 focus:ring-2 focus:ring-offset-gray-800 focus:ring-cyan-500 cursor-pointer"
                  />
              </div>
          </div>

          {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Created At</label>
              <input type="text" readOnly value={new Date(indicator.created_at).toLocaleString()}
                     className="w-full p-2 rounded bg-gray-700 cursor-not-allowed text-gray-300"/>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white px-5 py-2 rounded-md transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-md transition-colors">
            Save Changes
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-lg w-full text-white border border-gray-700">
        <h3 className="text-2xl font-semibold mb-6">{isEditMode ? 'Edit Indicator' : 'Add New Indicator'}</h3>
        {renderContent()}
      </div>
    </div>
  );
}

export default EditIndicatorModal;
