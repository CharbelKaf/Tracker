
import React, { ReactNode } from 'react';
import PageHeader, { PageFooter } from './PageHeader';
import Button from './ui/Button';

interface FormWizardProps {
    title: string;
    steps: string[];
    currentStep: number;
    onBack: () => void;
    children: ReactNode;
    isNextDisabled: boolean;
    isSaving?: boolean;
    onNext?: () => void;
    onSubmit?: () => void;
    onCancel?: () => void;
}

export const FormWizard: React.FC<FormWizardProps> = ({
    title,
    steps,
    currentStep,
    onBack,
    children,
    isNextDisabled,
    isSaving = false,
    onNext,
    onSubmit,
    onCancel,
}) => {
    const progress = ((currentStep + 1) / steps.length) * 100;
    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm">
                <PageHeader title={title} onBack={onBack} />
                <div className="w-full bg-gray-200">
                    <div className="bg-primary-500 h-1" style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}></div>
                </div>
                <p className="text-center text-sm p-2 bg-gray-50 text-gray-500">{`Étape ${currentStep + 1} sur ${steps.length}: ${steps[currentStep]}`}</p>
            </div>
            <main className="flex-grow overflow-y-auto px-4 pb-36 md:pb-6 pt-0">
                {children}
            </main>
            <PageFooter contentClassName={onCancel ? 'w-full items-center justify-between' : undefined}>
                {onCancel && (
                  <Button variant="secondary" onClick={onCancel} disabled={isSaving}>Annuler</Button>
                )}
                <div className="flex items-center gap-3">
                    {!isLastStep ? (
                      <Button onClick={onNext} disabled={isNextDisabled}>Suivant</Button>
                    ) : (
                      <Button onClick={onSubmit} disabled={isNextDisabled || isSaving} loading={isSaving} icon="check">
                        {isSaving ? 'Soumission...' : 'Soumettre'}
                      </Button>
                    )}
                </div>
            </PageFooter>
        </div>
    );
};
