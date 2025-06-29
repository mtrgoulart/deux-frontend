
import { useState } from 'react';

// EyeIcon component with improved icons
const EyeIcon = ({ revealed }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    {revealed ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.05 10.05 0 01-4.536 5.271" />
    )}
  </svg>
);

// CopyIcon component
const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);


function IndicatorRow({ indicator }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50 hover:bg-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-grow">
          <p className="text-xl text-white font-bold">{indicator.name}</p>
          <p className="text-sm text-gray-400 mt-1">Mandatory: {indicator.mandatory ? 'Yes' : 'No'}</p>
        </div>
        <button onClick={() => setRevealed(!revealed)} className="text-gray-400 hover:text-white transition-colors ml-4">
          <EyeIcon revealed={revealed} />
        </button>
      </div>
      {revealed && (
        <div className="mt-4 bg-gray-900/70 border border-cyan-500/20 rounded-md p-2 flex items-center justify-between">
          <span className="text-cyan-300 font-mono text-sm">{indicator.key}</span>
          <button onClick={() => copyToClipboard(indicator.key)} className="text-gray-400 hover:text-white">
            {copied ? <span className="text-xs text-green-400">Copied!</span> : <CopyIcon />}
          </button>
        </div>
      )}
    </div>
  );
}

export default IndicatorRow;
