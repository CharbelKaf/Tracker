import React from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';
import { UserRole } from '../../types';

interface UserAvatarProps {
  name: string;
  src?: string;
  role?: UserRole;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  src,
  role,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-8 h-8 text-label-small',
    md: 'w-10 h-10 text-label-medium',
    lg: 'w-14 h-14 text-body-large',
    xl: 'w-24 h-24 text-title-large'
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className={cn("relative shrink-0", className)}>
      <div className={cn(
        "rounded-full flex items-center justify-center font-medium border-2 border-surface shadow-elevation-1 overflow-hidden bg-secondary-container text-on-secondary-container",
        sizeClasses[size]
      )}>
        {src ? (
          <img
            src={src}
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : initials}
      </div>

      {role === 'SuperAdmin' && (
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 bg-tertiary text-on-tertiary rounded-full border-2 border-surface shadow-elevation-1 flex items-center justify-center",
          size === 'sm' || size === 'md' ? "p-0.5" : "p-1"
        )}>
          <MaterialIcon name="shield" size={size === 'sm' || size === 'md' ? 8 : 12} filled />
        </div>
      )}

      {role === 'Admin' && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-surface shadow-elevation-1" />
      )}
    </div>
  );
};

export default UserAvatar;
