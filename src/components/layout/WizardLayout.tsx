import React from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import { FullScreenLayout } from './FullScreenLayout';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface Step {
  id: number;
  title: string;
}

interface WizardLayoutProps {
  title: string;
  currentStep: number;
  steps: Step[];
  onClose: () => void;
  onBack?: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({
  title,
  currentStep,
  steps,
  onClose,
  onBack,
  children,
  actions,
}) => {
  const isCompactLandscape = useMediaQuery('(max-width: 839px) and (orientation: landscape)');

  const stepsIndicator = (
    <div className={cn(isCompactLandscape ? 'py-0.5' : 'py-1')}>
      <div className={cn('mx-auto w-full', !isCompactLandscape && 'max-w-3xl')}>
        <ol className={cn('flex items-start', isCompactLandscape ? 'gap-1.5' : 'gap-2')} aria-label="Progression de l'assistant">
          {steps.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isConnectorCompleted =
              index < steps.length - 1 ? steps[index + 1].id <= currentStep : false;

            return (
              <React.Fragment key={step.id}>
                <li
                  className={cn(
                    'flex shrink-0 flex-col items-center text-center',
                    isCompactLandscape ? 'w-6' : 'w-20'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div
                    className={cn(
                      'w-6 h-6 shrink-0 rounded-full border inline-flex items-center justify-center transition-all duration-short4 ease-emphasized',
                      isCompleted
                        ? 'bg-primary border-primary text-on-primary'
                        : isCurrent
                          ? 'bg-primary-container border-primary text-on-primary-container'
                          : 'bg-surface border-outline-variant text-on-surface-variant'
                    )}
                  >
                    {isCompleted ? (
                      <MaterialIcon name="check" size={14} />
                    ) : (
                      <span className="text-label-small font-semibold leading-none">{step.id}</span>
                    )}
                  </div>

                  {!isCompactLandscape && (
                    <span
                      className={cn(
                        'mt-1 w-full px-1 text-label-small truncate transition-colors duration-short4',
                        isCurrent
                          ? 'text-on-surface font-semibold'
                          : isCompleted
                            ? 'text-on-surface-variant'
                            : 'text-on-surface-variant/80'
                      )}
                    >
                      {step.title}
                    </span>
                  )}
                </li>

                {index < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className={cn(
                      'mt-3 mx-0.5 flex-1 rounded-full transition-colors duration-medium2 ease-emphasized',
                      isCompactLandscape ? 'h-1' : 'h-1.5',
                      isConnectorCompleted ? 'bg-primary' : 'bg-surface-container-highest'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </div>
  );

  return (
    <FullScreenLayout
      title={title}
      onClose={onClose}
      onBack={onBack}
      headerContent={stepsIndicator}
      footerActions={actions}
    >
      {children}
    </FullScreenLayout>
  );
};

export const WizardStep: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('animate-in fade-in slide-in-from-right-8 duration-macro', className)}>
    {children}
  </div>
);

