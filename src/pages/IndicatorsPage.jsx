// src/pages/IndicatorsPage.jsx
import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

function IndicatorsPage() {
  const [indicators, setIndicators] = useState([]);
  const [instances, setInstances] = useState([]);
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

  const fetchInstances = async () => {
    const res = await apiFetch('/get_instances?api_key_id=all');
    const data = await res.json();
    setInstances(data.instances || []);
  };

  useEffect(() => {
    fetchIndicators();
    fetchInstances();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente remover este indicador?')) return;
    await apiFetch('/remove_indicator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchIndicators();
  };

  const handleAddIndicator = async () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Campo obrigatório';
    if (!formData.instance_id) errors.instance_id = 'Campo obrigatório';
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
        console.error('Erro ao buscar a chave:', data.error);
        alert(data.error || 'Erro ao buscar a chave do indicador.');
        setShowKeyModal(false);
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
      alert('Erro ao conectar com o servidor.');
      setShowKeyModal(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Indicadores</h2>
        <button onClick={() => setShowAddForm(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded">
          Adicionar Indicador
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-700 p-4 mb-6 rounded">
          <h3 className="text-xl mb-4">Novo Indicador</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300">Nome</label>
              <input
                className={`w-full p-2 rounded bg-gray-800 text-white ${formErrors.name ? 'border border-red-500' : ''}`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do indicador"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Instância</label>
              <select
                className={`w-full p-2 rounded bg-gray-800 text-white ${formErrors.instance_id ? 'border border-red-500' : ''}`}
                value={formData.instance_id}
                onChange={(e) => setFormData({ ...formData, instance_id: e.target.value })}
              >
                <option value="">Selecione</option>
                {instances.map(inst => (
                  <option key={inst.id} value={inst.id}>({inst.id}) - {inst.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-300">Obrigatório?</label>
              <input
                type="checkbox"
                checked={formData.mandatory}
                onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                className="ml-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={handleAddIndicator} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">Salvar</button>
            <button onClick={() => setShowAddForm(false)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded">
          <thead className="bg-gray-700 text-left">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Instância</th>
              <th className="px-4 py-2">Obrigatório</th>
              <th className="px-4 py-2">Criado em</th>
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map(ind => (
              <tr key={ind.id} className="border-t border-gray-700">
                <td className="px-4 py-2">{ind.id}</td>
                <td className="px-4 py-2">{ind.name}</td>
                <td className="px-4 py-2">{ind.instance_id}</td>
                <td className="px-4 py-2">{ind.mandatory ? 'Sim' : 'Não'}</td>
                <td className="px-4 py-2">{new Date(ind.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 flex gap-2">
                <img
                  src="/icons/view.svg"
                  title="Ver chave"
                  className="w-5 h-5 cursor-pointer"
                  onClick={() => handleViewKey(ind.id)}
                />
                  <img src="/icons/config.svg" title="Configurar" className="w-5 h-5 cursor-pointer" onClick={() => alert('Em desenvolvimento')} />
                  <img src="/icons/trash.svg" title="Remover" className="w-5 h-5 cursor-pointer" onClick={() => handleDelete(ind.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-white">Chave do Indicador</h3>
            <div className="relative">
              <input
                type={revealKey ? 'text' : 'password'}
                readOnly
                value={selectedKey}
                className="w-full p-2 rounded bg-gray-700 text-white pr-10"
              />
              <img
                src={revealKey ? '/icons/eye-off.svg' : '/icons/eye.svg'}
                alt="Mostrar/Ocultar"
                className="absolute top-2 right-2 w-6 h-6 cursor-pointer"
                onClick={() => setRevealKey(!revealKey)}
              />
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowKeyModal(false)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndicatorsPage;