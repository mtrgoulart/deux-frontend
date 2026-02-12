import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';

function StrategySearchModal({ show, onClose, onSelectStrategy, side }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sideLabel = side === 'buy' ? t('instance.formBuy') : t('instance.formSell');

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

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface border border-border rounded-lg shadow-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-content-primary mb-4">
          {t('instance.searchModalTitle', { side: sideLabel })}
        </h3>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('instance.searchModalPlaceholder')}
            className="w-full px-4 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm
                     placeholder-content-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded text-sm
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '...' : t('instance.searchModalSearch')}
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {results.length > 0 && (
            <ul className="divide-y divide-border-subtle">
              {results.map(strategy => (
                <li
                  key={strategy.id}
                  onClick={() => onSelectStrategy(strategy)}
                  className="px-3 py-2 hover:bg-surface-raised/50 cursor-pointer text-content-primary text-sm transition-colors"
                >
                  {strategy.name} ({strategy.id})
                </li>
              ))}
            </ul>
          )}
          {!isLoading && results.length === 0 && query && (
            <p className="text-center text-content-muted text-sm py-4">
              {t('instance.searchModalNoResults')}
            </p>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-raised border border-border text-content-secondary rounded text-sm
                     hover:bg-surface-raised/80 hover:text-content-primary transition-colors"
          >
            {t('instance.searchModalClose')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StrategySearchModal;
