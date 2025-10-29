


import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Button from './ui/Button';

export interface TourStep {
  selector: string;
  title: string;
  content: string;
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ steps, isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  const findVisibleElement = (selector: string): Element | null => {
    const selectors = selector.split(',').map(s => s.trim());
    for (const s of selectors) {
        const el = document.querySelector(s);
        if (el && (el as HTMLElement).offsetParent !== null) {
            return el;
        }
    }
    return null;
  };

  useLayoutEffect(() => {
    if (isOpen && steps[currentStep]) {
      const element = findVisibleElement(steps[currentStep].selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        // Avoid scrolling if the element is already fully in view
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      } else {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
      }
    }
  }, [isOpen, currentStep, steps, onClose]);
  
  useLayoutEffect(() => {
    const calculatePosition = () => {
        if (!isOpen || !targetRect || !popoverRef.current) return;

        const popoverNode = popoverRef.current;
        //getBoundingClientRect can be expensive, let's use offsetWidth/Height
        const popoverRect = {
            width: popoverNode.offsetWidth,
            height: popoverNode.offsetHeight,
        };
        const screenPadding = 16;
        const popoverMargin = 12;

        const spaceAbove = targetRect.top;
        const spaceBelow = window.innerHeight - targetRect.bottom;
        
        let placement: 'top' | 'bottom' = 'bottom';
        if (spaceBelow < popoverRect.height + popoverMargin + screenPadding && spaceAbove > spaceBelow) {
            placement = 'top';
        }

        let top: number;
        if (placement === 'top') {
            top = targetRect.top - popoverRect.height - popoverMargin;
        } else {
            top = targetRect.bottom + popoverMargin;
        }
        
        let left = targetRect.left + targetRect.width / 2 - popoverRect.width / 2;
        
        if (left < screenPadding) {
            left = screenPadding;
        } else if (left + popoverRect.width > window.innerWidth - screenPadding) {
            left = window.innerWidth - popoverRect.width - screenPadding;
        }

        setPopoverStyle({
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: 300,
            maxWidth: `calc(100vw - ${2 * screenPadding}px)`,
            zIndex: 101,
            transition: 'top 0.3s ease-in-out, left 0.3s ease-in-out',
        });

        const arrowLeft = targetRect.left + targetRect.width / 2 - left - 6;

        if (placement === 'top') {
            setArrowStyle({
                position: 'absolute',
                bottom: '-6px',
                left: `${arrowLeft}px`,
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid white',
            });
        } else {
            setArrowStyle({
                position: 'absolute',
                top: '-6px',
                left: `${arrowLeft}px`,
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '6px solid white',
            });
        }
    };
    
    // We run this with a small delay to allow the popover to render and get its dimensions
    const timeoutId = setTimeout(calculatePosition, 50);

    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);
    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition, true);
    };

  }, [isOpen, targetRect]);
  
  useEffect(() => {
    if (isOpen) {
        const popoverElement = popoverRef.current;
        if (!popoverElement) return;

        const focusableElements = popoverElement.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
            if (e.key !== 'Tab') return;
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };
        
        const previouslyFocusedElement = document.activeElement as HTMLElement;
        document.addEventListener('keydown', handleKeyDown);
        
        // FIX: Explicitly type `el` as HTMLElement to access `innerText`.
        const nextButton = Array.from(focusableElements).find((el: HTMLElement) => el.innerText.includes('Suivant') || el.innerText.includes('Terminer'));
        if (nextButton) {
            // FIX: Ensure nextButton is treated as an element that can be focused.
            (nextButton as HTMLElement).focus();
        } else {
            lastElement.focus();
        }


        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocusedElement?.focus();
        };
    }
}, [isOpen, currentStep, onClose]);


  if (!isOpen || !targetRect) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="tour-title" onClick={onClose}>
        <div 
            className="fixed rounded-md transition-all duration-300 ease-in-out"
            style={{
                top: `${targetRect.top - 4}px`,
                left: `${targetRect.left - 4}px`,
                width: `${targetRect.width + 8}px`,
                height: `${targetRect.height + 8}px`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                border: '2px solid white'
            }}
        />
        <div 
            ref={popoverRef}
            className="bg-white rounded-lg p-4 shadow-xl animate-fade-in"
            style={popoverStyle}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={arrowStyle} />
            <h3 id="tour-title" className="font-bold text-lg mb-2">{step.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{step.content}</p>
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{currentStep + 1} / {steps.length}</span>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={onClose}>Passer</Button>
                    {currentStep > 0 && (
                      <Button variant="secondary" size="sm" onClick={handlePrev}>Précédent</Button>
                    )}
                    <Button size="sm" onClick={handleNext}>
                      {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default GuidedTour;