

import React, { useState, useMemo } from 'react';
import Button from './ui/Button';
import type { Assignment, Equipment, Model, Category, User } from '../types';
import PinValidator from './PinValidator';
import PageHeader from './PageHeader';

interface ValidationScreenProps {
  assignment: Assignment;
  equipment: Equipment;
  models: Model[];
  categories: Category[];
  users: User[];
  currentUser: User;
  onConfirm: () => void;
  onBack: () => void;
}

const ValidationScreen: React.FC<ValidationScreenProps> = ({ assignment, equipment, models, categories, users, currentUser, onConfirm, onBack }) => {
  const [isValidationComplete, setValidationComplete] = useState(false);

  const model = models.find(m => m.id === equipment.modelId);
  const category = model ? categories.find(c => c.id === model.categoryId) : null;
  
  // The person who needs to validate is the current user.
  const userForValidation = currentUser;

  const isConfirmButtonEnabled = useMemo(() => {
    return isValidationComplete;
  }, [isValidationComplete]);


  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <PageHeader title="Validation en attente" onBack={onBack} />
      <main className="flex-grow p-4 overflow-y-auto pb-36 md:pb-6">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">Nouvel équipement attribué</h2>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400">Veuillez examiner l'article et confirmer sa réception avec votre code PIN.</p>
          </div>
          <div className="mt-8">
            <h3 className="text-xs font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase">Détails de l'article</h3>
            <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{category?.name || 'Inconnu'}</span>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{model?.name || 'Modèle inconnu'}</p>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">N/S: {equipment.assetTag}</span>
              </div>
              <div className="flex-shrink-0">
                <div className="w-24 h-16 bg-center bg-contain bg-no-repeat rounded-lg" style={{ backgroundImage: `url("${model?.imageUrl}")` }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <PinValidator onValidated={setValidationComplete} correctPin={userForValidation?.pin} userName={userForValidation.name} />
          </div>
        </div>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-white/90 dark:bg-gray-900/70 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 md:static">
        <div className="p-4">
          <Button onClick={onConfirm} disabled={!isConfirmButtonEnabled} block>
            Confirmer
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ValidationScreen;