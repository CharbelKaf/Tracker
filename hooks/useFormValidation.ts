import { useState, useCallback, useEffect } from 'react';
import { useDebouncedCallback } from './useDebouncedCallback';

/**
 * Validation rule for a form field
 */
export interface ValidationRule<T = any> {
  /** Rule validator function */
  validate: (value: T, formValues?: Record<string, any>) => boolean | Promise<boolean>;
  /** Error message to display */
  message: string;
  /** Whether to run validation on change (default: true) */
  validateOnChange?: boolean;
  /** Whether to run validation on blur (default: true) */
  validateOnBlur?: boolean;
}

/**
 * Field configuration
 */
export interface FieldConfig<T = any> {
  /** Initial value */
  initialValue?: T;
  /** Validation rules */
  rules?: ValidationRule<T>[];
  /** Whether field is required */
  required?: boolean;
  /** Custom required message */
  requiredMessage?: string;
  /** Transform value before validation */
  transform?: (value: T) => T;
  /** Debounce validation delay (ms) */
  debounceMs?: number;
}

/**
 * Form configuration
 */
export interface FormConfig {
  /** Field configurations */
  fields: Record<string, FieldConfig>;
  /** Called when form is valid and submitted */
  onSubmit?: (values: Record<string, any>) => void | Promise<void>;
  /** Validate on mount */
  validateOnMount?: boolean;
  /** Auto-save draft */
  autoSave?: boolean;
  /** Auto-save key for localStorage */
  autoSaveKey?: string;
  /** Auto-save interval (ms) */
  autoSaveInterval?: number;
}

/**
 * Field state
 */
interface FieldState {
  value: any;
  error: string | null;
  touched: boolean;
  validating: boolean;
  dirty: boolean;
}

/**
 * Form state
 */
interface FormState {
  fields: Record<string, FieldState>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitCount: number;
}

/**
 * Hook for form validation with real-time feedback
 * 
 * @example
 * const form = useFormValidation({
 *   fields: {
 *     email: {
 *       initialValue: '',
 *       required: true,
 *       rules: [
 *         { validate: (v) => /\S+@\S+\.\S+/.test(v), message: 'Email invalide' }
 *       ]
 *     },
 *     password: {
 *       initialValue: '',
 *       required: true,
 *       rules: [
 *         { validate: (v) => v.length >= 8, message: 'Min 8 caractères' }
 *       ]
 *     }
 *   },
 *   onSubmit: async (values) => {
 *     await api.login(values);
 *   }
 * });
 */
