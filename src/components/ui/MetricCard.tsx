import React from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  /** Material Symbols icon name */
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  onClick?: () => void;
  className?: string;
}

/**
 * MD3 MetricCard — Elevated card style for KPI display.
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick,
  className
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "bg-surface-container-low rounded-md p-6 min-h-[140px] shadow-elevation-1 flex flex-col transition-all duration-short4 ease-emphasized group",
        onClick && "cursor-pointer hover:shadow-elevation-2 active:scale-[0.98] state-layer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-label-small text-on-surface-variant uppercase tracking-widest">{title}</p>
        {icon && (
          <div className="text-on-surface-variant group-hover:text-primary transition-colors duration-short4">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex-1">
        <p className="text-display-small text-on-surface mb-1 leading-none">{value}</p>
        {subtitle && (
          <p className="text-body-small text-on-surface-variant mt-2">{subtitle}</p>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div className={cn(
          "flex items-center gap-1.5 mt-4 text-label-medium",
          trend.direction === 'up' ? "text-tertiary" : "text-error"
        )}>
          <div className={cn(
            "p-1 rounded-full",
            trend.direction === 'up' ? "bg-tertiary-container" : "bg-error-container"
          )}>
            <MaterialIcon name={trend.direction === 'up' ? "trending_up" : "trending_down"} size={14} />
          </div>
          <span>{trend.value > 0 && trend.direction === 'up' ? '+' : ''}{trend.value}%</span>
          {trend.label && (
            <span className="text-on-surface-variant">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
