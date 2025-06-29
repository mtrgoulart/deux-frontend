// src/pages/IndicatorsPage.jsx
import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

function IndicatorsPage() {
  const [indicators, setIndicators] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', instance_id: '', mandatory: false });
  const [formErrors, setFormErrors] = useState({});
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState('');
  const [revealKey, setRevealKey] = useState(false);

  const fetchIndicators = async () => {
    const res = await apiFetch('/select_indicators_by_user');
    const data = await res.json();
    setIndicators(data.indicator_data || []);
  };

  const fetchStrategies = async () => {
    const res = await apiFetch('/get_instances?api_key_id=all');
    const data = await res.json();
    setStrategies(data.instances || []);
  };

  useEffect(() => {
    fetchIndicators();
    fetchStrategies();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this indicator?')) return;
    await apiFetch('/remove_indicator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchIndicators();
  };

  const handleAddIndicator = async () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Required field';
    if (!formData.instance_id) errors.instance_id = 'Required field';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      user_id: 1, // ajustar conforme auth
      ...formData
    };

    await apiFetch('/add_indicator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setShowAddForm(false);
    setFormData({ name: '', instance_id: '', mandatory: false });
    fetchIndicators();
  };

  const handleViewKey = async (indicatorId) => {
    try {
      // opcional: você pode usar um spinner ou placeholder enquanto busca
      setSelectedKey('••••••••••••••••••••');
      setShowKeyModal(true);
      setRevealKey(false);
  
      const res = await apiFetch('/select_indicator_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: indicatorId })
      });
  
      const data = await res.json();
  
      if (res.ok) {
        setSelectedKey(data.indicator_data.key);
      } else {
        console.error('Error fetching key:', data.error);
        alert(data.error || 'Error fetching indicator key.');
        setShowKeyModal(false);
      }
    } catch (err) {
      console.error('Connection error:', err);
      alert('Error connecting to server.');
      setShowKeyModal(false);
    }
  };

  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Indicator Management & Quantity Rules</h2>
          <p className="text-gray-400">Configure indicators for your trading strategies and set quantity requirements</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)} 
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Indicator</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-8 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>New Indicator</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Indicator Name</label>
              <input
                className={`w-full p-3 rounded-lg bg-gray-700 text-white border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  formErrors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter indicator name"
              />
              {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Strategy</label>
              <select
                className={`w-full p-3 rounded-lg bg-gray-700 text-white border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  formErrors.instance_id ? 'border-red-500' : 'border-gray-600'
                }`}
                value={formData.instance_id}
                onChange={(e) => setFormData({ ...formData, instance_id: e.target.value })}
              >
                <option value="">Select a strategy</option>
                {strategies.map(strategy => (
                  <option key={strategy.id} value={strategy.id}>({strategy.id}) - {strategy.name}</option>
                ))}
              </select>
              {formErrors.instance_id && <p className="text-red-400 text-xs mt-1">{formErrors.instance_id}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center space-x-3 text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.mandatory}
                  onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
                <span className="text-sm font-medium">Mandatory Indicator</span>
              </label>
              <p className="text-xs text-gray-400 mt-1 ml-7">
                Mandatory indicators must trigger before any BUY signal is executed
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button 
              onClick={() => setShowAddForm(false)} 
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddIndicator} 
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Indicator</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Strategy</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Mandatory</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {indicators.map(ind => (
                <tr key={ind.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-cyan-400 font-mono text-sm">{ind.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{ind.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-300">{ind.instance_id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ind.mandatory ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                        MANDATORY
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(ind.created_at).toLocaleString('en-US', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewKey(ind.id)}
                        className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1 rounded text-sm transition-colors border border-blue-600/30 flex items-center space-x-1"
                        title="View key"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Key</span>
                      </button>
                      <button
                        onClick={() => alert('Configuration feature coming soon')}
                        className="bg-yellow-600/20 hover:bg-yellow-600 text-yellow-400 hover:text-white px-3 py-1 rounded text-sm transition-colors border border-yellow-600/30 flex items-center space-x-1"
                        title="Configure"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Config</span>
                      </button>
                      <button
                        onClick={() => handleDelete(ind.id)}
                        className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded text-sm transition-colors border border-red-600/30 flex items-center space-x-1"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {indicators.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No indicators found</h3>
            <p className="text-gray-500 mb-6">Start by adding your first indicator to configure quantity rules.</p>
          </div>
        )}
      </div>

      {showKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-white flex items-center space-x-2">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Indicator Key</span>
            </h3>
            
            <div className="relative mb-4">
              <input
                type={revealKey ? 'text' : 'password'}
                readOnly
                value={selectedKey}
                className="w-full p-3 rounded-lg bg-gray-700 text-white pr-12 border border-gray-600 font-mono text-sm"
              />
              <button
                onClick={() => setRevealKey(!revealKey)}
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                title={revealKey ? 'Hide key' : 'Show key'}
              >
                {revealKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(selectedKey);
                  // Could add a toast notification here
                  console.log('Key copied to clipboard');
                } catch (err) {
                  console.error('Failed to copy key:', err);
                }
              }}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Key</span>
            </button>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowKeyModal(false)} 
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndicatorsPage;