import React from 'react';
import { cn } from '../../lib/utils';

export type CanonicalButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'danger';
type LegacyButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** MD3 button variants (legacy aliases still accepted for backward compatibility) */
  variant?: CanonicalButtonVariant | LegacyButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  /** Legacy alias kept for backward compatibility */
  startIcon?: React.ReactNode;
  /** Shows a loading spinner and disables interactions */
  loading?: boolean;
  /** Accessible fallback label when loading and no visible text exists */
  loadingLabel?: string;
  children?: React.ReactNode;
}

const LEGACY_VARIANT_MAP: Record<LegacyButtonVariant, CanonicalButtonVariant> = {
  primary: 'filled',
  secondary: 'tonal',
  ghost: 'outlined',
};

const VARIANT_STYLES: Record<CanonicalButtonVariant, string> = {
  filled: "bg-primary text-on-primary shadow-elevation-0 disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]",
  tonal: "bg-secondary-container text-on-secondary-container shadow-elevation-0 disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]",
  outlined: "bg-transparent text-primary border border-outline disabled:border-on-surface/[0.12] disabled:text-on-surface/[0.38]",
  text: "bg-transparent text-primary disabled:text-on-surface/[0.38]",
  elevated: "bg-surface-container-low text-primary shadow-elevation-1 hover:shadow-elevation-2 focus-visible:shadow-elevation-1 active:shadow-elevation-1 disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38] disabled:shadow-elevation-0",
  danger: "bg-error text-on-error shadow-elevation-0 disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]",
};

const SIZE_STYLES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: "px-4 py-2 text-label-medium",
  md: "px-6 py-2.5 text-label-large",
  lg: "px-7 py-3 text-label-large",
};

const resolveVariant = (variant: ButtonProps['variant'] | string | undefined): CanonicalButtonVariant => {
  if (!variant) {
    return 'filled';
  }

  if (variant in LEGACY_VARIANT_MAP) {
    return LEGACY_VARIANT_MAP[variant as LegacyButtonVariant];
  }

  if (variant in VARIANT_STYLES) {
    return variant as CanonicalButtonVariant;
  }

  return 'filled';
};

const normalizeIcon = (icon: React.ReactNode): React.ReactNode => {
  if (!React.isValidElement(icon) || typeof icon.type === 'string') {
    return icon;
  }

  const iconProps = (icon.props ?? {}) as Record<string, unknown>;
  if (iconProps.size !== undefined) {
    return icon;
  }

  return React.cloneElement(icon as React.ReactElement<Record<string, unknown>>, { size: 18 });
};

/**
 * MD3 Button component with canonical variants:
 * Filled, Filled Tonal, Outlined, Text, Elevated.
 * Legacy aliases are mapped for gradual migration.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'filled',
    size = 'md',
    icon,
    startIcon,
    children,
    className,
    disabled,
    loading = false,
    loadingLabel = 'Chargement',
    type,
    ...props
  }, ref) => {
    const resolvedVariant = resolveVariant(variant);
    const isDisabled = Boolean(disabled || loading);
    const leadingIcon = icon ?? startIcon;
    const resolvedIcon = loading
      ? <span className="inline-flex h-[18px] w-[18px] rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" />
      : normalizeIcon(leadingIcon);
    const hasVisibleLabel = React.Children.count(children) > 0;

    const baseStyles = cn(
      "inline-flex items-center justify-center gap-2 rounded-full min-h-12 min-w-12",
      "transition-[color,background-color,box-shadow,opacity] duration-short4 ease-emphasized",
      "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      "disabled:cursor-not-allowed disabled:pointer-events-none",
      "state-layer select-none",
      "text-label-large"
    );

    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(baseStyles, VARIANT_STYLES[resolvedVariant], SIZE_STYLES[size], className)}
        {...props}
      >
        {resolvedIcon && <span className="inline-flex shrink-0 items-center justify-center">{resolvedIcon}</span>}
        {children}
        {loading && !hasVisibleLabel && <span className="sr-only">{loadingLabel}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;

