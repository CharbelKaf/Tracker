import React from 'react';
import { EquipmentStatus } from '../types';
import { getEquipmentStatusColor } from '../constants/statusColors';

interface StatusBadgeProps {
  status: EquipmentStatus;
  label?: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className }) => {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 text-xs font-medium max-w-full',
        'leading-5 whitespace-nowrap rounded-[var(--radius-badge)]',
        getEquipmentStatusColor(status),
        className || '',
      ].join(' ')}
      title={status}
    >
      <span className="truncate">{label ?? status}</span>
    </span>
  );
};

export default StatusBadge;
