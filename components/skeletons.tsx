import React from 'react';

/**
 * Base skeleton component with shimmer animation
 */
const SkeletonBox: React.FC<{className?: string}> = ({ className }) => (
    <div className={`rounded-md animate-pulse bg-gradient-to-r from-secondary-100 via-secondary-50 to-secondary-100 dark:from-secondary-800 dark:via-secondary-700 dark:to-secondary-800 ${className}`} 
         style={{
           backgroundSize: '200% 100%',
           animation: 'shimmer 2s infinite',
         }}
    />
);

/**
 * Reusable skeleton variants
 */
export const SkeletonLine: React.FC<{ width?: string }> = ({ width = 'w-full' }) => (
    <SkeletonBox className={`h-4 ${width}`} />
);

export const SkeletonCircle: React.FC<{ size?: string }> = ({ size = 'size-12' }) => (
    <SkeletonBox className={`${size} rounded-full`} />
);

export const SkeletonButton: React.FC = () => (
    <SkeletonBox className="h-10 w-24 rounded-lg" />
);

export const SkeletonCard: React.FC = () => (
    <div className="surface-card surface-card-gradient rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
            <SkeletonCircle size="size-10" />
            <div className="flex-1 space-y-2">
                <SkeletonLine width="w-3/4" />
                <SkeletonLine width="w-1/2" />
            </div>
        </div>
        <SkeletonLine width="w-full" />
        <SkeletonLine width="w-5/6" />
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
    <div className="surface-card overflow-hidden rounded-xl">
        {/* Header */}
        <div className="border-b border-secondary-200 dark:border-secondary-700 p-4">
            <div className="flex items-center gap-4">
                <SkeletonBox className="h-5 w-32" />
                <SkeletonBox className="h-5 w-40" />
                <SkeletonBox className="h-5 w-24" />
                <SkeletonBox className="h-5 w-28" />
            </div>
        </div>
        {/* Rows */}
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="border-b border-secondary-100 dark:border-secondary-800 p-4">
                <div className="flex items-center gap-4">
                    <SkeletonBox className="h-4 w-32" />
                    <SkeletonBox className="h-4 w-40" />
                    <SkeletonBox className="h-4 w-24" />
                    <SkeletonBox className="h-4 w-28" />
                </div>
            </div>
        ))}
    </div>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => (
    <div className="space-y-2">
        {[...Array(items)].map((_, i) => (
            <div key={i} className="surface-card surface-card-gradient rounded-xl p-3 flex items-center gap-3">
                <SkeletonCircle size="size-10" />
                <div className="flex-1 space-y-2">
                    <SkeletonLine width="w-2/3" />
                    <SkeletonLine width="w-1/2" />
                </div>
                <SkeletonBox className="h-6 w-20 rounded-full" />
            </div>
        ))}
    </div>
);

export const DashboardSkeleton: React.FC = () => (
    <div className="p-4 space-y-6">
        {/* Stats */}
        <div>
            <SkeletonBox className="h-8 w-48 mb-4 ml-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SkeletonBox className="h-24 rounded-xl" />
                <SkeletonBox className="h-24 rounded-xl" />
                <SkeletonBox className="h-24 rounded-xl" />
                <SkeletonBox className="h-24 rounded-xl" />
            </div>
        </div>
        {/* Chart and lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonBox className="h-72 rounded-lg" />
            <SkeletonBox className="h-72 rounded-lg" />
        </div>
        {/* Recent Activity */}
        <div>
            <SkeletonBox className="h-8 w-40 mb-4 ml-4" />
            <div className="space-y-2">
                <SkeletonBox className="h-20 rounded-lg" />
                <SkeletonBox className="h-20 rounded-lg" />
                <SkeletonBox className="h-20 rounded-lg" />
            </div>
        </div>
    </div>
);

export const InventorySkeleton: React.FC = () => (
    <div className="space-y-3 px-4">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl p-3 surface-card surface-card-gradient">
                <SkeletonBox className="h-5 w-5 rounded flex-shrink-0" />
                <SkeletonBox className="size-16 rounded-lg flex-shrink-0" />
                <div className="flex-1 overflow-hidden space-y-2">
                    <SkeletonBox className="h-5 w-3/4" />
                    <SkeletonBox className="h-4 w-1/2" />
                    <SkeletonBox className="h-3 w-1/3" />
                </div>
                <SkeletonBox className="h-6 w-24 rounded-full" />
                <SkeletonBox className="size-8 rounded-full" />
            </div>
        ))}
    </div>
);


export const UsersSkeleton: React.FC = () => (
    <div className="divide-y divide-secondary-100 dark:divide-secondary-800 surface-card overflow-hidden">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
                <div className="flex items-center gap-4 flex-1">
                    <SkeletonBox className="size-12 rounded-full flex-shrink-0" />
                    <div className="flex flex-col justify-center space-y-2 flex-1">
                        <SkeletonBox className="h-5 w-1/2" />
                        <SkeletonBox className="h-4 w-1/3" />
                    </div>
                </div>
                <div className="shrink-0">
                    <SkeletonBox className="size-6 rounded" />
                </div>
            </div>
        ))}
    </div>
);