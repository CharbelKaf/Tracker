
import React, { useState, useRef, useEffect } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { ApprovalStatus, AssignmentStatus, Equipment, User } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import Pagination from '../../../components/ui/Pagination';
import { WizardLayout, WizardStep } from '../../../components/layout/WizardLayout';
import Button from '../../../components/ui/Button';
import { useAccessControl } from '../../../hooks/useAccessControl';
import StatusBadge from '../../../components/ui/StatusBadge';
import Badge from '../../../components/ui/Badge';
import { FacialRecognitionScan } from '../../../components/security/FacialRecognitionScan';
import { cn } from '../../../lib/utils';
import { EntityRow } from '../../../components/ui/EntityRow';
import { UserAvatar } from '../../../components/ui/UserAvatar';
import InputField from '../../../components/ui/InputField';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import IconButton from '../../../components/ui/IconButton';
import { EmptyState } from '../../../components/ui/EmptyState';

const ITEMS_PER_PAGE = 5;

type ValidationMethod = 'fingerprint' | 'pin' | 'face' | 'signature';

const AssignmentWizardPage: React.FC<{ onCancel: () => void; onComplete: () => void }> = ({ onCancel, onComplete }) => {
    const { equipment, users, updateEquipment, updateApproval, addApproval, approvals } = useData();
    const { showToast } = useToast();
    const { user: adminUser } = useAccessControl();

    const [step, setStep] = useState(1);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [validationMethod, setValidationMethod] = useState<ValidationMethod | null>(null);
    const [isValidated, setIsValidated] = useState(false);
    const [validatedBy, setValidatedBy] = useState<ValidationMethod | null>(null);
    const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);

    const [isImmediateHandover, setIsImmediateHandover] = useState(false);
    const [signatureCaptured, setSignatureCaptured] = useState(false);

    const [equipmentSearch, setEquipmentSearch] = useState('');
    const [equipmentPage, setEquipmentPage] = useState(1);
    const [userSearch, setUserSearch] = useState('');
    const [userPage, setUserPage] = useState(1);

    const [approvalId, setApprovalId] = useState<string | null>(null);
    const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
    const autoAdvanceTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const hash = window.location.hash;
        if (hash.includes('?')) {
            const queryString = hash.split('?')[1];
            const urlParams = new URLSearchParams(queryString);
            const pApprovalId = urlParams.get('approvalId');
            const pUserId = urlParams.get('userId');
            const pCategory = urlParams.get('category');

            if (pApprovalId) setApprovalId(pApprovalId);
            if (pUserId) {
                const foundUser = users.find(u => u.id === pUserId);
                if (foundUser) setSelectedUser(foundUser);
            }
            if (pCategory) {
                setSuggestedCategory(pCategory);
                setEquipmentSearch(pCategory);
            }
        }
    }, [users]);
    useEffect(() => {
        setEquipmentPage(1);
    }, [equipmentSearch]);

    useEffect(() => {
        setUserPage(1);
    }, [userSearch]);

    useEffect(() => {
        return () => {
            if (autoAdvanceTimerRef.current) {
                window.clearTimeout(autoAdvanceTimerRef.current);
            }
        };
    }, []);

    const filteredEquipment = equipment
        .filter(e => e.status === 'Disponible')
        .filter(e =>
            e.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
            e.assetId.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
            e.type.toLowerCase().includes(equipmentSearch.toLowerCase())
        );

    const totalEquipmentPages = Math.ceil(filteredEquipment.length / ITEMS_PER_PAGE);
    const paginatedEquipment = filteredEquipment.slice((equipmentPage - 1) * ITEMS_PER_PAGE, equipmentPage * ITEMS_PER_PAGE);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.department.toLowerCase().includes(userSearch.toLowerCase())
    );

    const totalUserPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE);

    const handleNext = () => {
        if (step < 4) {
            setStep(step + 1);
        } else if (selectedEquipment && selectedUser) {
            // LOGIQUE DE WORKFLOW
            if (approvalId) {
                const approval = approvals.find(a => a.id === approvalId);

                // Si l'approbation est en attente de traitement IT
                if (approval && (approval.status === 'WAITING_IT_PROCESSING' || approval.status === 'Pending')) {
                    const transitionDecision = updateApproval(approvalId, 'WAITING_DOTATION_APPROVAL');
                    if (!transitionDecision.allowed) {
                        showToast(
                            transitionDecision.reason || "Action non autorisée pour cette demande.",
                            'error',
                        );
                        return;
                    }

                    updateEquipment(selectedEquipment.id, {
                        status: 'En attente', // Reserved
                        assignmentStatus: 'WAITING_DOTATION_APPROVAL',
                        assignedAt: new Date().toISOString(),
                        assignedBy: adminUser?.id || '1',
                        assignedByName: adminUser?.name || 'Admin',
                        user: {
                            id: selectedUser.id,
                            name: selectedUser.name,
                            avatar: selectedUser.avatar,
                            email: selectedUser.email
                        }
                    });

                    // Update local reference logic if needed (usually handled by Context Refresh)
                    const appIndex = approvals.findIndex(a => a.id === approvalId);
                    if (appIndex >= 0) {
                        approvals[appIndex].assignedEquipmentId = selectedEquipment.id;
                        approvals[appIndex].assignedEquipmentName = selectedEquipment.name;
                    }

                    showToast("Matériel sélectionné. En attente de validation de la dotation par le Manager.", 'success');
                }
                // Fallback ou autres cas (Legacy)
                else {
                    const transitionDecision = updateApproval(approvalId, 'PENDING_DELIVERY');
                    if (!transitionDecision.allowed) {
                        showToast(
                            transitionDecision.reason || "Action non autorisée pour cette demande.",
                            'error',
                        );
                        return;
                    }

                    // ... (Keep existing or error?)
                    // If we are here, it might be a weird state. 
                    // But let's assume direct delivery if not in IT Processing
                    updateEquipment(selectedEquipment.id, {
                        status: 'En attente',
                        assignmentStatus: 'PENDING_DELIVERY',
                        assignedAt: new Date().toISOString(),
                        assignedBy: adminUser?.id,
                        user: { id: selectedUser.id, name: selectedUser.name, avatar: selectedUser.avatar, email: selectedUser.email }
                    });
                    showToast("Matériel affecté. En attente de confirmation utilisateur.", 'success');
                }
            } else {
                let finalAssignmentStatus: AssignmentStatus = 'PENDING_DELIVERY';
                let finalApprovalStatus: ApprovalStatus = 'PENDING_DELIVERY';
                const finalMainStatus = isImmediateHandover ? 'Attribué' : 'En attente';

                if (isImmediateHandover) {
                    finalAssignmentStatus = 'CONFIRMED';
                    finalApprovalStatus = 'Completed';
                }

                // Create implicit Approval for tracking
                addApproval({
                    requesterId: adminUser?.id || '1',
                    requesterName: adminUser?.name || 'Admin',
                    requesterRole: adminUser?.role || 'Admin',
                    beneficiaryId: selectedUser.id,
                    beneficiaryName: selectedUser.name,
                    isDelegated: true,
                    equipmentCategory: selectedEquipment.type,
                    reason: "Attribution directe par administrateur",
                    urgency: 'normal',
                    validationSteps: [],
                    currentStep: 99,
                    status: finalApprovalStatus,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    requester: adminUser?.name || 'Admin',
                    equipmentName: selectedEquipment.name,
                    equipmentType: selectedEquipment.type,
                    requestType: 'Attribution',
                    requestDate: new Date().toLocaleDateString(),
                    image: selectedEquipment.image,
                    assignedEquipmentId: selectedEquipment.id,
                    assignedEquipmentName: selectedEquipment.name
                });

                updateEquipment(selectedEquipment.id, {
                    status: finalMainStatus,
                    assignmentStatus: finalAssignmentStatus,
                    assignedAt: new Date().toISOString(),
                    assignedBy: adminUser?.id || '1',
                    assignedByName: adminUser?.name || 'Admin',
                    user: {
                        id: selectedUser.id,
                        name: selectedUser.name,
                        avatar: selectedUser.avatar,
                        email: selectedUser.email
                    },
                    // If immediate, confirm it
                    ...(isImmediateHandover ? {
                        confirmedBy: selectedUser.id, // Autosigned? Or Admin signed?
                        confirmedAt: new Date().toISOString()
                    } : {})
                });

                if (isImmediateHandover) {
                    showToast("Attribution effectuée et confirmée.", 'success');
                } else {
                    showToast("Attribution effectuée. En attente de confirmation utilisateur.", 'success');
                }
            }

            onComplete();
        }
    };

    const validationMethodLabels: Record<ValidationMethod, string> = {
        face: 'Face ID',
        signature: 'Signature',
        fingerprint: 'Empreinte',
        pin: 'Code PIN',
    };

    const completeValidation = (method: ValidationMethod) => {
        setValidatedBy(method);
        setValidationMethod(null);
        setIsValidated(true);
        setIsAutoAdvancing(true);

        if (autoAdvanceTimerRef.current) {
            window.clearTimeout(autoAdvanceTimerRef.current);
        }

        autoAdvanceTimerRef.current = window.setTimeout(() => {
            setIsAutoAdvancing(false);
            setStep(4);
        }, 900);
    };

    const handlePinChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        if (value !== '' && index < 5) pinRefs.current[index + 1]?.focus();
        if (index === 5 && value !== '') {
            window.setTimeout(() => completeValidation('pin'), 250);
        }
    };

    const handleValidationSuccess = (method: ValidationMethod = 'face') => {
        completeValidation(method);
    };

    const handleEquipmentSelect = (item: Equipment) => {
        setSelectedEquipment(item);
        setStep(2);
    };

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setStep(3);
    };

    const wizardSteps = [
        { id: 1, title: 'Équipement' },
        { id: 2, title: 'Utilisateur' },
        { id: 3, title: 'Validation' },
        { id: 4, title: 'Synthèse' },
    ];

    return (
        <WizardLayout
            title={approvalId ? `Affectation pour Demande #${approvalId.substring(0, 8)}` : "Attribuer un équipement"}
            currentStep={step}
            steps={wizardSteps}
            onClose={onCancel}
            onBack={step > 1 ? () => setStep(step - 1) : undefined}
            actions={
                <div className="flex gap-3">
                    {step === 4 && (
                        <Button onClick={handleNext} disabled={(step === 3 && !isValidated) || (step === 4 && isImmediateHandover && !signatureCaptured)}>
                            {step === 4 ? (approvalId ? 'Valider l\'affectation' : 'Confirmer') : 'Suivant'}
                        </Button>
                    )}
                </div>
            }
        >
            {step === 1 && (
                <WizardStep>
                    {suggestedCategory && (
                        <div className="mb-6 p-4 bg-secondary-container border border-outline-variant rounded-md flex items-start gap-3 animate-in slide-in-from-top-2">
                            <MaterialIcon name="lightbulb" size={20} className="shrink-0 mt-0.5 text-secondary" />
                            <p className="text-body-small text-on-secondary-container">Suggestion pour un <strong>{suggestedCategory}</strong>.</p>
                        </div>
                    )}
                    <div className="mb-6">
                        <SearchFilterBar
                            searchValue={equipmentSearch}
                            onSearchChange={setEquipmentSearch}
                            placeholder="Rechercher un équipement..."
                            resultCount={filteredEquipment.length}
                        />
                    </div>
                    <div className="bg-surface rounded-card shadow-elevation-1 border border-outline-variant overflow-hidden min-h-[400px]">
                        {paginatedEquipment.length > 0 ? (
                        paginatedEquipment.map(item => (
                            <EntityRow
                                key={item.id}
                                image={item.image}
                                title={item.name}
                                subtitle={
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-xs border border-outline-variant text-label-small">
                                            {item.assetId}
                                        </span>
                                        <span className="text-on-surface-variant">• {item.type}</span>
                                    </div>
                                }
                                status={<StatusBadge status={item.status} size="sm" />}
                                selected={selectedEquipment?.id === item.id}
                                onClick={() => handleEquipmentSelect(item)}
                            />
                        ))
                    ) : (
                        <div className="p-8">
                            <EmptyState
                                icon="inventory_2"
                                title="Aucun équipement disponible"
                                description={equipmentSearch ? "Aucun équipement ne correspond à votre recherche." : "Aucun équipement disponible pour une attribution."}
                            />
                        </div>
                    )}
                    </div>
                    {filteredEquipment.length > 0 && <Pagination currentPage={equipmentPage} totalPages={totalEquipmentPages} onPageChange={setEquipmentPage} className="mt-6" />}
                </WizardStep>
            )}

            {step === 2 && (
                <WizardStep>
                    <div className="mb-6">
                        <SearchFilterBar
                            searchValue={userSearch}
                            onSearchChange={setUserSearch}
                            placeholder="Rechercher un utilisateur..."
                            resultCount={filteredUsers.length}
                        />
                    </div>
                    <div className="bg-surface rounded-card shadow-elevation-1 border border-outline-variant overflow-hidden min-h-[400px]">
                        {paginatedUsers.length > 0 ? (
                        paginatedUsers.map(user => (
                            <EntityRow
                                key={user.id}
                                imageFallback={
                                    <UserAvatar
                                        name={user.name}
                                        src={user.avatar}
                                        role={user.role}
                                        size="md"
                                        className="w-full h-full"
                                    />
                                }
                                title={user.name}
                                subtitle={user.department}
                                status={
                                    <Badge variant={user.role === 'SuperAdmin' || user.role === 'Admin' ? 'info' : user.role === 'Manager' ? 'warning' : 'neutral'}>
                                        {user.role}
                                    </Badge>
                                }
                                selected={selectedUser?.id === user.id}
                                onClick={() => handleUserSelect(user)}
                            />
                        ))
                    ) : (
                        <div className="p-8">
                            <EmptyState
                                icon="person_off"
                                title="Aucun utilisateur trouvé"
                                description={userSearch ? "Aucun utilisateur ne correspond à votre recherche." : "Aucun utilisateur disponible pour cette attribution."}
                            />
                        </div>
                    )}
                    </div>
                    {filteredUsers.length > 0 && <Pagination currentPage={userPage} totalPages={totalUserPages} onPageChange={setUserPage} className="mt-6" />}
                </WizardStep>
            )}

                        {step === 3 && (
                <WizardStep>
                    <div className="min-h-[450px] flex flex-col items-center justify-center">
                        <div className="w-full max-w-2xl mb-6 rounded-md border border-outline-variant bg-surface-container-low p-4">
                            <p className="text-title-medium text-on-surface">Validation d'identité administrateur</p>
                            <p className="text-body-small text-on-surface-variant mt-1">
                                Choisissez une méthode de verification pour confirmer cette action sensible.
                            </p>
                        </div>

                        {!validationMethod && !isValidated && (
                            <div className="grid grid-cols-1 medium:grid-cols-2 gap-4 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {[
                                    {
                                        key: 'face',
                                        icon: 'face',
                                        title: 'Face ID',
                                        description: 'Biométrie faciale',
                                        iconClass: 'text-primary',
                                        action: () => setValidationMethod('face')
                                    },
                                    {
                                        key: 'signature',
                                        icon: 'edit',
                                        title: 'Signature',
                                        description: 'Validation manuscrite',
                                        iconClass: 'text-tertiary',
                                        action: () => setValidationMethod('signature')
                                    },
                                    {
                                        key: 'fingerprint',
                                        icon: 'fingerprint',
                                        title: 'Empreinte',
                                        description: 'Validation instantanée',
                                        iconClass: 'text-error',
                                        action: () => completeValidation('fingerprint')
                                    },
                                    {
                                        key: 'pin',
                                        icon: 'key',
                                        title: 'Code PIN',
                                        description: 'Saisie manuelle',
                                        iconClass: 'text-secondary',
                                        action: () => {
                                            setPin(['', '', '', '', '', '']);
                                            setValidationMethod('pin');
                                        }
                                    }
                                ].map(option => (
                                    <Button
                                        key={option.key}
                                        type="button"
                                        variant="outlined"
                                        onClick={option.action}
                                        className="h-auto w-full !rounded-md !border !border-outline-variant !bg-surface !px-6 !py-5 !text-on-surface !justify-start !items-center !text-left group hover:!border-primary hover:!shadow-elevation-2"
                                    >
                                        <MaterialIcon name={option.icon} size={28} className={cn(option.iconClass, "mr-4 group-hover:scale-110 transition-transform")} />
                                        <div className="flex-1">
                                            <h3 className="text-label-large text-on-surface mb-0.5">{option.title}</h3>
                                            <p className="text-body-small text-on-surface-variant">{option.description}</p>
                                        </div>
                                        <MaterialIcon name="chevron_right" size={18} className="text-outline group-hover:text-primary" />
                                    </Button>
                                ))}
                            </div>
                        )}

                        {validationMethod === 'face' && (
                            <FacialRecognitionScan
                                onSuccess={() => handleValidationSuccess('face')}
                                onCancel={() => setValidationMethod(null)}
                            />
                        )}

                        {validationMethod === 'signature' && (
                            <div className="bg-surface rounded-md p-10 text-center animate-in zoom-in-95 duration-medium2 w-full max-w-lg shadow-elevation-3 border border-outline-variant">
                                <h3 className="text-title-large text-on-surface mb-6 flex items-center justify-center gap-2">
                                    <MaterialIcon name="edit" size={24} className="text-tertiary" /> Signature Administrateur
                                </h3>
                                <div className="border-2 border-dashed border-outline-variant rounded-md bg-surface-container-low h-48 mb-6 flex items-center justify-center cursor-crosshair group relative overflow-hidden">
                                    <span className="text-on-surface-variant group-hover:hidden transition-all">Signer ici</span>
                                    <IconButton
                                        icon="ink_eraser"
                                        size={16}
                                        variant="standard"
                                        aria-label="Effacer la signature"
                                        onClick={(e) => { e.stopPropagation(); }}
                                        className="absolute bottom-2 right-2 !w-8 !h-8 bg-surface-container-lowest rounded-sm shadow-elevation-1 text-on-surface-variant hover:!text-error"
                                    />
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <Button variant="text" onClick={() => setValidationMethod(null)}>Changer de méthode</Button>
                                    <Button onClick={() => handleValidationSuccess('signature')}>Valider la signature</Button>
                                </div>
                            </div>
                        )}

                        {validationMethod === 'pin' && (
                            <div className="bg-surface rounded-md p-10 text-center animate-in zoom-in-95 duration-medium2 w-full max-w-md shadow-elevation-3 border border-outline-variant">
                                <div className="w-16 h-16 bg-secondary-container text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MaterialIcon name="lock" size={32} />
                                </div>
                                <h3 className="text-title-large text-on-surface mb-8">Code PIN requis</h3>
                                <div className="grid grid-cols-6 gap-3 mb-8 w-full max-w-[324px] mx-auto">
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
                                            className="h-14 !px-0 border-2 border-outline-variant rounded-md text-center text-headline-small focus:border-primary focus:ring-4 focus:ring-primary/10 input-pin transition-all duration-short4"
                                        />
                                    ))}
                                </div>
                                <Button variant="text" onClick={() => setValidationMethod(null)}>Changer de méthode</Button>
                            </div>
                        )}

                        {isValidated && (
                            <div className="flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in duration-500">
                                <div className="relative mb-2">
                                    <div className="w-20 h-20 bg-tertiary-container rounded-full flex items-center justify-center text-tertiary z-10 relative">
                                        <MaterialIcon name="check_circle" size={46} className="animate-in zoom-in duration-500 delay-100" />
                                    </div>
                                    <div className="absolute inset-0 bg-tertiary/20 rounded-full animate-ping"></div>
                                </div>
                                <h3 className="text-headline-small text-on-surface">Identité confirmée</h3>
                                <p className="text-on-surface-variant text-body-medium">
                                    Méthode utilisée: {validatedBy ? validationMethodLabels[validatedBy] : 'Validation sécurisée'}
                                </p>
                                {isAutoAdvancing ? (
                                    <div className="inline-flex items-center gap-2 text-label-medium text-on-surface-variant">
                                        <MaterialIcon name="progress_activity" size={16} className="animate-spin" />
                                        Redirection vers la synthèse...
                                    </div>
                                ) : (
                                    <Button onClick={() => setStep(4)}>Continuer</Button>
                                )}
                            </div>
                        )}
                    </div>
                </WizardStep>
            )}
            {step === 4 && selectedEquipment && selectedUser && (
                <WizardStep>
                    <div className="max-w-6xl mx-auto grid grid-cols-1 expanded:grid-cols-12 gap-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="expanded:col-span-7 space-y-4">
                            <div className="bg-surface rounded-card border border-outline-variant shadow-elevation-1 p-6">
                                <h3 className="text-headline-small text-on-surface">Synthèse de l'attribution</h3>
                                <p className="text-body-medium text-on-surface-variant mt-1">
                                    Vérifiez les informations avant confirmation.
                                </p>

                                <div className="grid grid-cols-1 medium:grid-cols-2 gap-4 mt-6">
                                    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
                                        <p className="text-label-medium text-on-surface-variant uppercase tracking-wide">Équipement</p>
                                        <div className="flex items-start gap-3 mt-3">
                                            <div className="w-16 h-16 rounded-lg bg-surface border border-outline-variant flex items-center justify-center overflow-hidden">
                                                <img src={selectedEquipment.image} className="w-full h-full object-contain p-1.5" alt={selectedEquipment.name} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-title-medium text-on-surface truncate">{selectedEquipment.name}</p>
                                                <p className="text-body-small text-on-surface-variant mt-1">{selectedEquipment.model}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="text-label-small font-mono bg-surface px-2 py-0.5 rounded-xs border border-outline-variant text-on-surface-variant">
                                                        {selectedEquipment.assetId}
                                                    </span>
                                                    <span className="text-label-small bg-surface px-2 py-0.5 rounded-xs border border-outline-variant text-on-surface-variant uppercase">
                                                        {selectedEquipment.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
                                        <p className="text-label-medium text-on-surface-variant uppercase tracking-wide">Bénéficiaire</p>
                                        <div className="flex items-start gap-3 mt-3">
                                            <UserAvatar
                                                name={selectedUser.name}
                                                src={selectedUser.avatar}
                                                role={selectedUser.role}
                                                size="md"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-title-medium text-on-surface truncate">{selectedUser.name}</p>
                                                <p className="text-body-small text-on-surface-variant mt-1 truncate">{selectedUser.email}</p>
                                                <p className="text-label-small text-on-surface-variant mt-1">{selectedUser.department || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 medium:grid-cols-3 gap-3 mt-4">
                                    <div className="bg-surface-container-low rounded-lg border border-outline-variant p-3">
                                        <p className="text-label-small text-on-surface-variant">Date d'effet</p>
                                        <p className="text-label-large text-on-surface mt-1">{new Date().toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-surface-container-low rounded-lg border border-outline-variant p-3">
                                        <p className="text-label-small text-on-surface-variant">Site</p>
                                        <p className="text-label-large text-on-surface mt-1">{adminUser?.site || 'Siège'}</p>
                                    </div>
                                    <div className="bg-surface-container-low rounded-lg border border-outline-variant p-3">
                                        <p className="text-label-small text-on-surface-variant">Validation</p>
                                        <p className="text-label-large text-on-surface mt-1">{validatedBy ? validationMethodLabels[validatedBy] : 'Validation sécurisée'}</p>
                                    </div>
                                </div>
                            </div>

                            {approvalId && (
                                <div className="bg-tertiary-container rounded-card border border-outline-variant p-4">
                                    <p className="text-label-large text-on-tertiary-container">Workflow d'approbation actif</p>
                                    <p className="text-body-small text-on-tertiary-container/90 mt-1">
                                        Cet équipement est réservé pour la demande. La validation Manager est requise avant remise.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="expanded:col-span-5 space-y-4">
                            {!approvalId && (
                                <div className="bg-surface rounded-card border border-outline-variant shadow-elevation-1 p-5">
                                    <h4 className="text-title-medium text-on-surface">Mode de remise</h4>
                                    <p className="text-body-small text-on-surface-variant mt-1">Choisissez le mode final de livraison.</p>

                                    <div className="space-y-3 mt-4">
                                        <Button
                                            type="button"
                                            variant="outlined"
                                            onClick={() => setIsImmediateHandover(true)}
                                            className={cn(
                                                "h-auto w-full !rounded-md !border-2 !px-4 !py-4 !text-left !justify-start !items-start",
                                                isImmediateHandover
                                                    ? 'border-primary !bg-primary/5 shadow-elevation-1'
                                                    : 'border-outline-variant !bg-surface hover:!border-outline'
                                            )}
                                        >
                                            <span className="block text-label-large text-on-surface">Remise immédiate</span>
                                            <span className="block text-body-small text-on-surface-variant mt-1">Signature capturée maintenant. Statut final: Attribué.</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outlined"
                                            onClick={() => setIsImmediateHandover(false)}
                                            className={cn(
                                                "h-auto w-full !rounded-md !border-2 !px-4 !py-4 !text-left !justify-start !items-start",
                                                !isImmediateHandover
                                                    ? 'border-secondary !bg-secondary-container/30 shadow-elevation-1'
                                                    : 'border-outline-variant !bg-surface hover:!border-outline'
                                            )}
                                        >
                                            <span className="block text-label-large text-on-surface">Envoi différé</span>
                                            <span className="block text-body-small text-on-surface-variant mt-1">
                                                {selectedUser.managerId ? 'Validation Manager puis utilisateur.' : 'Confirmation utilisateur après envoi.'}
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {!approvalId && isImmediateHandover && (
                                <div className="bg-surface rounded-card border border-outline-variant shadow-elevation-1 p-5">
                                    <h4 className="text-title-medium text-on-surface">Signature bénéficiaire</h4>
                                    <p className="text-body-small text-on-surface-variant mt-1">Appuyez dans la zone pour capturer la signature.</p>

                                    <div
                                        className={cn(
                                            "h-32 mt-4 border-2 border-dashed rounded-md bg-surface-container-low flex items-center justify-center cursor-crosshair transition-all duration-short4 relative overflow-hidden",
                                            signatureCaptured ? "border-tertiary bg-tertiary-container/30" : "border-outline hover:border-primary/50"
                                        )}
                                        onClick={() => setSignatureCaptured(true)}
                                    >
                                        {!signatureCaptured ? (
                                            <span className="text-label-small text-on-surface-variant uppercase tracking-widest">Signer ici</span>
                                        ) : (
                                            <div className="flex items-center gap-2 text-on-tertiary-container bg-tertiary-container px-4 py-1.5 rounded-full shadow-elevation-1">
                                                <MaterialIcon name="check_circle" size={16} />
                                                <span className="text-label-small uppercase tracking-wide">Signé</span>
                                            </div>
                                        )}

                                        {signatureCaptured && (
                                            <IconButton
                                                icon="ink_eraser"
                                                size={14}
                                                variant="standard"
                                                aria-label="Effacer la signature capturée"
                                                onClick={(e) => { e.stopPropagation(); setSignatureCaptured(false); }}
                                                className="absolute top-2 right-2 !w-8 !h-8 text-on-surface-variant hover:!text-error bg-surface-container-lowest rounded-sm shadow-elevation-1"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {!approvalId && !isImmediateHandover && (
                                <div className="bg-surface-container-low rounded-card border border-outline-variant p-4">
                                    <p className="text-label-large text-on-surface">Confirmation utilisateur requise</p>
                                    <p className="text-body-small text-on-surface-variant mt-1">
                                        La demande sera marquée en attente jusqu'à validation du bénéficiaire.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </WizardStep>
            )}
        </WizardLayout>
    );
};

export default AssignmentWizardPage;

















