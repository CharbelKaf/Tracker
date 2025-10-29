
import React, { ReactNode } from 'react';

// A styled fieldset for grouping form elements, providing semantic structure.
export const FormSection: React.FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
    <fieldset className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/60 dark:border-white/10 p-4 rounded-lg shadow-sm">
        <legend className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children}
        </div>
    </fieldset>
);

// A wrapper for a single form field with a label and optional help tooltip.
export const FormField: React.FC<{ label: string; htmlFor: string; children: ReactNode; className?: string; help?: ReactNode }> = ({ label, htmlFor, children, className, help }) => (
    <div className={className}>
        <div className="flex items-center gap-1 mb-2">
            <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-600 dark:text-gray-300">{label}</label>
            {help}
        </div>
        {children}
    </div>
);

const formControlBaseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-800";

// A standardized input component.
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
    <input
        {...props}
        className={`${formControlBaseClasses} ${className || ''}`}
    />
);

// A standardized select component with consistent styling, including a chevron icon.
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }> = ({ children, className, ...props }) => (
     <div className="relative">
        <select
            {...props}
            className={`w-full appearance-none pr-10 ${formControlBaseClasses} ${className || ''}`}
        >
            {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 dark:text-gray-500">
            <span className="material-symbols-outlined">expand_more</span>
        </div>
    </div>
);

// A standardized textarea component.
export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
    <textarea
        {...props}
        className={`${formControlBaseClasses} ${className || ''}`}
    />
);