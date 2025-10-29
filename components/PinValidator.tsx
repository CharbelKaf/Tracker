
import React, { useState, useRef, useEffect } from 'react';

interface PinValidatorProps {
  onValidated: (isValidated: boolean) => void;
  correctPin?: string;
  userName?: string;
  autoFocus?: boolean;
}

type PinValidationStatus = 'idle' | 'validating' | 'success' | 'error';

const PinValidator: React.FC<PinValidatorProps> = ({ onValidated, correctPin, userName, autoFocus = true }) => {
  const [status, setStatus] = useState<PinValidationStatus>('idle');
  const [pin, setPin] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const focusInput = (index: number) => {
    requestAnimationFrame(() => {
      const target = inputRefs.current[index];
      if (target) {
        target.focus();
      }
    });
  };

  useEffect(() => {
    if (autoFocus) {
      focusInput(0);
      setActiveIndex(0);
    }
  }, [autoFocus]);
  
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
    if (!correctPin) {
        setError("Aucun code PIN n'est configuré pour cet utilisateur.");
        setStatus('error');
        return;
    }
    
    setStatus('validating');
    setError(null);
    onValidated(false);

    // Simulate validation
    setTimeout(() => {
        if (fullPin === correctPin) {
            setStatus('success');
            onValidated(true);
            setActiveIndex(null);
        } else {
            setStatus('error');
            setError('Code PIN incorrect. Veuillez réessayer.');
            setPin(Array(6).fill(''));
            if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                navigator.vibrate(120);
            }
            focusInput(0);
            setActiveIndex(0);
        }
    }, 500);
  };
  
  const getStatusClasses = () => {
    switch(status) {
        case 'success': return 'border-green-500';
        case 'error': return 'border-red-500';
        default: return 'border-gray-300 focus-within:border-primary-500';
    }
  };

  const renderDigit = (digit: string, index: number) => {
    if (!digit) return '';
    return activeIndex === index ? digit : '•';
  };

  return (
    <div className="mt-4">
      <h2 className="text-lg font-bold mb-4 text-gray-800">Validation par PIN</h2>
      <p className="text-sm text-gray-500 mb-4">{userName ? `${userName.split(' ')[0]}, veuillez` : 'Veuillez'} saisir votre code PIN à 6 chiffres pour confirmer.</p>
      
      <div className={`mb-4 p-4 bg-white border-2 rounded-lg transition-colors ${getStatusClasses()}`}>
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
                  className="w-full aspect-square min-w-[2.5rem] text-center text-2xl sm:text-3xl font-bold rounded-md border border-gray-300 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  disabled={status === 'validating' || status === 'success'}
                  aria-label={`PIN digit ${index + 1}`}
              />
          ))}
        </div>
      </div>
      
      {status === 'success' && <p className="text-green-600 text-sm mt-2 text-center font-semibold">Validé avec succès !</p>}
      {status === 'error' && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
      {!correctPin && <p className="text-yellow-700 text-sm mt-2 text-center">Cet utilisateur n'a pas de code PIN configuré. Un administrateur peut en créer un sur la page de détails de l'utilisateur.</p>}
    </div>
  );
};

export default PinValidator;
