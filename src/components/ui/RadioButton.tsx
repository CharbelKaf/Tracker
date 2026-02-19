import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface RadioButtonProps {
    /** Whether this radio is selected */
    checked: boolean;
    /** Change handler */
    onChange: () => void;
    /** Radio group name */
    name: string;
    /** Value */
    value: string;
    /** Label text */
    label?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Error state */
    error?: boolean;
    className?: string;
}

/**
 * MD3 Radio Button — 20×20dp visual, 48×48dp touch target.
 * Supports selected, unselected, disabled, and error states.
 * Use Arrow keys to navigate within a group of radios.
 *
 * @see https://m3.material.io/components/radio-button/overview
 */
const RadioButton: React.FC<RadioButtonProps> = ({
    checked,
    onChange,
    name,
    value,
    label,
    disabled = false,
    error = false,
    className,
}) => {
    const id = useId();

    return (
        <label
            htmlFor={id}
            className={cn(
                "inline-flex items-center gap-3 select-none group",
                disabled ? "cursor-not-allowed opacity-38" : "cursor-pointer",
                className
            )}
        >
            {/* Touch target — 48×48dp */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0 -m-3">
                {/* Hidden native input */}
                <input
                    type="radio"
                    id={id}
                    name={name}
                    value={value}
                    checked={checked}
                    onChange={() => !disabled && onChange()}
                    disabled={disabled}
                    className="sr-only peer"
                />

                {/* State layer */}
                <div className={cn(
                    "absolute inset-2 rounded-full transition-colors duration-short2",
                    !disabled && "group-hover:bg-on-surface/[0.08] peer-focus-visible:bg-on-surface/[0.12]"
                )} />

                {/* Radio visual — 20×20dp outer circle */}
                <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-short4 ease-emphasized relative z-10",
                    checked
                        ? error
                            ? "border-error"
                            : "border-primary"
                        : error
                            ? "border-error"
                            : "border-on-surface-variant"
                )}>
                    {/* Inner dot — 10dp */}
                    <div className={cn(
                        "rounded-full transition-all duration-short4 ease-emphasized",
                        checked
                            ? cn("w-[10px] h-[10px]", error ? "bg-error" : "bg-primary")
                            : "w-0 h-0"
                    )} />
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
    );
};

export default RadioButton;
