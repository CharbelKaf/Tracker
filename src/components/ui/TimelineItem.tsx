import React from 'react';
import { HistoryEvent, EventType } from '../../types';
import MaterialIcon from './MaterialIcon';
import { UserAvatar } from './UserAvatar';
import { cn } from '../../lib/utils';

interface TimelineItemProps {
    event: HistoryEvent;
    isLast?: boolean;
}

const formatRelativeTime = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffInSeconds < 60) return "à l'instant";
    if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `il y a ${Math.floor(diffInSeconds / 86400)} j`;
    return date.toLocaleDateString('fr-FR');
};

const EVENT_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
    'CREATE': { icon: 'add_circle', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    'UPDATE': { icon: 'edit', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    'DELETE': { icon: 'delete', color: 'text-red-600', bgColor: 'bg-red-100' },
    'RETURN': { icon: 'assignment_return', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    'ASSIGN': { icon: 'assignment_ind', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    'APPROVAL_CREATE': { icon: 'rate_review', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    'APPROVAL_Admin': { icon: 'admin_panel_settings', color: 'text-teal-600', bgColor: 'bg-teal-100' },
    'APPROVAL_Manager': { icon: 'supervisor_account', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
    'LOGIN': { icon: 'login', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    'DEFAULT': { icon: 'info', color: 'text-gray-500', bgColor: 'bg-gray-50' }
};

export const TimelineItem: React.FC<TimelineItemProps> = ({ event, isLast }) => {
    // Fallback for known event types or generic styling
    const config = EVENT_CONFIG[event.type] ||
        (event.type.startsWith('APPROVAL') ? EVENT_CONFIG['APPROVAL_CREATE'] : EVENT_CONFIG['DEFAULT']);

    return (
        <div className="flex gap-4 group">
            {/* Left: Time & Localisation (Hidden on small screens?) */}
            <div className="hidden medium:flex flex-col items-end min-w-[120px] pt-1">
                <span className="text-label-small font-bold text-on-surface-variant">
                    {formatRelativeTime(event.timestamp)}
                </span>
                <span className="text-xs text-outline">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {/* Center: Timeline Line */}
            <div className="relative flex flex-col items-center">
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10",
                    config.bgColor, config.color
                )}>
                    <MaterialIcon name={config.icon} size={16} />
                </div>
                {!isLast && (
                    <div className="w-0.5 grow bg-outline-variant/30 my-2 group-last:hidden"></div>
                )}
            </div>

            {/* Right: Content Card */}
            <div className="flex-1 pb-8">
                <div className="bg-surface rounded-lg p-3 border border-outline-variant/50 hover:border-outline-variant transition-colors shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <UserAvatar
                                name={event.actorName}
                                size="xs"
                            // avatarUrl={...} // If we had actor avatar URL in event
                            />
                            <span className="text-sm font-bold text-on-surface">{event.actorName}</span>
                            <span className="text-xs text-on-surface-variant px-1.5 py-0.5 bg-surface-container rounded ml-1">
                                {event.actorRole}
                            </span>
                        </div>
                        <span className="text-xs font-mono text-outline">{event.targetType}</span>
                    </div>

                    <p className="text-sm text-on-surface mb-1">
                        {event.description}
                    </p>

                    {/* Metadata Context */}
                    {event.metadata && (
                        <div className="mt-2 text-xs bg-surface-container-lowest p-2 rounded text-on-surface-variant font-mono whitespace-pre-wrap">
                            {JSON.stringify(event.metadata, null, 2).slice(0, 200)}
                            {JSON.stringify(event.metadata).length > 200 && '...'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
