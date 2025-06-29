import React from 'react';

function ValidationMessage({ 
  type = 'error', 
  message, 
  field,
  className = '',
  showIcon = true,
  size = 'sm'
}) {
  if (!message) return null;

  const types = {
    error: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      classes: 'text-red-400 bg-red-900/20 border-red-500/30'
    },
    warning: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      classes: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
    },
    success: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      classes: 'text-green-400 bg-green-900/20 border-green-500/30'
    },
    info: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      classes: 'text-blue-400 bg-blue-900/20 border-blue-500/30'
    }
  };

  const sizes = {
    xs: 'text-xs px-2 py-1',
    sm: 'text-sm px-3 py-2',
    md: 'text-base px-4 py-3'
  };

  const config = types[type];

  return (
    <div className={`
      flex items-start space-x-2 border rounded-lg
      ${config.classes} 
      ${sizes[size]}
      ${className}
    `}>
      {showIcon && (
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
      )}
      <div className="flex-1">
        {field && (
          <div className="font-medium capitalize mb-1">
            {field}
          </div>
        )}
        <div>
          {message}
        </div>
      </div>
    </div>
  );
}

// Field validation wrapper
function ValidatedField({ 
  children, 
  error, 
  warning, 
  success, 
  info,
  className = '' 
}) {
  const hasValidation = error || warning || success || info;

  return (
    <div className={className}>
      {children}
      {hasValidation && (
        <div className="mt-2">
          {error && <ValidationMessage type="error" message={error} />}
          {warning && <ValidationMessage type="warning" message={warning} />}
          {success && <ValidationMessage type="success" message={success} />}
          {info && <ValidationMessage type="info" message={info} />}
        </div>
      )}
    </div>
  );
}

// Form validation summary
function ValidationSummary({ 
  errors = [], 
  warnings = [], 
  className = '',
  title = 'Please fix the following issues:'
}) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="text-red-400 font-medium">{title}</h4>
      </div>
      
      {errors.length > 0 && (
        <ul className="space-y-1 mb-3">
          {errors.map((error, index) => (
            <li key={index} className="text-red-300 text-sm flex items-center space-x-2">
              <span className="w-1 h-1 bg-red-400 rounded-full flex-shrink-0" />
              <span>{error}</span>
            </li>
          ))}
        </ul>
      )}
      
      {warnings.length > 0 && (
        <ul className="space-y-1">
          {warnings.map((warning, index) => (
            <li key={index} className="text-yellow-300 text-sm flex items-center space-x-2">
              <span className="w-1 h-1 bg-yellow-400 rounded-full flex-shrink-0" />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

ValidationMessage.Field = ValidatedField;
ValidationMessage.Summary = ValidationSummary;

export default ValidationMessage;
