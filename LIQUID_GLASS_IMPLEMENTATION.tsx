/**
 * LIQUID GLASS - Exemples d'implémentation React
 * Guide pratique pour appliquer le design Liquid Glass dans les composants
 */

import React from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// 1. BUTTON LIQUID GLASS
// ============================================================================

interface LiquidButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
}) => {
  const baseClasses = "relative overflow-hidden font-medium transition-all ease-[var(--ease-fluid)] duration-[var(--duration-normal)] glass-shimmer";
  
  const variantClasses = {
    primary: "bg-gradient-to-br from-white/10 to-white/5 dark:from-white/8 dark:to-white/3 border border-white/18 dark:border-white/10 backdrop-blur-[20px] text-gray-900 dark:text-white hover:shadow-[var(--shadow-elev-2)] hover:border-white/25 active:scale-[0.98]",
    secondary: "bg-white/5 dark:bg-white/3 border border-white/12 dark:border-white/6 backdrop-blur-[15px] text-gray-700 dark:text-gray-200 hover:bg-white/8 dark:hover:bg-white/5",
    ghost: "bg-transparent hover:bg-white/5 dark:hover:bg-white/3 text-gray-700 dark:text-gray-200",
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm rounded-[var(--radius-button)]",
    md: "px-4 py-2.5 text-base rounded-[var(--radius-button)]",
    lg: "px-6 py-3 text-lg rounded-[1rem]",
  };
  
  return (
    <motion.button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <span className="animate-spin material-symbols-outlined">progress_activity</span>
        ) : icon}
        {children}
      </span>
    </motion.button>
  );
};

// ============================================================================
// 2. CARD LIQUID GLASS
// ============================================================================

interface LiquidCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glow?: 'none' | 'soft' | 'primary' | 'blue';
}

export const LiquidCard: React.FC<LiquidCardProps> = ({
  children,
  className = '',
  onClick,
  hover = true,
  glow = 'none',
}) => {
  const glowClass = glow !== 'none' ? `glow-${glow}` : '';
  
  return (
    <motion.div
      onClick={onClick}
      className={`
        relative p-6 rounded-[var(--radius-card)]
        bg-gradient-to-br from-white/10 to-white/5
        dark:from-white/8 dark:to-white/3
        border border-white/18 dark:border-white/10
        backdrop-blur-[20px] saturate-[180%]
        shadow-[var(--shadow-elev-1)]
        transition-all ease-[var(--ease-fluid)] duration-[var(--duration-normal)]
        before:absolute before:inset-x-0 before:top-0 before:h-px
        before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent
        ${hover ? 'glass-shimmer cursor-pointer' : ''}
        ${glowClass}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={hover ? { y: -4, boxShadow: 'var(--shadow-elev-2)' } : undefined}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// 3. INPUT LIQUID GLASS
// ============================================================================

interface LiquidInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const LiquidInput: React.FC<LiquidInputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  icon,
  error,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {icon}
          </div>
        )}
        <motion.input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-4 ${icon ? 'pl-10' : ''} py-2.5
            rounded-[var(--radius-input)]
            bg-white/5 dark:bg-white/3
            border border-white/12 dark:border-white/8
            backdrop-blur-[10px]
            text-gray-900 dark:text-white
            placeholder:text-gray-500 dark:placeholder:text-gray-400
            transition-all ease-[var(--ease-fluid)] duration-[var(--duration-normal)]
            focus:outline-none focus:bg-white/8 dark:focus:bg-white/5
            ${error
              ? 'border-red-400 dark:border-red-500 focus:ring-4 focus:ring-red-500/10'
              : 'focus:border-primary-400 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'
            }
          `}
          animate={{
            boxShadow: isFocused
              ? error
                ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
                : '0 0 0 3px rgba(59, 130, 246, 0.1)'
              : 'none',
          }}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <span className="material-symbols-outlined !text-sm">error</span>
          {error}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// 4. MODAL LIQUID GLASS
// ============================================================================

interface LiquidModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const LiquidModal: React.FC<LiquidModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`
          relative w-full ${sizeClasses[size]} z-10
          rounded-[var(--radius-modal)]
          bg-gradient-to-br from-white/15 to-white/8
          dark:from-white/10 dark:to-white/5
          border border-white/25 dark:border-white/15
          backdrop-blur-[30px] saturate-[200%]
          shadow-[var(--shadow-elev-3)]
          overflow-hidden
        `}
      >
        {/* Top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        
        {/* Header */}
        {title && (
          <div className="px-6 pt-6 pb-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 py-4 text-gray-700 dark:text-gray-200">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="px-6 pb-6 pt-4 border-t border-white/10">
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// 5. BADGE/TAG LIQUID GLASS
// ============================================================================

interface LiquidBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

export const LiquidBadge: React.FC<LiquidBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
}) => {
  const variantClasses = {
    primary: 'bg-primary-500/10 border-primary-400/30 text-primary-700 dark:text-primary-300',
    success: 'bg-green-500/10 border-green-400/30 text-green-700 dark:text-green-300',
    warning: 'bg-yellow-500/10 border-yellow-400/30 text-yellow-700 dark:text-yellow-300',
    danger: 'bg-red-500/10 border-red-400/30 text-red-700 dark:text-red-300',
    neutral: 'bg-white/10 border-white/20 text-gray-700 dark:text-gray-300',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };
  
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-[var(--radius-badge)]
        backdrop-blur-[10px] border font-medium
        ${variantClasses[variant]} ${sizeClasses[size]}
      `}
    >
      {children}
    </span>
  );
};

// ============================================================================
// 6. LIST ITEM LIQUID GLASS
// ============================================================================

interface LiquidListItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export const LiquidListItem: React.FC<LiquidListItemProps> = ({
  title,
  subtitle,
  icon,
  badge,
  onClick,
  active = false,
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-[1rem]
        bg-gradient-to-br from-white/8 to-white/4
        dark:from-white/6 dark:to-white/3
        border border-white/12 dark:border-white/8
        backdrop-blur-[15px]
        transition-all ease-[var(--ease-fluid)] duration-[var(--duration-fast)]
        hover:from-white/12 hover:to-white/8 hover:border-white/20
        ${active ? 'ring-2 ring-primary-400/40 border-primary-400/40' : ''}
      `}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon && (
        <div className="flex-shrink-0 text-gray-600 dark:text-gray-300">
          {icon}
        </div>
      )}
      <div className="flex-1 text-left">
        <p className="font-medium text-gray-900 dark:text-white text-sm">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {badge && <div className="flex-shrink-0">{badge}</div>}
      <span className="material-symbols-outlined text-gray-400">
        chevron_right
      </span>
    </motion.button>
  );
};

