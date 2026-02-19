import React, { useId } from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from './MaterialIcon';

export interface CheckboxProps {
    /** Whether the checkbox is checked */
    checked: boolean;
    /** Change handler */
    onChange: (checked: boolean) => void;
    /** Label text */
    label?: string;
    /** Indeterminate state (overrides checked visual) */
    indeterminate?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Error state */
    error?: boolean;
    /** Error message */
    errorText?: string;
    className?: string;
}

/**
 * MD3 Checkbox — 18×18dp visual, 48×48dp touch target.
 * Supports checked, unchecked, indeterminate, disabled, and error states.
 *
 * @see https://m3.material.io/components/checkbox/overview
 */
const Checkbox: React.FC<CheckboxProps> = ({
    checked,
    onChange,
    label,
    indeterminate = false,
    disabled = false,
    error = false,
    errorText,
    className,
}) => {
    const id = useId();
    const errorId = errorText ? `${id}-error` : undefined;

    // Visual state: indeterminate takes precedence
    const isActive = indeterminate || checked;

    return (
        <div className={cn("inline-flex flex-col gap-1", className)}>
            <label
                htmlFor={id}
                className={cn(
                    "inline-flex items-center gap-3 select-none group",
                    disabled ? "cursor-not-allowed opacity-38" : "cursor-pointer"
                )}
            >
                {/* Touch target — 48×48dp, visual box 18×18dp centered */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0 -m-3">
                    {/* Hidden native input */}
                    <input
                        type="checkbox"
                        id={id}
                        checked={checked}
                        onChange={(e) => !disabled && onChange(e.target.checked)}
                        disabled={disabled}
                        aria-invalid={error || undefined}
                        aria-describedby={errorId}
                        className="sr-only peer"
                    />

                    {/* State layer */}
                    <div className={cn(
                        "absolute inset-2 rounded-full transition-colors duration-short2",
                        !disabled && "group-hover:bg-on-surface/[0.08] peer-focus-visible:bg-on-surface/[0.12]"
                    )} />

                    {/* Checkbox visual */}
                    <div className={cn(
                        "w-[18px] h-[18px] rounded-[2px] border-2 flex items-center justify-center transition-all duration-short4 ease-emphasized relative z-10",
                        isActive
                            ? error
                                ? "bg-error border-error"
                                : "bg-primary border-primary"
                            : error
                                ? "border-error bg-transparent"
                                : "border-on-surface-variant bg-transparent",
                        !disabled && isActive && !error && "group-hover:bg-primary/90",
                    )}>
                        {isActive && (
                            <MaterialIcon
                                name={indeterminate ? "remove" : "check"}
                                size={16}
                                className={cn(
                                    "text-on-primary",
                                    error && "text-on-error"
                                )}
                            />
                        )}
                    </div>
                </div>

                {label && (
                    <span className={cn(
                        "text-body-medium transition-colors duration-short4",
                        error ? "text-error" : "text-on-surface"
                    )}>
                        {label}
                    </span>
                )}
            </label>

            {errorText && (
                <p id={errorId} className="text-body-small text-error ml-9" role="alert">
                    {errorText}
                </p>
            )}
        </div>
    );
};

export default Checkbox;
