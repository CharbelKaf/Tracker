import { useEffect, useRef, useState } from 'react';

/**
 * Hook pour gérer les gestes de navigation (swipe back, keyboard shortcuts)
 */
export const useNavigationGestures = () => {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [showKeyboardHint, setShowKeyboardHint] = useState<string>('');
  const hintTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Gestion des gestes tactiles pour swipe back
    const handleTouchStart = (e: TouchEvent) => {
      // Ne déclencher que si le toucher commence près du bord gauche
      if (e.touches[0].clientX < 50) {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === 0) return;

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - touchStartX.current;
      const deltaY = Math.abs(touchY - touchStartY.current);

      // Vérifier que c'est un swipe horizontal
      if (deltaX > 10 && deltaY < 50) {
        const progress = Math.min(deltaX / window.innerWidth, 0.3);
        setSwipeProgress(progress);
        
        // Ajouter l'indicateur de swipe
        const indicator = document.querySelector('.swipe-indicator');
        if (indicator) {
          indicator.classList.add('active');
        }
      }
    };

    const handleTouchEnd = () => {
      if (swipeProgress > 0.15) {
        // Seuil de déclenchement atteint - retour arrière
        window.history.back();
      }
      
      // Réinitialiser
      touchStartX.current = 0;
      touchStartY.current = 0;
      setSwipeProgress(0);
      
      const indicator = document.querySelector('.swipe-indicator');
      if (indicator) {
        indicator.classList.remove('active');
      }
    };

    // Gestion des raccourcis clavier
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + Flèche gauche = Retour
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        window.history.back();
        showKeyboardHintTemporarily('← Retour');
      }
      
      // Alt + Flèche droite = Avant
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        window.history.forward();
        showKeyboardHintTemporarily('Avant →');
      }
      
      // Échap = Retour (si modal n'est pas ouverte)
      if (e.key === 'Escape') {
        const hasOpenModal = document.querySelector('[role="dialog"]');
        if (!hasOpenModal && window.location.hash !== '#/dashboard' && window.location.hash !== '#/') {
          e.preventDefault();
          window.history.back();
        }
      }
    };

    const showKeyboardHintTemporarily = (text: string) => {
      const hint = document.querySelector('.keyboard-nav-hint');
      if (hint) {
        hint.textContent = text;
        hint.classList.add('show');
        
        if (hintTimeoutRef.current) {
          clearTimeout(hintTimeoutRef.current);
        }
        
        hintTimeoutRef.current = window.setTimeout(() => {
          hint.classList.remove('show');
        }, 1500);
      }
    };

    // Ajouter les écouteurs d'événements
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
      
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, [swipeProgress]);

  return { swipeProgress };
};
