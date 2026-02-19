import React, { useState, useRef, useEffect } from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import { cn } from '../../lib/utils';
import { validateAdminPIN, logSecurityAction } from '../../lib/security';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import SideSheet from '../ui/SideSheet';
import Button from '../ui/Button';
import InputField from '../ui/InputField';
import IconButton from '../ui/IconButton';
import { FacialRecognitionScan } from './FacialRecognitionScan';

interface SecurityGateProps {
  onVerified: () => void;
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  level?: 'standard' | 'critical';
  entityId?: string;
}

type ValidationMethod = 'face' | 'signature' | 'fingerprint' | 'pin' | null;

const SecurityGate: React.FC<SecurityGateProps> = ({
  onVerified,
  trigger,
  title = "Validation de sécurité",
  description = "Choisissez une méthode pour confirmer votre identité administrateur.",
  entityId = 'system'
}) => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState<ValidationMethod>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // States pour PIN
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [attempts, setAttempts] = useState(0);

  // --- LOGIQUE PIN ---
  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value !== '' && index < 5) pinRefs.current[index + 1]?.focus();
    if (index === 5 && value !== '') {
      handleFinalVerify('pin', pin.join('') + value);
    }
  };

  const handleFinalVerify = (usedMethod: string, pinValue?: string) => {
    setIsVerifying(true);

    // Simulation délai sécurité
    setTimeout(() => {
      let success = true;
      if (usedMethod === 'pin') {
        success = validateAdminPIN(pinValue || '');
      }

      if (success) {
        setIsValidated(true);
        setMethod(null);
        logSecurityAction(title, currentUser?.id || 'unknown', entityId, usedMethod.toUpperCase() as any, 'SUCCESS');

        // Délai pour montrer l'animation de succès avant de fermer
        setTimeout(() => {
          onVerified();
          handleClose();
        }, 1500);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin(['', '', '', '', '', '']);
        pinRefs.current[0]?.focus();
        showToast(`Code incorrect. Tentative ${newAttempts}/3`, "error");
        if (newAttempts >= 3) handleClose();
      }
      setIsVerifying(false);
    }, 800);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setMethod(null);
      setIsValidated(false);
      setPin(['', '', '', '', '', '']);
      setAttempts(0);
    }, 300);
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="contents">
        {trigger}
      </div>

      <SideSheet
        open={isOpen}
        onClose={handleClose}
        title={isValidated ? "Identité confirmée" : title}
        description={!method && !isValidated ? description : undefined}
        width="standard"
        side="right"
      >
        <div className="min-h-[400px] flex flex-col items-center justify-center py-2">

          {/* 1. ÉCRAN DE SÉLECTION (Grid 2x2 harmonisé) */}
          {!method && !isValidated && (
            <div className="w-full space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 gap-3 w-full">
                {[
                  {
                    key: 'face',
                    icon: 'face',
                    title: 'Face ID',
                    description: 'Reconnaissance faciale',
                    iconClass: 'text-primary',
                    hoverClass: 'hover:!border-primary',
                    action: () => setMethod('face' as ValidationMethod)
                  },
                  {
                    key: 'signature',
                    icon: 'draw',
                    title: 'Signature',
                    description: 'Validation manuscrite',
                    iconClass: 'text-tertiary',
                    hoverClass: 'hover:!border-tertiary',
                    action: () => setMethod('signature' as ValidationMethod)
                  },
                  {
                    key: 'fingerprint',
                    icon: 'fingerprint',
                    title: 'Empreinte',
                    description: 'Capteur biométrique',
                    iconClass: 'text-error',
                    hoverClass: 'hover:!border-error',
                    action: () => setMethod('fingerprint' as ValidationMethod)
                  },
                  {
                    key: 'pin',
                    icon: 'key',
                    title: 'Code PIN',
                    description: 'Saisie manuelle',
                    iconClass: 'text-secondary',
                    hoverClass: 'hover:!border-secondary',
                    action: () => setMethod('pin' as ValidationMethod)
                  }
                ].map(option => (
                  <Button
                    key={option.key}
                    type="button"
                    variant="outlined"
                    onClick={option.action}
                    className={cn(
                      "h-auto w-full !rounded-md !border !border-outline-variant !bg-surface !px-4 !py-4 !text-on-surface !justify-start !items-center !text-left gap-3 group hover:!shadow-elevation-2",
                      option.hoverClass
                    )}
                  >
                    <MaterialIcon name={option.icon} size={24} className={cn(option.iconClass, "group-hover:scale-110 transition-transform")} />
                    <div>
                      <h4 className="text-title-small text-on-surface mb-1">{option.title}</h4>
                      <p className="text-label-small text-on-surface-variant">{option.description}</p>
                    </div>
                  </Button>
                ))}
              </div>

              <Button variant="outlined" onClick={handleClose} className="w-full text-on-surface-variant">Annuler</Button>
            </div>
          )}

          {/* 2. FACE ID SCAN */}
          {method === 'face' && (
            <FacialRecognitionScan
              onSuccess={() => handleFinalVerify('face')}
              onCancel={() => setMethod(null)}
            />
          )}

          {/* 3. SIGNATURE PAD */}
          {method === 'signature' && (
            <div className="w-full space-y-6 animate-in zoom-in-95 duration-300 text-center">
              <h3 className="text-title-large text-on-surface flex items-center justify-center gap-2">
                <MaterialIcon name="draw" className="text-tertiary" /> Signature de validation
              </h3>
              <div className="border-2 border-dashed border-outline-variant rounded-md bg-surface-container-low h-48 flex items-center justify-center cursor-crosshair group relative overflow-hidden">
                <span className="text-on-surface-variant text-label-large uppercase tracking-widest group-hover:hidden transition-all">Signer ici</span>
                <IconButton
                  icon="ink_eraser"
                  size={16}
                  variant="standard"
                  aria-label="Effacer la zone de signature"
                  className="absolute bottom-2 right-2 !w-8 !h-8 bg-surface-container-lowest rounded-sm shadow-elevation-1 text-on-surface-variant hover:!text-error"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outlined" className="flex-1" onClick={() => setMethod(null)}>Retour</Button>
                <Button className="flex-1" onClick={() => handleFinalVerify('signature')}>Valider</Button>
              </div>
            </div>
          )}

          {/* 4. PIN INPUT */}
          {method === 'pin' && (
            <div className="w-full space-y-8 animate-in zoom-in-95 duration-300 text-center">
              <div className="mx-auto w-16 h-16 bg-secondary-container text-secondary rounded-full flex items-center justify-center mb-4">
                <MaterialIcon name="lock" size={32} />
              </div>
              <h3 className="text-title-large text-on-surface">Confirmer votre code PIN</h3>
              <div className="grid grid-cols-6 gap-1.5 w-full max-w-[300px] mx-auto">
                {pin.map((digit, idx) => (
                  <InputField
                    key={idx}
                    ref={el => { pinRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    aria-label={`Chiffre PIN ${idx + 1}`}
                    className="h-12 !px-0 border-2 border-outline-variant rounded-md text-center text-title-medium focus:border-primary focus:ring-2 focus:ring-primary/10 input-pin transition-all duration-short4 ease-emphasized"
                  />
                ))}
              </div>
              {attempts > 0 && <p className="text-error text-body-small">PIN incorrect ({attempts}/3)</p>}
              <Button variant="outlined" onClick={() => setMethod(null)} className="text-on-surface-variant">Retour</Button>
            </div>
          )}

          {/* 5. SUCCESS STATE */}
          {isValidated && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-500">
              <div className="relative">
                <div className="w-24 h-24 bg-tertiary-container rounded-full flex items-center justify-center text-tertiary z-10 relative shadow-elevation-4">
                  <MaterialIcon name="check_circle" size={56} className="animate-in zoom-in duration-500 delay-200" />
                </div>
                <div className="absolute inset-0 bg-tertiary/20 rounded-full animate-ping"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-headline-small text-on-surface">Identité confirmée</h3>
                <p className="text-on-surface-variant max-w-xs text-body-large leading-relaxed">
                  L'authentification a été validée avec succès. L'action va être exécutée.
                </p>
              </div>
            </div>
          )}
        </div>
      </SideSheet>
    </>
  );
};

export default SecurityGate;

