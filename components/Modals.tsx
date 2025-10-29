
import React, { useState, useEffect, useRef } from 'react';
// FIX: Add FormAction and related types for the new ValidationModal
import { EquipmentStatus, Country, Site, FormAction } from '../types';
import type { Assignment, EquipmentWithDetails, User } from '../types';
import PinValidator from './PinValidator';
import FingerprintValidator from './FingerprintValidator';
// FIX: Change casing to match filename and resolve conflict.
import Button from './ui/Button';
import Select from './ui/Select';
import Modal from './ui/Modal';
import Input from './ui/Input';
export { FingerprintRegistrationModal } from './FingerprintRegistrationModal';

// useFocusTrap moved to shared hook in './hooks/useFocusTrap'

export const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
    confirmButtonText?: string;
    confirmButtonVariant?: 'primary' | 'danger';
    icon?: string;
    iconBgColor?: string;
    iconColor?: string;
}> = ({ isOpen, onClose, onConfirm, title, children, confirmButtonText = 'Confirmer', confirmButtonVariant = 'danger', icon = 'delete', iconBgColor = 'bg-red-100', iconColor = 'text-red-500' }) => {
    const confirmVariant = confirmButtonVariant === 'danger' ? 'danger' : 'primary';
    return (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          title={title}
          size="md"
          footer={
            <div className="grid grid-cols-2 gap-4">
              <Button variant="secondary" onClick={onClose}>Annuler</Button>
              <Button variant={confirmVariant} onClick={onConfirm}>{confirmButtonText}</Button>
            </div>
          }
        >
          <div className="flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-white !text-5xl mb-3">{icon}</span>
            <div className="mt-1 px-2 text-base leading-relaxed text-white/90 font-medium">
              {children}
            </div>
          </div>
        </Modal>
    );
};

export const AuditItemModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    primaryButtonText: string;
    onPrimaryClick: () => void;
    secondaryButtonText?: string;
    onSecondaryClick?: () => void;
    icon: string;
    iconBgColor: string;
    iconColor: string;
}> = ({ isOpen, onClose, title, children, primaryButtonText, onPrimaryClick, secondaryButtonText, onSecondaryClick, icon, iconBgColor, iconColor }) => {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="md"
        footer={
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" onClick={secondaryButtonText ? onSecondaryClick : onClose}>
              {secondaryButtonText || 'Annuler'}
            </Button>
            <Button onClick={onPrimaryClick}>{primaryButtonText}</Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-white !text-5xl mb-3">{icon}</span>
          <div className="mt-1 text-base text-white/90 font-medium leading-relaxed">{children}</div>
        </div>
      </Modal>
    );
};

export const BulkUpdateModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    updateType: 'status' | 'location';
    locations: string[];
}> = ({ isOpen, onClose, onConfirm, updateType, locations }) => {
    const [value, setValue] = useState('');

    const title = updateType === 'status' ? 'Changer le statut' : 'Définir l\'emplacement';
    const label = updateType === 'status' ? 'Nouveau statut' : 'Nouvel emplacement';

    return (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          title={title}
          size="sm"
          footer={
            <div className="grid grid-cols-2 gap-4">
              <Button variant="secondary" onClick={onClose}>Annuler</Button>
              <Button onClick={() => onConfirm(value)} disabled={!value}>Confirmer</Button>
            </div>
          }
        >
          {updateType === 'status' ? (
            <Select label={label} value={value} onChange={e => setValue((e.target as HTMLSelectElement).value)}>
              <option value="" disabled>Choisir…</option>
              {Object.values(EquipmentStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          ) : (
            <Select label={label} value={value} onChange={e => setValue((e.target as HTMLSelectElement).value)}>
              <option value="" disabled>Choisir…</option>
              {locations.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          )}
        </Modal>
    );
};

export const RejectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    title?: string;
    message?: string;
}> = ({ isOpen, onClose, onConfirm, title = "Rejeter la demande", message = "Veuillez fournir une raison pour le rejet. Ceci sera enregistré dans l'historique." }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason);
            setReason('');
        }
    };
    
    const handleClose = () => {
        setReason('');
        onClose();
    };

    return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title={title}
          size="md"
          footer={
            <div className="grid grid-cols-2 gap-4">
              <Button variant="secondary" onClick={handleClose}>Annuler</Button>
              <Button variant="danger" onClick={handleConfirm} disabled={!reason.trim()}>Rejeter</Button>
            </div>
          }
        >
          <p className="text-base text-gray-600 dark:text-gray-300 mb-4">{message}</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="rejection-reason">Raison du rejet</label>
            <textarea
              id="rejection-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              rows={3}
              placeholder="Entrez la raison ici..."
            />
          </div>
        </Modal>
    );
};

