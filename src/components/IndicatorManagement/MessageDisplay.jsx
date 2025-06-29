import { useState } from 'react';

function MessageDisplay({ 
  strategy, 
  buyIndicators, 
  sellIndicators, 
  copyToClipboard, 
  generateWebhookMessage 
}) {
  const [copiedMessage, setCopiedMessage] = useState('');

  const handleCopy = async (text, messageType) => {
    try {
      await copyToClipboard(text);
      setCopiedMessage(messageType);
      setTimeout(() => setCopiedMessage(''), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const generateBuyMessage = () => {
    return JSON.stringify({
      symbol: strategy.symbol,
      strategy_id: strategy.id,
      action: 'BUY',
      indicators_required: buyIndicators.length,
      mandatory_indicators: buyIndicators.filter(ind => ind.mandatory).map(ind => ind.indicator_key),
      webhook_url: `${window.location.origin}/api/webhook/${strategy.id}`,
      timestamp: new Date().toISOString()
    }, null, 2);
  };

  const generateSellMessage = () => {
    return JSON.stringify({
      symbol: strategy.symbol,
      strategy_id: strategy.id,
      action: 'SELL',
      indicator: sellIndicators[0]?.indicator_key || 'SELL_SIGNAL',
      webhook_url: `${window.location.origin}/api/webhook/${strategy.id}`,
      timestamp: new Date().toISOString()
    }, null, 2);
  };

  const generateCombinedMessage = () => {
    return JSON.stringify({
      symbol: strategy.symbol,
      strategy_id: strategy.id,
      buy_config: {
        action: 'BUY',
        indicators_required: buyIndicators.length,
        mandatory_indicators: buyIndicators.filter(ind => ind.mandatory).map(ind => ind.indicator_key),
        indicator_keys: buyIndicators.map(ind => ind.indicator_key)
      },
      sell_config: {
        action: 'SELL',
        indicator: sellIndicators[0]?.indicator_key || 'SELL_SIGNAL'
      },
      webhook_url: `${window.location.origin}/api/webhook/${strategy.id}`,
      generated_at: new Date().toISOString()
    }, null, 2);
  };

  const generateTradingViewAlert = (type) => {
    const baseMessage = {
      symbol: strategy.symbol,
      strategy: strategy.id,
      action: type.toUpperCase()
    };

    if (type === 'buy') {
      baseMessage.indicators = buyIndicators.map(ind => ind.indicator_key);
      baseMessage.required_count = buyIndicators.filter(ind => ind.mandatory).length;
    } else if (type === 'sell') {
      baseMessage.indicator = sellIndicators[0]?.indicator_key || 'SELL_SIGNAL';
    }

    return JSON.stringify(baseMessage);
  };

  const CopyButton = ({ onClick, copied, children, variant = 'primary' }) => {
    const baseClasses = "px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2";
    const variants = {
      primary: `${baseClasses} bg-cyan-600 hover:bg-cyan-700 text-white`,
      secondary: `${baseClasses} bg-gray-600 hover:bg-gray-700 text-white`,
      success: `${baseClasses} bg-green-600 text-white`
    };

    return (
      <button
        onClick={onClick}
        className={copied ? variants.success : variants[variant]}
      >
        {copied ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Copied!</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{children}</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-white">Auto-Generated Webhook Messages</h4>

      {/* BUY Message */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">BUY</span>
            <h5 className="text-white font-medium">Entry Signal Message</h5>
          </div>
          <CopyButton
            onClick={() => handleCopy(generateBuyMessage(), 'buy')}
            copied={copiedMessage === 'buy'}
          >
            Copy BUY
          </CopyButton>
        </div>
        <pre className="bg-gray-800 p-3 rounded text-sm text-gray-300 overflow-x-auto">
          {generateBuyMessage()}
        </pre>
        <p className="text-xs text-gray-400 mt-2">
          📈 Use this message for TradingView alerts that trigger BUY signals
        </p>
      </div>

      {/* SELL Message */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">SELL</span>
            <h5 className="text-white font-medium">Exit Signal Message</h5>
          </div>
          <CopyButton
            onClick={() => handleCopy(generateSellMessage(), 'sell')}
            copied={copiedMessage === 'sell'}
            variant="secondary"
          >
            Copy SELL
          </CopyButton>
        </div>
        <pre className="bg-gray-800 p-3 rounded text-sm text-gray-300 overflow-x-auto">
          {generateSellMessage()}
        </pre>
        <p className="text-xs text-gray-400 mt-2">
          📉 Use this message for TradingView alerts that trigger SELL signals
        </p>
      </div>

      {/* Combined Message */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">COMBINED</span>
            <h5 className="text-white font-medium">Complete Strategy Configuration</h5>
          </div>
          <CopyButton
            onClick={() => handleCopy(generateCombinedMessage(), 'combined')}
            copied={copiedMessage === 'combined'}
            variant="secondary"
          >
            Copy All
          </CopyButton>
        </div>
        <pre className="bg-gray-800 p-3 rounded text-sm text-gray-300 overflow-x-auto">
          {generateCombinedMessage()}
        </pre>
        <p className="text-xs text-gray-400 mt-2">
          🔧 Complete strategy configuration for external integrations
        </p>
      </div>

      {/* TradingView Specific Alerts */}
      <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
        <h5 className="text-blue-200 font-medium mb-3">📊 TradingView Alert Messages</h5>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-blue-100 text-sm">Compact BUY Alert:</span>
            <CopyButton
              onClick={() => handleCopy(generateTradingViewAlert('buy'), 'tv-buy')}
              copied={copiedMessage === 'tv-buy'}
              variant="secondary"
            >
              Copy
            </CopyButton>
          </div>
          <pre className="bg-gray-800 p-2 rounded text-xs text-gray-300 overflow-x-auto">
            {generateTradingViewAlert('buy')}
          </pre>

          <div className="flex items-center justify-between">
            <span className="text-blue-100 text-sm">Compact SELL Alert:</span>
            <CopyButton
              onClick={() => handleCopy(generateTradingViewAlert('sell'), 'tv-sell')}
              copied={copiedMessage === 'tv-sell'}
              variant="secondary"
            >
              Copy
            </CopyButton>
          </div>
          <pre className="bg-gray-800 p-2 rounded text-xs text-gray-300 overflow-x-auto">
            {generateTradingViewAlert('sell')}
          </pre>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
        <h5 className="text-yellow-200 font-medium mb-2">💡 Usage Instructions</h5>
        <ul className="text-yellow-100 text-sm space-y-1">
          <li>• Copy the appropriate message for your TradingView alert</li>
          <li>• Paste into TradingView's "Message" field when creating alerts</li>
          <li>• Set the webhook URL to: <code className="bg-gray-800 px-2 py-1 rounded text-xs">{window.location.origin}/api/webhook/{strategy.id}</code></li>
          <li>• BUY messages require {buyIndicators.length} indicators to confirm</li>
          <li>• SELL messages trigger immediately on signal</li>
        </ul>
      </div>

      {/* Webhook URL */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-white font-medium">Webhook URL</h5>
          <CopyButton
            onClick={() => handleCopy(`${window.location.origin}/api/webhook/${strategy.id}`, 'webhook-url')}
            copied={copiedMessage === 'webhook-url'}
            variant="secondary"
          >
            Copy URL
          </CopyButton>
        </div>
        <div className="bg-gray-800 p-3 rounded">
          <code className="text-cyan-400 text-sm break-all">
            {window.location.origin}/api/webhook/{strategy.id}
          </code>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          🔗 Use this URL as the webhook endpoint in TradingView alerts
        </p>
      </div>
    </div>
  );
}

export default MessageDisplay;
