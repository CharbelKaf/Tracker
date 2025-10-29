import React, { useEffect, useState } from 'react';
import type { EquipmentWithDetails, AuditSession, Equipment, Model, Site, Department, Country } from '../types';
import PageHeader from './PageHeader';

interface AuditReportProps { 
    session: AuditSession;
    equipment: Equipment[];
    models: Model[];
    sites: Site[];
    departments: Department[];
    countries: Country[];
    onBack: () => void 
}

const AuditReport: React.FC<AuditReportProps> = ({ session, equipment, models, sites, departments, countries, onBack }) => {
    const [reportData, setReportData] = useState<any | null>(null);

    useEffect(() => {
        if (session) {
            const department = departments.find(d => d.id === session.departmentId);
            const site = sites.find(s => s.id === department?.siteId);
            const country = countries.find(c => c.id === site?.countryId);
            const location = [country?.name, site?.name, department?.name].filter(Boolean).join(' / ');
            
            const expectedItems = equipment.filter(e => e.departmentId === session.departmentId);
            const confirmedItems = expectedItems.filter(e => session.scannedItemIds.includes(e.id));
            const missingItems = expectedItems.filter(e => !session.scannedItemIds.includes(e.id));
            
            const addDetails = (items: (Equipment | { assetTag: string, modelName?: string, originalLocation?: string })[]) => {
                return items.map(item => {
                    if ('id' in item) {
                         const model = models.find(m => m.id === item.modelId);
                         return { ...item, modelName: model?.name, imageUrl: model?.imageUrl };
                    }
                    return item; // For unexpected items that are already processed
                });
            };

            setReportData({
                location,
                confirmed: addDetails(confirmedItems),
                missing: addDetails(missingItems),
                unexpected: addDetails(session.unexpectedItems),
                scanDate: session.updatedAt,
            });
        }
    }, [session, equipment, models, sites, departments, countries]);

    if (!reportData) {
        return (
            <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
                <PageHeader title="Rapport d'audit" onBack={onBack} />
                <main className="flex-1 flex items-center justify-center">
                    <p>Chargement du rapport d'audit...</p>
                </main>
            </div>
        );
    }
    
    const { confirmed, missing, unexpected, scanDate, location } = reportData;
    const totalExpected = confirmed.length + missing.length;

    const ItemList: React.FC<{ items: any[] }> = ({ items }) => (
        <div className="p-4 space-y-2">
            {items.map((item, index) => (
                <div key={item.id || index} className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-secondary-900/40 border border-white/40 dark:border-white/5 transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
                    <img src={item.imageUrl || 'https://placehold.co/64x64/e2e8f0/a0aec0/png'} alt={item.modelName} className="size-12 rounded-xl object-contain bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 shadow-sm" />
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{item.modelName || 'Modèle inconnu'}</p>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-0.5">{item.assetTag}</p>
                        {item.originalLocation && <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1"><span className="material-symbols-outlined !text-xs">location_on</span>Trouvé à: {item.originalLocation}</p>}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-secondary-50 dark:bg-[#0f1722]">
            <PageHeader title={`Rapport: ${location}`} onBack={onBack} />
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                <div className="surface-card surface-card-gradient rounded-3xl p-6 md:p-8 border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-2)]">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/50 dark:to-green-800/30 shadow-sm">
                            <span className="material-symbols-outlined text-2xl text-green-600 dark:text-green-400">summarize</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Résumé de l'audit</h2>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">Terminé le {new Date(scanDate).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="text-center p-4 rounded-2xl bg-white/60 dark:bg-secondary-900/40 border border-white/40 dark:border-white/5">
                            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{totalExpected}</p>
                            <p className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 mt-2">Attendu</p>
                        </div>
                        <div className="text-center p-4 rounded-2xl bg-white/60 dark:bg-secondary-900/40 border border-white/40 dark:border-white/5">
                            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{confirmed.length}</p>
                            <p className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 mt-2">Trouvé</p>
                        </div>
                        <div className="text-center p-4 rounded-2xl bg-white/60 dark:bg-secondary-900/40 border border-white/40 dark:border-white/5">
                            <p className="text-4xl font-bold text-red-600 dark:text-red-400">{missing.length}</p>
                            <p className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 mt-2">Manquant</p>
                        </div>
                    </div>
                     {unexpected.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-white/40 dark:border-white/5">
                            <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-secondary-900/30 border border-orange-200/50 dark:border-orange-700/30">
                                <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">{unexpected.length}</p>
                                <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mt-2">Inattendu</p>
                            </div>
                        </div>
                    )}
                </div>

                {missing.length > 0 && (
                    <div className="surface-card surface-card-gradient rounded-3xl border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-1)]">
                        <div className="p-6 border-b border-white/40 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-10 rounded-xl bg-red-100 dark:bg-red-900/40">
                                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">report_problem</span>
                                </div>
                                <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Équipements manquants ({missing.length})</h2>
                            </div>
                        </div>
                       <ItemList items={missing} />
                    </div>
                )}
                
                {unexpected.length > 0 && (
                    <div className="surface-card surface-card-gradient rounded-3xl border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-1)]">
                        <div className="p-6 border-b border-white/40 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-10 rounded-xl bg-orange-100 dark:bg-orange-900/40">
                                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">error_outline</span>
                                </div>
                                <h2 className="text-lg font-bold text-orange-600 dark:text-orange-400">Équipements inattendus ({unexpected.length})</h2>
                            </div>
                        </div>
                       <ItemList items={unexpected} />
                    </div>
                )}

                {missing.length === 0 && unexpected.length === 0 && (
                     <div className="surface-card surface-card-gradient text-center py-12 rounded-3xl border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-1)]">
                        <div className="flex items-center justify-center size-20 rounded-full bg-green-100 dark:bg-green-900/40 mx-auto mb-4">
                            <span className="material-symbols-outlined text-5xl text-green-600 dark:text-green-400">verified</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Inventaire complet !</h3>
                        <p className="text-secondary-600 dark:text-secondary-400 mt-2">Tous les équipements attendus ont été trouvés.</p>
                    </div>
                )}

            </main>
        </div>
    );
};

export default AuditReport;