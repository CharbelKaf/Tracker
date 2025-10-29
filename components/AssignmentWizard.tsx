import React, { useState, useMemo, useEffect } from 'react';
import type { Assignment, Equipment, User, Model, Category, EquipmentCondition } from '../types';
import { FormAction, EquipmentStatus, UserRole } from '../types';
import { FormWizard } from './FormWizard';
import FingerprintValidator from './FingerprintValidator';
import FingerprintIcon from './icons/FingerprintIcon';
import PinValidator from './PinValidator';
import { useToast } from '../contexts/ToastContext';
import { ListItemCard } from './PageHeader';
import { FormSection, Textarea } from './Form';
import UserProfileHeader from './UserProfileHeader';
import SmartSearchInput from './SmartSearchInput';
import { getUserRoleColor, getEquipmentStatusColor } from '../constants/statusColors';
import { ConfirmationModal } from './Modals';

const CONDITION_OPTIONS: EquipmentCondition[] = ['Excellent', 'Bon', 'Moyen', 'Mauvais'];

interface AssignmentWizardProps {
  action: FormAction;
  initialEquipmentId?: string;
  initialUserId?: string;
  equipment: Equipment[];
  users: User[];
  currentUser: User;
  models: Model[];
  categories: Category[];
  assignments: Assignment[]; // Needed for return flow
  onSubmit: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
  onBack: () => void;
}

// Define all possible steps with unique IDs
const STEPS = {
  SELECT_EQUIPMENT_ASSIGN: { id: 'SELECT_EQUIPMENT_ASSIGN', title: 'Choisir l\'équipement' },
  SELECT_EQUIPMENT_RETURN: { id: 'SELECT_EQUIPMENT_RETURN', title: 'Choisir l\'équipement à retourner' },
  SELECT_USER: { id: 'SELECT_USER', title: 'Choisir l\'utilisateur' },
  CHECK_CONDITION: { id: 'CHECK_CONDITION', title: 'État de l\'équipement' },
  ADMIN_VALIDATION: { id: 'ADMIN_VALIDATION', title: 'Validation Administrateur' },
  SUMMARY: { id: 'SUMMARY', title: 'Synthèse' },
};


