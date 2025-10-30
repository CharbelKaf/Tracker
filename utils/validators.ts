/**
 * Common form validators
 * Reusable validation functions for forms
 */

import { ValidationRule } from '../hooks/useFormValidation';

/**
 * Validator: Required field
 */
export const required = (message: string = 'Ce champ est requis'): ValidationRule => ({
  validate: (value) => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value != null && value !== '';
  },
  message,
});

/**
 * Validator: Email format
 */
export const email = (message: string = 'Email invalide'): ValidationRule => ({
  validate: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  message,
});

/**
 * Validator: Minimum length
 */
export const minLength = (min: number, message?: string): ValidationRule => ({
  validate: (value) => {
    if (typeof value !== 'string') return false;
    return value.length >= min;
  },
  message: message || `Minimum ${min} caractères requis`,
});

/**
 * Validator: Maximum length
 */
export const maxLength = (max: number, message?: string): ValidationRule => ({
  validate: (value) => {
    if (typeof value !== 'string') return false;
    return value.length <= max;
  },
  message: message || `Maximum ${max} caractères autorisés`,
});

/**
 * Validator: Minimum value (numbers)
 */
export const min = (minValue: number, message?: string): ValidationRule => ({
  validate: (value) => {
    const num = Number(value);
    return !isNaN(num) && num >= minValue;
  },
  message: message || `La valeur doit être au moins ${minValue}`,
});

/**
 * Validator: Maximum value (numbers)
 */
export const max = (maxValue: number, message?: string): ValidationRule => ({
  validate: (value) => {
    const num = Number(value);
    return !isNaN(num) && num <= maxValue;
  },
  message: message || `La valeur doit être au maximum ${maxValue}`,
});

/**
 * Validator: Pattern matching
 */
export const pattern = (regex: RegExp, message: string): ValidationRule => ({
  validate: (value) => regex.test(value),
  message,
});

/**
 * Validator: URL format
 */
export const url = (message: string = 'URL invalide'): ValidationRule => ({
  validate: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  message,
});

/**
 * Validator: Phone number (French format)
 */
export const phoneNumber = (message: string = 'Numéro de téléphone invalide'): ValidationRule => ({
  validate: (value) => {
    // French phone: 0X XX XX XX XX or +33 X XX XX XX XX
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(value);
  },
  message,
});

/**
 * Validator: Matches another field
 */
export const matches = (fieldName: string, message?: string): ValidationRule => ({
  validate: (value, formValues) => {
    return value === formValues?.[fieldName];
  },
  message: message || 'Les champs ne correspondent pas',
});

/**
 * Validator: One of allowed values
 */
export const oneOf = (values: any[], message?: string): ValidationRule => ({
  validate: (value) => values.includes(value),
  message: message || `La valeur doit être l'une de: ${values.join(', ')}`,
});

/**
 * Validator: Date format (YYYY-MM-DD)
 */
export const dateFormat = (message: string = 'Date invalide'): ValidationRule => ({
  validate: (value) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) return false;
    
    const date = new Date(value);
    return !isNaN(date.getTime());
  },
  message,
});

/**
 * Validator: Future date
 */
export const futureDate = (message: string = 'La date doit être dans le futur'): ValidationRule => ({
  validate: (value) => {
    const date = new Date(value);
    return date > new Date();
  },
  message,
});

/**
 * Validator: Past date
 */
export const pastDate = (message: string = 'La date doit être dans le passé'): ValidationRule => ({
  validate: (value) => {
    const date = new Date(value);
    return date < new Date();
  },
  message,
});

/**
 * Validator: Alphanumeric only
 */
export const alphanumeric = (message: string = 'Seuls les caractères alphanumériques sont autorisés'): ValidationRule => ({
  validate: (value) => /^[a-zA-Z0-9]+$/.test(value),
  message,
});

/**
 * Validator: No special characters
 */
export const noSpecialChars = (message: string = 'Caractères spéciaux non autorisés'): ValidationRule => ({
  validate: (value) => /^[a-zA-Z0-9\s]+$/.test(value),
  message,
});

/**
 * Validator: Strong password
 */
export const strongPassword = (message?: string): ValidationRule => ({
  validate: (value) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const hasMinLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  },
  message: message || 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial',
});

/**
 * Validator: Asset tag format (custom for Neemba)
 */
export const assetTag = (message: string = 'Format invalide (ex: NEM-2024-001)'): ValidationRule => ({
  validate: (value) => {
    // Format: NEM-YYYY-XXX
    return /^NEM-\d{4}-\d{3,}$/.test(value);
  },
  message,
});

/**
 * Validator: Async - Check if value is unique (example)
 */
export const unique = (
  checkFunction: (value: string) => Promise<boolean>,
  message: string = 'Cette valeur est déjà utilisée'
): ValidationRule => ({
  validate: async (value) => {
    return await checkFunction(value);
  },
  message,
});

/**
 * Create a custom validator
 */
export const custom = (
  validator: (value: any, formValues?: Record<string, any>) => boolean | Promise<boolean>,
  message: string
): ValidationRule => ({
  validate: validator,
  message,
});
