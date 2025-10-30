/**
 * Hook personnalisé pour la gestion du PIN
 */

import { useState, useCallback, useEffect } from 'react';
import {
  validatePinFormat,
  isUserLockedOut,
  getLockoutTimeRemaining,
  resetPinAttempts,
  generateSecurePin,
  PIN_CONFIG,
} from '../utils/pinUtils';

export interface UsePinOptions {
  userId?: string;
  onLockout?: (timeRemaining: number) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface UsePinReturn {
  // État
  isLocked: boolean;
  lockoutTimeRemaining: number;
  isValidating: boolean;
  
  // Méthodes
  validatePin: (pin: string, correctPin: string) => Promise<boolean>;
  resetAttempts: () => void;
  checkLockout: () => boolean;
  generatePin: (length?: number) => string;
  validateFormat: (pin: string) => { valid: boolean; error?: string };
  
  // Utilitaires
  formatLockoutTime: (seconds: number) => string;
}

export const usePin = (options: UsePinOptions = {}): UsePinReturn => {
  const { userId = 'default', onLockout, onSuccess, onError } = options;
  
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  // Vérifier le verrouillage au montage et périodiquement
  useEffect(() => {
    const checkLockoutStatus = () => {
      const locked = isUserLockedOut(userId);
      setIsLocked(locked);
      
      if (locked) {
        const remaining = getLockoutTimeRemaining(userId);
        setLockoutTimeRemaining(remaining);
        onLockout?.(remaining);
      } else {
        setLockoutTimeRemaining(0);
      }
    };

    checkLockoutStatus();
    
    // Vérifier toutes les secondes si verrouillé
    const interval = setInterval(checkLockoutStatus, 1000);
    
    return () => clearInterval(interval);
  }, [userId, onLockout]);

  /**
   * Valide un PIN
   */
  const validatePin = useCallback(async (pin: string, correctPin: string): Promise<boolean> => {
    // Vérifier le verrouillage
    if (isUserLockedOut(userId)) {
      const remaining = getLockoutTimeRemaining(userId);
      const error = `Compte verrouillé. Réessayez dans ${formatLockoutTime(remaining)}.`;
      onError?.(error);
      setIsLocked(true);
      setLockoutTimeRemaining(remaining);
      return false;
    }

    // Valider le format
    const formatValidation = validatePinFormat(pin);
    if (!formatValidation.valid) {
      onError?.(formatValidation.error || 'Format de PIN invalide');
      return false;
    }

    setIsValidating(true);

    // Simuler un délai de validation (comme une requête API)
    return new Promise((resolve) => {
      setTimeout(() => {
        const isValid = pin === correctPin;
        
        if (isValid) {
          resetPinAttempts(userId);
          onSuccess?.();
          setIsValidating(false);
          resolve(true);
        } else {
          // Vérifier si verrouillage après échec
          if (isUserLockedOut(userId)) {
            const remaining = getLockoutTimeRemaining(userId);
            setIsLocked(true);
            setLockoutTimeRemaining(remaining);
            onLockout?.(remaining);
            onError?.(`Trop de tentatives échouées. Compte verrouillé pour ${formatLockoutTime(remaining)}.`);
          } else {
            onError?.('Code PIN incorrect.');
          }
          
          setIsValidating(false);
          resolve(false);
        }
      }, PIN_CONFIG.VALIDATION_DELAY_MS);
    });
  }, [userId, onSuccess, onError, onLockout]);

  /**
   * Réinitialise les tentatives
   */
  const resetAttempts = useCallback(() => {
    resetPinAttempts(userId);
    setIsLocked(false);
    setLockoutTimeRemaining(0);
  }, [userId]);

  /**
   * Vérifie le statut de verrouillage
   */
  const checkLockout = useCallback((): boolean => {
    const locked = isUserLockedOut(userId);
    setIsLocked(locked);
    
    if (locked) {
      const remaining = getLockoutTimeRemaining(userId);
      setLockoutTimeRemaining(remaining);
    }
    
    return locked;
  }, [userId]);

  /**
   * Génère un PIN sécurisé
   */
  const generatePin = useCallback((length?: number): string => {
    return generateSecurePin(length);
  }, []);

  /**
   * Valide le format d'un PIN
   */
  const validateFormat = useCallback((pin: string) => {
    return validatePinFormat(pin);
  }, []);

  /**
   * Formate le temps de verrouillage
   */
  const formatLockoutTime = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  }, []);

  return {
    // État
    isLocked,
    lockoutTimeRemaining,
    isValidating,
    
    // Méthodes
    validatePin,
    resetAttempts,
    checkLockout,
    generatePin,
    validateFormat,
    
    // Utilitaires
    formatLockoutTime,
  };
};
