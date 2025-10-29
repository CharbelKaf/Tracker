import React, { useState, useEffect } from 'react';
import FingerprintIcon from './icons/FingerprintIcon';

interface FingerprintValidatorProps {
  onValidated: (isValidated: boolean) => void;
  userCredentialId?: string;
}

type ValidationStatus = 'idle' | 'scanning' | 'success' | 'error' | 'unsupported';

// Helper: Convert Base64URL to ArrayBuffer
function base64URLToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLength);
  const raw = window.atob(padded);
  const buffer = new ArrayBuffer(raw.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return buffer;
}


const FingerprintValidator: React.FC<FingerprintValidatorProps> = ({ onValidated, userCredentialId }) => {
  const [status, setStatus] = useState<ValidationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      onValidated(false);

      if (!window.isSecureContext) {
        setStatus('unsupported');
        setError("WebAuthn nécessite une connexion sécurisée (HTTPS ou localhost).");
        return;
      }

      if (!('PublicKeyCredential' in window)) {
        setStatus('unsupported');
        setError("WebAuthn n'est pas pris en charge par ce navigateur.");
        return;
      }

      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!available) {
          setStatus('unsupported');
          setError("Aucun capteur d'empreintes digitales disponible sur cet appareil.");
          return;
        }
      } catch (err) {
        console.error('Fingerprint availability check failed:', err);
        setStatus('unsupported');
        setError("Impossible de vérifier la disponibilité de WebAuthn sur cet appareil.");
        return;
      }

      setStatus('idle');
      setError(null);
    };

    checkSupport();
  }, [onValidated]);

  const handleValidation = async () => {
    if (status !== 'idle' || !userCredentialId) return;

    if (!navigator.credentials || !navigator.credentials.get) {
      setError("WebAuthn n'est pas pris en charge par ce navigateur.");
      setStatus('unsupported');
      return;
    }
    
    setStatus('scanning');
    setError(null);
    onValidated(false);

    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
            challenge: challenge,
            allowCredentials: [{
                type: 'public-key',
                id: base64URLToBuffer(userCredentialId),
            }],
            timeout: 60000,
            userVerification: 'required',
        };

        const assertion = await navigator.credentials.get({ publicKey: publicKeyCredentialRequestOptions });
        
        if (assertion) {
            setStatus('success');
            onValidated(true);
        } else {
            throw new Error('Assertion failed');
        }
    } catch (err: any) {
        console.error("Fingerprint validation error:", err);
        if (err.name === 'NotAllowedError') {
             setError("Validation annulée.");
        } else {
            setError("La validation a échoué. Veuillez réessayer.");
        }
        setStatus('idle');
        onValidated(false);
    }
  };

  const renderContent = () => {
    if (!userCredentialId) {
        return (
            <>
                <FingerprintIcon className="text-gray-400" />
                <span className="ml-2 text-gray-500">Empreinte non enregistrée pour cet utilisateur.</span>
            </>
        );
    }
    switch (status) {
      case 'unsupported':
        return (
          <>
            <FingerprintIcon className="text-gray-400" />
            <span className="ml-2 text-left">{error || "Le navigateur ne permet pas cette validation."}</span>
          </>
        );
      case 'scanning':
        return (
          <>
            <FingerprintIcon className="animate-pulse" />
            <span className="ml-2">Scan en cours...</span>
          </>
        );
      case 'success':
        return (
          <>
            <span className="material-symbols-outlined">check_circle</span>
            <span className="ml-2">Validé</span>
          </>
        );
      case 'error':
        return (
            <>
                <span className="material-symbols-outlined">error</span>
                <span className="ml-2">{error || 'Erreur'}</span>
            </>
        );
      case 'idle':
      default:
        return (
          <>
            <FingerprintIcon />
            <span className="ml-2">Valider avec l'empreinte digitale</span>
          </>
        );
    }
  };
  
  const getButtonClasses = () => {
    let baseClasses = "w-full font-bold py-3 px-4 rounded-lg flex items-center justify-center shadow-sm transition-colors";
    if (!userCredentialId) {
        return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }
    switch (status) {
      case 'scanning':
        return `${baseClasses} bg-yellow-500 text-white cursor-wait`;
      case 'success':
        return `${baseClasses} bg-green-600 text-white`;
      case 'error':
        return `${baseClasses} bg-red-600 text-white`;
      case 'unsupported':
        return `${baseClasses} bg-gray-100 text-gray-500 cursor-not-allowed`;
      case 'idle':
      default:
        return `${baseClasses} bg-gray-200 hover:bg-gray-300 text-gray-800`;
    }
  }

  return (
    <div className="mt-4">
      <h2 className="text-lg font-bold mb-4 text-gray-800">ID par empreinte digitale</h2>
      <button
        onClick={handleValidation}
        disabled={!userCredentialId || status === 'unsupported' || status === 'scanning'}
        className={getButtonClasses()}
        aria-live="polite"
      >
        {renderContent()}
      </button>
      {error && status !== 'success' && status !== 'scanning' && (
        <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
      )}
    </div>
  );
};

export default FingerprintValidator;