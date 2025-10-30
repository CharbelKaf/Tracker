import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FormTextareaProps {
  /** Field label */
  label: string;
  /** Field name/id */
  name: string;
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Error message */
  error?: string | null;
  /** Whether field has been touched */
  touched?: boolean;
  /** Whether field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Helper text */
  helperText?: string;
  /** Number of rows */
  rows?: number;
  /** Maximum length */
  maxLength?: number;
  /** Show character count */
  showCharCount?: boolean;
  /** Whether to resize automatically */
  autoResize?: boolean;
  /** Additional classes */
  className?: string;
}

/**
 * Form textarea with validation and character count
 */
export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  placeholder,
  disabled,
  helperText,
  rows = 4,
  maxLength,
  showCharCount = false,
  autoResize = false,
  className = '',
}) => {
  const hasError = touched && error;
  const charCount = value.length;
  const isNearLimit = maxLength && charCount > maxLength * 0.9;

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize effect
  React.useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, autoResize]);

  return (
    <div className={`form-field-container ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="requis">
              *
            </span>
          )}
        </label>

        {/* Character count */}
        {(showCharCount || maxLength) && (
          <span
            className={`text-xs ${
              isNearLimit
                ? 'text-orange-500 dark:text-orange-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {charCount}
            {maxLength && `/${maxLength}`}
          </span>
        )}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={
          hasError ? `${name}-error` : helperText ? `${name}-helper` : undefined
        }
        className={`
          w-full px-4 py-3 rounded-xl
          border-2 transition-all duration-200
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-offset-2
          resize-${autoResize ? 'none' : 'vertical'}
          ${
            hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'
          }
        `}
      />

      {/* Error message */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            id={`${name}-error`}
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text */}
      {helperText && !hasError && (
        <p
          id={`${name}-helper`}
          className="mt-2 text-sm text-gray-500 dark:text-gray-400"
        >
          {helperText}
        </p>
      )}
    </div>
  );
};