export const ValidationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    assignment: Assignment;
    equipment: EquipmentWithDetails;
    userToValidate: User;
    actorLabel?: string;
    instructions?: string;
}> = ({ isOpen, onClose, onConfirm, assignment, equipment, userToValidate, actorLabel, instructions }) => {
    const [validationMethod, setValidationMethod] = useState<'fingerprint' | 'pin' | null>(null);
    const [isValidated, setIsValidated] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setValidationMethod(null);
            setIsValidated(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || validationMethod) return;
        const pinAvailable = Boolean(userToValidate.pin);
        const isSmallScreen = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
        if (pinAvailable && isSmallScreen) {
            setValidationMethod('pin');
        }
    }, [isOpen, validationMethod, userToValidate.pin]);

    const isAssign = assignment.action === FormAction.ASSIGN;
    const title = actorLabel ? `Valider en tant que ${actorLabel}` : isAssign ? 'Confirmer l\'attribution' : 'Confirmer le retour';
    const confirmButtonText = actorLabel ? `Valider en tant que ${actorLabel}` : isAssign ? 'Confirmer et accepter' : 'Confirmer le retour';

    const handleValidationMethodSelect = (method: 'fingerprint' | 'pin') => {
        if (validationMethod !== method) {
            setIsValidated(false);
        }
        setValidationMethod(method);
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="md"
        footer={
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button onClick={onConfirm} disabled={!isValidated}>{confirmButtonText}</Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center">
          <div className={`flex items-center justify-center bg-primary-100 rounded-full mb-4 size-14`}>
            <span className={`material-symbols-outlined text-primary-600 !text-3xl`}>{isAssign ? 'task_alt' : 'undo'}</span>
          </div>
          <div className="mt-4 w-full text-left">
            <div className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <img src={equipment.model?.imageUrl} alt={equipment.model?.name || ''} className="size-16 rounded-md object-contain bg-gray-100 dark:bg-gray-800" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{equipment.model?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{equipment.assetTag}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 text-base text-gray-600 dark:text-gray-300 w-full">
            <p className="text-sm text-center mb-4">
              {instructions || 'Veuillez valider votre identité pour continuer.'}
            </p>
            <div className="space-y-3">
              <button type="button" onClick={() => handleValidationMethodSelect('pin')} className={`w-full flex items-center gap-4 rounded-xl border-2 p-3 text-left transition-colors ${validationMethod === 'pin' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'}`}>
                <div className="flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 shrink-0 size-10"><span className="material-symbols-outlined text-2xl">pin</span></div>
                <p className="text-gray-900 dark:text-gray-100 text-base font-semibold leading-normal flex-1 truncate">Valider par PIN</p>
              </button>
              <button type="button" onClick={() => handleValidationMethodSelect('fingerprint')} className={`w-full flex items-center gap-4 rounded-xl border-2 p-3 text-left transition-colors ${validationMethod === 'fingerprint' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'}`}>
                <div className="flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 shrink-0 size-10"><span className="material-symbols-outlined text-2xl">fingerprint</span></div>
                <p className="text-gray-900 dark:text-gray-100 text-base font-semibold leading-normal flex-1 truncate">Valider par Empreinte</p>
              </button>
            </div>
          </div>

          {validationMethod === 'pin' && (
            <div className="pt-4 animate-fade-in w-full">
              <PinValidator
                onValidated={setIsValidated}
                correctPin={userToValidate.pin}
                userName={userToValidate.name}
                autoFocus
              />
            </div>
          )}
          {validationMethod === 'fingerprint' && (
            <div className="pt-4 animate-fade-in w-full">
              <FingerprintValidator onValidated={setIsValidated} userCredentialId={userToValidate.webauthnCredentialId} />
            </div>
          )}
        </div>
      </Modal>
    );
};

const PIN_LENGTH = 6;

export const PinManagementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (pin: string) => void;
    userName: string;
    existingPin?: string;
}> = ({ isOpen, onClose, onSave, userName, existingPin }) => {
    const [newPinDigits, setNewPinDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
    const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
    const [error, setError] = useState('');
    const [confirmTouched, setConfirmTouched] = useState(false);
    const newPinRefs = useRef<(HTMLInputElement | null)[]>([]);
    const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [activeField, setActiveField] = useState<{ type: 'new' | 'confirm'; index: number } | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setNewPinDigits(Array(PIN_LENGTH).fill(''));
            setConfirmPinDigits(Array(PIN_LENGTH).fill(''));
            setConfirmTouched(false);
            setError('');
            setActiveField(null);
        } else {
            setTimeout(() => {
                newPinRefs.current[0]?.focus();
            }, 120);
        }
    }, [isOpen]);

    const newPin = newPinDigits.join('');
    const confirmPinValue = confirmPinDigits.join('');
    const isNewComplete = newPin.length === PIN_LENGTH;
    const isConfirmComplete = confirmPinValue.length === PIN_LENGTH;
    const pinsMatch = newPin === confirmPinValue && isNewComplete && isConfirmComplete;
    const shouldShowMismatch = confirmTouched && isConfirmComplete && isNewComplete && !pinsMatch;

    const handleDigitChange = (type: 'new' | 'confirm', index: number, rawValue: string) => {
        const sanitized = rawValue.replace(/\D/g, '').slice(-1);
        const setDigits = type === 'new' ? setNewPinDigits : setConfirmPinDigits;
        const refs = type === 'new' ? newPinRefs : confirmPinRefs;

        setDigits(prev => {
            const next = [...prev];
            next[index] = sanitized;
            return next;
        });

        setError('');
        if (type === 'confirm') {
            setConfirmTouched(true);
        }

        if (sanitized) {
            const nextIndex = index + 1;
            if (nextIndex < PIN_LENGTH) {
                requestAnimationFrame(() => refs.current[nextIndex]?.focus());
            } else if (type === 'new') {
                requestAnimationFrame(() => confirmPinRefs.current[0]?.focus());
            }
        }
    };

    const handleKeyDown = (type: 'new' | 'confirm', index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        const refs = type === 'new' ? newPinRefs : confirmPinRefs;
        const digits = type === 'new' ? newPinDigits : confirmPinDigits;
        const setDigits = type === 'new' ? setNewPinDigits : setConfirmPinDigits;

        if (type === 'confirm') {
            setConfirmTouched(true);
        }

        if (e.key === 'Backspace') {
            e.preventDefault();
            if (digits[index]) {
                setDigits(prev => {
                    const next = [...prev];
                    next[index] = '';
                    return next;
                });
            } else if (index > 0) {
                setDigits(prev => {
                    const next = [...prev];
                    next[index - 1] = '';
                    return next;
                });
                requestAnimationFrame(() => refs.current[index - 1]?.focus());
            }
            return;
        }

        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            refs.current[index - 1]?.focus();
            return;
        }

        if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
            e.preventDefault();
            refs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (type: 'new' | 'confirm', index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
        if (!pasted) return;
        e.preventDefault();

        const digitsToInsert = pasted.slice(0, PIN_LENGTH - index).split('');
        const setDigits = type === 'new' ? setNewPinDigits : setConfirmPinDigits;
        const refs = type === 'new' ? newPinRefs : confirmPinRefs;

        setDigits(prev => {
            const next = [...prev];
            digitsToInsert.forEach((digit, offset) => {
                next[index + offset] = digit;
            });
            return next;
        });

        if (type === 'confirm') {
            setConfirmTouched(true);
        }

        const nextPosition = index + digitsToInsert.length;
        requestAnimationFrame(() => {
            if (type === 'new') {
                if (nextPosition < PIN_LENGTH) {
                    refs.current[nextPosition]?.focus();
                } else {
                    confirmPinRefs.current[0]?.focus();
                }
            } else {
                const target = Math.min(nextPosition, PIN_LENGTH - 1);
                refs.current[target]?.focus();
            }
        });
    };

    const renderDigit = (type: 'new' | 'confirm', index: number, digit: string) => {
        if (!digit) return '';
        return activeField?.type === type && activeField.index === index ? digit : '•';
    };

    const handleSave = () => {
        setError('');
        if (!isNewComplete || !isConfirmComplete) {
            setError('Le code PIN doit contenir 6 chiffres.');
            return;
        }
        if (!pinsMatch) {
            setError('Les codes PIN ne correspondent pas.');
            return;
        }
        onSave(newPin);
        setNewPinDigits(Array(PIN_LENGTH).fill(''));
        setConfirmPinDigits(Array(PIN_LENGTH).fill(''));
        setConfirmTouched(false);
        setActiveField(null);
    };

    const isEditing = !!existingPin;
    const hasError = Boolean(error) || shouldShowMismatch;
    const showSuccess = pinsMatch && !error;
    const statusMessage = error || (shouldShowMismatch ? 'Les codes PIN ne correspondent pas.' : '');

    const newFieldClasses = `mb-4 p-4 bg-white dark:bg-gray-800 border-2 dark:border-gray-600 rounded-lg transition-colors focus-within:border-primary-500 ${isNewComplete ? 'border-primary-400' : 'border-gray-300 dark:border-gray-600'}`;
    const confirmFieldClasses = `mb-2 p-4 bg-white dark:bg-gray-800 border-2 dark:border-gray-600 rounded-lg transition-colors focus-within:border-primary-500 ${hasError ? 'border-red-500' : showSuccess ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'}`;

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${isEditing ? 'Modifier' : 'Créer'} le code PIN`}
        size="sm"
        footer={
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSave} disabled={!pinsMatch}>Enregistrer</Button>
          </div>
        }
      >
        <div className="pt-0">
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Définissez un code PIN à 6 chiffres pour {userName}.</p>

                    <div className={newFieldClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="new-pin-0">Nouveau PIN</label>
                            {isNewComplete && !hasError && !showSuccess && (
                                <span className="text-xs text-primary-600 font-semibold">Complet</span>
                            )}
                        </div>
                        <div className="grid grid-cols-6 gap-2 sm:gap-3 w-full">
                            {newPinDigits.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`new-pin-${index}`}
                                    ref={el => { newPinRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="off"
                                    value={renderDigit('new', index, digit)}
                                    onChange={e => handleDigitChange('new', index, e.target.value)}
                                    onKeyDown={e => handleKeyDown('new', index, e)}
                                    onPaste={e => handlePaste('new', index, e)}
                                    onFocus={() => setActiveField({ type: 'new', index })}
                                    onBlur={() => {
                                        setActiveField(prev => (prev && prev.type === 'new' && prev.index === index ? null : prev));
                                    }}
                                    maxLength={1}
                                    className="w-full aspect-square min-w-[2.5rem] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center text-2xl font-bold text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                                    aria-label={`Chiffre ${index + 1} du nouveau PIN`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={confirmFieldClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="confirm-pin-0">Confirmer le PIN</label>
                            {showSuccess && (
                                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">verified</span>
                                    PIN confirmé
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-6 gap-2 sm:gap-3 w-full">
                            {confirmPinDigits.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`confirm-pin-${index}`}
                                    ref={el => { confirmPinRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="off"
                                    value={renderDigit('confirm', index, digit)}
                                    onChange={e => handleDigitChange('confirm', index, e.target.value)}
                                    onKeyDown={e => handleKeyDown('confirm', index, e)}
                                    onPaste={e => handlePaste('confirm', index, e)}
                                    onFocus={() => {
                                        setConfirmTouched(true);
                                        setActiveField({ type: 'confirm', index });
                                    }}
                                    onBlur={() => {
                                        setActiveField(prev => (prev && prev.type === 'confirm' && prev.index === index ? null : prev));
                                    }}
                                    maxLength={1}
                                    className={`w-full aspect-square min-w-[2.5rem] rounded-md border ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-400/60' : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'} bg-white dark:bg-gray-800 text-center text-2xl font-bold text-gray-900 dark:text-gray-100`}
                                    aria-label={`Chiffre ${index + 1} de confirmation du PIN`}
                                />
                            ))}
                        </div>
                    </div>

                    {hasError && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-2 text-center">{statusMessage}</p>
                    )}
                    {!hasError && !showSuccess && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Utilisez uniquement des chiffres. Évitez les suites trop évidentes comme 123456.</p>
                    )}
                    {showSuccess && (
                        <p className="text-green-600 dark:text-green-400 text-sm mt-2 text-center font-semibold">Les deux codes PIN correspondent.</p>
                    )}
        </div>
      </Modal>
    );
};

export interface LocationEditModalInfo {
    entityType: 'country' | 'site' | 'department';
    entity?: any;
    parentId?: string;
}

export const LocationEditModal: React.FC<{
    info: LocationEditModalInfo;
    countries: Country[];
    sites: Site[];
    onClose: () => void;
    onSave: (entityType: 'country' | 'site' | 'department', data: any) => Promise<void>;
}> = ({ info, countries, sites, onClose, onSave }) => {
    const { entityType, entity, parentId: parentIdFromInfo } = info;
    const [name, setName] = useState(entity?.name || '');
    const [isSaving, setIsSaving] = useState(false);
    const [parentId, setParentId] = useState(() => {
        if (parentIdFromInfo) return parentIdFromInfo;
        if (entity) {
            if (entityType === 'site') return (entity as Site).countryId;
            if (entityType === 'department') return (entity as any).siteId;
        }
        if (entityType === 'site' && countries.length > 0) return countries[0].id;
        if (entityType === 'department' && sites.length > 0) return sites[0].id;
        return '';
    });
    // Modal wrapper handles focus trapping

    const getTitle = () => {
        const action = entity ? 'Modifier' : 'Ajouter';
        switch(entityType) {
            case 'country': return `${action} un pays`;
            case 'site': return `${action} un site`;
            case 'department': return `${action} un service`;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);
        try {
            await onSave(entityType, { id: entity?.id, name, parentId });
            onClose();
        } catch (error) {
            setIsSaving(false);
        }
    };

    const isEditing = !!entity;

    return (
      <Modal
        isOpen={!!info}
        onClose={onClose}
        title={getTitle()}
        size="sm"
        footer={
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" form="location-edit-form" disabled={!name.trim() || isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <form id="location-edit-form" onSubmit={handleSubmit} className="space-y-4">
          {entityType === 'site' && (
            <div>
              <Select label="Pays" value={parentId} onChange={e => setParentId((e.target as HTMLSelectElement).value)} disabled={isEditing}>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
          )}
          {entityType === 'department' && (
            <div>
              <Select label="Site" value={parentId} onChange={e => setParentId((e.target as HTMLSelectElement).value)} disabled={isEditing}>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
          )}
          <div>
            <Input label="Nom" id="location-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
        </form>
      </Modal>
    );
};