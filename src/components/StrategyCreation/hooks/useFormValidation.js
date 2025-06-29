import { useState, useCallback, useEffect } from 'react';

// Validation rules
const VALIDATION_RULES = {
  required: (value, message = 'This field is required') => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    return null;
  },

  minLength: (value, min, message) => {
    if (typeof value === 'string' && value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value, max, message) => {
    if (typeof value === 'string' && value.length > max) {
      return message || `Must be no more than ${max} characters`;
    }
    return null;
  },

  pattern: (value, regex, message) => {
    if (typeof value === 'string' && !regex.test(value)) {
      return message || 'Invalid format';
    }
    return null;
  },

  email: (value, message = 'Invalid email address') => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof value === 'string' && !emailRegex.test(value)) {
      return message;
    }
    return null;
  },

  number: (value, message = 'Must be a valid number') => {
    if (value !== '' && (isNaN(value) || isNaN(parseFloat(value)))) {
      return message;
    }
    return null;
  },

  min: (value, min, message) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num < min) {
      return message || `Must be at least ${min}`;
    }
    return null;
  },

  max: (value, max, message) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > max) {
      return message || `Must be no more than ${max}`;
    }
    return null;
  },

  symbolFormat: (value, message = 'Invalid symbol format') => {
    // Symbol should be like BTC-USDT, ETH-BTC, etc.
    const symbolRegex = /^[A-Z]{2,10}-[A-Z]{2,10}$/i;
    if (typeof value === 'string' && !symbolRegex.test(value)) {
      return message;
    }
    return null;
  },

  percentage: (value, message = 'Must be a valid percentage (0-100)') => {
    const num = parseFloat(value);
    if (!isNaN(num) && (num < 0 || num > 100)) {
      return message;
    }
    return null;
  },

  custom: (value, validator, message) => {
    if (typeof validator === 'function') {
      const result = validator(value);
      if (result !== true) {
        return message || result || 'Invalid value';
      }
    }
    return null;
  }
};

