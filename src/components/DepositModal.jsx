import { useState } from 'react';

function DepositModal({ isOpen, onClose, address }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-900 p-8 rounded-lg border border-red-500/30 max-w-lg w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-4">Deposit Tokens</h2>

        <div className="space-y-4">
          <div className="bg-black/50 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Network</p>
            <p className="text-white font-semibold">Polygon (MATIC)</p>
          </div>

          <div className="bg-black/50 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Deposit Address</p>
            <code className="text-white font-mono text-sm break-all">{address}</code>
            <button
              onClick={copyAddress}
              className="mt-2 w-full py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Address'}
            </button>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
            <p className="text-yellow-500 font-semibold mb-2">Important</p>
            <ul className="text-yellow-200/80 text-sm space-y-1">
              <li>Only send tokens on the Polygon network</li>
              <li>Supported: USDT, USDC, MATIC, WETH</li>
              <li>Minimum deposit: 1 USDT</li>
              <li>Deposits are final and cannot be withdrawn</li>
            </ul>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-transparent border-2 border-gray-700
                     hover:bg-red-500 hover:border-red-500 rounded-lg transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default DepositModal;
