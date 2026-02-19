
import React, { useState, useMemo } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { formatCurrency, calculateLinearDepreciation } from '../../../lib/financial';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import Badge from '../../../components/ui/Badge';
import { cn } from '../../../lib/utils';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { AddBudgetModal } from '../components/AddBudgetModal';
import { PageTabs, TabItem } from '../../../components/ui/PageTabs';
import SelectField from '../../../components/ui/SelectField';
import SideSheet from '../../../components/ui/SideSheet';
import Tooltip from '../../../components/ui/Tooltip';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

// --- MOCK DATA ---

const MOCK_LOCATION_VALUE = [
    { country: 'France', value: 85000, percent: 55, color: 'var(--md-sys-color-primary)' },
    { country: 'Sénégal', value: 42000, percent: 28, color: 'var(--md-sys-color-secondary)' },
    { country: 'Togo', value: 25000, percent: 17, color: 'var(--md-sys-color-tertiary)' },
];

const MOCK_EXPENSES = [
    { id: 1, date: '2024-01-15', supplier: 'Dell Technologies', amount: 12500, type: 'Purchase', status: 'Paid', desc: 'Renouvellement Laptops Marketing' },
    { id: 2, date: '2024-01-20', supplier: 'Microsoft Azure', amount: 450, type: 'Cloud', status: 'Recurring', desc: 'Hosting Mensuel' },
    { id: 3, date: '2024-02-01', supplier: 'Orange Business', amount: 890, type: 'Service', status: 'Pending', desc: 'Fibre Optique HQ' },
    { id: 4, date: '2024-02-10', supplier: 'Adobe Creative Cloud', amount: 2400, type: 'License', status: 'Paid', desc: 'Licences Annuelles' },
    { id: 5, date: '2024-02-15', supplier: 'Amazon Web Services', amount: 1200, type: 'Cloud', status: 'Paid', desc: 'Serveurs Prod' },
];

type FinanceExpense = (typeof MOCK_EXPENSES)[number];

// Structure Budget Historique
const MOCK_BUDGET_HISTORY = [
    {
        year: 2026,
        status: 'En cours',
        totalAllocated: 150000,
        items: [
            { category: 'Matériel IT', type: 'Purchase', allocated: 85000, spent: 12500 },
            { category: 'Licences Logiciel', type: 'License', allocated: 35000, spent: 2400 },
            { category: 'Cloud Infrastructure', type: 'Cloud', allocated: 20000, spent: 1650 },
            { category: 'Maintenance & Services', type: 'Service', allocated: 10000, spent: 890 }
        ]
    },
    {
        year: 2025,
        status: 'Clôturé',
        totalAllocated: 142000,
        items: [
            { category: 'Matériel IT', type: 'Purchase', allocated: 80000, spent: 79500 },
            { category: 'Licences Logiciel', type: 'License', allocated: 32000, spent: 31000 },
            { category: 'Cloud Infrastructure', type: 'Cloud', allocated: 18000, spent: 19500 },
            { category: 'Maintenance & Services', type: 'Service', allocated: 12000, spent: 11000 }
        ]
    },
    {
        year: 2024,
        status: 'Archivé',
        totalAllocated: 130000,
        items: [
            { category: 'Matériel IT', type: 'Purchase', allocated: 75000, spent: 74000 },
            { category: 'Licences Logiciel', type: 'License', allocated: 30000, spent: 29000 },
            { category: 'Cloud Infrastructure', type: 'Cloud', allocated: 15000, spent: 14500 },
            { category: 'Maintenance & Services', type: 'Service', allocated: 10000, spent: 9000 }
        ]
    }
];

// Fonction simple simulant une classification IA
const classifyBudgetLine = (category: string, amount: number): 'CAPEX' | 'OPEX' => {
    const lowerCat = category.toLowerCase();
    // Règles heuristiques "IA"
    if (lowerCat.includes('matériel') || lowerCat.includes('hardware') || lowerCat.includes('serveur')) return 'CAPEX';
    if (lowerCat.includes('licence') || lowerCat.includes('cloud') || lowerCat.includes('maintenance') || lowerCat.includes('service')) return 'OPEX';

    // Fallback basÃ© sur le montant (Investissement lourd vs Frais courants)
    return amount > 5000 ? 'CAPEX' : 'OPEX';
};