// ============================================================================
// 7. FLOATING PANEL LIQUID GLASS (Notifications, Toasts)
// ============================================================================

interface FloatingPanelProps {
  children: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  children,
  position = 'bottom-right',
}) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: position.includes('top') ? -20 : 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: position.includes('top') ? -20 : 20 }}
      className={`
        fixed ${positionClasses[position]} z-50
        min-w-[300px] max-w-[400px]
        p-4 rounded-[1rem]
        bg-gradient-to-br from-white/20 to-white/10
        dark:from-white/15 dark:to-white/8
        border border-white/30 dark:border-white/20
        backdrop-blur-[30px] saturate-[200%]
        shadow-[var(--shadow-elev-3)]
      `}
    >
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      {children}
    </motion.div>
  );
};

// ============================================================================
// 8. USAGE EXAMPLES
// ============================================================================

export const LiquidGlassExamples = () => {
  return (
    <div className="p-8 space-y-8">
      {/* Buttons */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Buttons</h2>
        <div className="flex gap-3 flex-wrap">
          <LiquidButton variant="primary">Primary Button</LiquidButton>
          <LiquidButton variant="secondary">Secondary Button</LiquidButton>
          <LiquidButton variant="ghost">Ghost Button</LiquidButton>
          <LiquidButton variant="primary" loading>Loading...</LiquidButton>
        </div>
      </div>
      
      {/* Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Cards</h2>
        <div className="grid grid-cols-2 gap-4">
          <LiquidCard>
            <h3 className="font-semibold text-lg mb-2">Card Title</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This is a liquid glass card with beautiful transparency.
            </p>
          </LiquidCard>
          <LiquidCard glow="blue" hover>
            <h3 className="font-semibold text-lg mb-2">Glowing Card</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This card has a blue glow effect.
            </p>
          </LiquidCard>
        </div>
      </div>
      
      {/* Inputs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Inputs</h2>
        <LiquidInput
          label="Email"
          placeholder="Enter your email"
          icon={<span className="material-symbols-outlined">mail</span>}
        />
        <LiquidInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          error="Password is required"
          icon={<span className="material-symbols-outlined">lock</span>}
        />
      </div>
      
      {/* Badges */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Badges</h2>
        <div className="flex gap-2 flex-wrap">
          <LiquidBadge variant="primary">Primary</LiquidBadge>
          <LiquidBadge variant="success">Success</LiquidBadge>
          <LiquidBadge variant="warning">Warning</LiquidBadge>
          <LiquidBadge variant="danger">Danger</LiquidBadge>
          <LiquidBadge variant="neutral">Neutral</LiquidBadge>
        </div>
      </div>
    </div>
  );
};
