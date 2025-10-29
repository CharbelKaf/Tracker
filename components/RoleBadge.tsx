import React from 'react';
import { UserRole } from '../types';
import { getUserRoleColor } from '../constants/statusColors';

interface RoleBadgeProps {
  role: UserRole;
  label?: string;
  className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, label, className }) => {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 text-xs font-medium max-w-full',
        'leading-5 whitespace-nowrap rounded-[var(--radius-badge)]',
        getUserRoleColor(role),
        className || '',
      ].join(' ')}
      title={role}
    >
      <span className="truncate">{label ?? role}</span>
    </span>
  );
};

export default RoleBadge;
