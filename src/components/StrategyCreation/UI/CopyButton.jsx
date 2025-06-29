import React, { useState } from 'react';

function CopyButton({ 
  text, 
  children = 'Copy',
  className = '',
  variant = 'primary',
  size = 'md',
  showIcon = true,
  onCopySuccess,
  onCopyError
}) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopySuccess?.(text);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      onCopyError?.(err);
      
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
      }
    }
  };

  const variants = {
    primary: copied 
      ? 'bg-green-600 text-white border-green-500' 
      : 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500',
    secondary: copied 
      ? 'bg-green-600/20 text-green-400 border-green-500/50' 
      : 'bg-gray-600 hover:bg-gray-700 text-white border-gray-500',
    outline: copied 
      ? 'bg-green-500/10 text-green-400 border-green-500' 
      : 'bg-transparent hover:bg-gray-700 text-gray-300 border-gray-600',
    minimal: copied 
      ? 'text-green-400' 
      : 'text-gray-400 hover:text-white'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const baseClasses = variant === 'minimal' 
    ? 'transition-colors duration-200'
    : `border rounded-lg transition-all duration-200 font-medium ${sizes[size]}`;

  return (
    <button
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${baseClasses} ${variants[variant]} ${className} flex items-center space-x-2`}
      title={copied ? 'Copied!' : 'Click to copy'}
    >
      {showIcon && (
        <svg 
          className={`transition-transform duration-200 ${
            size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
          } ${copied ? 'scale-110' : isHovered ? 'scale-105' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {copied ? (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          ) : (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
            />
          )}
        </svg>
      )}
      <span className={copied ? 'text-green-400' : ''}>
        {copied ? 'Copied!' : children}
      </span>
    </button>
  );
}

// Enhanced copy button with tooltip
function CopyButtonWithTooltip({ text, tooltip, ...props }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <CopyButton
        text={text}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        {...props}
      />
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

// Code block with copy functionality
function CopyableCodeBlock({ code, language = 'json', title, className = '' }) {
  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-sm font-medium text-gray-300">{title}</span>
          <CopyButton 
            text={code}
            variant="outline"
            size="sm"
          >
            Copy {language}
          </CopyButton>
        </div>
      )}
      <div className="relative">
        <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
          <code className={`language-${language}`}>{code}</code>
        </pre>
        {!title && (
          <div className="absolute top-2 right-2">
            <CopyButton 
              text={code}
              variant="minimal"
              size="sm"
              className="opacity-60 hover:opacity-100"
            />
          </div>
        )}
      </div>
    </div>
  );
}

CopyButton.WithTooltip = CopyButtonWithTooltip;
CopyButton.CodeBlock = CopyableCodeBlock;

export default CopyButton;
