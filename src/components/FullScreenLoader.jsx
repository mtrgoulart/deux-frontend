import React from 'react';

export function FullScreenLoader({ isOpen, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="flex flex-col items-center gap-4 text-content-primary text-lg">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-accent/30 rounded-full"></div>
          <div className="absolute inset-2 border-4 border-accent/60 rounded-full animate-spin [animation-direction:reverse]"></div>
          <div className="absolute inset-4 border-4 border-accent rounded-full animate-spin"></div>
        </div>
        <span>{message}</span>
      </div>
    </div>
  );
}
