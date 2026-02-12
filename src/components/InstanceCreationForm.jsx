import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import { FullScreenLoader } from './FullScreenLoader';
import StrategySearchModal from './StrategySearchModal';

function StrategyDetailsCard({ strategy, onClear }) {
  const { t } = useTranslation();
  if (!strategy) return null;

  const sizeMode = strategy.size_mode || 'percentage';
  const isFlatValue = sizeMode === 'flat_value';

  const formattedSizing = isFlatValue
    ? `$${parseFloat(strategy.flat_value || 0).toFixed(2)}`
    : ((percentValue) => {
        const num = parseFloat(percentValue);
        return !isNaN(num) ? `${num * 100}%` : 'N/A';
      })(strategy.percent);

  return (
    <div className="bg-surface-raised border border-border-subtle p-3 rounded-md animate-fade-in transition-all duration-300">
      <div className="flex justify-between items-center mb-2">
        <h5 className="font-bold text-content-primary truncate" title={strategy.name}>
          {strategy.name} <span className="text-content-muted font-normal">({strategy.id})</span>
        </h5>
        <button onClick={() => onClear(strategy.side)} className="text-danger hover:text-danger/80 font-bold text-xl px-2">
          &times;
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="bg-surface-primary border border-border-subtle p-2 rounded">
          <p className="text-content-muted">{isFlatValue ? t('instance.strategyDetailsFlatValue') : t('instance.strategyDetailsOperationPercent')}</p>
          <p className="font-semibold text-content-primary">{formattedSizing}</p>
        </div>
        <div className="bg-surface-primary border border-border-subtle p-2 rounded">
          <p className="text-content-muted">{t('instance.strategyDetailsConditionLimit')}</p>
          <p className="font-semibold text-content-primary">{strategy.condition_limit ?? 'N/A'}</p>
        </div>
        <div className="bg-surface-primary border border-border-subtle p-2 rounded">
          <p className="text-content-muted">{t('instance.strategyDetailsIntervalMinutes')}</p>
          <p className="font-semibold text-content-primary">{strategy.interval ?? 'N/A'}</p>
        </div>
        {strategy.side === 'buy' && (
          <div className="bg-surface-primary border border-border-subtle p-2 rounded">
            <p className="text-content-muted">{t('instance.strategyDetailsSimultaneousOps')}</p>
            <p className="font-semibold text-content-primary">{strategy.simultaneous_operations ?? 'N/A'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StrategySelector({ side, isLoading, selectedStrategy, recentSuggestions, onSelect, onClear, onSearch }) {
  const { t } = useTranslation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sideTitle = side === 'buy' ? t('instance.formBuy') : t('instance.formSell');

  const isBuy = side === 'buy';
  const themeClasses = {
    border: isBuy ? 'border-success/20' : 'border-danger/20',
    title: isBuy ? 'text-success' : 'text-danger',
    searchButton: isBuy ? 'text-success hover:text-success/80' : 'text-danger hover:text-danger/80',
    suggestionHover: isBuy ? 'hover:bg-success-muted' : 'hover:bg-danger-muted',
  };

  return (
    <div className={`border ${themeClasses.border} p-4 rounded-md space-y-2 min-h-[120px]`}>
      <h4 className={`text-lg font-semibold ${themeClasses.title}`}>{sideTitle}</h4>

      {isLoading ? (
        <div className="p-3 rounded bg-surface-raised animate-pulse w-full"><div className="h-4 bg-surface-primary rounded w-3/4"></div></div>
      ) : !selectedStrategy ? (
        <div className="relative">
          <div
            className="w-full p-2 rounded bg-surface-raised text-content-muted cursor-pointer text-left text-sm"
            onClick={() => setShowSuggestions(prev => !prev)}
          >
            {t('instance.formSelectConfig')}
          </div>
          <button
            onClick={onSearch}
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm font-semibold ${themeClasses.searchButton}`}
          >
            {t('instance.formSearch')}
          </button>
          {showSuggestions && (
            <ul className="absolute z-10 w-full bg-surface border border-border mt-1 rounded max-h-40 overflow-y-auto shadow-lg">
              {recentSuggestions.length > 0 ? (
                recentSuggestions.map(s => (
                  <li
                    key={s.id}
                    onClick={() => { onSelect(s); setShowSuggestions(false); }}
                    className={`px-3 py-2 cursor-pointer text-content-primary text-sm ${themeClasses.suggestionHover}`}
                  >
                    {s.name} ({s.id})
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-content-muted text-sm">{t('instance.formNoConfig')}</li>
              )}
            </ul>
          )}
        </div>
      ) : (
        <StrategyDetailsCard strategy={selectedStrategy} onClear={onClear} />
      )}
    </div>
  );
}

function InstanceCreationForm({ show, onClose, apiKeys, initialData, selectedApiKey }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState(initialData);
  const [selectedStrategies, setSelectedStrategies] = useState({ buy: null, sell: null });
  const [recentSuggestions, setRecentSuggestions] = useState({ buy: [], sell: [] });
  const [isSearchModalOpen, setIsSearchModalOpen] = useState({ buy: false, sell: false });
  const [symbolSuggestions, setSymbolSuggestions] = useState([]);
  const [isSearchingSymbols, setIsSearchingSymbols] = useState(false);
  const [symbolSearchTimeout, setSymbolSearchTimeout] = useState(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [isStrategyLoading, setIsStrategyLoading] = useState({ buy: false, sell: false });
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [existingSharingId, setExistingSharingId] = useState(null);

  const fetchStrategyDetails = async (strategy) => {
    if (!strategy || !strategy.id) return;
    setIsStrategyLoading(prev => ({ ...prev, [strategy.side]: true }));
    try {
      const res = await apiFetch(`/get_strategy_parameters?id=${strategy.id}`);
      const data = await res.json();
      if (res.ok) {
        const detailedStrategy = { ...data, side: strategy.side };
        setSelectedStrategies(prev => ({ ...prev, [strategy.side]: detailedStrategy }));
        setFormState(prev => ({ ...prev, [`strategy_${strategy.side}`]: strategy.id }));
      }
    } catch (error) {
      console.error("Failed to fetch strategy details:", error);
    } finally {
      setIsStrategyLoading(prev => ({ ...prev, [strategy.side]: false }));
    }
  };

  const handleClearStrategy = (side) => {
    setSelectedStrategies(prev => ({ ...prev, [side]: null }));
    setFormState(prev => ({ ...prev, [`strategy_${side}`]: '' }));
  };

  const handleSymbolSearch = (value) => {
    setFormState(prev => ({ ...prev, symbol: value }));
    if (symbolSearchTimeout) clearTimeout(symbolSearchTimeout);
    setIsSearchingSymbols(true);
    const timeout = setTimeout(async () => {
      if (!value || !formState.api_key) {
        setSymbolSuggestions([]);
        setIsSearchingSymbols(false);
        return;
      }
      try {
        const res = await apiFetch(`/search_symbols?query=${value}&api_key_id=${formState.api_key}`);
        const data = await res.json();
        setSymbolSuggestions(data.symbols || []);
      } catch (e) {
        setSymbolSuggestions([]);
      } finally {
        setIsSearchingSymbols(false);
      }
    }, 300);
    setSymbolSearchTimeout(timeout);
  };

  useEffect(() => {
    if (initialData) {
      setFormState(initialData);
      if (initialData.strategy_buy) fetchStrategyDetails({ id: initialData.strategy_buy, side: 'buy' });
      if (initialData.strategy_sell) fetchStrategyDetails({ id: initialData.strategy_sell, side: 'sell' });
    }
  }, [initialData]);

  useEffect(() => {
    const fetchSharingStatus = async () => {
      if (initialData?.id) {
        try {
          const res = await apiFetch(`/get_instance_sharing?instance_id=${initialData.id}`);
          const data = await res.json();
          if (data.sharing) {
            setSharingEnabled(true);
            setExistingSharingId(data.sharing.id);
          } else {
            setSharingEnabled(false);
            setExistingSharingId(null);
          }
        } catch (error) {
          console.error("Failed to fetch sharing status:", error);
        }
      } else {
        setSharingEnabled(false);
        setExistingSharingId(null);
      }
    };
    fetchSharingStatus();
  }, [initialData]);

  useEffect(() => {
    const fetchRecent = async () => {
      if (show) {
        try {
          const res = await apiFetch('/get_recent_strategies');
          const data = await res.json();
          if (res.ok) setRecentSuggestions({ buy: data.buy || [], sell: data.sell || [] });
        } catch (error) { console.error("Failed to fetch recent strategies:", error); }
      }
    };
    fetchRecent();
  }, [show]);

  const mutation = useMutation({
    mutationFn: async () => {
      setLoadingSave(true);
      const route = formState.id ? '/update_instance' : '/save_instance';
      const payload = { ...formState };
      const res = await apiFetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save instance');
      }
      const result = await res.json();

      const instanceId = formState.id || result.instance_id;
      if (sharingEnabled && !existingSharingId && instanceId) {
        const sharingRes = await apiFetch('/save_sharing_instance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formState.name,
            instance_id: instanceId
          }),
        });
        if (!sharingRes.ok) {
          console.error('Failed to create sharing');
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instances', selectedApiKey]);
      onClose();
    },
    onError: (error) => {
      alert(t('instance.formSaveError', { message: error.message }));
    },
    onSettled: () => {
      setLoadingSave(false);
    }
  });

  if (!show) return null;

  return (
    <>
      <FullScreenLoader isOpen={loadingSave} message={t('instance.formSaving')} />
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
        <div className="bg-surface border border-border rounded-lg shadow-2xl p-6 w-full max-w-lg overflow-y-auto max-h-[90vh]">
          <h3 className="text-xl font-bold mb-6 text-content-primary">
            {formState.id ? t('instance.formTitleEdit') : t('instance.formTitleNew')}
          </h3>
          <div className="space-y-4">

            <div>
              <label htmlFor="strategy-name" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                {t('instance.formName')}
              </label>
              <input id="strategy-name" name="name" maxLength={255} value={formState.name || ''} onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))} placeholder={t('instance.formNamePlaceholder')}
                className="w-full px-4 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm
                         placeholder-content-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
            </div>

            <div>
              <label htmlFor="api-key-select" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                {t('instance.formApiKey')}
              </label>
              <select id="api-key-select" name="api_key" value={formState.api_key || ''} onChange={(e) => setFormState(prev => ({ ...prev, api_key: e.target.value }))}
                disabled={Boolean(formState.id)}
                className="w-full px-4 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm
                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50">
                <option value="">{t('instance.formSelectApiKey')}</option>
                {apiKeys.map(key => (<option key={key.api_key_id} value={key.api_key_id}>({key.api_key_id}) {key.name}</option>))}
              </select>
            </div>

            <div>
              <label htmlFor="symbol-search" className="block text-xs font-semibold text-content-accent mb-2 uppercase tracking-wider">
                {t('instance.formSymbol')}
              </label>
              <div className="relative">
                <input id="symbol-search" type="text" name="symbol" value={formState.symbol || ''} onChange={(e) => handleSymbolSearch(e.target.value)} placeholder={t('instance.formSymbolPlaceholder')}
                  className="w-full px-4 py-2 bg-surface-primary border border-border text-content-primary rounded text-sm
                           placeholder-content-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                {isSearchingSymbols && <div className="absolute right-3 top-2 text-xs text-content-muted animate-pulse">{t('instance.formSymbolSearching')}</div>}
                {symbolSuggestions.length > 0 && (
                  <ul className="absolute z-10 bg-surface border border-border mt-1 rounded w-full max-h-40 overflow-y-auto shadow-lg">
                    {symbolSuggestions.map((s, i) => (<li key={i} onClick={() => { setFormState(prev => ({ ...prev, symbol: s })); setSymbolSuggestions([]); }} className="px-3 py-2 hover:bg-surface-raised/50 cursor-pointer text-content-primary text-sm">{s}</li>))}
                  </ul>
                )}
              </div>
            </div>

            {/* Sharing Configuration */}
            <div className="border border-border-subtle p-4 rounded-md space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sharing-enabled"
                  checked={sharingEnabled}
                  onChange={(e) => setSharingEnabled(e.target.checked)}
                  disabled={!!existingSharingId}
                  className="w-4 h-4 rounded border-border bg-surface-primary text-accent focus:ring-accent disabled:opacity-50"
                />
                <label htmlFor="sharing-enabled" className="text-sm font-medium text-content-primary">
                  {t('instance.formSharing')}
                </label>
              </div>
              <p className="text-xs text-content-muted ml-7">
                {t('instance.formSharingDescription')}
              </p>
            </div>

            <StrategySelector side="buy" isLoading={isStrategyLoading.buy} selectedStrategy={selectedStrategies.buy} recentSuggestions={recentSuggestions.buy} onSelect={(strategy) => fetchStrategyDetails({ ...strategy, side: 'buy' })} onClear={handleClearStrategy} onSearch={() => setIsSearchModalOpen(prev => ({ ...prev, buy: true }))} />
            <StrategySelector side="sell" isLoading={isStrategyLoading.sell} selectedStrategy={selectedStrategies.sell} recentSuggestions={recentSuggestions.sell} onSelect={(strategy) => fetchStrategyDetails({ ...strategy, side: 'sell' })} onClear={handleClearStrategy} onSearch={() => setIsSearchModalOpen(prev => ({ ...prev, sell: true }))} />

            <div className="flex justify-end gap-4 mt-6">
              <button onClick={onClose}
                className="px-4 py-2 bg-surface-raised border border-border text-content-secondary rounded text-sm
                         hover:bg-surface-raised/80 hover:text-content-primary transition-colors">
                {t('instance.formCancel')}
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={loadingSave || isStrategyLoading.buy || isStrategyLoading.sell}
                className="px-4 py-2 font-semibold text-white rounded text-sm transition-all duration-300
                         bg-accent hover:bg-accent-hover border border-accent/50
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSave ? t('instance.formSaving') : (formState.id ? t('instance.formUpdate') : t('instance.formSave'))}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isSearchModalOpen.buy && (<StrategySearchModal show={isSearchModalOpen.buy} onClose={() => setIsSearchModalOpen(prev => ({ ...prev, buy: false }))} onSelectStrategy={(strategy) => { fetchStrategyDetails({ ...strategy, side: 'buy' }); setIsSearchModalOpen(prev => ({ ...prev, buy: false })); }} side="buy" />)}
      {isSearchModalOpen.sell && (<StrategySearchModal show={isSearchModalOpen.sell} onClose={() => setIsSearchModalOpen(prev => ({ ...prev, sell: false }))} onSelectStrategy={(strategy) => { fetchStrategyDetails({ ...strategy, side: 'sell' }); setIsSearchModalOpen(prev => ({ ...prev, sell: false })); }} side="sell" />)}
    </>
  );
}

export default InstanceCreationForm;
