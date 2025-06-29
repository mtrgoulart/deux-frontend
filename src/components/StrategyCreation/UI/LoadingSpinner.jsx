import React from 'react';

function LoadingSpinner({ size = 'md', color = 'cyan', className = '', children }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    cyan: 'border-cyan-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    yellow: 'border-yellow-500',
    red: 'border-red-500',
    white: 'border-white'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full animate-spin`}
      />
      {children && (
        <span className="text-gray-300 text-sm animate-pulse">
          {children}
        </span>
      )}
    </div>
  );
}

// Skeleton loading component for form fields
function SkeletonLoader({ className = '', lines = 1, height = 'h-4' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-700 rounded ${height} ${index > 0 ? 'mt-2' : ''}`}
        />
      ))}
    </div>
  );
}

// Full page loading overlay
function LoadingOverlay({ message = 'Loading...', isVisible = true }) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-white font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}

// Button loading state
function LoadingButton({ 
  children, 
  isLoading = false, 
  loadingText = 'Loading...', 
  className = '',
  disabled = false,
  ...props 
}) {
  return (
    <button
      className={`flex items-center justify-center space-x-2 ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" color="white" />}
      <span>{isLoading ? loadingText : children}</span>
    </button>
  );
}

LoadingSpinner.Skeleton = SkeletonLoader;
LoadingSpinner.Overlay = LoadingOverlay;
LoadingSpinner.Button = LoadingButton;

export default LoadingSpinner;