const AssignmentWizard: React.FC<AssignmentWizardProps> = ({
  action,
  initialEquipmentId,
  initialUserId,
  equipment,
  users,
  currentUser,
  models,
  categories,
  assignments,
  onSubmit,
  onBack,
}) => {
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId || null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(initialEquipmentId || null);
  
  const [condition, setCondition] = useState<EquipmentCondition>('Bon');
  const [returnNotes, setReturnNotes] = useState('');

  const [adminValidationMethod, setAdminValidationMethod] = useState<'passkey' | 'user_pin' | null>(null);
  const [isAdminValidated, setIsAdminValidated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancelRequest = () => setShowCancelConfirm(true);

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false);
    setSelectedEquipmentId(null);
    setSelectedUserId(null);
    setCondition('Bon');
    setReturnNotes('');
    setAdminValidationMethod(null);
    setIsAdminValidated(false);
    setCurrentStep(0);
    setSearchTerm('');
    onBack();
  };

  const handleCancelDismiss = () => setShowCancelConfirm(false);

  const modelMap = useMemo(() => new Map(models.map(m => [m.id, m])), [models]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  
  const lastAssignmentForReturn = useMemo(() => {
    const equipmentIdForReturn = initialEquipmentId || selectedEquipmentId;
    if (action === FormAction.RETURN && equipmentIdForReturn) {
      return assignments
        .filter(a => a.equipmentId === equipmentIdForReturn && a.action === FormAction.ASSIGN)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }
    return null;
  }, [action, initialEquipmentId, selectedEquipmentId, assignments]);

  const steps = useMemo(() => {
    const wizardSteps = [];
    if (action === FormAction.ASSIGN) {
        if (!initialEquipmentId) wizardSteps.push(STEPS.SELECT_EQUIPMENT_ASSIGN);
        if (!initialUserId) wizardSteps.push(STEPS.SELECT_USER);
        wizardSteps.push(STEPS.ADMIN_VALIDATION);
        wizardSteps.push(STEPS.SUMMARY);
    } else { // RETURN
        if (!initialEquipmentId) wizardSteps.push(STEPS.SELECT_EQUIPMENT_RETURN);
        wizardSteps.push(STEPS.CHECK_CONDITION);
        wizardSteps.push(STEPS.ADMIN_VALIDATION);
        wizardSteps.push(STEPS.SUMMARY);
    }
    return wizardSteps;
  }, [action, initialEquipmentId, initialUserId]);

  const currentStepConfig = steps[currentStep];

  useEffect(() => {
    // Reset validation when step changes to a validation step
    if (currentStepConfig?.id === 'ADMIN_VALIDATION') {
        setIsAdminValidated(false);
        setAdminValidationMethod(null);
    }
  }, [currentStepConfig]);

  useEffect(() => {
    if (!adminValidationMethod) {
      if (currentUser.webauthnCredentialId) {
        setAdminValidationMethod('passkey');
      } else if (currentUser.pin) {
        setAdminValidationMethod('user_pin');
      }
    }
  }, [adminValidationMethod, currentUser.webauthnCredentialId, currentUser.pin]);

  useEffect(() => {
    if (adminValidationMethod) {
      setIsAdminValidated(false);
    }
  }, [adminValidationMethod]);

  const availableEquipment = useMemo(() => equipment
      .filter(e => e.status === EquipmentStatus.AVAILABLE)
      .map(e => ({ ...e, model: modelMap.get(e.modelId), category: categoryMap.get(modelMap.get(e.modelId)?.categoryId || '') }))
      .sort((a,b) => (a.model?.name || '').localeCompare(b.model?.name || '')),
  [equipment, modelMap, categoryMap]);
  
  const assignedEquipment = useMemo(() => equipment
        .filter(e => e.status === EquipmentStatus.ASSIGNED)
        .map(e => {
            const lastAssignment = assignments
                .filter(a => a.equipmentId === e.id && a.action === FormAction.ASSIGN)
                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            const user = lastAssignment ? users.find(u => u.id === lastAssignment.userId) : null;
            return { 
                ...e, 
                model: modelMap.get(e.modelId), 
                category: categoryMap.get(modelMap.get(e.modelId)?.categoryId || ''),
                assignedTo: user?.name
            }
        })
        .sort((a,b) => (a.model?.name || '').localeCompare(b.model?.name || '')),
    [equipment, assignments, users, modelMap, categoryMap]);

  const filteredEquipment = useMemo(() => availableEquipment.filter(item => {
      const lowerCaseTerm = searchTerm.toLowerCase();
      return searchTerm === '' || item.assetTag.toLowerCase().includes(lowerCaseTerm) || item.model?.name.toLowerCase().includes(lowerCaseTerm) || item.category?.name.toLowerCase().includes(lowerCaseTerm);
  }), [availableEquipment, searchTerm]);
    
  const filteredReturnEquipment = useMemo(() => assignedEquipment.filter(item => {
        const lowerCaseTerm = searchTerm.toLowerCase();
        return searchTerm === '' || 
            item.assetTag.toLowerCase().includes(lowerCaseTerm) || 
            item.model?.name.toLowerCase().includes(lowerCaseTerm) || 
            item.assignedTo?.toLowerCase().includes(lowerCaseTerm);
    }), [assignedEquipment, searchTerm]);

  const sortedUsers = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name)), [users]);
  const filteredUsers = useMemo(() => sortedUsers.filter(user => {
      const lowerCaseTerm = searchTerm.toLowerCase();
      return searchTerm === '' || user.name.toLowerCase().includes(lowerCaseTerm) || user.department?.toLowerCase().includes(lowerCaseTerm);
  }), [sortedUsers, searchTerm]);
  
  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedEquipment = equipment.find(e => e.id === selectedEquipmentId);
  const userForReturn = users.find(u => u.id === lastAssignmentForReturn?.userId);
  const model = selectedEquipment ? modelMap.get(selectedEquipment.modelId) : null;
  const category = model ? categoryMap.get(model.categoryId) : null;

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };
  
  const handleEquipmentSelect = (equipmentId: string) => {
    setSelectedEquipmentId(equipmentId);
  };
  
  const handleAdminValidationMethodSelect = (method: 'passkey' | 'user_pin') => {
    setAdminValidationMethod(method);
  };

  const isNextDisabled = useMemo(() => {
    if (!currentStepConfig) return true;
    switch (currentStepConfig.id) {
        case 'SELECT_EQUIPMENT_ASSIGN':
        case 'SELECT_EQUIPMENT_RETURN':
            return !selectedEquipmentId;
        case 'SELECT_USER':
            return !selectedUserId;
        case 'CHECK_CONDITION':
            return false;
        case 'ADMIN_VALIDATION':
            return !isAdminValidated;
        case 'SUMMARY':
            return false;
        default:
            return true;
    }
  }, [currentStepConfig, selectedUserId, selectedEquipmentId, isAdminValidated]);
  
  const handleNext = () => {
    if (!isNextDisabled) {
        setSearchTerm('');
        setCurrentStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
        setCurrentStep(prev => prev - 1);
    } else {
        onBack();
    }
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    let assignmentData: Omit<Assignment, 'id'> | null = null;
    let signatureOrValidationString = '';
    
    if (adminValidationMethod === 'user_pin') {
        signatureOrValidationString = 'Validated by Admin PIN';
    } else if (adminValidationMethod === 'passkey') {
        signatureOrValidationString = 'Validated by Admin Passkey';
    } else {
        addToast("Méthode de validation administrateur invalide.", "error");
        setIsSaving(false);
        return;
    }

    const initialValidation = {
        it: currentUser.role === UserRole.ADMIN,
        manager: currentUser.role === UserRole.MANAGER,
        user: false,
    } as const;

    if (action === FormAction.ASSIGN && selectedUser && selectedEquipmentId) {
        const manager = users.find(u => u.id === selectedUser.managerId);
        assignmentData = {
            action: FormAction.ASSIGN, equipmentId: selectedEquipmentId, date: new Date().toISOString().split('T')[0],
            userId: selectedUser.id, managerId: manager?.id || currentUser.id,
            signature: signatureOrValidationString, validation: { ...initialValidation }
        };
    } else if (action === FormAction.RETURN && lastAssignmentForReturn && selectedEquipmentId) {
        assignmentData = {
            action: FormAction.RETURN, equipmentId: selectedEquipmentId, date: new Date().toISOString().split('T')[0],
            userId: lastAssignmentForReturn.userId, managerId: lastAssignmentForReturn.managerId,
            signature: signatureOrValidationString, validation: { ...initialValidation },
            condition: condition, returnNotes: returnNotes,
        };
    } else {
        addToast("Données manquantes pour la soumission.", "error");
        setIsSaving(false);
        return;
    }

    try {
        await onSubmit(assignmentData);
        setIsSaving(false);
    } catch (error) {
        addToast("La soumission a échoué.", "error");
        setIsSaving(false);
    }
  };
  
  const renderStepContent = () => {
    if (!currentStepConfig) return null;

    switch(currentStepConfig.id) {
        case 'SELECT_EQUIPMENT_ASSIGN':
        case 'SELECT_EQUIPMENT_RETURN': {
            const items = currentStepConfig.id === 'SELECT_EQUIPMENT_ASSIGN' ? filteredEquipment : filteredReturnEquipment;
            const detailsFn = (item: any) => currentStepConfig.id === 'SELECT_EQUIPMENT_ASSIGN'
                ? [
                    { icon: 'category', text: item.category?.name || 'Inconnu' },
                    { icon: 'tag', text: item.assetTag }
                  ]
                : [
                    { icon: 'tag', text: item.assetTag },
                    { icon: 'person', text: item.assignedTo }
                  ];

            return (
                <div className="flex flex-col h-full">
                    <div className="sticky top-0 z-10 -mx-4 -mt-4 px-4 pt-4 pb-4 bg-gray-100 dark:bg-gray-900">
                        <SmartSearchInput
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onSubmit={handleSearchSubmit}
                            placeholder="Rechercher par nom, catégorie..."
                            isSearching={false}
                            showAiButton={false}
                            formClassName="w-full"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-4 pt-6">
                        <div className="space-y-3">
                            {items.map(item => (
                                <ListItemCard
                                    key={item.id}
                                    id={item.id}
                                    imageUrl={item.model?.imageUrl}
                                    title={item.name || item.model?.name || 'Équipement'}
                                    details={detailsFn(item)}
                                    statusBadge={
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px] ${getEquipmentStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    }
                                    onCardClick={handleEquipmentSelect}
                                    isSelected={selectedEquipmentId === item.id}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        case 'CHECK_CONDITION': {
            return (
                <div className="space-y-6">
                    <FormSection title="État observé">
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {CONDITION_OPTIONS.map(option => (
                                <label
                                    key={option}
                                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                                        condition === option
                                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-500'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="return-condition"
                                        value={option}
                                        checked={condition === option}
                                        onChange={() => setCondition(option)}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="font-medium">{option}</span>
                                </label>
                            ))}
                        </div>
                    </FormSection>
                    <FormSection title="Notes de retour (optionnel)">
                        <div className="md:col-span-2">
                            <Textarea
                                value={returnNotes}
                                onChange={(e) => setReturnNotes(e.target.value)}
                                rows={4}
                                placeholder="Ajoutez des détails sur l'état constaté lors du retour..."
                            />
                        </div>
                    </FormSection>
                </div>
            );
        }
        case 'ADMIN_VALIDATION': {
            const hasPasskey = Boolean(currentUser.webauthnCredentialId);
            const hasPin = Boolean(currentUser.pin);
            const noMethodAvailable = !hasPasskey && !hasPin;

            const methodButtonClasses = (method: 'passkey' | 'user_pin', disabled: boolean) => {
                const isActive = adminValidationMethod === method;
                return `flex items-center justify-between gap-3 rounded-lg border p-4 text-left transition-colors ${
                    isActive
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-500'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`;
            };

            return (
                <div className="space-y-6">
                    <FormSection title="Validation administrateur">
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleAdminValidationMethodSelect('passkey')}
                                disabled={!hasPasskey}
                                className={methodButtonClasses('passkey', !hasPasskey)}
                            >
                                <div>
                                    <p className="font-semibold">Empreinte digitale</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Valider avec WebAuthn</p>
                                </div>
                                <FingerprintIcon className="text-primary-600" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAdminValidationMethodSelect('user_pin')}
                                disabled={!hasPin}
                                className={methodButtonClasses('user_pin', !hasPin)}
                            >
                                <div>
                                    <p className="font-semibold">Code PIN</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Confirmer avec votre code PIN</p>
                                </div>
                                <span className="material-symbols-outlined text-2xl">password</span>
                            </button>
                        </div>
                        {noMethodAvailable && (
                            <div className="md:col-span-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                Aucune méthode de validation n'est configurée pour l'administrateur actuel. Ajoutez un code PIN ou une empreinte dans votre profil.
                            </div>
                        )}
                    </FormSection>

                    {adminValidationMethod === 'passkey' && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                            <FingerprintValidator
                                onValidated={setIsAdminValidated}
                                userCredentialId={currentUser.webauthnCredentialId}
                            />
                        </div>
                    )}

                    {adminValidationMethod === 'user_pin' && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                            <PinValidator
                                onValidated={setIsAdminValidated}
                                correctPin={currentUser.pin}
                                userName={currentUser.name}
                            />
                        </div>
                    )}

                    {isAdminValidated && (
                        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3">
                            <span className="material-symbols-outlined">verified</span>
                            <p className="font-semibold">Validation administrateur réussie.</p>
                        </div>
                    )}
                </div>
            );
        }
        case 'SELECT_USER': {
            return (
                <div className="flex flex-col h-full">
                    <div className="sticky top-0 z-10 -mx-4 -mt-4 px-4 pt-4 pb-4 bg-gray-100 dark:bg-gray-900">
                        <SmartSearchInput
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onSubmit={handleSearchSubmit}
                            placeholder="Rechercher par nom ou département..."
                            isSearching={false}
                            showAiButton={false}
                            formClassName="w-full"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-4 pt-6">
                        <div className="space-y-3">
                            {filteredUsers.map(user => (
                                <ListItemCard
                                    key={user.id}
                                    id={user.id}
                                    imageUrl={user.avatarUrl}
                                    imageShape="round"
                                    title={user.name}
                                    details={[{ icon: 'work', text: user.department || 'N/A' }]}
                                    statusBadge={
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getUserRoleColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                    }
                                    onCardClick={handleUserSelect}
                                    isSelected={selectedUserId === user.id}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        case 'SUMMARY': {
             const userForAction = action === FormAction.ASSIGN ? selectedUser : userForReturn;
             return (
                <div className="max-w-2xl mx-auto space-y-6">
                    <FormSection title="Équipement">
                        <div className="md:col-span-2">
                             <ListItemCard
                                id={selectedEquipment!.id}
                                imageUrl={model?.imageUrl}
                                title={model?.name}
                                details={[
                                    { text: `${category?.name || 'Inconnu'} • ${selectedEquipment!.assetTag}` }
                                ]}
                            />
                        </div>
                    </FormSection>
                    <FormSection title={action === FormAction.ASSIGN ? 'Attribué à' : 'Retourné par'}>
                        <div className="md:col-span-2">
                           {userForAction && <UserProfileHeader user={userForAction} compact />}
                        </div>
                    </FormSection>
                    {action === FormAction.RETURN && (
                         <FormSection title="Détails du retour">
                             <div className="md:col-span-2 space-y-2">
                                <p className="text-sm"><span className="font-semibold">État:</span> {condition}</p>
                                <p className="text-sm"><span className="font-semibold">Notes:</span> {returnNotes || 'Aucune'}</p>
                             </div>
                         </FormSection>
                    )}
                     <FormSection title="Validation">
                        <div className="md:col-span-2 grid grid-cols-1 gap-4">
                            <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                                <span className="material-symbols-outlined">verified</span>
                                <p className="font-semibold">Action validée par l'administrateur</p>
                            </div>
                        </div>
                     </FormSection>
                </div>
            )
        }
    }
  };

  return (
    <>
      <FormWizard
        title={action}
        steps={steps.map(s => s.title)}
        currentStep={currentStep}
        onBack={handleBack}
        isNextDisabled={isNextDisabled}
        isSaving={isSaving}
        onNext={handleNext}
        onSubmit={handleSubmit}
        onCancel={handleCancelRequest}
      >
        <div className="max-w-2xl mx-auto">
          {renderStepContent()}
        </div>
      </FormWizard>
      {showCancelConfirm && (
        <ConfirmationModal
          isOpen={showCancelConfirm}
          onClose={handleCancelDismiss}
          onConfirm={handleCancelConfirm}
          title="Quitter le wizard ?"
          icon="close"
          iconBgColor="bg-gray-100"
          iconColor="text-gray-600"
          confirmButtonText="Quitter"
          confirmButtonVariant="primary"
        >
          <p className="text-sm leading-relaxed">
            Vous perdrez les sélections en cours. Êtes-vous sûr de vouloir abandonner ce processus ?
          </p>
        </ConfirmationModal>
      )}
    </>
  );
};

export default AssignmentWizard;