function useFormValidation(initialValues = {}, validationSchema = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Validate a single field
  const validateField = useCallback((fieldName, value = values[fieldName]) => {
    const rules = validationSchema[fieldName];
    if (!rules) return null;

    for (const rule of rules) {
      const { type, ...params } = rule;
      const validator = VALIDATION_RULES[type];
      
      if (validator) {
        const error = validator(value, ...Object.values(params));
        if (error) {
          return error;
        }
      }
    }
    return null;
  }, [values, validationSchema]);

  // Validate all fields
  const validateForm = useCallback(async () => {
    setIsValidating(true);
    const newErrors = {};

    for (const fieldName in validationSchema) {
      const error = validateField(fieldName);
      if (error) {
        newErrors[fieldName] = error;
      }
    }

    setErrors(newErrors);
    setIsValidating(false);
    return Object.keys(newErrors).length === 0;
  }, [validateField, validationSchema]);

  // Set field value
  const setValue = useCallback((fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  }, [errors]);

  // Set multiple values
  const setValues_multi = useCallback((newValues) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));

    // Clear errors for updated fields
    const fieldsToUpdate = Object.keys(newValues);
    setErrors(prev => {
      const newErrors = { ...prev };
      fieldsToUpdate.forEach(field => {
        if (newErrors[field]) {
          newErrors[field] = null;
        }
      });
      return newErrors;
    });
  }, []);

  // Mark field as touched
  const setFieldTouched = useCallback((fieldName, isTouched = true) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: isTouched
    }));
  }, []);

  // Handle field blur
  const handleBlur = useCallback((fieldName) => {
    setFieldTouched(fieldName, true);
    
    // Validate field on blur
    const error = validateField(fieldName);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, [setFieldTouched, validateField]);

  // Handle field change
  const handleChange = useCallback((fieldName, value) => {
    setValue(fieldName, value);
    
    // Real-time validation for touched fields
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
  }, [setValue, touched, validateField]);

  // Get field props for easy integration
  const getFieldProps = useCallback((fieldName) => {
    return {
      value: values[fieldName] || '',
      onChange: (e) => {
        const value = e.target ? e.target.value : e;
        handleChange(fieldName, value);
      },
      onBlur: () => handleBlur(fieldName),
      error: touched[fieldName] ? errors[fieldName] : null,
      isValid: touched[fieldName] && !errors[fieldName],
      isTouched: touched[fieldName]
    };
  }, [values, handleChange, handleBlur, touched, errors]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Reset field
  const resetField = useCallback((fieldName) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: initialValues[fieldName] || ''
    }));
    setErrors(prev => ({
      ...prev,
      [fieldName]: null
    }));
    setTouched(prev => ({
      ...prev,
      [fieldName]: false
    }));
  }, [initialValues]);

  // Check if form has errors
  const hasErrors = Object.values(errors).some(error => error !== null);
  const hasFieldErrors = useCallback((fieldNames) => {
    return fieldNames.some(field => errors[field]);
  }, [errors]);

  // Check if form is valid
  const isValid = !hasErrors && Object.keys(touched).length > 0;

  // Get error summary
  const getErrorSummary = useCallback(() => {
    return Object.entries(errors)
      .filter(([, error]) => error !== null)
      .map(([field, error]) => ({ field, error }));
  }, [errors]);

  // Check if field is valid
  const isFieldValid = useCallback((fieldName) => {
    return touched[fieldName] && !errors[fieldName];
  }, [touched, errors]);

  // Set error manually
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  // Clear errors
  const clearErrors = useCallback((fieldNames = null) => {
    if (fieldNames) {
      setErrors(prev => {
        const newErrors = { ...prev };
        fieldNames.forEach(field => {
          newErrors[field] = null;
        });
        return newErrors;
      });
    } else {
      setErrors({});
    }
  }, []);

  return {
    // State
    values,
    errors,
    touched,
    isValidating,

    // Actions
    setValue,
    setValues: setValues_multi,
    setFieldTouched,
    setFieldError,
    clearErrors,

    // Handlers
    handleChange,
    handleBlur,
    getFieldProps,

    // Validation
    validateField,
    validateForm,

    // Reset
    resetForm,
    resetField,

    // Status
    isValid,
    hasErrors,
    hasFieldErrors,
    isFieldValid,
    getErrorSummary,

    // Utilities
    getTouchedFields: () => Object.keys(touched).filter(key => touched[key]),
    getInvalidFields: () => Object.keys(errors).filter(key => errors[key]),
    getValidFields: () => Object.keys(touched).filter(key => touched[key] && !errors[key])
  };
}

// Pre-defined validation schemas for common use cases
export const WIZARD_VALIDATION_SCHEMAS = {
  symbolStep: {
    api_key: [
      { type: 'required', message: 'API Key is required' }
    ],
    symbol: [
      { type: 'required', message: 'Trading symbol is required' },
      { type: 'symbolFormat', message: 'Symbol must be in format XXX-YYY (e.g., BTC-USDT)' }
    ]
  },

  rulesStep: {
    strategy_buy: [
      { type: 'required', message: 'Buy strategy is required' }
    ],
    strategy_sell: [
      { type: 'required', message: 'Sell strategy is required' }
    ]
  },

  newRuleCreation: {
    name: [
      { type: 'required', message: 'Rule name is required' },
      { type: 'minLength', min: 3, message: 'Name must be at least 3 characters' },
      { type: 'maxLength', max: 50, message: 'Name must be no more than 50 characters' }
    ],
    description: [
      { type: 'maxLength', max: 200, message: 'Description must be no more than 200 characters' }
    ],
    threshold: [
      { type: 'number', message: 'Threshold must be a valid number' },
      { type: 'min', min: 0, message: 'Threshold must be positive' }
    ]
  },

  reviewStep: {
    strategyName: [
      { type: 'required', message: 'Strategy name is required' },
      { type: 'minLength', min: 3, message: 'Name must be at least 3 characters' },
      { type: 'maxLength', max: 100, message: 'Name must be no more than 100 characters' }
    ],
    strategyDescription: [
      { type: 'maxLength', max: 500, message: 'Description must be no more than 500 characters' }
    ]
  }
};

export default useFormValidation;
