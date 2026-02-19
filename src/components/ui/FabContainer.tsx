import React from 'react';
import { cn } from '../../lib/utils';

interface FabContainerProps {
    children: React.ReactNode;
    className?: string;
    description?: string; // For accessibility
}

/**
 * Container to position FABs on the screen (usually bottom-right).
 */
export const FabContainer: React.FC<FabContainerProps> = ({ children, className, description }) => {
    return (
        <div
            className={cn(
                "fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4",
                "pointer-events-none [&>*]:pointer-events-auto", // Allow clicking through empty space
                className
            )}
            role="group"
            aria-label={description || "Floating Actions"}
        >
            {children}
        </div>
    );
};
