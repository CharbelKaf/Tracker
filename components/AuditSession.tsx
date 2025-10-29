import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Equipment, Model, Category, QrScanData, EquipmentWithDetails, Site, Department, AuditSession, Country } from '../types';
import PageHeader, { PageHeaderActions } from './PageHeader';
import QRScanner from './QRScanner';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';
import { AuditItemModal, ConfirmationModal } from './Modals';

interface AuditSessionProps {
    session: AuditSession;
    allEquipment: Equipment[];
    allModels: Model[];
    allCategories: Category[];
    sites: Site[];
    departments: Department[];
    countries: Country[];
    onBack: () => void;
    onUpdateEquipment: (equipment: Partial<Equipment>) => void;
    dispatch: React.Dispatch<any>;
}

const sessionStatusConfig: Record<string, { label: string; icon: string; badgeClass: string }> = {
    'in-progress': {
        label: 'En cours',
        icon: 'play_circle',
        badgeClass: 'bg-status-info-100 text-status-info-600 dark:bg-status-info-900/40 dark:text-status-info-300'
    },
    paused: {
        label: 'En pause',
        icon: 'pause_circle',
        badgeClass: 'bg-status-warning-100 text-status-warning-700 dark:bg-status-warning-900/40 dark:text-status-warning-200'
    },
    completed: {
        label: 'Terminé',
        icon: 'check_circle',
        badgeClass: 'bg-status-success-100 text-status-success-700 dark:bg-status-success-900/40 dark:text-status-success-200'
    },
    cancelled: {
        label: 'Annulé',
        icon: 'cancel',
        badgeClass: 'bg-status-danger-100 text-status-danger-700 dark:bg-status-danger-900/40 dark:text-status-danger-200'
    },
};

const ProgressRing: React.FC<{ value: number }> = ({ value }) => {
    const clamped = Math.min(100, Math.max(0, value));
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (clamped / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={84} height={84} className="-rotate-90">
                <circle
                    stroke="rgba(148, 163, 184, 0.3)"
                    fill="transparent"
                    strokeWidth="8"
                    r={radius}
                    cx="42"
                    cy="42"
                />
                <circle
                    stroke={clamped >= 100 ? '#22c55e' : '#6e87a7'}
                    fill="transparent"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset }}
                    r={radius}
                    cx="42"
                    cy="42"
                />
            </svg>
            <span className="absolute text-xl font-semibold text-gray-900 dark:text-gray-100">
                {Math.round(clamped)}%
            </span>
        </div>
    );
};

const metricAccents: Record<'secondary' | 'success' | 'danger', { iconBg: string; iconText: string; border: string }> = {
    secondary: {
        iconBg: 'bg-secondary-100/80 dark:bg-secondary-900/40',
        iconText: 'text-secondary-700 dark:text-secondary-200',
        border: 'border-secondary-200/70 dark:border-secondary-700/60',
    },
    success: {
        iconBg: 'bg-status-success-100/80 dark:bg-status-success-900/40',
        iconText: 'text-status-success-700 dark:text-status-success-200',
        border: 'border-status-success-200/70 dark:border-status-success-700/60',
    },
    danger: {
        iconBg: 'bg-status-danger-100/80 dark:bg-status-danger-900/40',
        iconText: 'text-status-danger-700 dark:text-status-danger-200',
        border: 'border-status-danger-200/70 dark:border-status-danger-700/60',
    },
};

