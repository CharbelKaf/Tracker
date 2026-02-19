import React, { useState, useRef, useCallback, useId } from 'react';
import { cn } from '../../lib/utils';

export interface SliderProps {
    /** Current value */
    value: number;
    /** Change handler */
    onChange: (value: number) => void;
    /** Minimum value. Default 0 */
    min?: number;
    /** Maximum value. Default 100 */
    max?: number;
    /** Step size. Default 1 (continuous). */
    step?: number;
    /** Show value label tooltip */
    showLabel?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Label */
    label?: string;
    className?: string;
}

/**
 * MD3 Slider — Continuous or discrete.
 * Track with active/inactive parts, 20dp thumb (24dp hover, 28dp pressed).
 * Supports discrete steps with tick marks and value label tooltip.
 *
 * @see https://m3.material.io/components/sliders/overview
 */
const Slider: React.FC<SliderProps> = ({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    showLabel = false,
    disabled = false,
    label,
    className,
}) => {
    const id = useId();
    const [dragging, setDragging] = useState(false);
    const [hovering, setHovering] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const pct = ((value - min) / (max - min)) * 100;
    const isDiscrete = step > 1;
    const totalSteps = isDiscrete ? Math.floor((max - min) / step) : 0;

    const updateValue = useCallback((clientX: number) => {
        if (!trackRef.current || disabled) return;
        const rect = trackRef.current.getBoundingClientRect();
        let ratio = (clientX - rect.left) / rect.width;
        ratio = Math.max(0, Math.min(1, ratio));
        let raw = min + ratio * (max - min);
        // Snap to step
        raw = Math.round(raw / step) * step;
        raw = Math.max(min, Math.min(max, raw));
        onChange(raw);
    }, [min, max, step, onChange, disabled]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (disabled) return;
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        updateValue(e.clientX);
    }, [disabled, updateValue]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (dragging) updateValue(e.clientX);
    }, [dragging, updateValue]);

    const handlePointerUp = useCallback(() => {
        setDragging(false);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (disabled) return;
        let newValue = value;
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                e.preventDefault();
                newValue = Math.min(max, value + step);
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                e.preventDefault();
                newValue = Math.max(min, value - step);
                break;
            case 'Home':
                e.preventDefault();
                newValue = min;
                break;
            case 'End':
                e.preventDefault();
                newValue = max;
                break;
        }
        if (newValue !== value) onChange(newValue);
    }, [value, min, max, step, onChange, disabled]);

    const thumbSize = dragging ? 'w-7 h-7' : hovering ? 'w-6 h-6' : 'w-5 h-5';

    return (
        <div className={cn("w-full", disabled && "opacity-38 cursor-not-allowed", className)}>
            {label && (
                <label htmlFor={id} className="block text-body-medium text-on-surface mb-2">{label}</label>
            )}

            <div
                ref={trackRef}
                className="relative h-12 flex items-center cursor-pointer"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                {/* Inactive track */}
                <div className="absolute left-0 right-0 h-1 rounded-full bg-surface-container-highest" />

                {/* Active track */}
                <div
                    className="absolute left-0 h-1 rounded-full bg-primary transition-[width] duration-100 ease-md-standard"
                    style={{ width: `${pct}%` }}
                />

                {/* Tick marks (discrete) */}
                {isDiscrete && totalSteps > 0 && totalSteps <= 20 && (
                    Array.from({ length: totalSteps + 1 }, (_, i) => {
                        const tickPct = (i / totalSteps) * 100;
                        const isActive = tickPct <= pct;
                        return (
                            <div
                                key={i}
                                className={cn(
                                    "absolute w-1 h-1 rounded-full -translate-x-1/2",
                                    isActive ? "bg-on-primary" : "bg-on-surface-variant"
                                )}
                                style={{ left: `${tickPct}%` }}
                            />
                        );
                    })
                )}

                {/* Thumb */}
                <div
                    id={id}
                    role="slider"
                    aria-valuenow={value}
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-label={label}
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={handleKeyDown}
                    onMouseEnter={() => setHovering(true)}
                    onMouseLeave={() => setHovering(false)}
                    onFocus={() => setHovering(true)}
                    onBlur={() => setHovering(false)}
                    className={cn(
                        "absolute rounded-full bg-primary shadow-elevation-1 -translate-x-1/2 transition-all duration-short4 ease-emphasized",
                        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        "before:absolute before:inset-[-6px] before:rounded-full before:bg-primary/[0.08]",
                        "before:transition-opacity before:duration-short2",
                        (hovering || dragging) ? "before:opacity-100" : "before:opacity-0",
                        thumbSize
                    )}
                    style={{ left: `${pct}%` }}
                >
                    {/* Value label */}
                    {showLabel && (dragging || hovering) && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-primary text-on-primary text-label-medium px-2 py-1 rounded-xs whitespace-nowrap shadow-elevation-2 animate-in fade-in zoom-in-90 duration-100">
                            {value}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Slider;
