import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

// Icon components for better visual design
const Icons = {
  Instance: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  ApiKey: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  Strategy: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Symbol: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Add: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  Buy: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
    </svg>
  ),
  Sell: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
};

function CorrectedInstanceCreation({ 
  showAddForm, 
  setShowAddForm, 
  onInstanceCreated 
}) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [formState, setFormState] = useState({
    name: '',
    api_key: '',
    symbol: '',
    strategy_buy: '',
    strategy_sell: '',
    status: 1
  });

  // API Keys data
  const { data: apiKeys = [] } = useQuery({
    queryKey: ['user_apikeys'],
    queryFn: async () => {
      const res = await apiFetch('/get_user_apikeys');
      const data = await res.json();
      return data.user_apikeys || [];
    },
  });

  // Exchanges data for API Key creation
  const { data: exchanges = [] } = useQuery({
    queryKey: ['exchanges'],
    queryFn: async () => {
      const res = await apiFetch('/get_exchanges');
      const data = await res.json();
      return data.exchanges || [];
    },
  });

  // Strategies data
  const { data: strategies = [] } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const res = await apiFetch('/get_strategies');
      const data = await res.json();
      return data.strategies || [];
    },
  });

  // Symbol search state
  const [symbolSuggestions, setSymbolSuggestions] = useState([]);
  const [symbolSearchTimeout, setSymbolSearchTimeout] = useState(null);
  const [isSearchingSymbols, setIsSearchingSymbols] = useState(false);

  // Strategy search and filtering
  const [strategySearchBuy, setStrategySearchBuy] = useState('');
  const [strategySearchSell, setStrategySearchSell] = useState('');
  
  // Filter strategies by side and search term
  const buyStrategies = strategies.filter(s => 
    s.side === 'buy' && 
    s.name.toLowerCase().includes(strategySearchBuy.toLowerCase())
  );
  
  const sellStrategies = strategies.filter(s => 
    s.side === 'sell' && 
    s.name.toLowerCase().includes(strategySearchSell.toLowerCase())
  );

  // New API Key form state
  const [showAddApiKey, setShowAddApiKey] = useState(false);
  const [newApiKeyForm, setNewApiKeyForm] = useState({
    name: '',
    exchange_id: '',
    api_key: '',
    secret_key: ''
  });
  const [extraParams, setExtraParams] = useState([]);

  // New Strategy form state
  const [showAddStrategy, setShowAddStrategy] = useState(false);
  const [newStrategyForm, setNewStrategyForm] = useState({
    name: '',
    side: 'buy',
    strategy: uuidv4(),
    percent: '',
    condition_limit: '',
    interval: '',
    simultaneous_operations: '',
    tp: '',
    sl: ''
  });
  const [strategyType, setStrategyType] = useState(''); // 'buy' or 'sell'
  const [strategyFormErrors, setStrategyFormErrors] = useState({});

  // Loading states
  const [loadingSave, setLoadingSave] = useState(false);

  const steps = [
    { id: 1, title: 'Instance Details', icon: Icons.Instance },
    { id: 2, title: 'API Key', icon: Icons.ApiKey },
    { id: 3, title: 'Trading Symbol', icon: Icons.Symbol },
    { id: 4, title: 'Strategies', icon: Icons.Strategy }
  ];

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

  // API Key extra parameters handlers
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

  // Strategy form validation
  const validateStrategyForm = () => {
    const errors = {};
    if (!newStrategyForm.name) errors.name = 'Campo obrigatório';
    if (!newStrategyForm.side) errors.side = 'Campo obrigatório';
    if (!newStrategyForm.percent) errors.percent = 'Campo obrigatório';
    if (!newStrategyForm.condition_limit) errors.condition_limit = 'Campo obrigatório';
    if (!newStrategyForm.interval) errors.interval = 'Campo obrigatório';
    if (!newStrategyForm.simultaneous_operations) errors.simultaneous_operations = 'Campo obrigatório';
    if (!newStrategyForm.tp) errors.tp = 'Campo obrigatório';
    if (!newStrategyForm.sl) errors.sl = 'Campo obrigatório';
    setStrategyFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add new API Key mutation
  const addApiKeyMutation = useMutation({
    mutationFn: async () => {
      const additional = Object.fromEntries(extraParams.map(p => [p.key, p.value]));
      const res = await apiFetch('/save_user_apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newApiKeyForm.name,
          exchange_id: newApiKeyForm.exchange_id,
          api_credentials: {
            api_key: newApiKeyForm.api_key,
            secret_key: newApiKeyForm.secret_key,
            ...additional,
          },
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['user_apikeys']);
      // Try to get the new API key ID from the response or refetch the list
      setTimeout(() => {
        queryClient.refetchQueries(['user_apikeys']).then(() => {
          const updatedKeys = queryClient.getQueryData(['user_apikeys']) || [];
          const newKey = updatedKeys.find(key => key.name === newApiKeyForm.name);
          if (newKey) {
            setFormState(prev => ({ ...prev, api_key: newKey.api_key_id }));
          }
        });
      }, 100);
      
      setShowAddApiKey(false);
      setNewApiKeyForm({ name: '', exchange_id: '', api_key: '', secret_key: '' });
      setExtraParams([]);
    }
  });

  // Add new Strategy mutation
  const addStrategyMutation = useMutation({
    mutationFn: async () => {
      if (!validateStrategyForm()) return;
      
      const payload = {
        ...newStrategyForm,
        percent: newStrategyForm.percent / 100,
        tp: newStrategyForm.tp / 100,
        sl: newStrategyForm.sl / 100,
      };
      
      const res = await apiFetch('/save_strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['strategies']);
      if (data.strategy_id) {
        if (strategyType === 'buy') {
          setFormState(prev => ({ ...prev, strategy_buy: data.strategy_id }));
        } else {
          setFormState(prev => ({ ...prev, strategy_sell: data.strategy_id }));
        }
      }
      setShowAddStrategy(false);
      setNewStrategyForm({
        name: '',
        side: 'buy',
        strategy: uuidv4(),
        percent: '',
        condition_limit: '',
        interval: '',
        simultaneous_operations: '',
        tp: '',
        sl: ''
      });
      setStrategyType('');
      setStrategyFormErrors({});
    }
  });

  // Save instance mutation
  const saveInstanceMutation = useMutation({
    mutationFn: async () => {
      setLoadingSave(true);
      const payload = {
        ...formState,
        strategies: [formState.strategy_buy, formState.strategy_sell].filter(Boolean),
      };
      delete payload.strategy_buy;
      delete payload.strategy_sell;

      const res = await apiFetch('/save_instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      setLoadingSave(false);
      onInstanceCreated();
      resetForm();
    },
    onError: () => {
      setLoadingSave(false);
    }
  });

  const resetForm = () => {
    setShowAddForm(false);
    setCurrentStep(1);
    setFormState({
      name: '',
      api_key: '',
      symbol: '',
      strategy_buy: '',
      strategy_sell: '',
      status: 1
    });
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: return formState.name.trim().length > 0;
      case 2: return formState.api_key !== '';
      case 3: return formState.symbol !== '';
      case 4: return formState.strategy_buy || formState.strategy_sell;
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Icons.Instance />
              <h3 className="text-xl font-semibold mt-2">Instance Details</h3>
              <p className="text-gray-400 text-sm">Give your trading instance a memorable name</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Instance Name
              </label>
              <input
                type="text"
                value={formState.name}
                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value.trimStart() }))}
                placeholder="e.g., BTC Scalping Bot"
                className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                maxLength={255}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Choose a descriptive name for your trading instance
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Icons.ApiKey />
              <h3 className="text-xl font-semibold mt-2">API Key Selection</h3>
              <p className="text-gray-400 text-sm">Choose which exchange API key to use</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select API Key
              </label>
              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div
                    key={key.api_key_id}
                    onClick={() => setFormState(prev => ({ ...prev, api_key: key.api_key_id }))}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formState.api_key === key.api_key_id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{key.name}</p>
                        <p className="text-sm text-gray-400">Exchange: {key.exchange_name}</p>
                        <p className="text-sm text-gray-400">ID: {key.api_key_id}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        formState.api_key === key.api_key_id 
                          ? 'bg-cyan-500 border-cyan-500' 
                          : 'border-gray-400'
                      }`} />
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => setShowAddApiKey(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-500 rounded-lg hover:border-cyan-500 transition-all flex items-center justify-center space-x-2 text-cyan-400 hover:text-cyan-300"
                >
                  <Icons.Add />
                  <span>Add New API Key</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Icons.Symbol />
              <h3 className="text-xl font-semibold mt-2">Trading Symbol</h3>
              <p className="text-gray-400 text-sm">Select the cryptocurrency pair to trade</p>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Symbol
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formState.symbol}
                  onChange={(e) => handleSymbolSearch(e.target.value)}
                  placeholder="Search for trading pairs (e.g., BTCUSDT)"
                  className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  autoComplete="off"
                />
                <div className="absolute left-3 top-3 text-gray-400">
                  <Icons.Search />
                </div>
                
                {isSearchingSymbols && (
                  <div className="absolute right-3 top-3 text-cyan-400 animate-spin">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>

              {symbolSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {symbolSuggestions.map((symbol, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setFormState(prev => ({ ...prev, symbol }));
                        setSymbolSuggestions([]);
                      }}
                      className="px-4 py-3 hover:bg-cyan-600/20 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{symbol}</span>
                        <span className="text-xs text-gray-400">Trading Pair</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Icons.Strategy />
              <h3 className="text-xl font-semibold mt-2">Trading Strategies</h3>
              <p className="text-gray-400 text-sm">Configure your buy and sell strategies</p>
            </div>

            {/* Buy Strategy */}
            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Icons.Buy />
                </div>
                <h4 className="font-medium text-green-400">Buy Strategy</h4>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Search existing buy strategies..."
                  value={strategySearchBuy}
                  onChange={(e) => setStrategySearchBuy(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                
                {buyStrategies.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border border-gray-600 rounded-lg">
                    {buyStrategies.map((strategy) => (
                      <div
                        key={strategy.id}
                        onClick={() => setFormState(prev => ({ ...prev, strategy_buy: strategy.id }))}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0 ${
                          formState.strategy_buy === strategy.id 
                            ? 'bg-green-600/20' 
                            : 'hover:bg-green-600/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{strategy.name}</span>
                          <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">
                            BUY
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  setStrategyType('buy');
                  setNewStrategyForm(prev => ({ ...prev, side: 'buy', strategy: uuidv4() }));
                  setShowAddStrategy(true);
                }}
                className="mt-3 w-full p-2 border border-dashed border-green-500 rounded text-green-400 hover:bg-green-500/10 transition-all flex items-center justify-center space-x-2"
              >
                <Icons.Add />
                <span>Create New Buy Strategy</span>
              </button>
            </div>

            {/* Sell Strategy */}
            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Icons.Sell />
                </div>
                <h4 className="font-medium text-red-400">Sell Strategy</h4>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Search existing sell strategies..."
                  value={strategySearchSell}
                  onChange={(e) => setStrategySearchSell(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                
                {sellStrategies.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border border-gray-600 rounded-lg">
                    {sellStrategies.map((strategy) => (
                      <div
                        key={strategy.id}
                        onClick={() => setFormState(prev => ({ ...prev, strategy_sell: strategy.id }))}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0 ${
                          formState.strategy_sell === strategy.id 
                            ? 'bg-red-600/20' 
                            : 'hover:bg-red-600/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{strategy.name}</span>
                          <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded">
                            SELL
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  setStrategyType('sell');
                  setNewStrategyForm(prev => ({ ...prev, side: 'sell', strategy: uuidv4() }));
                  setShowAddStrategy(true);
                }}
                className="mt-3 w-full p-2 border border-dashed border-red-500 rounded text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center space-x-2"
              >
                <Icons.Add />
                <span>Create New Sell Strategy</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!showAddForm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Create New Instance</h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                  currentStep >= step.id 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <step.icon />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 transition-all ${
                    currentStep > step.id ? 'bg-cyan-500' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-gray-700 flex justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg transition-all ${
              currentStep === 1
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceedToNextStep()}
              className={`px-6 py-2 rounded-lg transition-all ${
                canProceedToNextStep()
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => saveInstanceMutation.mutate()}
              disabled={!canProceedToNextStep() || loadingSave}
              className={`px-6 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                canProceedToNextStep() && !loadingSave
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loadingSave ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Instance</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Add API Key Modal */}
      {showAddApiKey && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-60">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Add New API Key</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="API Key Name"
                value={newApiKeyForm.name}
                onChange={(e) => setNewApiKeyForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 rounded bg-gray-700 text-white"
                required
              />
              
              <select
                value={newApiKeyForm.exchange_id}
                onChange={(e) => setNewApiKeyForm(prev => ({ ...prev, exchange_id: e.target.value }))}
                className="w-full p-3 rounded bg-gray-700 text-white"
                required
              >
                <option value="">Select Exchange</option>
                {exchanges.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="API Key"
                value={newApiKeyForm.api_key}
                onChange={(e) => setNewApiKeyForm(prev => ({ ...prev, api_key: e.target.value }))}
                className="w-full p-3 rounded bg-gray-700 text-white"
                required
              />
              
              <input
                type="text"
                placeholder="Secret Key"
                value={newApiKeyForm.secret_key}
                onChange={(e) => setNewApiKeyForm(prev => ({ ...prev, secret_key: e.target.value }))}
                className="w-full p-3 rounded bg-gray-700 text-white"
                required
              />
            </div>

            {/* Extra Parameters */}
            <div className="mt-4">
              <h4 className="mb-2 text-sm text-gray-300">Additional Parameters</h4>
              {extraParams.map((param, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    placeholder="Key" 
                    value={param.key} 
                    onChange={(e) => handleExtraParamChange(index, 'key', e.target.value)} 
                    className="flex-1 p-2 rounded bg-gray-700 text-white" 
                  />
                  <input 
                    type="text" 
                    placeholder="Value" 
                    value={param.value} 
                    onChange={(e) => handleExtraParamChange(index, 'value', e.target.value)} 
                    className="flex-1 p-2 rounded bg-gray-700 text-white" 
                  />
                  <button 
                    type="button" 
                    onClick={() => removeExtraParam(index)} 
                    className="bg-red-500 hover:bg-red-600 px-3 rounded text-white"
                  >
                    X
                  </button>
                </div>
              ))}
              <button 
                type="button" 
                onClick={addExtraParam} 
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white"
              >
                + Add Parameter
              </button>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowAddApiKey(false);
                  setNewApiKeyForm({ name: '', exchange_id: '', api_key: '', secret_key: '' });
                  setExtraParams([]);
                }}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => addApiKeyMutation.mutate()}
                disabled={!newApiKeyForm.name || !newApiKeyForm.exchange_id || !newApiKeyForm.api_key || !newApiKeyForm.secret_key}
                className="px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-700 disabled:bg-gray-600"
              >
                Add API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Strategy Modal */}
      {showAddStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-60">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              Create New {strategyType === 'buy' ? 'Buy' : 'Sell'} Strategy
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300">Name</label>
                <input
                  type="text"
                  placeholder="Strategy Name"
                  value={newStrategyForm.name}
                  onChange={(e) => setNewStrategyForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full p-3 rounded bg-gray-700 text-white ${strategyFormErrors.name ? 'border border-red-500' : ''}`}
                />
                {strategyFormErrors.name && <p className="text-red-400 text-sm">{strategyFormErrors.name}</p>}
              </div>

              <div>
                <label className="text-sm text-gray-300">Side</label>
                <select
                  value={newStrategyForm.side}
                  onChange={(e) => setNewStrategyForm(prev => ({ ...prev, side: e.target.value }))}
                  className={`w-full p-3 rounded bg-gray-700 text-white ${strategyFormErrors.side ? 'border border-red-500' : ''}`}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
                {strategyFormErrors.side && <p className="text-red-400 text-sm">{strategyFormErrors.side}</p>}
              </div>

              <div className="col-span-2">
                <label className="text-sm text-gray-300">UUID</label>
                <input
                  value={newStrategyForm.strategy}
                  readOnly
                  className="w-full p-3 rounded bg-gray-700 text-white opacity-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Percentage (%)</label>
                <input
                  type="number"
                  value={newStrategyForm.percent}
                  onChange={(e) => {
                    let value = parseFloat(e.target.value);
                    if (isNaN(value)) value = '';
                    else if (value > 100) value = 100;
                    else if (value < 0) value = 0;
                    setNewStrategyForm(prev => ({ ...prev, percent: value }));
                  }}
                  className={`w-full p-3 rounded bg-gray-700 text-white ${strategyFormErrors.percent ? 'border border-red-500' : ''}`}
                />
                {strategyFormErrors.percent && <p className="text-red-400 text-sm">{strategyFormErrors.percent}</p>}
              </div>

              <div>
                <label className="text-sm text-gray-300">Condition Limit</label>
                <input
                  type="number"
                  value={newStrategyForm.condition_limit}
                  onChange={(e) => {
                    let value = parseFloat(e.target.value);
                    if (isNaN(value)) value = '';
                    else if (value > 100) value = 100;
                    else if (value < 0) value = 0;
                    setNewStrategyForm(prev => ({ ...prev, condition_limit: value }));
                  }}
                  className={`w-full p-3 rounded bg-gray-700 text-white ${strategyFormErrors.condition_limit ? 'border border-red-500' : ''}`}
                />
                {strategyFormErrors.condition_limit && <p className="text-red-400 text-sm">{strategyFormErrors.condition_limit}</p>}
              </div>

              <div>
                <label className="text-sm text-gray-300">Interval (min)</label>
                <input
                  type="number"
                  value={newStrategyForm.interval}
                  onChange={(e) => {
                    let value = parseFloat(e.target.value);
                    if (isNaN(value) || value < 0) value = '';
                    setNewStrategyForm(prev => ({ ...prev, interval: value }));
                  }}
                  className={`w-full p-3 rounded bg-gray-700 text-white ${strategyFormErrors.interval ? 'border border-red-500' : ''}`}
                />
                {strategyFormErrors.interval && <p className="text-red-400 text-sm">{strategyFormErrors.interval}</p>}
              </div>

              <div>
                <label className="text-sm text-gray-300">Simultaneous Operations</label>
                <input
                  type="number"
                  value={newStrategyForm.simultaneous_operations}
                  onChange={(e) => {
                    let value = parseFloat(e.target.value);
                    if (isNaN(value)) value = '';
                    else if (value > 100) value = 100;
                    else if (value < 0) value = 0;
                    setNewStrategyForm(prev => ({ ...prev, simultaneous_operations: value }));
                  }}
                  className={`w-full p-3 rounded bg-gray-700 text-white ${strategyFormErrors.simultaneous_operations ? 'border border-red-500' : ''}`}
                />
                {strategyFormErrors.simultaneous_operations && <p className="text-red-400 text-sm">{strategyFormErrors.simultaneous_operations}</p>}
              </div>

              <div>
                <label className="text-sm text-gray-300">Take Profit (%)</label>
                <input
                  type="number"
                  value={newStrategyForm.tp}
                  onChange={(e) => {
                    let value = parseFloat(e.target.value);
                    if (isNaN(value)) value = '';
                    else if (value > 100) value = 100;
                    else if (value < 0) value = 0;
                    setNewStrategyForm(prev => ({ ...prev, tp: value }));
                  }}
                  className={`w-full p-3 rounded bg-gray-700 text-white ${strategyFormErrors.tp ? 'border border-red-500' : ''}`}
                />
                {strategyFormErrors.tp && <p className="text-red-400 text-sm">{strategyFormErrors.tp}</p>}
              </div>

              <div>
                <label className="text-sm text-gray-300">Stop Loss (%)</label>
                <input
                  type="number"
                  value={newStrategyForm.sl}
                  onChange={(e) => {
                    let value = parseFloat(e.target.value);
                    if (isNaN(value)) value = '';
                    else if (value > 100) value = 100;
                    else if (value < 0) value = 0;
                    setNewStrategyForm(prev => ({ ...prev, sl: value }));
                  }}
                  className={`w-full p-3 rounded bg-gray-700 text-white ${strategyFormErrors.sl ? 'border border-red-500' : ''}`}
                />
                {strategyFormErrors.sl && <p className="text-red-400 text-sm">{strategyFormErrors.sl}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowAddStrategy(false);
                  setNewStrategyForm({
                    name: '',
                    side: 'buy',
                    strategy: uuidv4(),
                    percent: '',
                    condition_limit: '',
                    interval: '',
                    simultaneous_operations: '',
                    tp: '',
                    sl: ''
                  });
                  setStrategyFormErrors({});
                }}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => addStrategyMutation.mutate()}
                className="px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-700"
              >
                Create Strategy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorrectedInstanceCreation;
