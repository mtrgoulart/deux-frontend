import React from 'react';

export function FullScreenLoader({ isOpen, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 animate-fade-in">
      <div className="flex flex-col items-center gap-4 text-white text-lg">
        {/* Spinner Cyberpunk Customizado */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-red-500/30 rounded-full"></div>
          <div className="absolute inset-2 border-4 border-red-500/60 rounded-full animate-spin [animation-direction:reverse]"></div>
          <div className="absolute inset-4 border-4 border-red-500 rounded-full animate-spin"></div>
        </div>
        <span>{message}</span>
      </div>
    </div>
  );
}