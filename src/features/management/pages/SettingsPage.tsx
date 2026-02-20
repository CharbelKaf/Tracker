
import React, { useState, useMemo, useEffect } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { PageHeader } from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import Badge from '../../../components/ui/Badge';
import Toggle from '../../../components/ui/Toggle';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { formatCurrency } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import { PageContainer } from '../../../components/layout/PageContainer';
import type { AppSettings } from '../../../types';
import { getAccentSeedHex } from '../../../lib/md3Theme';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { APP_CONFIG } from '../../../config';

interface SettingsPageProps {
    onLogout: () => void;
}

type SettingsSection = 'general' | 'finance' | 'account' | 'help';

const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
    const { showToast } = useToast();
    const { settings, updateSettings } = useData();
    const [activeSection, setActiveSection] = useState<SettingsSection>('general');
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
    const isCompactOrMedium = useMediaQuery('(max-width: 839px)');

    // Local state for finance form
    const [financeForm, setFinanceForm] = useState(settings);

    useEffect(() => {
        setFinanceForm(settings);
    }, [settings]);

    const handleFinanceChange = (field: string, value: string | boolean | number) => {
        setFinanceForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        updateSettings(financeForm);
        showToast('Configuration sauvegardée.', 'success');
    };

    const handleVisualChange = <K extends 'theme' | 'accentColor'>(field: K, value: AppSettings[K]) => {
        updateSettings({ [field]: value } as Pick<AppSettings, K>);
    };

    // --- SIMULATION ---
    const simulation = useMemo(() => {
        const price = 1000000;
        const years = Number(financeForm.defaultDepreciationYears) || 1;
        const salvagePercent = Number(financeForm.salvageValuePercent) || 0;
        const method = financeForm.defaultDepreciationMethod;

        const salvageValue = price * (salvagePercent / 100);
        const depreciableAmount = price - salvageValue;
        let monthly = (depreciableAmount / years) / 12;

        if (method === 'degressive') {
            monthly = monthly * 1.5; // Simplified visual multiplier
        }

        return { monthly, salvageValue };
    }, [financeForm]);

    // --- SECTIONS ---
    const sections: Array<{ id: SettingsSection; label: string; icon: string }> = [
        { id: 'general', label: isCompactOrMedium ? 'Affichage' : 'Affichage', icon: 'palette' },
        { id: 'finance', label: isCompactOrMedium ? 'Finances' : 'Finances & Paramètres', icon: 'account_balance' },
        { id: 'account', label: isCompactOrMedium ? 'Compte' : 'Compte & Sécurité', icon: 'manage_accounts' },
        { id: 'help', label: 'Aide', icon: 'help' },
    ];

    const colors: AppSettings['accentColor'][] = ['yellow', 'blue', 'purple', 'emerald', 'orange'];
    const themeOptions: Array<{ id: AppSettings['theme']; label: string; icon: string }> = [
        { id: 'light', label: 'Clair', icon: 'light_mode' },
        { id: 'dark', label: 'Sombre', icon: 'dark_mode' },
        { id: 'system', label: 'Système', icon: 'desktop_windows' }
    ];
    const canSaveFinance = activeSection === 'finance';

    return (
        <PageContainer className="flex flex-col h-full !p-0 gap-0 max-w-full">
            {/* WRAPPED HEADER TO MATCH STANDARD SPACING */}
            <div className="px-page-sm medium:px-page pt-page-sm medium:pt-page sticky top-0 z-20 bg-surface/95 backdrop-blur-sm">
                <PageHeader
                    sticky={false}
                    title="Paramètres"
                    subtitle="Gérez vos préférences et la configuration système."
                    breadcrumb="PARAMÈTRES"
                    actions={
                        <div className="flex gap-2 flex-wrap justify-end">
                            <Button
                                variant="outlined"
                                onClick={onLogout}
                                className="text-error hover:text-error hover:bg-error-container border-none shadow-none whitespace-nowrap"
                                icon={<MaterialIcon name="logout" size={18} />}
                            >
                                Déconnexion
                            </Button>
                            <Button
                                variant="filled"
                                icon={<MaterialIcon name="save" size={18} />}
                                onClick={canSaveFinance ? handleSave : undefined}
                                disabled={!canSaveFinance}
                                className={cn('whitespace-nowrap', !canSaveFinance && 'opacity-60')}
                                title={canSaveFinance ? 'Enregistrer la configuration financière' : 'Disponible dans l\'onglet Finances'}
                            >
                                Enregistrer
                            </Button>
                        </div>
                    }
                />
            </div>

            <div className="flex-1 overflow-hidden">
                <PageContainer className="h-full flex flex-col expanded:flex-row gap-0 expanded:gap-8 !p-0 md:!px-page max-w-[1600px] mx-auto">

                    {/* SIDEBAR NAVIGATION */}
                    <aside className="w-full expanded:w-64 shrink-0 bg-surface expanded:bg-transparent border-b expanded:border-b-0 border-outline-variant p-4 expanded:py-8 overflow-x-auto expanded:overflow-visible">
                        <nav className={cn('flex expanded:flex-col gap-2', isCompactOrMedium && 'min-w-max')}>
                            {sections.map(section => (
                                <Button
                                    key={section.id}
                                    type="button"
                                    variant={activeSection === section.id ? 'tonal' : 'text'}
                                    onClick={() => setActiveSection(section.id)}
                                    className={cn(
                                        isCompactOrMedium
                                            ? "h-11 !w-auto shrink-0 !rounded-full !px-4 !py-2 !text-label-medium !font-medium whitespace-nowrap !justify-center"
                                            : "h-auto w-full !rounded-md !px-4 !py-3 !text-sm !font-medium !transition-all whitespace-nowrap expanded:whitespace-normal !justify-start",
                                        activeSection === section.id
                                            ? "!bg-primary-container !text-on-primary-container shadow-elevation-1"
                                            : "!text-on-surface-variant hover:!bg-surface-container-high hover:!text-on-surface"
                                    )}
                                >
                                    <MaterialIcon name={section.icon} size={20} className={activeSection === section.id ? "text-primary" : "text-on-surface-variant"} />
                                    {section.label}
                                </Button>
                            ))}
                        </nav>
                    </aside>

                    {/* MAIN CONTENT AREA */}
                    <main className="flex-1 overflow-y-auto p-4 expanded:py-8 expanded:pr-4">
                        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-medium2 pb-20">

                            {/* --- GENERAL SECTION --- */}
                            {activeSection === 'general' && (
                                <div className="space-y-6">
                                    <h2 className="text-title-large font-bold">Apparence</h2>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1">
                                        <h3 className="text-title-medium font-semibold mb-4">Thème</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {themeOptions.map((theme) => (
                                                <Button
                                                    key={theme.id}
                                                    type="button"
                                                    variant="outlined"
                                                    onClick={() => handleVisualChange('theme', theme.id)}
                                                    className={cn(
                                                        "h-auto !rounded-lg !border-2 !p-4 !flex-col !items-center !justify-center gap-3",
                                                        settings.theme === theme.id
                                                            ? "border-primary !bg-primary-container/20"
                                                            : "border-outline-variant !bg-surface-container-low hover:!border-outline"
                                                    )}
                                                >
                                                    <MaterialIcon name={theme.icon} size={24} className={settings.theme === theme.id ? "text-primary" : "text-on-surface-variant"} />
                                                    <span className="text-sm font-medium">{theme.label}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1">
                                        <h3 className="text-title-medium font-semibold mb-4">Couleur d'accentuation</h3>
                                        <div className="flex gap-4">
                                            {colors.map((colorId) => (
                                                <Button
                                                    key={colorId}
                                                    type="button"
                                                    variant="text"
                                                    aria-label={`Couleur d'accentuation ${colorId}`}
                                                    onClick={() => handleVisualChange('accentColor', colorId)}
                                                    className={cn(
                                                        "!w-12 !h-12 !p-0 !rounded-full transition-all flex items-center justify-center relative shadow-elevation-1",
                                                        settings.accentColor === colorId
                                                            ? "ring-2 ring-offset-2 ring-offset-surface ring-primary"
                                                            : "hover:scale-110"
                                                    )}
                                                    style={{ backgroundColor: getAccentSeedHex(colorId) }}
                                                >
                                                    {settings.accentColor === colorId && <MaterialIcon name="check" size={20} className="text-white drop-shadow-sm" />}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- FINANCE SECTION --- */}
                            {activeSection === 'finance' && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-title-large font-bold">Configuration Financière</h2>
                                        <Badge variant="neutral" className="gap-1">
                                            <MaterialIcon name="info" size={14} /> Global
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 expanded:grid-cols-2 gap-6">
                                        <div className="space-y-6">
                                            <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1 h-full">
                                                <h3 className="text-title-medium font-semibold mb-4 flex items-center gap-2">
                                                    <MaterialIcon name="settings" size={20} className="text-primary" />
                                                    Paramètres Généraux
                                                </h3>
                                                <div className="space-y-4">
                                                    <SelectField
                                                        label="Devise"
                                                        name="currency"
                                                        value={financeForm.currency}
                                                        onChange={(e) => handleFinanceChange('currency', e.target.value)}
                                                        options={[
                                                            { value: 'XOF', label: 'XOF (Franc CFA)' }
                                                        ]}
                                                    />
                                                    <SelectField
                                                        label="Début année fiscale"
                                                        name="fiscalYearStart"
                                                        value={financeForm.fiscalYearStart}
                                                        onChange={(e) => handleFinanceChange('fiscalYearStart', e.target.value)}
                                                        options={[
                                                            { value: '01', label: 'Janvier' },
                                                            { value: '04', label: 'Avril' },
                                                            { value: '09', label: 'Septembre' }
                                                        ]}
                                                    />

                                                    <div className="flex items-center justify-between pt-2">
                                                        <label className="text-sm font-medium text-on-surface">Notation compacte (1k, 1M)</label>
                                                        <Toggle checked={financeForm.compactNotation} onChange={(v) => handleFinanceChange('compactNotation', v)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="p-6 bg-primary-container/20 rounded-lg border border-primary/20 h-full">
                                                <h3 className="text-title-medium font-semibold mb-4 flex items-center gap-2 text-primary">
                                                    <MaterialIcon name="preview" size={20} />
                                                    Aperçu Amortissement
                                                </h3>
                                                <div className="space-y-4 text-sm">
                                                    <div className="flex justify-between py-2 border-b border-outline-variant/50">
                                                        <span className="text-on-surface-variant">Base (Exemple)</span>
                                                        <span className="font-mono font-bold">1 000 000 {financeForm.currency}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-outline-variant/50">
                                                        <span className="text-on-surface-variant">Mensualité</span>
                                                        <span className="font-mono font-bold text-primary">{formatCurrency(simulation.monthly, financeForm.currency, financeForm.compactNotation)}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2">
                                                        <span className="text-on-surface-variant">Valeur Résiduelle</span>
                                                        <span className="font-mono font-bold text-tertiary">{formatCurrency(simulation.salvageValue, financeForm.currency, financeForm.compactNotation)}</span>
                                                    </div>
                                                    <div className="bg-surface/50 p-3 rounded text-xs text-on-surface-variant italic mt-4 border border-outline-variant/50">
                                                        * Ceci est une estimation basée sur la méthode {financeForm.defaultDepreciationMethod === 'linear' ? 'linéaire' : 'dégressive'}.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1">
                                        <h3 className="text-title-medium font-semibold mb-4">Règles d'Amortissement par défaut</h3>
                                        <div className="grid grid-cols-1 expanded:grid-cols-2 gap-6">
                                            <SelectField
                                                label="Méthode"
                                                name="method"
                                                value={financeForm.defaultDepreciationMethod}
                                                onChange={(e) => handleFinanceChange('defaultDepreciationMethod', e.target.value)}
                                                options={[
                                                    { value: 'linear', label: 'Linéaire (Constant)' },
                                                    { value: 'degressive', label: 'Dégressif (Accéléré)' }
                                                ]}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField
                                                    label="Durée (Ans)"
                                                    type="number"
                                                    value={financeForm.defaultDepreciationYears.toString()}
                                                    onChange={(e) => handleFinanceChange('defaultDepreciationYears', Number(e.target.value))}
                                                />
                                                <InputField
                                                    label="Valeur Résid. (%)"
                                                    type="number"
                                                    value={financeForm.salvageValuePercent.toString()}
                                                    onChange={(e) => handleFinanceChange('salvageValuePercent', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- ACCOUNT SECTION --- */}
                            {activeSection === 'account' && (
                                <div className="space-y-6">
                                    <h2 className="text-title-large font-bold">Mon Compte</h2>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1 flex items-start gap-6">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-bold border-2 border-surface shadow-elevation-1 shrink-0">
                                            AA
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-title-large font-bold">Alice Admin</h3>
                                            <p className="text-on-surface-variant">alice.admin@tracker.app</p>
                                            <div className="flex gap-2 mt-3">
                                                <Badge variant="info">SuperAdmin</Badge>
                                                <Badge variant="neutral">IT Department</Badge>
                                            </div>
                                        </div>
                                        <Button variant="outlined" size="sm">Modifier</Button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1">
                                            <h3 className="text-title-medium font-semibold mb-6 flex items-center gap-2">
                                                <MaterialIcon name="security" size={20} className="text-tertiary" />
                                                Sécurité
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between py-2">
                                                    <div>
                                                        <p className="font-medium">Mot de passe</p>
                                                        <p className="text-sm text-on-surface-variant">Dernière modification il y a 90 jours</p>
                                                    </div>
                                                    <Button variant="outlined" className="text-primary whitespace-nowrap !px-4">Mettre à jour</Button>
                                                </div>
                                                <div className="h-px bg-outline-variant/50" />
                                                <div className="flex items-center justify-between py-2 gap-3">
                                                    <div className="min-w-0">
                                                        <p className="font-medium">Authentification 2FA</p>
                                                        <p className="text-sm text-on-surface-variant">Recommandé pour les administrateurs</p>
                                                        {!isTwoFactorEnabled && (
                                                            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-error-container px-2 py-1 text-label-small text-on-error-container">
                                                                <MaterialIcon name="warning" size={14} />
                                                                Protection inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Toggle checked={isTwoFactorEnabled} onChange={setIsTwoFactorEnabled} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- HELP SECTION --- */}
                            {activeSection === 'help' && (
                                <div className="space-y-6">
                                    <h2 className="text-title-large font-bold">Centre d'aide</h2>

                                    <div className="grid grid-cols-1 expanded:grid-cols-2 gap-4">
                                        {[ 
                                            { title: 'Documentation', icon: 'menu_book', desc: 'Guides complets et manuels.' },
                                            { title: 'Support', icon: 'support_agent', desc: 'Contacter l\'équipe technique.' },
                                            { title: 'Tutoriels', icon: 'play_circle', desc: 'Vidéos de démonstration.' },
                                            { title: 'FAQ', icon: 'quiz', desc: 'Questions fréquentes.' },
                                        ].map((item, idx) => (
                                            <Button
                                                key={idx}
                                                type="button"
                                                variant="outlined"
                                                className="h-auto !rounded-lg !p-4 !bg-surface !border-outline-variant hover:!border-primary/50 hover:!bg-surface-container-low !text-left group !justify-start"
                                            >
                                                <div className="w-10 h-10 bg-secondary-container text-secondary rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <MaterialIcon name={item.icon} size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-on-surface">{item.title}</h3>
                                                    <p className="text-sm text-on-surface-variant">{item.desc}</p>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="p-6 bg-surface-container-low rounded-lg border border-outline-variant text-center">
                                        <p className="text-sm text-on-surface-variant mb-2">Version du système</p>
                                        <p className="font-mono font-bold">{APP_CONFIG.appName} v{APP_CONFIG.version}</p>
                                    </div>
                                </div>
                            )}

                        </div>
                    </main>
                </PageContainer>
            </div>
        </PageContainer>
    );
};

export default SettingsPage;














