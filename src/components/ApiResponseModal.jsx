import React from 'react';
import { FaTimes } from 'react-icons/fa';

export const ApiResponseModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  // Função para renderizar valores. Se for um objeto, formata como JSON.
  const renderValue = (value) => {
    // Se o valor já for uma string, apenas o exibe.
    if (typeof value === 'string') {
      return value;
    }
    // Se for um objeto ou array, o formata para melhor leitura.
    if (typeof value === 'object' && value !== null) {
      return (
        <pre className="bg-gray-900/70 p-2 rounded-md text-sm whitespace-pre-wrap">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    return String(value);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-red-500/30 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Impede que o clique dentro do modal o feche
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h3 className="text-xl font-semibold text-white">API Response Details</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <strong className="text-red-400/80 font-semibold md:col-span-1 break-words">{key}:</strong>
                <div className="text-slate-300 md:col-span-2 break-all">{renderValue(value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};