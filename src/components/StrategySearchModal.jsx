import { useState } from 'react';
import { apiFetch } from '../utils/api';

function StrategySearchModal({ show, onClose, onSelectStrategy, side }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setIsLoading(true);
    try {
      const res = await apiFetch(`/search_strategies?query=${query}`);
      const data = await res.json();
      if (res.ok) {
        const filtered = (data.strategies || []).filter(s => s.side === side);
        setResults(filtered);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search failed", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Pesquisar Estratégia de {side === 'buy' ? 'Compra' : 'Venda'}</h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Digite o nome da estratégia..."
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
          <button onClick={handleSearch} disabled={isLoading} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded disabled:bg-gray-500">
            {isLoading ? '...' : 'Buscar'}
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {results.length > 0 && (
            <ul className="divide-y divide-gray-700">
              {results.map(strategy => (
                <li 
                  key={strategy.id} 
                  onClick={() => onSelectStrategy(strategy)}
                  className="p-3 hover:bg-gray-700 cursor-pointer"
                >
                  {/* ALTERAÇÃO AQUI */}
                  {strategy.name} ({strategy.id})
                </li>
              ))}
            </ul>
          )}
          {!isLoading && results.length === 0 && query && (
             <p className="text-center text-gray-400">Nenhum resultado encontrado.</p>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default StrategySearchModal;