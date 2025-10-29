import React, { createContext, useContext } from 'react';
import type { NavigateFunction, NavigateOptions, To } from 'react-router-dom';

export interface NavigationContextValue {
    navigateTo: (to: To, options?: NavigateOptions) => void;
    replace: (to: To, options?: NavigateOptions) => void;
    goBack: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

const normalizeTo = (to: To): To => {
    if (typeof to !== 'string') {
        return to;
    }

    if (to.startsWith('#')) {
        to = to.slice(1);
    }

    if (!to.startsWith('/')) {
        return `/${to}`;
    }

    return to;
};

export const createNavigationValue = (navigate: NavigateFunction): NavigationContextValue => ({
    navigateTo: (to, options) => navigate(normalizeTo(to), options),
    replace: (to, options) => navigate(normalizeTo(to), { ...options, replace: true }),
    goBack: () => navigate(-1),
});

export const NavigationProvider: React.FC<{ value: NavigationContextValue; children: React.ReactNode }> = ({ value, children }) => (
    <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
);

export const useNavigation = (): NavigationContextValue => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};
