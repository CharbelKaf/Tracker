import React, { useState } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { mockAllUsersExtended } from '../../../data/mockData';
import InputField from '../../../components/ui/InputField';
import Button from '../../../components/ui/Button';
import { useData } from '../../../context/DataContext';
import { APP_CONFIG } from '../../../config';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

type AuthView = 'login' | 'forgot-password';

const DEMO_LOGIN_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';
const LOGIN_FOOTER_CONTACT = {
    year: 2026,
    developerName: 'Kafui Charbel EKLU',
    githubUrl: 'https://github.com/CharbelKaf',
    linkedinUrl: 'https://www.linkedin.com/in/charbelkaf',
    gmailAddress: 'charbeleklu@gmail.com',
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState<string | undefined>(undefined);
    const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [authMethod, setAuthMethod] = useState<'email' | null>(null);

    const [authView, setAuthView] = useState<AuthView>('login');
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState<string | undefined>(undefined);
    const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);

    const { showToast } = useToast();
    const { login } = useAuth();
    const { logEvent } = useData();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedEmail = email.trim();
        let hasValidationError = false;

        if (!trimmedEmail) {
            setEmailError('Veuillez saisir votre adresse e-mail.');
            hasValidationError = true;
        } else if (!emailPattern.test(trimmedEmail)) {
            setEmailError("Le format de l'adresse e-mail est invalide.");
            hasValidationError = true;
        } else {
            setEmailError(undefined);
        }

        if (!password) {
            setPasswordError('Veuillez saisir votre mot de passe.');
            hasValidationError = true;
        } else {
            setPasswordError(undefined);
        }

        if (hasValidationError) {
            showToast('Veuillez corriger les erreurs du formulaire.', 'error');
            return;
        }

        if (!DEMO_LOGIN_ENABLED) {
            showToast("Connexion démo désactivée dans cet environnement.", 'error');
            return;
        }

        setIsLoading(true);
        setAuthMethod('email');

        setTimeout(() => {
            const user = mockAllUsersExtended.find(u => u.email.toLowerCase() === trimmedEmail.toLowerCase());

            if (user) {
                login(user.email);
                logEvent({
                    type: 'LOGIN',
                    actorId: user.id,
                    actorName: user.name,
                    actorRole: user.role,
                    targetType: 'USER',
                    targetId: user.id,
                    targetName: user.name,
                    description: 'Connexion réussie (Email)',
                    isSystem: false,
                    isSensitive: false
                });
                setIsLoading(false);
                setEmailError(undefined);
                setPasswordError(undefined);
                onLoginSuccess();
            } else {
                setIsLoading(false);
                setAuthMethod(null);
                setPasswordError('Identifiants incorrects. Vérifiez vos informations.');
                showToast('Identifiants incorrects.', 'error');
            }
        }, 800);
    };

    const openForgotPassword = () => {
        setForgotPasswordEmail(email.trim());
        setForgotPasswordError(undefined);
        setAuthView('forgot-password');
    };

    const backToLogin = () => {
        if (isSubmittingForgotPassword) return;
        setForgotPasswordError(undefined);
        setAuthView('login');
    };

    const handleForgotPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedEmail = forgotPasswordEmail.trim();

        if (!trimmedEmail) {
            setForgotPasswordError('Veuillez saisir votre adresse e-mail.');
            return;
        }

        if (!emailPattern.test(trimmedEmail)) {
            setForgotPasswordError("Le format de l'adresse e-mail est invalide.");
            return;
        }

        setForgotPasswordError(undefined);
        setIsSubmittingForgotPassword(true);

        setTimeout(() => {
            const accountExists = mockAllUsersExtended.some(
                (user) => user.email.toLowerCase() === trimmedEmail.toLowerCase()
            );

            if (accountExists) {
                setEmail(trimmedEmail);
            }

            setIsSubmittingForgotPassword(false);
            setAuthView('login');
            showToast('Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.', 'success');
        }, 900);
    };

    const fillDemoCredentials = (userEmail: string) => {
        if (!DEMO_LOGIN_ENABLED) {
            showToast("Connexion démo désactivée dans cet environnement.", 'error');
            return;
        }

        setEmail(userEmail);
        setPassword('password123');
        setEmailError(undefined);
        setPasswordError(undefined);
        showToast('Identifiants de démonstration remplis', 'info');
    };

    const featuresTracker = [
        'Inventaire en temps réel',
        'Suivi du cycle de vie',
        'Audits et rapports dédiés'
    ];

    return (
        <div className="flex min-h-screen w-full font-sans bg-surface-container-lowest text-on-surface">

            {/* LEFT PANEL - MARKETING HERO (MD3 Inverse Surface) */}
            <section
                className="hidden expanded:flex expanded:w-5/12 large:w-1/2 fixed inset-y-0 left-0 z-10 flex-col items-center justify-center p-10 large:p-12 bg-surface-container text-on-surface overflow-hidden"
            >
                <div className="absolute -top-28 -left-24 w-96 h-96 rounded-full bg-primary opacity-10 blur-3xl" />
                <div className="absolute -bottom-20 -right-16 w-80 h-80 rounded-full bg-tertiary opacity-10 blur-3xl" />

                <div className="relative z-10 max-w-lg">
                    <h2 className="text-display-small mb-6 leading-tight text-on-surface animate-in fade-in slide-in-from-left-8 duration-700 delay-100">
                        Pilotez votre parc <br />
                        <span className="text-primary">en toute sérénité.</span>
                    </h2>

                    <p className="text-body-large text-on-surface-variant mb-12 leading-relaxed animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
                        Accédez à la plateforme centralisée de gestion des actifs informatiques. Suivi, attribution et maintenance simplifiés.
                    </p>

                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        {featuresTracker.map((feature) => (
                            <div key={feature} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-lg bg-primary-container/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors duration-medium2 ease-emphasized">
                                    <MaterialIcon name="check_circle" size={20} />
                                </div>
                                <span className="text-body-large font-medium text-on-surface">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>


            </section>

            {/* RIGHT PANEL */}
            <main className="w-full expanded:w-7/12 large:w-1/2 expanded:ml-auto min-h-screen flex flex-col items-center justify-center p-6 medium:p-8 large:p-16 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-full max-w-md space-y-7 rounded-xl border border-outline-variant bg-surface-container-low p-5 medium:p-7 expanded:space-y-8 expanded:rounded-none expanded:border-none expanded:bg-transparent expanded:p-0">

                    {/* MEDIUM HERO (600-839) */}
                    <section className="hidden medium:block expanded:hidden rounded-lg border border-outline-variant bg-primary-container/25 p-5">
                        <p className="text-title-large text-on-surface mb-1">{APP_CONFIG.appName}</p>
                        <p className="text-body-medium text-on-surface-variant mb-4">
                            Gérez vos actifs IT avec une vue unifiée et des workflows simplifiés.
                        </p>
                        <div className="space-y-2">
                            {featuresTracker.map((feature) => (
                                <div key={`medium-${feature}`} className="flex items-center gap-2 text-on-surface-variant">
                                    <MaterialIcon name="check_circle" size={18} className="text-primary" />
                                    <span className="text-body-small">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* MOBILE BRANDING */}
                    <div className="medium:hidden flex items-center justify-center gap-2 text-on-surface">
                        <div className="w-8 h-8 rounded-md bg-primary-container text-on-primary-container flex items-center justify-center">
                            <MaterialIcon name="dashboard" size={18} />
                        </div>
                        <span className="text-title-medium font-medium tracking-tight">{APP_CONFIG.appName}</span>
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2">
                        {authView === 'login' ? (
                            <>
                                <h1 className="text-headline-large text-on-surface">Connexion</h1>
                                <p className="text-body-large text-on-surface-variant">Heureux de vous revoir !</p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-headline-large text-on-surface">Réinitialiser le mot de passe</h1>
                                <p className="text-body-large text-on-surface-variant">Saisissez votre e-mail pour recevoir un lien.</p>
                            </>
                        )}
                    </div>

                    {authView === 'login' ? (
                        <>
                            <form noValidate onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-5">
                                    <InputField
                                        label="Adresse e-mail"
                                        type="email"
                                        placeholder="Ex: nom@tracker.app"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (emailError) {
                                                setEmailError(undefined);
                                            }
                                        }}
                                        icon={<MaterialIcon name="mail" size={20} />}
                                        variant="filled"
                                        className="!bg-surface-container-low"
                                        autoComplete="username"
                                        error={emailError}
                                        required
                                    />

                                    <div>
                                        <InputField
                                            label="Mot de passe"
                                            type="password"
                                            placeholder="Votre mot de passe"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (passwordError) {
                                                    setPasswordError(undefined);
                                                }
                                            }}
                                            icon={<MaterialIcon name="lock" size={20} />}
                                            variant="filled"
                                            className="!bg-surface-container-low"
                                            isPassword
                                            autoComplete="current-password"
                                            error={passwordError}
                                            required
                                        />
                                        <div className="flex justify-end mt-2">
                                            <Button
                                                type="button"
                                                variant="text"
                                                onClick={openForgotPassword}
                                                disabled={isLoading}
                                                className="!rounded-sm"
                                            >
                                                Mot de passe oublié ?
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    variant="filled"
                                    size="lg"
                                    loading={isLoading && authMethod === 'email'}
                                    loadingLabel="Connexion en cours"
                                    className="w-full h-12"
                                >
                                    Se connecter
                                </Button>
                            </form>

                            {DEMO_LOGIN_ENABLED && (
                                <div className="pt-8">
                                    <p className="text-label-small text-on-surface-variant uppercase tracking-widest text-center mb-4">
                                        Comptes Démo
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        {mockAllUsersExtended.slice(0, 4).map((user) => (
                                            <Button
                                                key={user.id}
                                                type="button"
                                                variant="text"
                                                onClick={() => fillDemoCredentials(user.email)}
                                                aria-label={`Connexion démo: ${user.name}, rôle ${user.role}`}
                                                className="group relative !w-12 !h-12 !p-0 !rounded-full !min-w-12 !min-h-12 !overflow-visible"
                                                title={`Se connecter en tant que ${user.role} (${user.name})`}
                                            >
                                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-short4 ease-emphasized">
                                                    <img
                                                        src={user.avatar}
                                                        className="w-full h-full object-contain bg-surface-container p-0.5"
                                                        alt={user.name}
                                                    />
                                                </div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center text-label-small font-medium text-on-primary bg-primary">
                                                    {user.role[0]}
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <form noValidate onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                            <InputField
                                label="Adresse e-mail"
                                type="email"
                                placeholder="Ex: nom@tracker.app"
                                value={forgotPasswordEmail}
                                onChange={(e) => {
                                    setForgotPasswordEmail(e.target.value);
                                    if (forgotPasswordError) {
                                        setForgotPasswordError(undefined);
                                    }
                                }}
                                icon={<MaterialIcon name="mail" size={20} />}
                                variant="filled"
                                className="!bg-surface-container-low"
                                autoComplete="email"
                                error={forgotPasswordError}
                                required
                            />

                            <div className="flex items-center justify-between gap-3">
                                <Button
                                    type="button"
                                    variant="text"
                                    onClick={backToLogin}
                                    disabled={isSubmittingForgotPassword}
                                >
                                    Retour à la connexion
                                </Button>
                                <Button
                                    type="submit"
                                    variant="filled"
                                    loading={isSubmittingForgotPassword}
                                    loadingLabel="Envoi en cours"
                                >
                                    Envoyer le lien
                                </Button>
                            </div>
                        </form>
                    )}

                    <div className="pt-2 text-center text-label-small text-on-surface-variant space-y-1">
                        <p>
                            © {LOGIN_FOOTER_CONTACT.year} {APP_CONFIG.companyName}. Tous droits réservés.
                        </p>
                        <p>
                            Développé par {LOGIN_FOOTER_CONTACT.developerName} ·{' '}
                            <a
                                href={LOGIN_FOOTER_CONTACT.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline"
                            >
                                GitHub
                            </a>
                            {' · '}
                            <a
                                href={LOGIN_FOOTER_CONTACT.linkedinUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline"
                            >
                                LinkedIn
                            </a>
                            {' · '}
                            <a
                                href={`mailto:${LOGIN_FOOTER_CONTACT.gmailAddress}`}
                                className="text-primary hover:underline"
                            >
                                Gmail
                            </a>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;














