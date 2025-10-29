import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Composant pour gérer les transitions entre pages
 * Utilise Framer Motion pour des animations fluides
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={window.location.hash}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1], // Ease-out-cubic
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
