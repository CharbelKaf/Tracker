import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import type { AuditSession, Equipment, Country, Site, Department, User } from '../types';
import PageHeader from './PageHeader';
import { useTheme } from '../contexts/ThemeContext';
import Button from './ui/Button';

interface AuditOverviewProps {
    auditSessions: AuditSession[];
    equipment: Equipment[];
    countries: Country[];
    sites: Site[];
    departments: Department[];
    users: User[];
}

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string; id?: string }> = ({ title, children, className = '', id }) => (
    <motion.section
        id={id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`surface-card surface-card-gradient rounded-3xl p-6 border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-2)] flex flex-col ${className}`}
    >
        <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-50">{title}</h2>
        </div>
        <div className="flex-1 w-full min-h-0">
            {children}
        </div>
    </motion.section>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                <p className="label font-bold text-gray-800 dark:text-gray-100">{`${label}`}</p>
                {payload.map((pld: any, index: number) => (
                    <p key={index} style={{ color: pld.fill }}>
                        {`${pld.name}: ${pld.value.toFixed(0)}${pld.unit || ''}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};


const metricAccents: Record<'primary' | 'info' | 'success' | 'warning', { border: string; cardBg: string; iconText: string }> = {
    primary: {
        border: 'border-primary-200/60 dark:border-primary-700/50',
        cardBg: 'bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-900/25 dark:via-secondary-900/40 dark:to-secondary-900/20',
        iconText: 'text-primary-700 dark:text-primary-200',
    },
    info: {
        border: 'border-secondary-200/60 dark:border-secondary-700/60',
        cardBg: 'bg-gradient-to-br from-secondary-50/70 via-white to-white dark:from-secondary-900/25 dark:via-secondary-900/45 dark:to-secondary-900/25',
        iconText: 'text-secondary-700 dark:text-secondary-200',
    },
    success: {
        border: 'border-status-success-200/60 dark:border-status-success-700/60',
        cardBg: 'bg-gradient-to-br from-status-success-50/70 via-white to-white dark:from-status-success-900/25 dark:via-secondary-900/40 dark:to-secondary-900/25',
        iconText: 'text-status-success-700 dark:text-status-success-200',
    },
    warning: {
        border: 'border-status-warning-200/60 dark:border-status-warning-700/50',
        cardBg: 'bg-gradient-to-br from-status-warning-50/70 via-white to-white dark:from-status-warning-900/25 dark:via-secondary-900/40 dark:to-secondary-900/25',
        iconText: 'text-status-warning-700 dark:text-status-warning-200',
    },
};

const SummaryMetric: React.FC<{ label: string; value: string; description: string; accent: keyof typeof metricAccents; icon: string }> = ({ label, value, description, accent, icon }) => {
    const styles = metricAccents[accent];
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`surface-card rounded-2xl p-5 border ${styles.border} ${styles.cardBg} shadow-[var(--shadow-elev-1)]`}
        >
            <div className="flex items-center gap-4">
                <span className={`material-symbols-outlined text-3xl ${styles.iconText}`}>{icon}</span>
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-300">{label}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-50">{value}</p>
                    <p className="text-xs text-secondary-600 dark:text-secondary-300">{description}</p>
                </div>
            </div>
        </motion.div>
    );
};

const OverviewQuickCard: React.FC<{ title: string; description: string; icon: string; onClick: () => void }> = ({ title, description, icon, onClick }) => (
    <motion.button
        type="button"
        onClick={onClick}
        className="surface-card surface-card-gradient w-full text-left rounded-2xl border border-transparent px-5 py-4 shadow-[var(--shadow-elev-1)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-elev-2)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        whileTap={{ scale: 0.98 }}
    >
        <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl text-secondary-600 dark:text-secondary-400">{icon}</span>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{title}</p>
                <p className="text-xs text-secondary-600 dark:text-secondary-300 leading-snug">{description}</p>
            </div>
        </div>
    </motion.button>
);


export const AuditOverview: React.FC<AuditOverviewProps> = ({ auditSessions, equipment, countries, sites, departments, users }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const tickColor = isDark ? '#9ca3af' : '#4b5563'; // gray-400 vs gray-600
    const gridColor = isDark ? '#374151' : '#e5e7eb'; // gray-700 vs gray-200

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
        const totalEquipmentCount = equipment.length;
        let totalScannedCount = 0;
        let activeSessionsCount = 0;
        let pausedSessionsCount = 0;
        let completedSessionsCount = 0;
        let totalUnexpectedItems = 0;

        auditSessions.forEach(session => {
            totalUnexpectedItems += session.unexpectedItems?.length ?? 0;
            switch (session.status) {
                case 'in-progress':
                    activeSessionsCount += 1;
                    break;
                case 'paused':
                    pausedSessionsCount += 1;
                    break;
                case 'completed':
                    completedSessionsCount += 1;
                    break;
                default:
                    break;
            }
        });

        latestSessionByDept.forEach(session => {
            if (session.status === 'completed') {
                const deptTotal = equipment.filter(e => e.departmentId === session.departmentId).length;
                totalScannedCount += deptTotal;
            } else {
                totalScannedCount += session.scannedItemIds.length;
            }
        });

        const overallProgress = totalEquipmentCount > 0 ? (totalScannedCount / totalEquipmentCount) * 100 : 0;

        const countryProgress = countries.map(country => {
            const countrySites = sites.filter(s => s.countryId === country.id);
            const countryDepts = departments.filter(d => countrySites.some(s => s.id === d.siteId));
            const countryEquipment = equipment.filter(e => countryDepts.some(d => d.id === e.departmentId));
            const total = countryEquipment.length;
            if (total === 0) return { name: country.name, progress: 0 };

            let scanned = 0;
            const processedDepts = new Set<string>();
            countryDepts.forEach(dept => {
                if (!processedDepts.has(dept.id)) {
                    const session = latestSessionByDept.get(dept.id);
                    if (session?.status === 'completed') {
                        const totalInDept = equipment.filter(e => e.departmentId === dept.id).length;
                        scanned += totalInDept;
                    } else {
                        scanned += session ? session.scannedItemIds.length : 0;
                    }
                    processedDepts.add(dept.id);
                }
            });

            return { name: country.name, progress: (scanned / total) * 100 };
        }).filter(c => c.progress >= 0 && countries.some(co => co.name === c.name));

        const auditStatusData = Array.from(latestSessionByDept.values()).reduce((acc: { name: string; value: number }[], session: AuditSession) => {
            let status: string;
            switch (session.status) {
                case 'in-progress':
                    status = 'En cours';
                    break;
                case 'paused':
                    status = 'En pause';
                    break;
                case 'completed':
                    status = 'Terminé';
                    break;
                default:
                    status = 'Inconnu';
            }
            const existing = acc.find(item => item.name === status);
            if (existing) {
                existing.value += 1;
            } else {
                acc.push({ name: status, value: 1 });
            }
            return acc;
        }, [] as { name: string; value: number }[]);

        const completedSessions = Array.from(latestSessionByDept.values()).filter((s: AuditSession) => s.status === 'completed');
        const findingsData = completedSessions.slice(-5).map((session: AuditSession) => {
            const department = departments.find(d => d.id === session.departmentId);
            const totalInDept = equipment.filter(e => e.departmentId === session.departmentId).length;
            const confirmed = session.scannedItemIds.length;
            const unexpected = session.unexpectedItems.length;
            const missing = totalInDept - confirmed;
            return {
                name: department?.name || 'Unknown',
                Confirmés: confirmed,
                Manquants: missing < 0 ? 0 : missing,
                Inattendus: unexpected,
            };
        });

        return {
            overallProgress,
            countryProgress,
            auditStatusData,
            findingsData,
            totalEquipmentCount,
            totalScannedCount,
            activeSessionsCount,
            pausedSessionsCount,
            completedSessionsCount,
            totalUnexpectedItems,
        };

    }, [latestSessionByDept, equipment, countries, sites, departments, auditSessions]);

    const {
        overallProgress,
        countryProgress,
        auditStatusData,
        findingsData,
        totalEquipmentCount,
        totalScannedCount,
        activeSessionsCount,
        pausedSessionsCount,
        completedSessionsCount,
        totalUnexpectedItems,
    } = progressData;

    const formatNumber = (value: number) => new Intl.NumberFormat('fr-FR').format(value);

    const COLORS = ['#3b82f6', '#f97316', '#22c55e', '#eab308'];

    const overallProgressData = [{ name: 'Progress', value: overallProgress }];

    const quickCards = [
        {
            title: 'Progression globale',
            description: `${overallProgress.toFixed(0)}% des équipements scannés`,
            icon: 'donut_large',
            onClick: () => document.getElementById('chart-global')?.scrollIntoView({ behavior: 'smooth' }),
        },
        {
            title: 'Progression par pays',
            description: `${countryProgress.length} pays suivis`,
            icon: 'travel_explore',
            onClick: () => document.getElementById('chart-country')?.scrollIntoView({ behavior: 'smooth' }),
        },
        {
            title: 'Statut des audits',
            description: `${activeSessionsCount + pausedSessionsCount + completedSessionsCount} sessions actives`,
            icon: 'progress_activity',
            onClick: () => document.getElementById('chart-status')?.scrollIntoView({ behavior: 'smooth' }),
        },
        {
            title: 'Derniers résultats',
            description: `${Math.min(findingsData.length, 5)} derniers services analysés`,
            icon: 'insights',
            onClick: () => document.getElementById('chart-latest')?.scrollIntoView({ behavior: 'smooth' }),
        },
    ];

    return (
        <div className="flex flex-col h-full bg-secondary-50 dark:bg-[#0f1722]">
            <PageHeader title="Aperçu des audits" onBack={() => window.location.hash = '#/audit'}>
                <Button
                    variant="secondary"
                    size="sm"
                    icon="file_download"
                    onClick={() => window.print()}
                >
                    Exporter
                </Button>
            </PageHeader>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="surface-card surface-card-gradient rounded-3xl p-8 md:p-10 border border-white/60 dark:border-white/10 shadow-[var(--shadow-elev-2)]"
                >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-5">
                            <span className="material-symbols-outlined text-6xl text-secondary-600 dark:text-secondary-400">dashboard</span>
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wider text-secondary-600 dark:text-secondary-400 mb-2">Tableau de bord</p>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight leading-tight">Vue d'ensemble des audits</h1>
                                <p className="mt-3 text-sm leading-relaxed text-secondary-700 dark:text-secondary-300 max-w-2xl">
                                    Surveillez la santé de vos campagnes d'audit, identifiez les zones à risque et partagez facilement des rapports synthétiques avec vos équipes.
                                </p>
                            </div>
                        </div>
                        <div className="grid w-full max-w-md gap-3 sm:grid-cols-2">
                            <SummaryMetric
                                label="Taux de complétion"
                                value={`${overallProgress.toFixed(0)}%`}
                                description={`${formatNumber(totalScannedCount)} / ${formatNumber(totalEquipmentCount)} équipements scannés`}
                                accent="primary"
                                icon="donut_small"
                            />
                            <SummaryMetric
                                label="Sessions actives"
                                value={`${activeSessionsCount}`}
                                description={`+ ${pausedSessionsCount} en pause`}
                                accent="info"
                                icon="play_circle"
                            />
                            <SummaryMetric
                                label="Sessions terminées"
                                value={`${completedSessionsCount}`}
                                description="30 derniers jours"
                                accent="success"
                                icon="verified"
                            />
                            <SummaryMetric
                                label="Anomalies signalées"
                                value={`${totalUnexpectedItems}`}
                                description="Équipements inattendus détectés"
                                accent="warning"
                                icon="warning_amber"
                            />
                        </div>
                    </div>
                </motion.section>

                <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {quickCards.map(card => (
                        <OverviewQuickCard key={card.title} {...card} />
                    ))}
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                    <ChartCard title="Progression globale" className="min-h-[360px]" id="chart-global">
                        {totalEquipmentCount === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-6xl text-secondary-400 dark:text-secondary-600 mb-4">insights</span>
                                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Aucun équipement à auditer</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    innerRadius="68%"
                                    outerRadius="100%"
                                    data={overallProgressData}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    <RadialBar dataKey="value" cornerRadius={14} background fill={COLORS[0]} />
                                    <text
                                        x="50%"
                                        y="50%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-4xl font-semibold fill-current text-gray-900 dark:text-gray-100"
                                    >
                                        {`${overallProgress.toFixed(0)}%`}
                                    </text>
                                    <Tooltip content={<CustomTooltip />} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                    <ChartCard title="Progression par pays" className="min-h-[360px]" id="chart-country">
                        {countryProgress.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-6xl text-secondary-400 dark:text-secondary-600 mb-4">travel_explore</span>
                                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Aucun pays configuré</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={countryProgress} layout="vertical" margin={{ top: 10, right: 24, left: 24, bottom: 10 }}>
                                    <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
                                    <XAxis type="number" domain={[0, 100]} tick={{ fill: tickColor }} unit="%" />
                                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: tickColor }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
                                    <Bar dataKey="progress" name="Progression" fill={COLORS[0]} background={{ fill: isDark ? '#1f2937' : '#e5e7eb' }} radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <ChartCard title="Statut des audits" className="min-h-[360px]" id="chart-status">
                        {auditStatusData.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-6xl text-secondary-400 dark:text-secondary-600 mb-4">progress_activity</span>
                                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Aucune session d'audit</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={auditStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={110}
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {auditStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                    <ChartCard title="Derniers résultats d'audit" className="min-h-[360px]" id="chart-latest">
                        {findingsData.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-6xl text-secondary-400 dark:text-secondary-600 mb-4">insights</span>
                                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Aucun audit terminé</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={findingsData} margin={{ top: 10, right: 24, left: -4, bottom: 10 }}>
                                    <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
                                    <XAxis dataKey="name" tick={{ fill: tickColor }} />
                                    <YAxis tick={{ fill: tickColor }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="Confirmés" stackId="a" fill={COLORS[2]} radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="Manquants" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="Inattendus" fill={COLORS[1]} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </div>
            </main>
        </div>
    );
};
