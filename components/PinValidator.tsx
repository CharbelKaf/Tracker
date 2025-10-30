
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  isUserLockedOut,
  getLockoutTimeRemaining,
  recordPinAttempt,
  resetPinAttempts,
  formatLockoutTime,
  PIN_CONFIG,
} from '../utils/pinUtils';

interface PinValidatorProps {
  onValidated: (isValidated: boolean) => void;
  correctPin?: string;
  userName?: string;
  userId?: string;
  autoFocus?: boolean;
  onLockout?: (timeRemaining: number) => void;
}

type PinValidationStatus = 'idle' | 'validating' | 'success' | 'error' | 'locked';

const PinValidator: React.FC<PinValidatorProps> = ({ 
  onValidated, 
  correctPin, 
  userName, 
  userId = 'default',
  autoFocus = true,
  onLockout 
}) => {
  const [status, setStatus] = useState<PinValidationStatus>('idle');
  const [pin, setPin] = useState<string[]>(Array(PIN_CONFIG.LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [lockoutTime, setLockoutTime] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lockoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const focusInput = (index: number) => {
    requestAnimationFrame(() => {
      const target = inputRefs.current[index];
      if (target) {
        target.focus();
      }
    });
  };

  // Vérifier le verrouillage au montage
  useEffect(() => {
    if (isUserLockedOut(userId)) {
      const remaining = getLockoutTimeRemaining(userId);
      setStatus('locked');
      setLockoutTime(remaining);
      startLockoutTimer(remaining);
      onLockout?.(remaining);
    } else if (autoFocus) {
      focusInput(0);
      setActiveIndex(0);
    }
  }, [autoFocus, userId, onLockout]);

  // Nettoyer le timer au démontage
  useEffect(() => {
    return () => {
      if (lockoutTimerRef.current) {
        clearInterval(lockoutTimerRef.current);
      }
    };
  }, []);

  // Timer de verrouillage
  const startLockoutTimer = useCallback((seconds: number) => {
    setLockoutTime(seconds);
    
    if (lockoutTimerRef.current) {
      clearInterval(lockoutTimerRef.current);
    }

    lockoutTimerRef.current = setInterval(() => {
      setLockoutTime(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          if (lockoutTimerRef.current) {
            clearInterval(lockoutTimerRef.current);
          }
          setStatus('idle');
          resetPinAttempts(userId);
          setAttemptCount(0);
          focusInput(0);
          return 0;
        }
        return newTime;
      });
    }, 1000);
  }, [userId]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === '') {
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        if (value !== '' && index < 5) {
            focusInput(index + 1);
            setActiveIndex(index + 1);
        }
        
        if (newPin.join('').length === 6) {
             handleValidation(newPin.join(''));
        }
        
        setError(null);
        setStatus('idle');
        if (value === '') {
            setActiveIndex(index);
        }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
        if (pin[index] === '' && index > 0) {
            focusInput(index - 1);
            setActiveIndex(index - 1);
        } else {
            setActiveIndex(index);
        }
    }
  };

  const handleValidation = (fullPin: string) => {
    // Vérifier le verrouillage
    if (isUserLockedOut(userId)) {
      const remaining = getLockoutTimeRemaining(userId);
      setStatus('locked');
      setError(`Trop de tentatives échouées. Réessayez dans ${formatLockoutTime(remaining)}.`);
      startLockoutTimer(remaining);
      onLockout?.(remaining);
      return;
    }

    if (!correctPin) {
        setError("Aucun code PIN n'est configuré pour cet utilisateur.");
        setStatus('error');
        return;
    }
    
    setStatus('validating');
    setError(null);
    onValidated(false);

    // Simulate validation avec délai
    setTimeout(() => {
        const isValid = fullPin === correctPin;
        
        // Enregistrer la tentative
        recordPinAttempt(userId, isValid);
        
        if (isValid) {
            setStatus('success');
            onValidated(true);
            setActiveIndex(null);
            resetPinAttempts(userId);
            setAttemptCount(0);
        } else {
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            // Vérifier si verrouillage après cette tentative
            if (isUserLockedOut(userId)) {
              const remaining = getLockoutTimeRemaining(userId);
              setStatus('locked');
              setError(`Trop de tentatives échouées. Compte verrouillé pour ${formatLockoutTime(remaining)}.`);
              startLockoutTimer(remaining);
              onLockout?.(remaining);
            } else {
              setStatus('error');
              const remainingAttempts = PIN_CONFIG.MAX_ATTEMPTS - newAttemptCount;
              setError(
                remainingAttempts > 0
                  ? `Code PIN incorrect. ${remainingAttempts} tentative${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}.`
                  : 'Code PIN incorrect.'
              );
            }
            
            setPin(Array(PIN_CONFIG.LENGTH).fill(''));
            
            // Vibration feedback
            if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                navigator.vibrate([100, 50, 100]);
            }
            
            if (status !== 'locked') {
              focusInput(0);
              setActiveIndex(0);
            }
        }
    }, PIN_CONFIG.VALIDATION_DELAY_MS);
  };
  
  const getStatusClasses = () => {
    switch(status) {
        case 'success': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
        case 'error': return 'border-red-500 bg-red-50 dark:bg-red-900/20 animate-shake';
        case 'locked': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
        case 'validating': return 'border-primary-500 bg-primary-50 dark:bg-primary-900/20';
        default: return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus-within:border-primary-500';
    }
  };

  const getInputClasses = (index: number) => {
    const baseClasses = 'w-full aspect-square min-w-[2.5rem] text-center text-2xl sm:text-3xl font-bold rounded-lg transition-all duration-200';
    const stateClasses = status === 'success' 
      ? 'border-2 border-green-500 text-green-700 dark:text-green-400' 
      : status === 'error'
      ? 'border-2 border-red-500 text-red-700 dark:text-red-400'
      : 'border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';
    const focusClasses = 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
    const disabledClasses = 'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed';
    
    return `${baseClasses} ${stateClasses} ${focusClasses} ${disabledClasses}`;
  };

  const renderDigit = (digit: string, index: number) => {
    if (!digit) return '';
    return activeIndex === index ? digit : '•';
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Validation par PIN</h2>
        {status === 'locked' && (
          <span className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400">
            <span className="material-symbols-outlined text-base">lock</span>
            {formatLockoutTime(lockoutTime)}
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {userName ? `${userName.split(' ')[0]}, veuillez` : 'Veuillez'} saisir votre code PIN à {PIN_CONFIG.LENGTH} chiffres pour confirmer.
      </p>
      
      <div className={`mb-4 p-4 border-2 rounded-xl transition-all duration-300 ${getStatusClasses()}`}>
        <div className="mx-auto grid grid-cols-6 gap-2 sm:gap-3 max-w-md">
          {pin.map((digit, index) => (
              <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={renderDigit(digit, index)}
                  onChange={e => handleInputChange(e, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(prev => (prev === index ? null : prev))}
                  maxLength={1}
                  className={getInputClasses(index)}
                  disabled={status === 'validating' || status === 'success' || status === 'locked'}
                  aria-label={`PIN digit ${index + 1}`}
              />
          ))}
        </div>
      </div>
      
      {/* Messages de statut */}
      {status === 'validating' && (
        <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 text-sm mt-2">
          <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
          <span>Vérification en cours...</span>
        </div>
      )}
      
      {status === 'success' && (
        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 text-sm mt-2 font-semibold">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>Validé avec succès !</span>
        </div>
      )}
      
      {status === 'error' && error && (
        <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 text-sm mt-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{error}</span>
        </div>
      )}
      
      {status === 'locked' && error && (
        <div className="flex items-center justify-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm mt-2">
          <span className="material-symbols-outlined text-base">lock</span>
          <span>{error}</span>
        </div>
      )}
      
      {!correctPin && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-300 text-sm text-center">
            <span className="material-symbols-outlined text-base align-middle mr-1">warning</span>
            Cet utilisateur n'a pas de code PIN configuré. Un administrateur peut en créer un sur la page de détails de l'utilisateur.
          </p>
        </div>
      )}
    </div>
  );
};

export default PinValidator;
