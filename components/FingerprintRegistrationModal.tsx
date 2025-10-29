



import React, { useState, useEffect } from 'react';
import FingerprintIcon from './icons/FingerprintIcon';
import Modal from './ui/Modal';
import Button from './ui/Button';

// Helper: ArrayBuffer to Base64URL
function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const charCode of bytes) {
    str += String.fromCharCode(charCode);
  }
  const base64 = window.btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

interface FingerprintRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (credentialId: string) => void;
    userId: string;
    userName: string;
    existingCredentialId?: string;
}

type RegistrationStatus = 'idle' | 'prompting' | 'registering' | 'success' | 'error';

export const FingerprintRegistrationModal: React.FC<FingerprintRegistrationModalProps> = ({ isOpen, onClose, onSave, userId, userName, existingCredentialId }) => {
    const [status, setStatus] = useState<RegistrationStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [supportError, setSupportError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState<boolean>(true);

    useEffect(() => {
        if (isOpen) {
            setStatus('idle');
            setError(null);
            setSupportError(null);
            setIsSupported(true);

            if (!window.isSecureContext) {
                setSupportError("WebAuthn nécessite une connexion sécurisée (HTTPS ou localhost).");
                setIsSupported(false);
                return;
            }

            if (!('PublicKeyCredential' in window)) {
                setSupportError("WebAuthn n'est pas pris en charge par ce navigateur.");
                setIsSupported(false);
                return;
            }

            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                .then((available) => {
                    if (!available) {
                        setSupportError("Aucun capteur biométrique compatible WebAuthn n'a été détecté sur cet appareil.");
                        setIsSupported(false);
                    }
                })
                .catch((err) => {
                    console.error('Fingerprint availability check failed:', err);
                    setSupportError("Impossible de vérifier la disponibilité de WebAuthn sur cet appareil.");
                    setIsSupported(false);
                });
        }
    }, [isOpen]);

    const handleRegistration = async () => {
        if (!isSupported) {
            return;
        }

        if (!navigator.credentials || !navigator.credentials.create) {
          setError("WebAuthn n'est pas pris en charge par ce navigateur.");
          setStatus('error');
          return;
        }
        
        setStatus('prompting');
        setError(null);
    
        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);
    
            const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
                challenge,
                rp: {
                    name: "Neemba Tracker",
                    id: window.location.hostname,
                },
                user: {
                    // FIX: Changed implementation to avoid type error with charCodeAt.
                    id: new Uint8Array(Array.from(userId).map((c: string) => c.charCodeAt(0))),
                    name: userName,
                    displayName: userName,
                },
                pubKeyCredParams: [{ alg: -7, type: 'public-key' }], // ES256
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required',
                    requireResidentKey: true,
                },
                timeout: 60000,
                attestation: 'none',
            };
            
            setStatus('registering');
            const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
          
            if (credential && (credential as PublicKeyCredential).rawId) {
                const credentialId = bufferToBase64URL((credential as PublicKeyCredential).rawId);
                setStatus('success');
                onSave(credentialId);
            } else {
                throw new Error('La création des informations d\'identification a échoué.');
            }
        } catch (err: any) {
            console.error("Erreur d'enregistrement d'empreinte digitale:", err);
            if (err.name === 'NotAllowedError') {
                 setError("L'enregistrement a été annulé.");
            } else {
                setError("L'enregistrement a échoué. Veuillez réessayer.");
            }
            setStatus('error');
        }
    };

    const handleRemove = () => {
        onSave(''); // Pass empty string to signal removal
    };

    const renderStatusContent = () => {
        switch (status) {
            case 'prompting':
                return <p>Veuillez suivre les instructions de votre navigateur pour continuer.</p>;
            case 'registering':
                return <p>Veuillez toucher le capteur d'empreintes digitales...</p>;
            case 'success':
                return <p className="text-green-600 font-semibold">Enregistrement réussi !</p>;
            case 'error':
                return <p className="text-red-600">{error}</p>;
            case 'idle':
            default:
                return (
                    <>
                        <p className="text-gray-600">
                            {existingCredentialId
                                ? "Une empreinte est déjà enregistrée. Vous pouvez l'enregistrer à nouveau ou la supprimer."
                                : "Cliquez sur 'Démarrer' pour enregistrer une empreinte digitale pour cet utilisateur."}
                        </p>
                        {supportError && (
                            <p className="mt-3 text-sm text-red-600">{supportError}</p>
                        )}
                    </>
                );
        }
    };

    const footer = existingCredentialId ? (
      <div className="grid grid-cols-2 gap-4">
        <Button variant="danger" onClick={handleRemove}>Supprimer</Button>
        <Button onClick={handleRegistration} disabled={status === 'registering' || status === 'prompting' || !isSupported}>Ré-enregistrer</Button>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-4">
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleRegistration} disabled={status === 'registering' || status === 'prompting' || !isSupported}>Démarrer</Button>
      </div>
    );

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${existingCredentialId ? 'Gérer' : 'Enregistrer'} l'empreinte digitale`}
        size="md"
        footer={footer}
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-primary-100 rounded-full mb-4">
            <FingerprintIcon className="text-primary-600 !w-8 !h-8" />
          </div>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-300">pour {userName}</p>
          <div className="mt-4 h-12 flex items-center justify-center">
            {renderStatusContent()}
          </div>
        </div>
      </Modal>
    );
}
;