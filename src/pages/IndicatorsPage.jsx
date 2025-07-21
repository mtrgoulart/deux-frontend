import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import EditIndicatorModal from '../components/EditIndicatorModal';

function IndicatorsPage() {
  const [indicators, setIndicators] = useState([]);
  const [instances, setInstances] = useState([]);
  
  // State for the Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  
  // State for the Key Viewer modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyModalData, setKeyModalData] = useState(null);
  const [isLoadingKey, setIsLoadingKey] = useState(false);
  const [revealKey, setRevealKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // State for the Delete Confirmation modal
  const [indicatorToDelete, setIndicatorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); // <-- NOVO ESTADO

  
  const fetchIndicators = async () => {
    try {
      const res = await apiFetch('/select_indicators_by_user');
      const data = await res.json();
      setIndicators(data.indicator_data || []);
    } catch (error) {
      console.error("Failed to fetch indicators:", error);
    }
  };

  const fetchInstances = async () => {
    try {
      const res = await apiFetch('/get_instances?api_key_id=all');
      const data = await res.json();
      setInstances(data.instances || []);
    } catch (error) {
      console.error("Failed to fetch instances:", error);
    }
  };

  useEffect(() => {
    fetchIndicators();
    fetchInstances();
  }, []);

  // --- Delete Logic with Confirmation Modal ---
  const handleConfirmDelete = async () => {
    if (!indicatorToDelete) return;
    setIsDeleting(true); // <-- ATIVA O LOADING
    try {
      await apiFetch('/remove_indicator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: indicatorToDelete.id })
      });
      fetchIndicators();
    } catch (error) {
      console.error("Failed to delete indicator:", error);
      alert("Error deleting indicator.");
    } finally {
      setIsDeleting(false); // <-- DESATIVA O LOADING
      setIndicatorToDelete(null); // Fecha a modal
    }
  };
  
  // --- Add/Edit Modal Logic ---

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIndicator(null);
  };

  const handleOpenAddModal = () => {
    setSelectedIndicator({}); 
    setShowModal(true);
  };
  
  const handleOpenEditModal = (indicator) => {
    setSelectedIndicator(indicator);
    setShowModal(true);
  };

  const handleSaveIndicator = async (indicatorData) => {
    const isEditMode = !!indicatorData.id;
    const endpoint = isEditMode ? '/update_indicator' : '/add_indicator';

    try {
      await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(indicatorData),
      });
      fetchIndicators();
    } catch (error) {
        console.error("Save failed:", error);
        throw error;
    }
  };

  // --- Key Viewer Modal Logic ---
  const handleViewKey = async (indicator) => {
    setShowKeyModal(true);
    setKeyModalData(indicator);
    setRevealKey(false);
    setCopySuccess(false);

    if (indicator.key) {
      return;
    }

    setIsLoadingKey(true);
    try {
      const res = await apiFetch('/select_indicator_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: indicator.id })
      });
      const data = await res.json();
      if (res.ok) {
        const fetchedKey = data.indicator_data.key;
        setIndicators(currentIndicators =>
          currentIndicators.map(ind =>
            ind.id === indicator.id ? { ...ind, key: fetchedKey } : ind
          )
        );
        setKeyModalData(prev => ({ ...prev, key: fetchedKey }));
      } else {
        alert(data.error || 'Error fetching the indicator key.');
        setShowKeyModal(false);
      }
    } catch (err) {
      alert('Error connecting to the server.');
      setShowKeyModal(false);
    } finally {
      setIsLoadingKey(false);
    }
  };

  const handleCopyKey = async () => {
    if (!keyModalData || !keyModalData.key || copySuccess) return;
    const textToCopy = `key:${keyModalData.key},side:${keyModalData.side}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy key: ', err);
      alert('Your browser does not support this function or permission was denied.');
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Indicators</h2>
        <button onClick={handleOpenAddModal} className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md transition-colors">
          Add Indicator
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg">
          <thead className="bg-gray-700 text-left">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Strategy</th>
              <th className="px-4 py-3">Side</th>
              <th className="px-4 py-3">Mandatory</th>
              <th className="px-4 py-3">Created At</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {indicators.map(ind => (
              <tr key={ind.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                <td className="px-4 py-2">{ind.id}</td>
                <td className="px-4 py-2">{ind.name}</td>
                <td className="px-4 py-2">{ind.instance_id}</td>
                <td className="px-4 py-2 capitalize">{ind.side}</td>
                <td className="px-4 py-2">{ind.mandatory ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2">{new Date(ind.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 flex items-center gap-3">
                  <img src="/icons/view.svg" title="View key" className="w-5 h-5 cursor-pointer" onClick={() => handleViewKey(ind)} />
                  <img src="/icons/config.svg" title="Configure" className="w-5 h-5 cursor-pointer" onClick={() => handleOpenEditModal(ind)} />
                  <img src="/icons/trash.svg" title="Remove" className="w-5 h-5 cursor-pointer" onClick={() => setIndicatorToDelete(ind)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <EditIndicatorModal
          indicator={selectedIndicator}
          instances={instances}
          onClose={handleCloseModal}
          onSave={handleSaveIndicator}
        />
      )}
      
      {showKeyModal && keyModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full border border-gray-700">
            <h3 className="text-xl font-semibold mb-1 text-white">
              Indicator Key
            </h3>
            <p className="text-sm text-gray-400 mb-6 font-mono">
              {keyModalData.name} ({keyModalData.id})
            </p>
            
            {isLoadingKey ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                <p className="ml-4 text-gray-300">Loading key...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Message to Copy</label>
                  <div className="flex items-center gap-2">
                    <input type={revealKey ? 'text' : 'password'} readOnly value={`key:${keyModalData.key || ''},side:${keyModalData.side}`} className="flex-grow p-2 rounded bg-gray-900 text-white font-mono" />
                    <div className="flex items-center space-x-2">
                      <img src={revealKey ? '/icons/eye-off.svg' : '/icons/eye.svg'} alt="Show/Hide" title="Show/Hide" className="w-6 h-6 cursor-pointer" onClick={() => setRevealKey(!revealKey)} />
                      <img src={copySuccess ? '/icons/check.svg' : '/icons/copy.svg'} alt={copySuccess ? 'Copied!' : 'Copy'} title={copySuccess ? 'Copied!' : 'Copy'} className={`w-5 h-5 ${copySuccess ? '' : 'cursor-pointer'}`} onClick={handleCopyKey} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Key Only</label>
                  <div className="flex items-center gap-2">
                    <input type={revealKey ? 'text' : 'password'} readOnly value={keyModalData.key || ''} className="flex-grow p-2 rounded bg-gray-900 text-white font-mono" />
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowKeyModal(false)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white transition-colors" disabled={isLoadingKey}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {indicatorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
                {isDeleting ? (
                  <div className="flex flex-col items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                    <p className="mt-4 text-gray-300">Deleting indicator...</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-white">Confirm Deletion</h3>
                    <p className="text-gray-300 my-4">
                        Are you sure you want to delete the indicator?
                        <br />
                        <strong className="font-mono text-cyan-400">{indicatorToDelete.name} (ID: {indicatorToDelete.id})</strong>
                    </p>
                    <p className="text-sm text-amber-400">This action cannot be undone.</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={() => setIndicatorToDelete(null)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md text-white transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-md text-white transition-colors">
                            Delete
                        </button>
                    </div>
                  </>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

export default IndicatorsPage;