const FinanceManagementPage = () => {
    const { equipment, settings } = useData();
    const { showToast } = useToast();
    const [activeView, setActiveView] = useState<'overview' | 'expenses' | 'budget'>('overview');
    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<FinanceExpense | null>(null);
    const isCompact = useMediaQuery('(max-width: 599px)');

    // Budget State
    const [selectedYear, setSelectedYear] = useState(2026);

    // --- ANALYSE FINANCIÃˆRE ---
    const stats = useMemo(() => {
        let purchase = 0;
        let current = 0;
        let monthlyDep = 0;
        let criticalRenew = 0;

        equipment.forEach(item => {
            if (item.financial) {
                const dep = calculateLinearDepreciation(
                    item.financial.purchasePrice,
                    item.financial.purchaseDate,
                    item.financial.depreciationYears,
                    item.financial.purchasePrice > 0 ? ((item.financial.salvageValue || 0) / item.financial.purchasePrice) * 100 : 0
                );
                purchase += item.financial.purchasePrice;
                current += dep.currentValue;
                monthlyDep += dep.monthlyDepreciation;
                if (dep.progressPercent >= 85) criticalRenew++;
            }
        });

        return {
            purchase, current, monthlyDep, criticalRenew,
            efficiency: purchase > 0 ? (current / purchase) * 100 : 0
        };
    }, [equipment]);

    // Budget Logic
    const currentBudget = useMemo(() => {
        return MOCK_BUDGET_HISTORY.find(b => b.year === selectedYear) || MOCK_BUDGET_HISTORY[0];
    }, [selectedYear]);

    const budgetStats = useMemo(() => {
        const totalSpent = currentBudget.items.reduce((acc, item) => acc + item.spent, 0);
        const totalAllocated = currentBudget.totalAllocated;
        const remaining = totalAllocated - totalSpent;
        const percent = (totalSpent / totalAllocated) * 100;
        return { totalSpent, totalAllocated, remaining, percent };
    }, [currentBudget]);

    const spentPercent = Math.min(Math.max(budgetStats.percent, 0), 100);
    const remainingPercent = Math.max(0, 100 - spentPercent);

    // DonnÃ©es pour le graphique d'aire (Projection)
    const projectionSteps = [
        { m: 'Jan', val: stats.current },
        { m: 'Fév', val: stats.current - stats.monthlyDep },
        { m: 'Mar', val: stats.current - (stats.monthlyDep * 2) },
        { m: 'Avr', val: stats.current - (stats.monthlyDep * 3) },
        { m: 'Mai', val: stats.current - (stats.monthlyDep * 4) },
        { m: 'Juin', val: stats.current - (stats.monthlyDep * 5) },
    ];
    const maxProj = Math.max(...projectionSteps.map(s => s.val));

    const tabs: TabItem[] = [
        { id: 'overview', label: isCompact ? 'Synthèse' : 'Synthèse Globale', icon: <MaterialIcon name="dashboard" size={20} /> },
        { id: 'expenses', label: isCompact ? 'Journal' : 'Journal Dépenses', icon: <MaterialIcon name="receipt_long" size={20} /> },
        { id: 'budget', label: isCompact ? 'Pilotage' : 'Pilotage Budget', icon: <MaterialIcon name="calculate" size={20} /> }
    ];

    return (
        <div className="flex flex-col h-full bg-surface-background">
            <AddExpenseModal isOpen={isAddExpenseModalOpen} onClose={() => setIsAddExpenseModalOpen(false)} />
            <AddBudgetModal isOpen={isAddBudgetModalOpen} onClose={() => setIsAddBudgetModalOpen(false)} />
            <SideSheet
                open={!!selectedExpense}
                onClose={() => setSelectedExpense(null)}
                title={selectedExpense ? `Dépense #${selectedExpense.id}` : 'Détail de dépense'}
                description="Vérification rapide d'une ligne du journal des dépenses."
                width="standard"
                footer={selectedExpense ? (
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="outlined" onClick={() => setSelectedExpense(null)}>
                            Fermer
                        </Button>
                        <Button
                            variant="filled"
                            onClick={() => {
                                showToast('Dépense marquée comme vérifiée.', 'success');
                                setSelectedExpense(null);
                            }}
                        >
                            Marquer vérifiée
                        </Button>
                    </div>
                ) : undefined}
            >
                {selectedExpense && (
                    <div className="space-y-6">
                        <div className="rounded-md border border-outline-variant bg-surface-container-low p-4">
                            <p className="text-label-small uppercase tracking-widest text-on-surface-variant mb-2">Description</p>
                            <p className="text-body-medium text-on-surface">{selectedExpense.desc}</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-body-small text-on-surface-variant">Fournisseur</span>
                                <span className="text-label-large text-on-surface">{selectedExpense.supplier}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-body-small text-on-surface-variant">Date</span>
                                <span className="text-label-large text-on-surface">{selectedExpense.date}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-body-small text-on-surface-variant">Type</span>
                                <span className="text-label-large text-on-surface">{selectedExpense.type}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-body-small text-on-surface-variant">Montant</span>
                                <span className="text-title-medium text-on-surface">{formatCurrency(selectedExpense.amount, settings.currency)}</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-outline-variant">
                            <p className="text-label-small uppercase tracking-widest text-on-surface-variant mb-3">Statut</p>
                            <Badge
                                variant={
                                    selectedExpense.status === 'Paid'
                                        ? 'success'
                                        : selectedExpense.status === 'Pending'
                                            ? 'warning'
                                            : 'info'
                                }
                            >
                                {selectedExpense.status}
                            </Badge>
                        </div>
                    </div>
                )}
            </SideSheet>

            {/* HEADER SECTION */}
            <div className="bg-surface border-b border-outline-variant pt-page-sm medium:pt-page pb-0 px-0 sticky top-0 z-20">
                <div className="px-page-sm medium:px-page mb-6">
                    <PageHeader
                        sticky={false}
                        title={
                            activeView === 'overview' ? "Tableau de Bord Financier" :
                                activeView === 'expenses' ? "Suivi des Dépenses" : "Budget & Prévisions"
                        }
                        subtitle="Optimisation du ROI et pilotage des coûts."
                        breadcrumb="FINANCE"
                        actions={
                            !isCompact && activeView === 'budget' && (
                                <div className="flex items-center gap-3">
                                    <div className="w-52">
                                        <SelectField
                                            name="finance-year"
                                            value={selectedYear.toString()}
                                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                                            options={MOCK_BUDGET_HISTORY.map((budget) => ({
                                                value: budget.year.toString(),
                                                label: `${budget.year} (${budget.status})`,
                                            }))}
                                            placeholder="Choisir un exercice"
                                            className="!space-y-0"
                                        />
                                    </div>
                                    <Button
                                        variant="filled"
                                        icon={<MaterialIcon name="add" size={18} />}
                                        onClick={() => setIsAddBudgetModalOpen(true)}
                                        className="whitespace-nowrap"
                                    >
                                        Définir Budget
                                    </Button>
                                </div>
                            )
                        }
                    />
                </div>

                <PageTabs items={tabs} activeId={activeView} onChange={(id) => setActiveView(id as any)} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <PageContainer>
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-macro">

                        {isCompact && activeView === 'budget' && (
                            <div className="mb-5 rounded-card border border-outline-variant bg-surface-container-low p-4">
                                <div className="space-y-2">
                                    <SelectField
                                        name="finance-year-mobile"
                                        value={selectedYear.toString()}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        options={MOCK_BUDGET_HISTORY.map((budget) => ({
                                            value: budget.year.toString(),
                                            label: `${budget.year} · ${budget.status}`,
                                        }))}
                                        placeholder="Exercice"
                                        className="!space-y-0"
                                    />
                                    <Button
                                        variant="filled"
                                        icon={<MaterialIcon name="add" size={18} />}
                                        onClick={() => setIsAddBudgetModalOpen(true)}
                                        className="w-full !h-12 !rounded-md !px-4 !justify-center whitespace-nowrap"
                                    >
                                        Définir budget
                                    </Button>
                                </div>
                                <p className="mt-2 text-label-small text-on-surface-variant">
                                    Exercice {selectedYear} · {currentBudget.status}
                                </p>
                            </div>
                        )}

                        {activeView === 'overview' && (
                            <div className="space-y-8">
                                {/* SECTION 1: TOP KPIS */}
                                <div className="grid grid-cols-1 expanded:grid-cols-12 gap-4">
                                    <div className="expanded:col-span-5 bg-primary-container/35 rounded-card p-6 border border-primary/25 shadow-elevation-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-label-small uppercase tracking-widest text-on-primary-container/90">Valeur du Parc</p>
                                            <MaterialIcon name="attach_money" size={22} className="text-primary" />
                                        </div>
                                        <p className="text-display-small text-on-surface leading-none">
                                            {formatCurrency(stats.current, settings.currency, settings.compactNotation)}
                                        </p>
                                        <div className="mt-4 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-error-container text-error text-label-small">
                                            <MaterialIcon name="trending_down" size={14} />
                                            -2.4% net comptable
                                        </div>
                                    </div>

                                    <div className="expanded:col-span-7 grid grid-cols-1 medium:grid-cols-3 gap-4">
                                        <div className="bg-surface-container-low rounded-card p-5 border border-outline-variant">
                                            <p className="text-label-small uppercase tracking-widest text-on-surface-variant">Amortissement mensuel</p>
                                            <p className="text-headline-small text-on-surface mt-2">{formatCurrency(stats.monthlyDep, settings.currency, settings.compactNotation)}</p>
                                            <p className="inline-flex items-center gap-1 text-label-small text-error mt-2">
                                                <MaterialIcon name="trending_up" size={14} />
                                                +0.8% charge estimée
                                            </p>
                                        </div>
                                        <div className="bg-surface-container-low rounded-card p-5 border border-outline-variant">
                                            <p className="text-label-small uppercase tracking-widest text-on-surface-variant">Efficacité des actifs</p>
                                            <p className="text-headline-small text-on-surface mt-2">{stats.efficiency.toFixed(1)}%</p>
                                            <p className="inline-flex items-center gap-1 text-label-small text-tertiary mt-2">
                                                <MaterialIcon name="trending_up" size={14} />
                                                +1.2% ROI optimisé
                                            </p>
                                        </div>
                                        <div className="bg-surface-container-low rounded-card p-5 border border-outline-variant">
                                            <p className="text-label-small uppercase tracking-widest text-on-surface-variant">Risque fin de vie</p>
                                            <p className="text-headline-small text-on-surface mt-2">{stats.criticalRenew}</p>
                                            <p className="text-label-small text-error mt-2">14 actifs à traiter</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-3 gap-8">
                                    {/* CHART: EVOLUTION DE LA VALEUR (AIRE) */}
                                    <Card title="Projection de Dépréciation (6 mois)" className="expanded:col-span-2">
                                        <div className="h-[300px] w-full relative mt-8">
                                            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                                                <defs>
                                                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                        <stop offset="0%" style={{ stopColor: 'var(--md-sys-color-primary)', stopOpacity: 0.2 }} />
                                                        <stop offset="100%" style={{ stopColor: 'var(--md-sys-color-primary)', stopOpacity: 0 }} />
                                                    </linearGradient>
                                                </defs>
                                                {[0, 50, 100, 150, 200].map(y => (
                                                    <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
                                                ))}
                                                <path
                                                    d={`M 0 200 ${projectionSteps.map((s, i) => `L ${i * 120} ${200 - (s.val / maxProj * 150)}`).join(' ')} L 600 200 Z`}
                                                    fill="url(#grad)"
                                                />
                                                <path
                                                    d={`M 0 ${200 - (projectionSteps[0].val / maxProj * 150)} ${projectionSteps.map((s, i) => `L ${i * 120} ${200 - (s.val / maxProj * 150)}`).join(' ')}`}
                                                    fill="none"
                                                    stroke="var(--md-sys-color-primary)"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    className="animate-draw"
                                                />
                                                {projectionSteps.map((s, i) => (
                                                    <g key={i} className="group/dot">
                                                        <circle
                                                            cx={i * 120}
                                                            cy={200 - (s.val / maxProj * 150)}
                                                            r="4"
                                                            fill="var(--md-sys-color-surface)"
                                                            stroke="var(--md-sys-color-primary)"
                                                            strokeWidth="2"
                                                        />
                                                        <text x={i * 120} y="195" textAnchor={i === 0 ? 'start' : i === projectionSteps.length - 1 ? 'end' : 'middle'} className="text-label-small fill-on-surface-variant font-bold uppercase">{s.m}</text>
                                                        <text x={i * 120} y={200 - (s.val / maxProj * 150) - 10} textAnchor={i === 0 ? 'start' : i === projectionSteps.length - 1 ? 'end' : 'middle'} className="text-label-small fill-dark font-bold opacity-0 group-hover/dot:opacity-100 transition-opacity">
                                                            {formatCurrency(s.val, settings.currency, settings.compactNotation)}
                                                        </text>
                                                    </g>
                                                ))}
                                            </svg>
                                        </div>
                                        <div className="mt-4 p-4 bg-secondary-container rounded-xl border border-secondary/20 flex items-start gap-3">
                                            <MaterialIcon name="auto_awesome" size={18} className="text-secondary shrink-0 mt-0.5" />
                                            <p className="text-xs text-on-secondary-container leading-relaxed">
                                                <strong>IA Note :</strong> La valeur du parc atteindra son point d'équilibre en <strong>Mai</strong>. Prévoyez une injection de capital de ~12kâ‚¬ pour maintenir la santé technologique.
                                            </p>
                                        </div>
                                    </Card>

                                    {/* DISTRIBUTION PAR PAYS */}
                                    <Card title="Valeur par Entité">
                                        <div className="space-y-6 pt-4">
                                            {MOCK_LOCATION_VALUE.map((loc, i) => (
                                                <div key={i} className="group cursor-pointer">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container border border-outline-variant group-hover:border-primary/30 transition-colors">
                                                                <MaterialIcon name="language" size={14} className="text-on-surface-variant" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-on-surface">{loc.country}</p>
                                                                <p className="text-label-small text-on-surface-variant font-bold uppercase">{formatCurrency(loc.value, settings.currency, settings.compactNotation)}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-black text-on-surface">{loc.percent}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full transition-all duration-1000 ease-standard-decelerate rounded-full"
                                                            style={{ width: `${loc.percent}%`, backgroundColor: loc.color }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Button variant="outlined" className="w-full mt-8 border-dashed text-on-surface-variant text-xs font-bold uppercase tracking-widest hover:text-primary">
                                            Voir le détail complet
                                        </Button>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {activeView === 'expenses' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-card p-6 text-on-primary shadow-elevation-3">
                                        <p className="text-label-small uppercase font-bold opacity-70 mb-2">Total Dépenses Q1</p>
                                        <div className="text-headline-medium font-black mb-1">{formatCurrency(16240, settings.currency, settings.compactNotation)}</div>
                                        <div className="flex items-center gap-2 text-xs font-medium bg-on-primary/20 w-fit px-2 py-1 rounded-lg">
                                            <MaterialIcon name="north_east" size={14} /> +12% vs 2023
                                        </div>
                                    </div>
                                    <div className="bg-surface rounded-card p-6 border border-outline-variant shadow-elevation-1">
                                        <p className="text-label-small text-on-surface-variant uppercase font-bold mb-2">Budget Restant (Annuel)</p>
                                        <div className="text-headline-medium font-black text-on-surface mb-1">{formatCurrency(85000, settings.currency, settings.compactNotation)}</div>
                                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-3">
                                            <div className="bg-tertiary h-full w-[65%]" />
                                        </div>
                                        <p className="text-xs text-on-surface-variant mt-2 text-right">65% consommé</p>
                                    </div>
                                    <div
                                        onClick={() => setIsAddExpenseModalOpen(true)}
                                        className="bg-surface rounded-card p-6 border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary-container/10 cursor-pointer transition-all flex flex-col items-center justify-center text-center group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/20 transition-all duration-700 ease-emphasized"></div>
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                                            <MaterialIcon name="add" size={20} />
                                        </div>
                                        <p className="font-bold text-on-surface text-sm">Nouvelle Dépense</p>
                                        <p className="text-label-small text-on-surface-variant">Scanner facture ou saisie manuelle</p>
                                    </div>
                                </div>

                                <Card title="Historique des Transactions">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-xs">
                                                <tr>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Fournisseur</th>
                                                    <th className="px-6 py-4">Description</th>
                                                    <th className="px-6 py-4">Type</th>
                                                    <th className="px-6 py-4">Montant</th>
                                                    <th className="px-6 py-4 text-center">Statut</th>
                                                    <th className="px-6 py-4"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant">
                                                {MOCK_EXPENSES.map((exp) => (
                                                    <tr key={exp.id} className="hover:bg-surface-container/50 transition-colors group">
                                                        <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">{exp.date}</td>
                                                        <td className="px-6 py-4 font-bold text-on-surface">{exp.supplier}</td>
                                                        <td className="px-6 py-4 text-on-surface-variant truncate max-w-[200px]">{exp.desc}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                {exp.type === 'Purchase' && <MaterialIcon name="work" size={14} className="text-secondary" />}
                                                                {exp.type === 'Cloud' && <MaterialIcon name="cloud_upload" size={14} className="text-tertiary" />}
                                                                {exp.type === 'License' && <MaterialIcon name="vpn_key" size={14} className="text-tertiary" />}
                                                                {exp.type === 'Service' && <MaterialIcon name="layers" size={14} className="text-on-surface-variant" />}
                                                                <span className="text-xs font-medium">{exp.type}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-on-surface">{formatCurrency(exp.amount, settings.currency)}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <Badge variant={
                                                                exp.status === 'Paid' ? 'success' :
                                                                    exp.status === 'Pending' ? 'warning' : 'info'
                                                            }>
                                                                {exp.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <Button
                                                                variant="outlined"
                                                                size="sm"
                                                                aria-label={`Voir le détail de la dépense ${exp.id}`}
                                                                onClick={() => setSelectedExpense(exp)}
                                                                className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <MaterialIcon name="chevron_right" size={16} />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeView === 'budget' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-macro">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-3 gap-6">
                                    <div className="bg-surface rounded-card p-6 border border-outline-variant shadow-elevation-1 flex flex-col justify-between">
                                        <p className="text-label-small text-on-surface-variant uppercase font-black tracking-widest mb-2">Budget Total {selectedYear}</p>
                                        <div className="text-headline-medium font-black text-on-surface">{formatCurrency(budgetStats.totalAllocated, settings.currency, settings.compactNotation)}</div>
                                        <div className="flex items-center gap-2 mt-4 text-xs font-bold text-on-surface-variant">
                                            <span className={cn("px-2 py-0.5 rounded text-label-small uppercase", currentBudget.status === 'En cours' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container')}>
                                                {currentBudget.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-surface rounded-card p-6 border border-outline-variant shadow-elevation-1 flex flex-col justify-between">
                                        <p className="text-label-small text-on-surface-variant uppercase font-black tracking-widest mb-2">Dépenses {selectedYear}</p>
                                        <div className="text-headline-medium font-black text-on-surface">{formatCurrency(budgetStats.totalSpent, settings.currency, settings.compactNotation)}</div>
                                        <div className="mt-4 flex items-center justify-between text-label-small">
                                            <span className="text-on-surface-variant">Utilisation</span>
                                            <span className="text-on-surface font-semibold">{spentPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-surface-container-highest rounded-full h-2.5 mt-2 overflow-hidden">
                                            <div className="bg-error h-full rounded-full" style={{ width: `${spentPercent}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="bg-surface rounded-card p-6 border border-outline-variant shadow-elevation-1 flex flex-col justify-between">
                                        <p className="text-label-small text-on-surface-variant uppercase font-black tracking-widest mb-2">Restant</p>
                                        <div className={cn("text-headline-medium font-black", budgetStats.remaining < 0 ? "text-error" : "text-primary")}>
                                            {formatCurrency(budgetStats.remaining, settings.currency, settings.compactNotation)}
                                        </div>
                                        <div className="text-label-small text-on-surface mt-4 font-semibold">
                                            {remainingPercent.toFixed(1)}% du budget restant
                                        </div>
                                    </div>
                                </div>

                                {/* Detail List Table (Style Image) */}
                                <div className="bg-surface rounded-card shadow-elevation-1 border border-outline-variant overflow-hidden">
                                    <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface-container-low">
                                        <div className="flex flex-col medium:flex-row medium:items-center medium:justify-between gap-3">
                                            <div className="space-y-1">
                                                <h2 className="font-bold text-on-surface text-title-medium">Détails du budget</h2>
                                                <div className="flex items-center gap-2 text-label-small text-on-surface-variant">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                                                        <MaterialIcon name="psychology" size={12} /> Analyse IA CAPEX/OPEX
                                                    </span>
                                                    <Tooltip
                                                        variant="rich"
                                                        placement="bottom"
                                                        content={(
                                                            <div className="space-y-3">
                                                                <p className="text-body-small text-on-surface-variant">
                                                                    La classification IA CAPEX/OPEX est dérivée du type et du montant de chaque ligne.
                                                                </p>
                                                                <Button
                                                                    variant="text"
                                                                    size="sm"
                                                                    onClick={() => setActiveView('expenses')}
                                                                    className="!h-auto !min-h-0 !px-0"
                                                                >
                                                                    Ouvrir le journal des dépenses
                                                                </Button>
                                                            </div>
                                                        )}
                                                    >
                                                        <button type="button" className="inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-surface-container-high" aria-label="Aide analyse IA">
                                                            <MaterialIcon name="info" size={14} />
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            <Button variant="outlined" size="sm" icon={<MaterialIcon name="download" size={16} />} className="w-full medium:w-auto whitespace-nowrap">
                                                Exporter le tableau
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-label-small tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-4">Catégorie</th>
                                                    <th className="px-6 py-4 text-right">Alloué</th>
                                                    <th className="px-6 py-4 text-right">Dépensé</th>
                                                    <th className="px-6 py-4 text-right">Restant</th>
                                                    <th className="px-6 py-4 w-1/5">Utilisation</th>
                                                    <th className="px-6 py-4 text-center">Type (IA)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant bg-surface">
                                                {currentBudget.items.map((item, idx) => {
                                                    const itemPercent = (item.spent / item.allocated) * 100;
                                                    const itemRemaining = item.allocated - item.spent;
                                                    const budgetType = classifyBudgetLine(item.category, item.allocated);

                                                    return (
                                                        <tr key={idx} className="hover:bg-surface-container/50 transition-colors group">
                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "p-2 rounded-lg",
                                                                        item.type === 'Purchase' ? "bg-secondary-container text-secondary" :
                                                                            item.type === 'License' ? "bg-secondary-container text-on-secondary-container" :
                                                                                item.type === 'Cloud' ? "bg-tertiary-container text-tertiary" : "bg-surface-container text-on-surface-variant"
                                                                    )}>
                                                                        {item.type === 'Purchase' && <MaterialIcon name="work" size={16} />}
                                                                        {item.type === 'License' && <MaterialIcon name="vpn_key" size={16} />}
                                                                        {item.type === 'Cloud' && <MaterialIcon name="cloud_upload" size={16} />}
                                                                        {item.type === 'Service' && <MaterialIcon name="layers" size={16} />}
                                                                    </div>
                                                                    <span className="font-bold text-on-surface">{item.category}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-right font-medium text-on-surface-variant">
                                                                {formatCurrency(item.allocated, settings.currency, settings.compactNotation)}
                                                            </td>
                                                            <td className="px-6 py-5 text-right font-bold text-on-surface">
                                                                {formatCurrency(item.spent, settings.currency, settings.compactNotation)}
                                                            </td>
                                                            <td className={cn("px-6 py-5 text-right font-bold", itemRemaining < 0 ? "text-error" : "text-tertiary")}>
                                                                {formatCurrency(itemRemaining, settings.currency, settings.compactNotation)}
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full rounded-full",
                                                                            itemPercent > 100 ? "bg-error" :
                                                                                itemPercent > 80 ? "bg-secondary" : "bg-tertiary"
                                                                        )}
                                                                        style={{ width: `${Math.min(itemPercent, 100)}%` }}
                                                                    />
                                                                </div>
                                                                <div className="text-label-small text-on-surface-variant mt-1 font-medium text-right">
                                                                    {itemPercent.toFixed(0)}%
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-center">
                                                                <Badge variant={budgetType === 'CAPEX' ? 'info' : 'warning'}>
                                                                    {budgetType}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div
                                    onClick={() => setIsAddBudgetModalOpen(true)}
                                    className="border-2 border-dashed border-outline-variant rounded-card p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary-container/10 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center mb-3 text-on-surface-variant group-hover:text-primary transition-colors">
                                        <MaterialIcon name="table_chart" size={24} />
                                    </div>
                                    <h3 className="font-bold text-on-surface">Importer un nouveau budget</h3>
                                    <p className="text-sm text-on-surface-variant mt-1">
                                        Écrasez les données actuelles en important un fichier Excel validé pour l'année en cours.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </PageContainer>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .animate-draw {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 2s var(--md-sys-motion-easing-emphasized-decelerate) forwards;
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
      `}} />
        </div>
    );
};



export default FinanceManagementPage;




















