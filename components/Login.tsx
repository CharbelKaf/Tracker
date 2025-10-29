
import React, { useState, useEffect, useRef } from 'react';
import Button from './ui/Button';
import type { User } from '../types';
import { useToast } from '../contexts/ToastContext';

// --- Embedded SVG Components ---

const NeembaLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
);

// --- Main Login Component ---

const Login: React.FC<{ users: User[]; onLoginSuccess: (user: User) => void; }> = ({ users, onLoginSuccess }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [shakeError, setShakeError] = useState(false);
    const { addToast } = useToast();
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const rememberedUser = localStorage.getItem('rememberedUser');
        if (rememberedUser) {
            setIdentifier(rememberedUser);
            setRememberMe(true);
        }
    }, []);
    
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        setTimeout(() => {
            const lowerCaseIdentifier = identifier.toLowerCase();
            const user = users.find(u => 
                u.email?.toLowerCase() === lowerCaseIdentifier || 
                u.name.toLowerCase() === lowerCaseIdentifier
            );

            if (user && user.pin === password) {
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', identifier);
                } else {
                    localStorage.removeItem('rememberedUser');
                }
                addToast(`Bienvenue, ${user.name.split(' ')[0]} !`, 'success');
                onLoginSuccess(user);
            } else {
                addToast('Identifiant ou mot de passe incorrect.', 'error');
                setError('Identifiant ou mot de passe incorrect.');
                setIsLoading(false);
                setShakeError(true);
                setTimeout(() => setShakeError(false), 820);
            }
        }, 500);
    };
    
    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
        passwordInputRef.current?.focus();
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden">
            <div aria-hidden="true" className="absolute inset-0 z-0">
                <div className="absolute -top-1/4 -left-1/4 size-[500px] bg-primary-200/50 dark:bg-primary-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-1/4 -right-1/4 size-[500px] bg-status-action-200/50 dark:bg-status-action-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-1/4 left-1/4 size-[500px] bg-status-info-200/50 dark:bg-status-info-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 flex min-h-screen">
                <div className="hidden lg:flex flex-col items-center justify-center flex-1 bg-gray-50/80 dark:bg-gray-800/50 text-center p-12 backdrop-blur-sm">
                    <div className="relative z-10 flex flex-col items-center max-w-lg">
                        <NeembaLogo className="w-20 h-20 text-primary-500" />
                        <h2 className="mt-6 text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                            Unlock Peak Efficiency.
                        </h2>
                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                            Neemba Tracker provides a seamless, intuitive, and powerful way to manage your IT assets from assignment to retirement.
                        </p>
                        <div className="mt-12 w-full p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                            <blockquote className="text-gray-700 dark:text-gray-300">
                                <p>"Cette plateforme a révolutionné notre façon de suivre nos équipements. Elle nous a fait gagner un temps précieux et a décuplé notre sens des responsabilités."</p>
                            </blockquote>
                            <figcaption className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                — A. Diop, Chef du service informatique chez TechCorp
                            </figcaption>
                        </div>
                    </div>
                </div>
                
                <main className="flex flex-1 flex-col items-center justify-center p-4 lg:p-8 lg:bg-white lg:dark:bg-gray-900">
                    <div className={`w-full max-w-sm ${shakeError ? 'animate-shake' : ''}`}>
                        <header className="text-center mb-8">
                             <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                Bienvenue sur Neemba Tracker
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Connectez-vous pour gérer vos actifs
                            </p>
                        </header>
                        
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="relative">
                                <label htmlFor="identifier" className="sr-only">Email ou Nom d'utilisateur</label>
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</span>
                                <input
                                    id="identifier"
                                    name="identifier"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={identifier}
                                    className="w-full h-14 appearance-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 pl-12 pr-4 text-gray-900 dark:text-gray-100 shadow-inner focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                    placeholder="Email ou Nom d'utilisateur"
                                    onChange={e => setIdentifier(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <label htmlFor="password"  className="sr-only">Mot de passe</label>
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
                                <input
                                    ref={passwordInputRef}
                                    id="password"
                                    name="password"
                                    type={passwordVisible ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full h-14 appearance-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 pl-12 pr-12 text-gray-900 dark:text-gray-100 shadow-inner focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                    placeholder="Mot de passe"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-4 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                >
                                    <span className="material-symbols-outlined">{passwordVisible ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={e => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="remember-me" className="text-gray-600 dark:text-gray-300 ml-2">Se souvenir de moi</label>
                                </div>
                                <a href="#" className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                                    Mot de passe oublié
                                </a>
                            </div>
                            <Button type="submit" block disabled={!identifier || !password || isLoading} loading={isLoading} icon="login">
                                {isLoading ? 'Connexion...' : 'Se connecter'}
                            </Button>
                        </form>
                    </div>
                    <footer className="absolute bottom-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        © {new Date().getFullYear()} Neemba Solutions. Tous droits réservés.
                    </footer>
                </main>
            </div>
        </div>
    );
};
export default Login;
