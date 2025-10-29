

import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Equipment, User, Site, Department, AuditSession, Country } from '../types';
import PageHeader from './PageHeader';
import Button from './ui/Button';

interface SelectAuditLocationProps {
    equipment: Equipment[];
    currentUser: User;
    sites: Site[];
    departments: Department[];
    countries: Country[];
    auditSessions: AuditSession[];
    dispatch: React.Dispatch<any>;
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
    <div className="w-full h-2 rounded-full bg-secondary-200/70 dark:bg-secondary-900/40">
        <div
            className="h-2 rounded-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 transition-[width] duration-300 ease-in-out"
            style={{ width: `${Math.min(value, 100)}%` }}
        ></div>
    </div>
);

const getStatusBadge = (status?: AuditSession['status']) => {
    if (!status) return null;
    const commonClasses = "inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold px-2 py-0.5 rounded-full";
    switch (status) {
        case 'in-progress': return <span className={`bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ${commonClasses}`}>En cours</span>;
        case 'paused': return <span className={`bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 ${commonClasses}`}>En pause</span>;
        case 'completed': return <span className={`bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 ${commonClasses}`}>Terminé</span>;
        default: return null;
    }
};

const SelectAuditLocation: React.FC<SelectAuditLocationProps> = ({ equipment, currentUser, sites, departments, countries, auditSessions, dispatch }) => {
    const [activeCountryId, setActiveCountryId] = useState<string | null>(null);
    const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
    const [navigatingToDept, setNavigatingToDept] = useState<string | null>(null);

    useEffect(() => {
        if (navigatingToDept) {
            const newSession = auditSessions.find(s => s.departmentId === navigatingToDept && s.status === 'in-progress');
            if (newSession) {
                window.location.hash = `#/audit/session/${newSession.id}`;
                setNavigatingToDept(null);
            }
        }
    }, [auditSessions, navigatingToDept]);

    const sortedCountries = useMemo(() => [...countries].sort((a, b) => a.name.localeCompare(b.name)), [countries]);

    const sitesByCountry = useMemo(() => {
        const map = new Map<string, Site[]>();
        sites.forEach(site => {
            const list = map.get(site.countryId) ?? [];
            list.push(site);
            map.set(site.countryId, list);
        });
        map.forEach(list => list.sort((a, b) => a.name.localeCompare(b.name)));
        return map;
    }, [sites]);

    const departmentsBySite = useMemo(() => {
        const map = new Map<string, Department[]>();
        departments.forEach(dept => {
            const list = map.get(dept.siteId) ?? [];
            list.push(dept);
            map.set(dept.siteId, list);
        });
        map.forEach(list => list.sort((a, b) => a.name.localeCompare(b.name)));
        return map;
    }, [departments]);

    useEffect(() => {
        if (sortedCountries.length === 0) {
            if (activeCountryId !== null) setActiveCountryId(null);
            if (activeSiteId !== null) setActiveSiteId(null);
            return;
        }

        if (!activeCountryId || !sortedCountries.some(country => country.id === activeCountryId)) {
            setActiveCountryId(sortedCountries[0].id);
            return;
        }

        const countrySites = sitesByCountry.get(activeCountryId) ?? [];
        if (countrySites.length === 0) {
            if (activeSiteId !== null) setActiveSiteId(null);
            return;
        }

        if (!activeSiteId || !countrySites.some(site => site.id === activeSiteId)) {
            setActiveSiteId(countrySites[0].id);
        }
    }, [sortedCountries, sitesByCountry, activeCountryId, activeSiteId]);

    const latestSessionByDept = useMemo(() => {
        const map = new Map<string, AuditSession>();
        auditSessions
            .filter(s => s.status !== 'cancelled')
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .forEach(session => {
                if (!map.has(session.departmentId)) {
                    map.set(session.departmentId, session);
                }
            });
        return map;
    }, [auditSessions]);

    const progressData = useMemo(() => {
        const deptProgress: Record<string, { progress: number; session?: AuditSession; scannedCount: number; totalItems: number }> = {};
        departments.forEach(dept => {
            const session = latestSessionByDept.get(dept.id);
            const totalItems = equipment.filter(e => e.departmentId === dept.id).length;
            if (totalItems === 0) {
                const scannedCount = session ? session.scannedItemIds.length : 0;
                deptProgress[dept.id] = { progress: session?.status === 'completed' ? 100 : 0, session, scannedCount, totalItems };
                return;
            }
            if (session?.status === 'completed') {
                deptProgress[dept.id] = { progress: 100, session, scannedCount: totalItems, totalItems };
                return;
            }
            const scannedCount = session ? session.scannedItemIds.length : 0;
            deptProgress[dept.id] = { progress: (scannedCount / totalItems) * 100, session, scannedCount, totalItems };
        });
        
        const siteProgress: Record<string, { progress: number; itemCount: number; totalScanned: number }> = {};
        sites.forEach(site => {
            const siteDepts = departments.filter(d => d.siteId === site.id);
            const totalItems = equipment.filter(e => e.siteId === site.id).length;
            const totalScanned = siteDepts.reduce((sum, dept) => {
                const session = latestSessionByDept.get(dept.id);
                return sum + (session ? session.scannedItemIds.length : 0);
            }, 0);
            siteProgress[site.id] = { progress: totalItems > 0 ? (totalScanned / totalItems) * 100 : 0, itemCount: totalItems, totalScanned };
        });

        const countryProgress: Record<string, { progress: number; itemCount: number; totalScanned: number }> = {};
        countries.forEach(country => {
            const countrySites = sites.filter(s => s.countryId === country.id);
            const totalItems = countrySites.reduce((sum, site) => sum + (siteProgress[site.id]?.itemCount || 0), 0);
            const totalScanned = countrySites.reduce((sum, site) => {
                 const siteDepts = departments.filter(d => d.siteId === site.id);
                 return sum + siteDepts.reduce((deptSum, dept) => {
                     const session = latestSessionByDept.get(dept.id);
                     return deptSum + (session ? session.scannedItemIds.length : 0);
                 }, 0);
            }, 0);
             countryProgress[country.id] = { progress: totalItems > 0 ? (totalScanned / totalItems) * 100 : 0, itemCount: totalItems, totalScanned };
        });
        
        return { deptProgress, siteProgress, countryProgress };
    }, [latestSessionByDept, equipment, sites, departments, countries]);

    const heroMetrics = useMemo(() => {
        const deptEntries = Object.values(progressData.deptProgress);
        const scanned = deptEntries.reduce((sum, entry) => sum + Math.min(entry.scannedCount, entry.totalItems), 0);
        const total = equipment.length;
        const completion = total > 0 ? (scanned / total) * 100 : 0;
        const activeSessionsCount = auditSessions.filter(s => s.status === 'in-progress' || s.status === 'paused').length;
        const completedSessionsCount = auditSessions.filter(s => s.status === 'completed').length;
        return {
            totalEquipment: total,
            scannedEquipment: scanned,
            completionRate: completion,
            activeSessionsCount,
            completedSessionsCount,
        };
    }, [progressData, equipment, auditSessions]);

    const countrySites = activeCountryId ? (sitesByCountry.get(activeCountryId) ?? []) : [];
    const activeSite = activeSiteId ? countrySites.find(site => site.id === activeSiteId) ?? null : null;
    const resolvedActiveSite = activeSite ?? (countrySites[0] ?? null);
    const siteDepartments = resolvedActiveSite ? (departmentsBySite.get(resolvedActiveSite.id) ?? []) : [];
    const siteData = resolvedActiveSite ? progressData.siteProgress[resolvedActiveSite.id] : undefined;
    const countryData = activeCountryId ? progressData.countryProgress[activeCountryId] : undefined;

    const handleAction = (departmentId: string) => {
        const session = latestSessionByDept.get(departmentId);
        if (session && (session.status === 'in-progress' || session.status === 'paused')) {
            dispatch({ type: 'START_AUDIT_SESSION', payload: { departmentId, userId: currentUser.id } });
            window.location.hash = `#/audit/session/${session.id}`;
        } else if (session && session.status === 'completed') {
            window.location.hash = `#/audit/report/${session.id}`;
        } else { // No active session, start a new one
            dispatch({ type: 'START_AUDIT_SESSION', payload: { departmentId, userId: currentUser.id } });
            setNavigatingToDept(departmentId);
        }
    };

    const renderDepartmentActionLabel = (sessionStatus?: AuditSession['status']) => {
        if (sessionStatus === 'in-progress' || sessionStatus === 'paused') return 'Continuer';
        if (sessionStatus === 'completed') return 'Rapport';
        return 'Commencer';
    };

    return (
        <div className="flex flex-col h-full bg-secondary-50 dark:bg-[#0f1722]">
            <PageHeader title="Lancer un audit" />
            <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="surface-card surface-card-gradient rounded-3xl p-8 md:p-10 border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-2)]"
                >
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-5">
                            <span className="material-symbols-outlined text-6xl text-primary-600 dark:text-primary-400">event_available</span>
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-2">Préparer vos audits</p>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight leading-tight">Suivez la progression des campagnes d'audit</h2>
                                <p className="mt-3 text-sm leading-relaxed text-secondary-700 dark:text-secondary-300 max-w-2xl">
                                    Explorez vos pays, sites et services pour lancer rapidement un audit, reprendre une session en cours
                                    ou consulter les rapports finalisés.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:items-end sm:justify-end sm:w-72">
                            <Button
                                variant="primary"
                                icon="play_arrow"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                    if (resolvedActiveSite) {
                                        const siteDepts = departmentsBySite.get(resolvedActiveSite.id) ?? [];
                                        const targetDept = siteDepts[0];
                                        if (targetDept) handleAction(targetDept.id);
                                    }
                                }}
                            >
                                Démarrer un audit
                            </Button>
                            <Button
                                variant="secondary"
                                icon="monitoring"
                                className="w-full sm:w-auto"
                                onClick={() => window.location.hash = '#/audit/overview'}
                            >
                                Aperçu
                            </Button>
                        </div>
                    </div>
                    <div className="mt-8 grid gap-4 md:grid-cols-4">
                        <div className="rounded-2xl border border-white/40 dark:border-white/5 bg-gradient-to-br from-white/80 to-white/50 dark:from-secondary-900/40 dark:to-secondary-900/20 backdrop-blur-sm px-5 py-4 shadow-[var(--shadow-elev-1)] transition-all duration-300 hover:shadow-[var(--shadow-elev-2)] hover:-translate-y-0.5">
                            <p className="text-xs font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Progression globale</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-50">{heroMetrics.completionRate.toFixed(0)}%</p>
                            <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">Taux de couverture</p>
                        </div>
                        <div className="rounded-2xl border border-white/40 dark:border-white/5 bg-gradient-to-br from-white/80 to-white/50 dark:from-secondary-900/40 dark:to-secondary-900/20 backdrop-blur-sm px-5 py-4 shadow-[var(--shadow-elev-1)] transition-all duration-300 hover:shadow-[var(--shadow-elev-2)] hover:-translate-y-0.5">
                            <p className="text-xs font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Équipements scannés</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-50">{heroMetrics.scannedEquipment}</p>
                            <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">sur {heroMetrics.totalEquipment}</p>
                        </div>
                        <div className="rounded-2xl border border-white/40 dark:border-white/5 bg-gradient-to-br from-white/80 to-white/50 dark:from-secondary-900/40 dark:to-secondary-900/20 backdrop-blur-sm px-5 py-4 shadow-[var(--shadow-elev-1)] transition-all duration-300 hover:shadow-[var(--shadow-elev-2)] hover:-translate-y-0.5">
                            <p className="text-xs font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Sessions actives</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-50">{heroMetrics.activeSessionsCount}</p>
                            <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">En cours ou en pause</p>
                        </div>
                        <div className="rounded-2xl border border-white/40 dark:border-white/5 bg-gradient-to-br from-white/80 to-white/50 dark:from-secondary-900/40 dark:to-secondary-900/20 backdrop-blur-sm px-5 py-4 shadow-[var(--shadow-elev-1)] transition-all duration-300 hover:shadow-[var(--shadow-elev-2)] hover:-translate-y-0.5">
                            <p className="text-xs font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Rapports finalisés</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-50">{heroMetrics.completedSessionsCount}</p>
                            <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">Derniers 30 jours</p>
                        </div>
                    </div>
                </motion.section>

                <div className="flex flex-col gap-6 xl:flex-row">
                    <section className="xl:w-[320px] flex-shrink-0 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">Pays</h3>
                            <span className="text-xs text-secondary-500 dark:text-secondary-300">{sortedCountries.length}</span>
                        </div>
                        <div className="space-y-2">
                            {sortedCountries.length === 0 && (
                                <p className="text-sm text-secondary-500 dark:text-secondary-300 italic">Aucun pays disponible.</p>
                            )}
                            {sortedCountries.map(country => {
                                const countryProgress = progressData.countryProgress[country.id];
                                const isActive = country.id === activeCountryId;
                                return (
                                    <motion.button
                                        key={country.id}
                                        type="button"
                                        onClick={() => setActiveCountryId(country.id)}
                                        className={`surface-card surface-card-gradient w-full text-left rounded-2xl border px-4 py-4 transition-all ${isActive ? 'border-secondary-400/80 dark:border-secondary-600 bg-secondary-100/60 dark:bg-secondary-900/40 shadow-[var(--shadow-elev-2)]' : 'border-transparent hover:border-secondary-200/70 dark:hover:border-secondary-700/60'}`}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium uppercase text-secondary-500 dark:text-secondary-300">Pays</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">{country.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-secondary-500 dark:text-secondary-300">Sites</p>
                                                <p className="text-sm font-semibold text-secondary-600 dark:text-secondary-200">{sitesByCountry.get(country.id)?.length ?? 0}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            <ProgressBar value={countryProgress?.progress || 0} />
                                            <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-300">
                                                <span>{Math.round(countryProgress?.progress || 0)}% complété</span>
                                                <span>{countryProgress?.totalScanned || 0}/{countryProgress?.itemCount || 0}</span>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="flex-1 space-y-4">
                        <AnimatePresence mode="wait">
                            {activeCountryId ? (
                                <motion.div
                                    key={activeCountryId}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-5"
                                >
                                    <div className="surface-card surface-card-gradient rounded-3xl p-6 border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-1)]">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-secondary-600 dark:text-secondary-400">Sites</p>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mt-1">{resolvedActiveSite ? resolvedActiveSite.name : 'Sélectionnez un site'}</h3>
                                                {countryData && (
                                                    <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">
                                                        {Math.round(countryData.progress)}% de progression globale pour ce pays ({countryData.totalScanned}/{countryData.itemCount} équipements).
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                                                {countrySites.length === 0 && (
                                                    <span className="text-sm text-secondary-500 dark:text-secondary-300 italic">Aucun site enregistré.</span>
                                                )}
                                                {countrySites.map(site => {
                                                    const isSiteActive = (resolvedActiveSite?.id ?? activeSiteId) === site.id;
                                                    const data = progressData.siteProgress[site.id];
                                                    return (
                                                        <button
                                                            key={site.id}
                                                            type="button"
                                                            onClick={() => setActiveSiteId(site.id)}
                                                            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${isSiteActive ? 'border-primary-400 text-primary-700 dark:text-primary-200 bg-primary-50/70 dark:bg-primary-900/30' : 'border-secondary-200 text-secondary-600 hover:border-secondary-400 hover:text-secondary-800 dark:border-secondary-700 dark:text-secondary-200 dark:hover:border-secondary-500'}`}
                                                        >
                                                            {site.name} • {Math.round(data?.progress || 0)}%
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
                                        <motion.div
                                            key={resolvedActiveSite?.id || 'no-site'}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="surface-card surface-card-gradient rounded-3xl p-6 border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-1)]"
                                        >
                                            <div className="flex items-center justify-between mb-5">
                                                <h4 className="text-sm font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Services / Départements</h4>
                                                <span className="text-xs text-secondary-500 dark:text-secondary-300">{siteDepartments.length}</span>
                                            </div>
                                            <div className="space-y-3">
                                                {siteDepartments.length === 0 && (
                                                    <p className="text-sm text-secondary-500 dark:text-secondary-300 italic">Aucun service pour ce site.</p>
                                                )}
                                                {siteDepartments.map(dept => {
                                                    const deptData = progressData.deptProgress[dept.id];
                                                    const sessionStatus = deptData?.session?.status;
                                                    const actionLabel = renderDepartmentActionLabel(sessionStatus);
                                                    return (
                                                        <motion.div
                                                            key={dept.id}
                                                            layout
                                                            className="flex items-center gap-4 rounded-2xl border border-transparent bg-white/70 dark:bg-secondary-900/40 px-4 py-3 shadow-[var(--shadow-elev-1)] transition hover:border-secondary-200/70 dark:hover:border-secondary-700/60"
                                                            whileHover={{ y: -1 }}
                                                        >
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{dept.name}</p>
                                                                    <span className="text-xs text-secondary-500 dark:text-secondary-300">{Math.round(deptData?.progress || 0)}%</span>
                                                                </div>
                                                                <div className="mt-2 flex items-center gap-3">
                                                                    <div className="flex-1 min-w-[120px]"><ProgressBar value={deptData?.progress || 0} /></div>
                                                                    {getStatusBadge(sessionStatus)}
                                                                </div>
                                                                <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-300">
                                                                    {deptData?.scannedCount || 0}/{deptData?.totalItems || 0} équipements scannés
                                                                </p>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant={actionLabel === 'Rapport' ? 'ghost' : 'secondary'}
                                                                className={actionLabel === 'Rapport' ? 'border border-secondary-200 dark:border-secondary-700 bg-white/40 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-100 hover:bg-secondary-100/80 dark:hover:bg-secondary-800/60' : ''}
                                                                onClick={() => handleAction(dept.id)}
                                                            >
                                                                {actionLabel}
                                                            </Button>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>

                                        <motion.aside
                                            key={`summary-${resolvedActiveSite?.id || 'empty'}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25, delay: 0.05 }}
                                            className="surface-card surface-card-gradient rounded-3xl p-6 border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-1)] space-y-4"
                                        >
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-secondary-600 dark:text-secondary-400">Résumé du site</p>
                                                <h4 className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-50">{resolvedActiveSite ? resolvedActiveSite.name : 'Sélectionnez un site'}</h4>
                                                {siteData && (
                                                    <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">{Math.round(siteData.progress)}% complété • {siteData.totalScanned}/{siteData.itemCount} équipements.</p>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                <div className="rounded-2xl border border-white/40 dark:border-white/5 bg-white/60 dark:bg-secondary-900/30 px-4 py-4">
                                                    <p className="text-xs font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Services à auditer</p>
                                                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-50">{siteDepartments.length}</p>
                                                </div>
                                                <div className="rounded-2xl border border-white/40 dark:border-white/5 bg-white/60 dark:bg-secondary-900/30 px-4 py-4">
                                                    <p className="text-xs font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Sessions actives</p>
                                                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-50">{siteDepartments.filter(dept => {
                                                        const session = progressData.deptProgress[dept.id]?.session;
                                                        return session && (session.status === 'in-progress' || session.status === 'paused');
                                                    }).length}</p>
                                                </div>
                                            </div>
                                            <Button
                                                block
                                                variant="primary"
                                                icon="bolt"
                                                onClick={() => {
                                                    const pendingDept = siteDepartments.find(dept => {
                                                        const session = progressData.deptProgress[dept.id]?.session;
                                                        return !session || session.status !== 'completed';
                                                    }) || siteDepartments[0];
                                                    if (pendingDept) handleAction(pendingDept.id);
                                                }}
                                                disabled={!siteDepartments.length}
                                            >
                                                Lancer l'action prioritaire
                                            </Button>
                                        </motion.aside>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    className="surface-card rounded-3xl p-6 text-center text-secondary-600 dark:text-secondary-300"
                                >
                                    Sélectionnez un pays pour visualiser ses sites et services.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default SelectAuditLocation;