import React, { useEffect } from 'react';
import { useNavigationGestures } from '../hooks/useNavigationGestures';

interface NavigationProviderProps {
  children: React.ReactNode;
}

/**
 * Provider pour améliorer la navigation de l'application
 * - Ajoute le support des gestes de swipe back
 * - Ajoute les raccourcis clavier
 * - Ajoute les indicateurs visuels
 */
const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const { swipeProgress } = useNavigationGestures();

  useEffect(() => {
    // Créer l'indicateur de swipe s'il n'existe pas
    if (!document.querySelector('.swipe-indicator')) {
      const indicator = document.createElement('div');
      indicator.className = 'swipe-indicator';
      document.body.appendChild(indicator);
    }

    // Créer l'indicateur de raccourcis clavier s'il n'existe pas
    if (!document.querySelector('.keyboard-nav-hint')) {
      const hint = document.createElement('div');
      hint.className = 'keyboard-nav-hint';
      hint.setAttribute('aria-live', 'polite');
      document.body.appendChild(hint);
    }

    return () => {
      // Nettoyer les indicateurs lors du démontage
      const indicator = document.querySelector('.swipe-indicator');
      const hint = document.querySelector('.keyboard-nav-hint');
      if (indicator) indicator.remove();
      if (hint) hint.remove();
    };
  }, []);

  return <>{children}</>;
};

export default NavigationProvider;
