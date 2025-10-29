import { useCallback } from 'react';

export type NavigateOptions = {
  replace?: boolean;
  state?: any;
};

/**
 * Hook personnalisé pour la navigation avec support des transitions
 */
export const useNavigation = () => {
  const navigate = useCallback((to: string, options?: NavigateOptions) => {
    // Ajouter une classe de transition à body
    document.body.classList.add('page-transitioning');
    
    // Petit délai pour permettre l'animation de sortie
    setTimeout(() => {
      if (options?.replace) {
        window.location.replace(`#${to}`);
      } else {
        window.location.hash = `#${to}`;
      }
      
      // Retirer la classe après navigation
      setTimeout(() => {
        document.body.classList.remove('page-transitioning');
      }, 50);
    }, 150);
  }, []);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  const goForward = useCallback(() => {
    window.history.forward();
  }, []);

  const getCurrentPath = useCallback(() => {
    return window.location.hash.slice(1) || '/';
  }, []);

  return {
    navigate,
    goBack,
    goForward,
    getCurrentPath,
  };
};
