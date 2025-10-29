import React from 'react';

const SkeletonBox: React.FC<{className?: string}> = ({ className }) => (
    <div className={`rounded-md animate-pulse bg-gradient-to-r from-secondary-100 via-secondary-50 to-secondary-100 dark:from-secondary-800 dark:via-secondary-700 dark:to-secondary-800 ${className}`} />
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