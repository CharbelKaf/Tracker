import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressIndicatorProps {
    /** Visual type: circular spinner or linear bar */
    type?: 'circular' | 'linear';
    /** Value 0-100 for determinate mode. Omit for indeterminate */
    value?: number;
    /** Size for circular indicator (dp). Default 48 */
    size?: number;
    /** Track/indicator color token. Default primary */
    color?: 'primary' | 'secondary' | 'tertiary' | 'error';
    /** Optional accessible label */
    label?: string;
    className?: string;
}

const COLOR_MAP = {
    primary: { indicator: 'text-primary', track: 'text-on-surface/[0.12]' },
    secondary: { indicator: 'text-secondary', track: 'text-on-surface/[0.12]' },
    tertiary: { indicator: 'text-tertiary', track: 'text-on-surface/[0.12]' },
    error: { indicator: 'text-error', track: 'text-on-surface/[0.12]' },
};

/**
 * MD3 Progress Indicator — Circular and Linear variants.
 * Supports both determinate (with value) and indeterminate (without value) modes.
 *
 * @see https://m3.material.io/components/progress-indicators/overview
 */
const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
    type = 'circular',
    value,
    size = 48,
    color = 'primary',
    label,
    className,
}) => {
    const isDeterminate = value !== undefined;
    const clampedValue = isDeterminate ? Math.min(100, Math.max(0, value)) : 0;
    const colors = COLOR_MAP[color];

    if (type === 'circular') {
        const strokeWidth = size >= 48 ? 4 : 3;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = isDeterminate ? circumference * (1 - clampedValue / 100) : circumference * 0.75;

        return (
            <div
                role="progressbar"
                aria-valuenow={isDeterminate ? clampedValue : undefined}
                aria-valuemin={isDeterminate ? 0 : undefined}
                aria-valuemax={isDeterminate ? 100 : undefined}
                aria-label={label || (isDeterminate ? `${clampedValue}% chargé` : 'Chargement en cours')}
                className={cn("inline-flex items-center justify-center", className)}
                style={{ width: size, height: size }}
            >
                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    className={cn(
                        !isDeterminate && "animate-spin"
                    )}
                    style={{
                        width: size,
                        height: size,
                        animationDuration: '1.333s',
                    }}
                >
                    {/* Track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        strokeWidth={strokeWidth}
                        className={cn("stroke-current", colors.track)}
                    />
                    {/* Indicator */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={cn("stroke-current transition-[stroke-dashoffset] duration-medium2 ease-emphasized", colors.indicator)}
                        style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
                    />
                </svg>
            </div>
        );
    }

    // Linear
    return (
        <div
            role="progressbar"
            aria-valuenow={isDeterminate ? clampedValue : undefined}
            aria-valuemin={isDeterminate ? 0 : undefined}
            aria-valuemax={isDeterminate ? 100 : undefined}
            aria-label={label || (isDeterminate ? `${clampedValue}% chargé` : 'Chargement en cours')}
            className={cn("w-full h-1 rounded-full overflow-hidden", colors.track, "bg-current", className)}
        >
            <div
                className={cn(
                    "h-full rounded-full",
                    colors.indicator, "bg-current",
                    isDeterminate
                        ? "transition-[width] duration-medium2 ease-emphasized"
                        : "animate-linear-indeterminate"
                )}
                style={isDeterminate ? { width: `${clampedValue}%` } : undefined}
            />
        </div>
    );
};

export default ProgressIndicator;