const MetricCard: React.FC<{ label: string; value: number; description: string; icon: string; accent: 'secondary' | 'success' | 'danger' }> = ({ label, value, description, icon, accent }) => {
    const accentStyles = metricAccents[accent];
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`surface-card rounded-2xl p-5 border ${accentStyles.border} shadow-[var(--shadow-elev-1)]`}
        >
            <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentStyles.iconBg} ${accentStyles.iconText}`}>
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
                <span className="text-xs uppercase font-semibold tracking-wide text-secondary-500 dark:text-secondary-300">{label}</span>
            </div>
            <p className="mt-4 text-3xl font-semibold text-gray-900 dark:text-gray-50">{value}</p>
            <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">{description}</p>
        </motion.div>
    );
};

type EquipmentSectionAccent = 'success' | 'warning';

const equipmentAccentStyles: Record<EquipmentSectionAccent, { iconBg: string; iconText: string; badge: string }> = {
    success: {
        iconBg: 'bg-status-success-100/80 dark:bg-status-success-900/40',
        iconText: 'text-status-success-700 dark:text-status-success-200',
        badge: 'bg-status-success-100 text-status-success-700 dark:bg-status-success-900/40 dark:text-status-success-200',
    },
    warning: {
        iconBg: 'bg-status-warning-100/80 dark:bg-status-warning-900/40',
        iconText: 'text-status-warning-700 dark:text-status-warning-200',
        badge: 'bg-status-warning-100 text-status-warning-700 dark:bg-status-warning-900/40 dark:text-status-warning-200',
    },
};

interface EquipmentSectionProps {
    title: string;
    items: EquipmentWithDetails[];
    emptyMessage: string;
    accent: EquipmentSectionAccent;
    icon: string;
    getLocation: (item: EquipmentWithDetails) => string;
}

const EquipmentSection: React.FC<EquipmentSectionProps> = ({ title, items, emptyMessage, accent, icon, getLocation }) => {
    const accentClass = equipmentAccentStyles[accent];
    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="surface-card surface-card-gradient rounded-3xl p-6 border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-1)] space-y-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-[var(--shadow-elev-1)] ${accentClass.iconBg} ${accentClass.iconText}`}>
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-50">{title}</h3>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">{items.length} équipement(s)</p>
                    </div>
                </div>
            </div>
            <div className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-sm text-secondary-600 dark:text-secondary-300 italic">{emptyMessage}</p>
                ) : (
                    items.map(item => (
                        <motion.div
                            key={item.id}
                            layout
                            className="flex items-start gap-4 rounded-2xl border border-white/40 dark:border-white/5 bg-white/60 dark:bg-secondary-900/40 px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-[var(--shadow-elev-1)] hover:-translate-y-0.5"
                            whileHover={{ y: -1 }}
                        >
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{item.model?.name || item.assetTag}</p>
                                    <span className="text-xs font-medium text-secondary-500 dark:text-secondary-300">{item.assetTag}</span>
                                </div>
                                <p className="text-xs text-secondary-600 dark:text-secondary-300">{getLocation(item)}</p>
                                {item.category?.name && (
                                    <p className="text-xs text-secondary-500 dark:text-secondary-300">Catégorie · {item.category.name}</p>
                                )}
                            </div>
                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${accentClass.badge}`}>
                                {accent === 'success' ? 'Confirmé' : 'À vérifier'}
                            </span>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.section>
    );
};

const AuditSession: React.FC<AuditSessionProps> = ({ session, allEquipment, allModels, allCategories, sites, departments, countries, onBack, onUpdateEquipment, dispatch }) => {
    const { addToast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [modalInfo, setModalInfo] = useState<{ type: 'unexpected' | 'new'; data: any } | null>(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    
    const sessionDepartment = useMemo(() => departments.find(d => d.id === session.departmentId), [departments, session.departmentId]);
    const sessionSite = useMemo(() => sites.find(s => s.id === sessionDepartment?.siteId), [sites, sessionDepartment]);
    const sessionCountry = useMemo(() => countries.find(c => c.id === sessionSite?.countryId), [countries, sessionSite]);

    const locationString = [sessionCountry?.name, sessionSite?.name, sessionDepartment?.name].filter(Boolean).join(' / ');

    const equipmentWithDetails = useMemo(() => allEquipment.map(e => {
        const model = allModels.find(m => m.id === e.modelId);
        const category = model ? allCategories.find(c => c.id === model.categoryId) : null;
        return { ...e, model, category };
    }), [allEquipment, allModels, allCategories]);

    const expectedItems = useMemo(() => {
        return equipmentWithDetails.filter(e => e.departmentId === session.departmentId);
    }, [equipmentWithDetails, session.departmentId]);

    const scannedIds = useMemo(() => new Set(session.scannedItemIds), [session.scannedItemIds]);

    const confirmedItems = useMemo(() => expectedItems.filter(e => scannedIds.has(e.id)), [expectedItems, scannedIds]);
    const remainingItems = useMemo(() => expectedItems.filter(e => !scannedIds.has(e.id)), [expectedItems, scannedIds]);
    const progressPercent = expectedItems.length === 0 ? 0 : (confirmedItems.length / expectedItems.length) * 100;
    const remainingCount = remainingItems.length;

    const statusInfo = sessionStatusConfig[session.status] || {
        label: 'Session',
        icon: 'info',
        badgeClass: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-200',
    };

    const lastScannedItems = useMemo<EquipmentWithDetails[]>(() => {
        const ids = Array.isArray(session.scannedItemIds) ? [...session.scannedItemIds] : [];
        return ids
            .slice(-4)
            .reverse()
            .reduce<EquipmentWithDetails[]>((acc, id) => {
                const item = equipmentWithDetails.find(e => e.id === id);
                if (item) acc.push(item);
                return acc;
            }, []);
    }, [session.scannedItemIds, equipmentWithDetails]);
    
    const getCurrentLocationString = (item: EquipmentWithDetails): string => {
        const site = item.siteId ? sites.find(s => s.id === item.siteId) : null;
        if (!site) return item.location || 'Emplacement inconnu';
        
        if (item.departmentId) {
            const department = departments.find(d => d.id === item.departmentId);
            if (department && department.siteId === site.id) {
                return `${site.name} / ${department.name}`;
            }
        }
        return site.name;
    };

    const handleScanSuccess = (text: string) => {
        setIsScanning(false);
        const processScan = (assetTag: string, qrData?: QrScanData) => {
            if (!assetTag) {
                addToast("QR code invalide: Numéro de série manquant.", "error");
                return;
            }

            const foundEquipment = equipmentWithDetails.find(e => e.assetTag === assetTag);

            if (foundEquipment) {
                if (scannedIds.has(foundEquipment.id)) {
                    addToast("Déjà scanné.", "info");
                    return;
                }

                if (foundEquipment.departmentId !== session.departmentId) {
                    setModalInfo({ type: 'unexpected', data: foundEquipment });
                } else {
                    dispatch({ type: 'UPDATE_AUDIT_SESSION_SCAN', payload: { sessionId: session.id, scannedItemId: foundEquipment.id } });
                    addToast(`${foundEquipment.model?.name || foundEquipment.assetTag} confirmé !`, "success");
                }
            } else if (qrData) {
                setModalInfo({ type: 'new', data: qrData });
            } else {
                 addToast(`Équipement avec N/S "${assetTag}" non trouvé.`, "error");
            }
        };

        try {
            const qrData: QrScanData = JSON.parse(text);
            processScan(qrData.serialNumber, qrData);
        } catch (e) {
            processScan(text);
        }
    };

    const handleMoveItem = () => {
        if (modalInfo?.type === 'unexpected') {
            const itemToMove = modalInfo.data as EquipmentWithDetails;
            onUpdateEquipment({ 
                id: itemToMove.id, 
                siteId: sessionSite?.id, 
                departmentId: sessionDepartment?.id
            });
            dispatch({ type: 'UPDATE_AUDIT_SESSION_SCAN', payload: { sessionId: session.id, scannedItemId: itemToMove.id } });
            addToast(`${itemToMove.model?.name} déplacé vers ${locationString}.`, 'success');
            setModalInfo(null);
        }
    };
    
    const handleAddNewItem = () => {
        if(modalInfo?.type === 'new') {
            sessionStorage.setItem('new-equipment-from-scan', JSON.stringify(modalInfo.data));
            window.location.hash = '#/equipment/new';
            setModalInfo(null);
        }
    };

    const handlePauseAudit = () => {
        dispatch({ type: 'PAUSE_AUDIT_SESSION', payload: { sessionId: session.id } });
        onBack();
    };

    const handleFinishAudit = () => {
        dispatch({ type: 'COMPLETE_AUDIT_SESSION', payload: { sessionId: session.id } });
        window.location.hash = `#/audit/report/${session.id}`;
    };
    
    const handleCancelAudit = () => {
        dispatch({ type: 'CANCEL_AUDIT_SESSION', payload: { sessionId: session.id } });
        onBack();
    };
    
    const actions = [
        { label: 'Annuler l\'audit', icon: 'cancel', onClick: () => setIsCancelModalOpen(true), isDestructive: true },
    ];
    
    return (
        <div className="flex flex-col h-full bg-secondary-50 dark:bg-[#0f1722]">
            <PageHeader
                title="Session d'audit"
                subtitle={locationString || 'Emplacement non défini'}
                onBack={handlePauseAudit}
            >
                <PageHeaderActions actions={actions} />
            </PageHeader>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-36">
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="surface-card surface-card-gradient rounded-3xl p-8 md:p-10 border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-2)]"
                >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-5">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-100 to-secondary-50 dark:from-secondary-900/50 dark:to-secondary-800/30 text-secondary-700 dark:text-secondary-300 shadow-[var(--shadow-elev-1)]">
                                <span className="material-symbols-outlined text-4xl">inventory_2</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <p className="text-sm font-bold uppercase tracking-wider text-secondary-600 dark:text-secondary-400">Session d'audit</p>
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.badgeClass}`}>
                                        <span className="material-symbols-outlined !text-sm">{statusInfo.icon}</span>
                                        {statusInfo.label}
                                    </span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight leading-tight">{locationString}</h1>
                                <p className="mt-3 text-sm leading-relaxed text-secondary-700 dark:text-secondary-300 max-w-xl">
                                    Confirmez les équipements présents, signalez les anomalies et suivez en temps réel la progression de cette campagne.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <ProgressRing value={progressPercent} />
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="secondary"
                                    icon="check_circle"
                                    onClick={handleFinishAudit}
                                >
                                    Terminer l'audit
                                </Button>
                                <Button
                                    variant="ghost"
                                    icon="pause_circle"
                                    onClick={handlePauseAudit}
                                >
                                    Mettre en pause
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <div className="grid gap-4 md:grid-cols-3">
                    <MetricCard
                        label="Attendus"
                        value={expectedItems.length}
                        description="Équipements prévus dans ce service"
                        icon="assignment"
                        accent="secondary"
                    />
                    <MetricCard
                        label="Confirmés"
                        value={confirmedItems.length}
                        description="Scannés et validés pour cette session"
                        icon="task_alt"
                        accent="success"
                    />
                    <MetricCard
                        label="Restants"
                        value={remainingCount}
                        description="À vérifier ou à signaler"
                        icon="hourglass_empty"
                        accent="danger"
                    />
                </div>

                <div className="flex flex-col gap-6 xl:flex-row">
                    <section className="flex-1 space-y-5">
                        <EquipmentSection
                            title="Confirmés"
                            items={confirmedItems}
                            emptyMessage="Aucun équipement confirmé pour le moment. Scanner un élément pour commencer."
                            accent="success"
                            icon="verified"
                            getLocation={getCurrentLocationString}
                        />
                        <EquipmentSection
                            title="Restants"
                            items={remainingItems}
                            emptyMessage="Tous les équipements ont été confirmés. Rien à signaler !"
                            accent="warning"
                            icon="pending_actions"
                            getLocation={getCurrentLocationString}
                        />
                    </section>

                    <motion.aside
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="xl:w-[320px] flex-shrink-0 space-y-5"
                    >
                        <div className="surface-card surface-card-gradient rounded-3xl p-6 border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-1)] space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Actions rapides</h3>
                                <span className="material-symbols-outlined text-secondary-500 dark:text-secondary-300">bolt</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="primary"
                                    icon="qr_code_scanner"
                                    onClick={() => setIsScanning(true)}
                                >
                                    Scanner un équipement
                                </Button>
                                <Button
                                    variant="ghost"
                                    icon="report"
                                    onClick={() => {
                                        dispatch({ type: 'REPORT_AUDIT_EXCEPTION', payload: { sessionId: session.id } });
                                        addToast('Espace de signalement ouvert.', 'info');
                                    }}
                                >
                                    Signaler une anomalie
                                </Button>
                            </div>
                        </div>

                        <div className="surface-card surface-card-gradient rounded-3xl p-6 border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-1)] space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-secondary-600 dark:text-secondary-400">history</span>
                                <h3 className="text-sm font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Derniers scans</h3>
                            </div>
                            <div className="space-y-3">
                                {lastScannedItems.length === 0 ? (
                                    <p className="text-sm text-secondary-600 dark:text-secondary-300 italic">Aucune entrée pour le moment.</p>
                                ) : (
                                    lastScannedItems.map(item => (
                                        <div key={item.id} className="rounded-2xl border border-white/40 dark:border-white/5 bg-white/60 dark:bg-secondary-900/40 px-4 py-3 transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{item.model?.name || item.assetTag}</p>
                                            <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-0.5">{item.assetTag}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.aside>
                </div>
            </main>
            <footer className="fixed bottom-16 left-0 right-0 z-10 surface-card backdrop-blur-md p-4 border-t border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-2)] lg:static">
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={handleFinishAudit} className="flex-1">Terminer l'audit</Button>
                    <Button onClick={() => setIsScanning(true)} className="flex-1">Scanner</Button>
                </div>
            </footer>
            {isScanning && (
                <QRScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScanning(false)} />
            )}
            {modalInfo?.type === 'unexpected' && (
                <AuditItemModal
                    isOpen={true}
                    onClose={() => setModalInfo(null)}
                    title="Équipement inattendu"
                    icon="warning"
                    iconBgColor="bg-yellow-100"
                    iconColor="text-yellow-600"
                    primaryButtonText="Oui, déplacer"
                    onPrimaryClick={handleMoveItem}
                    secondaryButtonText="Ignorer"
                    onSecondaryClick={() => {
                        dispatch({ type: 'UPDATE_AUDIT_SESSION_SCAN', payload: { sessionId: session.id, unexpectedItem: { assetTag: modalInfo.data.assetTag, modelName: modalInfo.data.model?.name, originalLocation: getCurrentLocationString(modalInfo.data) } } });
                        setModalInfo(null);
                    }}
                >
                    Cet équipement ({modalInfo.data.model.name}) est enregistré à l'emplacement "{getCurrentLocationString(modalInfo.data)}". Voulez-vous le déplacer vers "{locationString}"?
                </AuditItemModal>
            )}
            {modalInfo?.type === 'new' && (
                 <AuditItemModal
                    isOpen={true}
                    onClose={() => setModalInfo(null)}
                    title="Nouvel équipement trouvé"
                    icon="add_circle"
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                    primaryButtonText="Oui, ajouter maintenant"
                    onPrimaryClick={handleAddNewItem}
                    secondaryButtonText="Ignorer pour l'instant"
                    onSecondaryClick={() => setModalInfo(null)}
                >
                    L'équipement avec le numéro de série "{modalInfo.data.serialNumber}" n'a pas été trouvé dans l'inventaire. Voulez-vous l'ajouter ?
                </AuditItemModal>
            )}
             <ConfirmationModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleCancelAudit}
                title="Annuler l'audit"
                confirmButtonText="Oui, annuler"
            >
                <p>Êtes-vous sûr de vouloir annuler cet audit ? Toute la progression sera perdue.</p>
            </ConfirmationModal>
        </div>
    );
};

export default AuditSession;