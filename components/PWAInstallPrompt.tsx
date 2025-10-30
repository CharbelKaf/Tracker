import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '../hooks/usePWA';

/**
 * PWA Install Prompt component
 * Shows a banner/modal prompting user to install the app
 */
export const PWAInstallPrompt: React.FC<{
  /** Display as banner (default) or modal */
  variant?: 'banner' | 'modal';
  /** Auto-show after delay (ms) */
  autoShowDelay?: number;
  /** Position for banner */
  position?: 'top' | 'bottom';
}> = ({ variant = 'banner', autoShowDelay = 3000, position = 'bottom' }) => {
  const { isInstallable, isInstalled, promptInstall, dismissPrompt } = usePWAInstall();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if user has previously dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  // Auto-show after delay
  useEffect(() => {
    if (!isInstallable || dismissed || isInstalled) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, autoShowDelay);

    return () => clearTimeout(timer);
  }, [isInstallable, dismissed, isInstalled, autoShowDelay]);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    dismissPrompt();
  };

  if (!isInstallable || dismissed || isInstalled || !show) {
    return null;
  }

  if (variant === 'modal') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Installer l'application
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Installez Neemba Tracker pour un accès rapide et une expérience optimale, même hors ligne.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Plus tard
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
                >
                  Installer
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Banner variant
  const positionClasses = position === 'top' ? 'top-0' : 'bottom-0';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
        className={`fixed ${positionClasses} left-0 right-0 z-40 p-4`}
      >
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Installer Neemba Tracker
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Accédez rapidement à l'app depuis votre écran d'accueil
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Non merci
              </button>
              <button
                onClick={handleInstall}
                className="px-4 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
              >
                Installer
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Simple install button
 */
export const PWAInstallButton: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  if (!isInstallable || isInstalled) {
    return null;
  }

  return (
    <button
      onClick={promptInstall}
      className={className || 'px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium flex items-center gap-2'}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {children || 'Installer l\'app'}
    </button>
  );
};