export function useFormValidation(config: FormConfig) {
  const { fields: fieldsConfig, onSubmit, validateOnMount = false, autoSave, autoSaveKey, autoSaveInterval = 30000 } = config;

  // Initialize state from localStorage if auto-save is enabled
  const getInitialState = (): FormState => {
    let savedValues: Record<string, any> = {};
    
    if (autoSave && autoSaveKey) {
      try {
        const saved = localStorage.getItem(`form_draft_${autoSaveKey}`);
        if (saved) {
          savedValues = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Failed to load auto-saved form:', e);
      }
    }

    const fields: Record<string, FieldState> = {};
    
    Object.keys(fieldsConfig).forEach(fieldName => {
      const fieldConfig = fieldsConfig[fieldName];
      fields[fieldName] = {
        value: savedValues[fieldName] ?? fieldConfig.initialValue ?? '',
        error: null,
        touched: false,
        validating: false,
        dirty: false,
      };
    });

    return {
      fields,
      isSubmitting: false,
      isValid: false,
      isDirty: false,
      submitCount: 0,
    };
  };

  const [state, setState] = useState<FormState>(getInitialState);

  // Validate a single field
  const validateField = useCallback(
    async (fieldName: string, value: any, allValues: Record<string, any>): Promise<string | null> => {
      const fieldConfig = fieldsConfig[fieldName];
      if (!fieldConfig) return null;

      // Transform value if needed
      const transformedValue = fieldConfig.transform ? fieldConfig.transform(value) : value;

      // Check required
      if (fieldConfig.required) {
        const isEmpty = transformedValue === '' || transformedValue === null || transformedValue === undefined;
        if (isEmpty) {
          return fieldConfig.requiredMessage || 'Ce champ est requis';
        }
      }

      // Run validation rules
      if (fieldConfig.rules) {
        for (const rule of fieldConfig.rules) {
          try {
            const isValid = await Promise.resolve(rule.validate(transformedValue, allValues));
            if (!isValid) {
              return rule.message;
            }
          } catch (error) {
            console.error(`Validation error for ${fieldName}:`, error);
            return 'Erreur de validation';
          }
        }
      }

      return null;
    },
    [fieldsConfig]
  );

  // Validate all fields
  const validateAll = useCallback(async (): Promise<boolean> => {
    const allValues = Object.keys(state.fields).reduce((acc, key) => {
      acc[key] = state.fields[key].value;
      return acc;
    }, {} as Record<string, any>);

    const validationPromises = Object.keys(state.fields).map(async (fieldName) => {
      const error = await validateField(fieldName, state.fields[fieldName].value, allValues);
      return { fieldName, error };
    });

    const results = await Promise.all(validationPromises);

    setState(prev => {
      const newFields = { ...prev.fields };
      results.forEach(({ fieldName, error }) => {
        newFields[fieldName] = {
          ...newFields[fieldName],
          error,
        };
      });

      const isValid = results.every(r => r.error === null);

      return {
        ...prev,
        fields: newFields,
        isValid,
      };
    });

    return results.every(r => r.error === null);
  }, [state.fields, validateField]);

  // Debounced validation for onChange
  const [debouncedValidate] = useDebouncedCallback(
    async (fieldName: string, value: any) => {
      const allValues = Object.keys(state.fields).reduce((acc, key) => {
        acc[key] = key === fieldName ? value : state.fields[key].value;
        return acc;
      }, {} as Record<string, any>);

      const error = await validateField(fieldName, value, allValues);

      setState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [fieldName]: {
            ...prev.fields[fieldName],
            error,
            validating: false,
          },
        },
      }));
    },
    300
  );

  // Set field value
  const setFieldValue = useCallback((fieldName: string, value: any) => {
    setState(prev => {
      const newFields = {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          value,
          dirty: true,
          validating: true,
        },
      };

      return {
        ...prev,
        fields: newFields,
        isDirty: true,
      };
    });

    // Trigger debounced validation
    const fieldConfig = fieldsConfig[fieldName];
    const debounceMs = fieldConfig?.debounceMs ?? 300;
    
    if (debounceMs > 0) {
      debouncedValidate(fieldName, value);
    } else {
      // Validate immediately
      const allValues = Object.keys(state.fields).reduce((acc, key) => {
        acc[key] = key === fieldName ? value : state.fields[key].value;
        return acc;
      }, {} as Record<string, any>);

      validateField(fieldName, value, allValues).then(error => {
        setState(prev => ({
          ...prev,
          fields: {
            ...prev.fields,
            [fieldName]: {
              ...prev.fields[fieldName],
              error,
              validating: false,
            },
          },
        }));
      });
    }
  }, [fieldsConfig, state.fields, validateField, debouncedValidate]);

  // Set field touched
  const setFieldTouched = useCallback((fieldName: string) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          touched: true,
        },
      },
    }));

    // Validate on blur
    const allValues = Object.keys(state.fields).reduce((acc, key) => {
      acc[key] = state.fields[key].value;
      return acc;
    }, {} as Record<string, any>);

    validateField(fieldName, state.fields[fieldName].value, allValues).then(error => {
      setState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [fieldName]: {
            ...prev.fields[fieldName],
            error,
          },
        },
      }));
    });
  }, [state.fields, validateField]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      setState(prev => ({
        ...prev,
        isSubmitting: true,
        submitCount: prev.submitCount + 1,
      }));

      // Mark all fields as touched
      setState(prev => {
        const newFields = { ...prev.fields };
        Object.keys(newFields).forEach(key => {
          newFields[key] = { ...newFields[key], touched: true };
        });
        return { ...prev, fields: newFields };
      });

      const isValid = await validateAll();

      if (isValid && onSubmit) {
        try {
          const values = Object.keys(state.fields).reduce((acc, key) => {
            acc[key] = state.fields[key].value;
            return acc;
          }, {} as Record<string, any>);

          await onSubmit(values);

          // Clear draft on successful submit
          if (autoSave && autoSaveKey) {
            localStorage.removeItem(`form_draft_${autoSaveKey}`);
          }
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }

      setState(prev => ({ ...prev, isSubmitting: false }));
    },
    [validateAll, onSubmit, state.fields, autoSave, autoSaveKey]
  );

  // Reset form
  const reset = useCallback(() => {
    setState(getInitialState());
    if (autoSave && autoSaveKey) {
      localStorage.removeItem(`form_draft_${autoSaveKey}`);
    }
  }, [autoSave, autoSaveKey]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !autoSaveKey || !state.isDirty) return;

    const timer = setInterval(() => {
      const values = Object.keys(state.fields).reduce((acc, key) => {
        acc[key] = state.fields[key].value;
        return acc;
      }, {} as Record<string, any>);

      try {
        localStorage.setItem(`form_draft_${autoSaveKey}`, JSON.stringify(values));
      } catch (e) {
        console.warn('Failed to auto-save form:', e);
      }
    }, autoSaveInterval);

    return () => clearInterval(timer);
  }, [autoSave, autoSaveKey, state.fields, state.isDirty, autoSaveInterval]);

  // Validate on mount if requested
  useEffect(() => {
    if (validateOnMount) {
      validateAll();
    }
  }, []); // Run once on mount

  // Get values
  const getValues = useCallback(() => {
    return Object.keys(state.fields).reduce((acc, key) => {
      acc[key] = state.fields[key].value;
      return acc;
    }, {} as Record<string, any>);
  }, [state.fields]);

  return {
    // Field helpers
    register: (fieldName: string) => ({
      value: state.fields[fieldName]?.value ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setFieldValue(fieldName, e.target.value),
      onBlur: () => setFieldTouched(fieldName),
      'aria-invalid': state.fields[fieldName]?.error ? true : false,
      'aria-describedby': state.fields[fieldName]?.error ? `${fieldName}-error` : undefined,
    }),
    
    // Field state
    getFieldState: (fieldName: string) => state.fields[fieldName],
    
    // Form state
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    isDirty: state.isDirty,
    submitCount: state.submitCount,
    
    // Actions
    setFieldValue,
    setFieldTouched,
    handleSubmit,
    reset,
    validateAll,
    getValues,
  };
}
