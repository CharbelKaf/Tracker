import React, { useState } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { mockAuditCountries } from '../../../data/mockData';
import { ViewType } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';

interface PhysicalAuditViewProps {
    onViewChange: (view: ViewType) => void;
}

export const PhysicalAuditView: React.FC<PhysicalAuditViewProps> = ({ onViewChange }) => {
    const { showToast } = useToast();
    const [selectedCountry, setSelectedCountry] = useState('France');
    const [selectedSite] = useState('Bureau Paris');

    const countries = mockAuditCountries;

    const totalEquipment = countries.reduce((sum, country) => sum + country.total, 0);
    const scannedEquipment = countries.reduce((sum, country) => sum + country.completed, 0);
    const coveragePercent = totalEquipment > 0 ? Math.round((scannedEquipment / totalEquipment) * 100) : 0;
    const activeSessions = 0;
    const finalizedReports = 0;
    const hasAuditActivity = scannedEquipment > 0 || activeSessions > 0 || finalizedReports > 0;


    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };

    const handleStartAudit = () => {
        showToast("Audit 'Marketing Europe' démarré", 'success');
        onViewChange('audit_details');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section */}
            <div className="bg-surface rounded-card p-page shadow-elevation-1 border border-outline-variant">
                <div className="flex flex-col gap-5">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wide mb-2">
                            <MaterialIcon name="calendar_today" size={18} /> PRÉPARER VOS AUDITS
                        </div>
                        <h3 className="text-headline-small medium:text-headline-medium font-bold text-on-surface mb-4">
                            Suivez la progression des campagnes d'audit
                        </h3>
                        <p className="text-on-surface-variant text-sm max-w-xl leading-relaxed">
                            Explorez vos pays, sites et services pour lancer rapidement un audit, reprendre une session en cours ou consulter les rapports finalisés.
                        </p>
                        <div className="mt-5">
                            <Button
                                variant="outlined"
                                onClick={() => onViewChange('audit_details')}
                                icon={<MaterialIcon name="bar_chart" size={18} />}
                                className="shadow-elevation-1"
                            >
                                Aperçu
                            </Button>
                        </div>
                    </div>
                </div>

                {hasAuditActivity ? (
                    <div className="grid grid-cols-2 large:grid-cols-4 gap-8 mt-10 pt-8 border-t border-outline-variant/30">
                        <div>
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">PROGRESSION GLOBALE</span>
                            <div className="text-headline-medium font-bold text-on-surface">{coveragePercent}%</div>
                            <div className="text-xs text-on-surface-variant mt-1">Taux de couverture</div>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">ÉQUIPEMENTS SCANNÉS</span>
                            <div className="text-headline-medium font-bold text-on-surface">{scannedEquipment}</div>
                            <div className="text-xs text-on-surface-variant mt-1">sur {totalEquipment}</div>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">SESSIONS ACTIVES</span>
                            <div className="text-headline-medium font-bold text-on-surface">{activeSessions}</div>
                            <div className="text-xs text-on-surface-variant mt-1">En cours ou en pause</div>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">RAPPORTS FINALISÉS</span>
                            <div className="text-headline-medium font-bold text-on-surface">{finalizedReports}</div>
                            <div className="text-xs text-on-surface-variant mt-1">Derniers 30 jours</div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-10 pt-8 border-t border-outline-variant/30">
                        <div className="rounded-card border border-dashed border-outline-variant bg-surface-container-low p-6 flex flex-col medium:flex-row medium:items-center medium:justify-between gap-4">
                            <div>
                                <p className="text-title-medium text-on-surface">Aucun audit actif pour le moment</p>
                                <p className="text-body-small text-on-surface-variant mt-1">Démarrez votre première session pour suivre la progression et générer des rapports.</p>
                            </div>
                            <Button
                                variant="tonal"
                                onClick={handleStartAudit}
                                icon={<MaterialIcon name="play_arrow" size={16} />}
                                className="whitespace-nowrap"
                            >
                                Démarrer un audit
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 extra-large:grid-cols-12 gap-6">

                {/* Left Column: Countries */}
                <div className="extra-large:col-span-4 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">PAYS</span>
                        <span className="text-xs font-bold text-on-surface-variant">{countries.length}</span>
                    </div>

                    {countries.map((country) => (
                        <div
                            key={country.name}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedCountry(country.name)}
                            onKeyDown={(e) => handleKeyDown(e, () => setSelectedCountry(country.name))}
                            className={`p-card rounded-card border-2 cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedCountry === country.name
                                ? 'bg-surface border-outline-variant shadow-elevation-1'
                                : 'bg-surface border-transparent hover:border-outline-variant'
                                }`}
                        >
                            <div className="flex justify-between items-start gap-3 mb-4">
                                <div>
                                    <h4 className="text-title-medium font-bold text-on-surface">{country.name}</h4>
                                    <p className="text-label-small text-on-surface-variant mt-1">
                                        {country.sites} site{country.sites > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-surface-container-high text-label-small text-on-surface-variant border border-outline-variant">
                                    {country.completed}/{country.total}
                                </span>
                            </div>

                            <div className="relative w-full h-2 bg-surface-container rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-primary"
                                    style={{ width: `${(country.completed / Math.max(country.total, 1)) * 100}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-label-small">
                                <span className="text-on-surface-variant">Progression</span>
                                <span className="font-semibold text-on-surface">{Math.round((country.completed / Math.max(country.total, 1)) * 100)}%</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Column: Site Details */}
                <div className="extra-large:col-span-8 space-y-6">
                    {/* Site Header Card */}
                    <div className="bg-surface rounded-card p-card shadow-elevation-1 border border-transparent flex flex-col medium:flex-row justify-between items-start medium:items-center gap-4">
                        <div>
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">SITES</span>
                            <h3 className="text-headline-small medium:text-headline-medium font-bold text-on-surface mb-1">
                                {selectedSite}
                            </h3>
                            <p className="text-on-surface-variant text-sm">0% de progression globale pour ce pays (0/3 équipements).</p>
                        </div>
                        <Button
                            type="button"
                            variant="tonal"
                            className="!px-4 !py-2 !text-sm !font-bold whitespace-nowrap hover:!bg-primary hover:!text-on-primary"
                        >
                            {selectedSite} • 0%
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 large:grid-cols-2 gap-6">
                        {/* Services Card */}
                        <div className="bg-surface rounded-card p-card shadow-elevation-1 border border-transparent h-full">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">SERVICES / DÉPARTEMENTS</span>
                                <span className="text-xs font-bold text-on-surface-variant">1</span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <h5 className="font-bold text-on-surface text-sm">Marketing Europe</h5>
                                        <span className="text-xs font-bold text-on-surface-variant">0%</span>
                                    </div>
                                    <div className="relative w-full h-1.5 bg-surface-container rounded-full overflow-hidden mb-2">
                                        <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: '0%' }}></div>
                                    </div>
                                    <p className="text-xs text-on-surface-variant">0/0 équipements scannés</p>
                                </div>
                                <Button
                                    onClick={handleStartAudit}
                                    variant="tonal"
                                    size="sm"
                                    className="rounded-lg text-xs"
                                    icon={<MaterialIcon name="play_arrow" size={10} filled />}
                                >
                                    Commencer
                                </Button>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-surface rounded-card p-card shadow-elevation-1 border border-transparent h-full flex flex-col">
                            <div>
                                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 block">RÉSUMÉ DU SITE</span>
                                <h4 className="text-title-medium font-bold text-on-surface mb-1">{selectedSite}</h4>
                                <p className="text-xs text-on-surface-variant mb-6">0% complété • 0/3 équipements.</p>

                                <div className="space-y-4">
                                    <div>
                                        <span className="text-label-small font-bold text-on-surface-variant uppercase tracking-widest block mb-0.5">SERVICES À AUDITER</span>
                                        <div className="text-title-large font-bold text-on-surface">1</div>
                                    </div>
                                    <div>
                                        <span className="text-label-small font-bold text-on-surface-variant uppercase tracking-widest block mb-0.5">SESSIONS ACTIVES</span>
                                        <div className="text-title-large font-bold text-on-surface">0</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


