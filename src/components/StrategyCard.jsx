// StrategyCard.jsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import MessageDisplay from './IndicatorManagement/MessageDisplay';
import IndicatorRow from './IndicatorRow';

function StrategyCard({ 
  strategy, 
  onStatusChange, 
  onDelete, 
  onEdit, // New prop for edit
  getStatusBadge, 
  formatDate,
  loadingStatusChange 
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    // Reset activeSection when expanded state changes
    setActiveSection('basic');
  }, [expanded]);

  const { data: indicators, isLoading: isLoadingIndicators } = useQuery({
    queryKey: ['indicators', strategy.id],
    queryFn: async () => {
      const res = await apiFetch(`/get_indicators_by_instance/${strategy.id}`);
      const data = await res.json();
      return data.indicators || [];
    },
    enabled: expanded,
  });

  // Get strategy configuration
  const { data: strategyConfig = {}, isLoading: isConfigLoading, error: configError } = useQuery({
    queryKey: ['strategy_config', strategy.strategy_buy, strategy.strategy_sell],
    queryFn: async () => {
      const res = await apiFetch('/get_strategies');
      const data = await res.json();
      const strategies = data.strategies || [];
      
      const buyStrategy = strategies.find(s => s.id === strategy.strategy_buy);
      const sellStrategy = strategies.find(s => s.id === strategy.strategy_sell);
      
      return {
        buy: buyStrategy || {},
        sell: sellStrategy || {}
      };
    },
    enabled: expanded,
  });

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const generateWebhookMessage = (type = 'all') => {
    const baseMessage = {
      symbol: strategy.symbol,
      strategy_id: strategy.id,
      action: type === 'buy' ? 'BUY' : type === 'sell' ? 'SELL' : 'SIGNAL'
    };
    
    return JSON.stringify(baseMessage, null, 2);
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: '📊' },
    { id: 'indicators', label: 'Indicators', icon: '⚙️' },
    { id: 'messages', label: 'Webhook Messages', icon: '🔗' }
  ];

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-2xl">
      {/* Strategy Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {strategy.name ? strategy.name.charAt(0).toUpperCase() : ''}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{strategy.name}</h3>
              <p className="text-gray-400 text-sm">ID: {strategy.id}</p>
            </div>
          </div>
          {getStatusBadge(strategy.status)}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            <span className="font-medium text-white">{strategy.symbol}</span> • 
            Created {formatDate(strategy.created_at)}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Control Buttons */}
            {strategy.status === 1 && (
              <button
                onClick={() => onStatusChange(strategy, 'start')}
                disabled={loadingStatusChange}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-6V7a2 2 0 00-2-2H5a2 2 0 00-2 2v3h14V7z" />
                </svg>
                <span>Start</span>
              </button>
            )}
            {strategy.status === 2 && (
              <button
                onClick={() => onStatusChange(strategy, 'stop')}
                disabled={loadingStatusChange}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9V10z" />
                </svg>
                <span>Stop</span>
              </button>
            )}

            {/* Edit Button */}
            <button
              onClick={() => onEdit(strategy)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              <span>Edit</span>
            </button>
            
            {/* Expand/Collapse Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
            >
              <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>{expanded ? 'Collapse' : 'Expand'}</span>
            </button>
            
            {/* Delete Button */}
            <button
              onClick={() => onDelete(strategy)}
              className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded text-sm transition-colors border border-red-600/30"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-6">
          {/* Section Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-900 p-1 rounded-lg">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span>{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </div>

          {/* Section Content */}
          <div className="min-h-[200px]">
            {activeSection === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Strategy Name</label>
                    <div className="bg-gray-700 p-3 rounded-lg text-white">{strategy.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Trading Symbol</label>
                    <div className="bg-gray-700 p-3 rounded-lg text-white">{strategy.symbol}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <div className="bg-gray-700 p-3 rounded-lg">{getStatusBadge(strategy.status)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Last Updated</label>
                    <div className="bg-gray-700 p-3 rounded-lg text-gray-300">{formatDate(strategy.updated_at)}</div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'indicators' && (
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-white text-lg font-semibold mb-4">Indicators</h3>
                  {isLoadingIndicators && (
                    <div className="text-center py-4 text-gray-400">
                      Loading indicators...
                    </div>
                  )}
                  {!isLoadingIndicators && indicators && indicators.length === 0 && (
                    <div className="text-center py-4 text-gray-400">
                      No indicators found for this instance.
                    </div>
                  )}
                  {!isLoadingIndicators && indicators && indicators.length > 0 && (
                    <div className="space-y-3">
                      {indicators.map(indicator => (
                        <IndicatorRow key={indicator.id} indicator={indicator} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'messages' && (
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-white text-lg font-semibold mb-4">Webhook Messages</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Copy Webhook Message</label>
                      <button
                        onClick={() => copyToClipboard(generateWebhookMessage())}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center justify-between"
                      >
                        <span>Copy Message</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StrategyCard;