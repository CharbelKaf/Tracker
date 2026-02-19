import { useState, useEffect, useCallback } from 'react';

// Helper to get path segments from hash
// e.g. #/users/123 -> ['users', '123']
const getHashSegments = () => {
    const hash = window.location.hash;
    const path = hash.replace(/^#/, '') || '/';
    const [pathname] = path.split('?');
    return pathname.split('/').filter(Boolean);
};

export const useRouter = () => {
    const [routeSegments, setRouteSegments] = useState<string[]>(getHashSegments());

    useEffect(() => {
        const handleHashChange = () => {
            setRouteSegments(getHashSegments());
        };

        // Initialize if empty
        if (!window.location.hash) {
            window.location.hash = '/';
        }

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const navigate = useCallback((path: string) => {
        window.location.hash = path.startsWith('/') ? path : `/${path}`;
    }, []);

    return { routeSegments, navigate };
};
