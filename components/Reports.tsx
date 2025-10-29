import React, { useMemo, useState } from 'react';
import type { Assignment, Equipment, User, Model, Category } from '../types';
import { EquipmentStatus, FormAction } from '../types';
import PageHeader from './PageHeader';
import Button from './ui/Button';

// jsPDF est chargé à partir d'une balise script dans index.html
declare const jspdf: any;
const { jsPDF } = jspdf;

interface ReportsProps {
    equipment: Equipment[];
    assignments: Assignment[];
    users: User[];
    models: Model[];
    categories: Category[];
    currentUser: User;
}

// Fonctions d'aide pour l'exportation
const exportToCsv = (filename: string, rows: (string | number | undefined | null)[][]) => {
    const processRow = (row: (string | number | undefined | null)[]) => row.map(val => {
        const str = String(val === null || val === undefined ? '' : val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }).join(',');

    const csvContent = "data:text/csv;charset=utf-8," 
        + rows.map(processRow).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const exportToPdf = (title: string, head: string[][], body: (string | number | undefined | null)[][]) => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    (doc as any).autoTable({
        startY: 20,
        head: head,
        body: body,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [255, 202, 24] }, // primary-500
    });
    doc.save(`${title.toLowerCase().replace(/\s/g, '_')}.pdf`);
};

interface ReportCardProps {
    icon: string;
    title: string;
    description: string;
    onCsv?: () => void;
    onPdf?: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ icon, title, description, onCsv, onPdf }) => (
    <div className="flex flex-col justify-between surface-card surface-card-gradient p-5 rounded-2xl gap-4">
        <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100/90 dark:bg-secondary-900/50 text-secondary-700 dark:text-secondary-200 mb-3 shadow-[var(--shadow-elev-1)]">
                <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight mb-2">{title}</h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-200/90 leading-relaxed">{description}</p>
        </div>
        <div className="mt-auto grid gap-2 sm:flex sm:flex-row">
            {onCsv && (
                <Button
                    variant="secondary"
                    size="lg"
                    onClick={onCsv}
                    className="w-full sm:flex-1 bg-white/90 dark:bg-secondary-900/60 text-secondary-800 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                >
                    Exporter en CSV
                </Button>
            )}
            {onPdf && (
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={onPdf}
                    className="w-full sm:flex-1 border border-secondary-200 dark:border-secondary-700 bg-white/40 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-100 hover:bg-secondary-100/80 dark:hover:bg-secondary-800/60"
                >
                    Exporter en PDF
                </Button>
            )}
        </div>
    </div>
);


const Reports: React.FC<ReportsProps> = ({ equipment, assignments, users, models, categories, currentUser }) => {
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [reportTypeForUser, setReportTypeForUser] = useState<'pdf' | 'csv' | null>(null);

    const modelMap = useMemo(() => new Map(models.map(m => [m.id, m])), [models]);
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    
    const assignedUserMap = useMemo(() => {
        const map = new Map<string, string>();
        const latestAssignments = new Map<string, Assignment>();

        for (const assignment of assignments) {
            const existing = latestAssignments.get(assignment.equipmentId);
            if (!existing || new Date(assignment.date) > new Date(existing.date)) {
                latestAssignments.set(assignment.equipmentId, assignment);
            }
        }

        for (const eq of equipment) {
            if (eq.status === EquipmentStatus.ASSIGNED) {
                const lastAssignment = latestAssignments.get(eq.id);
                if (lastAssignment && lastAssignment.action === FormAction.ASSIGN) {
                    map.set(eq.id, userMap.get(lastAssignment.userId) || 'Utilisateur inconnu');
                }
            }
        }
        return map;
    }, [assignments, equipment, userMap]);
    
    // --- Fonctions de génération de données de rapport ---

    const getFullInventoryData = () => {
        const headers = ["Catégorie", "Modèle", "N° d'inventaire", "Nom", "Statut", "Utilisateur attribué", "Date d'achat", "Fin de garantie"];
        const data = equipment.map(item => {
            const model = modelMap.get(item.modelId);
            const category = model ? categoryMap.get(model.categoryId) : null;
            return [
                category?.name,
                model?.name,
                item.assetTag,
                item.name,
                item.status,
                assignedUserMap.get(item.id),
                item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : null,
                item.warrantyEndDate ? new Date(item.warrantyEndDate).toLocaleDateString() : null
            ];
        });
        return { headers: [headers], data };
    };

    const getAgingEquipmentData = () => {
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
        const agingEquipment = equipment.filter(item => item.purchaseDate && new Date(item.purchaseDate) < threeYearsAgo);
        
        const headers = ["Modèle", "N° d'inventaire", "Statut", "Date d'achat", "Âge (ans)"];
        const data = agingEquipment.map(item => {
            const model = modelMap.get(item.modelId);
            const age = item.purchaseDate ? ((new Date().getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1) : null;
            return [model?.name, item.assetTag, item.status, new Date(item.purchaseDate!).toLocaleDateString(), age];
        });
        return { headers: [headers], data };
    };

    const getWarrantyExpiryData = () => {
        const now = new Date();
        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(now.getDate() + 90);
        
        const expiringEquipment = equipment.filter(item => item.warrantyEndDate && new Date(item.warrantyEndDate) > now && new Date(item.warrantyEndDate) <= ninetyDaysFromNow);
        
        const headers = ["Modèle", "N° d'inventaire", "Fin de garantie", "Jours restants"];
        const data = expiringEquipment.map(item => {
            const model = modelMap.get(item.modelId);
            const daysLeft = Math.ceil((new Date(item.warrantyEndDate!).getTime() - now.getTime()) / (1000 * 3600 * 24));
            return [model?.name, item.assetTag, new Date(item.warrantyEndDate!).toLocaleDateString(), daysLeft];
        });
        return { headers: [headers], data };
    };

    const getUserHistoryData = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return { title: '', headers: [], data: [] };

        const userAssignments = assignments.filter(a => a.userId === user.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const headers = ["Date", "Action", "Modèle", "N° d'inventaire"];
        const data = userAssignments.map(a => {
            const item = equipment.find(e => e.id === a.equipmentId);
            const model = item ? modelMap.get(item.modelId) : null;
            return [new Date(a.date).toLocaleDateString(), a.action, model?.name, item?.assetTag];
        });
        return { title: `Historique pour ${user.name}`, headers: [headers], data };
    };
    
    const handleUserReportGeneration = () => {
        if (!selectedUserId || !reportTypeForUser) return;
        const { title, headers, data } = getUserHistoryData(selectedUserId);
        if (reportTypeForUser === 'csv') {
            exportToCsv(`historique_${users.find(u=>u.id===selectedUserId)?.name.replace(' ','_')}`, [headers[0], ...data]);
        } else {
            exportToPdf(title, headers, data);
        }
        setUserModalOpen(false);
        setSelectedUserId('');
        setReportTypeForUser(null);
    }


    return (
        <div className="flex flex-col h-full bg-secondary-50 dark:bg-[#0f1722]">
            <PageHeader title="Rapports" />
            <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ReportCard 
                        icon="inventory_2"
                        title="Inventaire Complet"
                        description="Exporter la liste complète de tous les équipements et leurs détails."
                        onCsv={() => {
                            const { headers, data } = getFullInventoryData();
                            exportToCsv('inventaire_complet', [headers[0], ...data]);
                        }}
                        onPdf={() => {
                            const { headers, data } = getFullInventoryData();
                            exportToPdf("Inventaire Complet", headers, data);
                        }}
                    />
                     <ReportCard 
                        icon="person_search"
                        title="Historique par Utilisateur"
                        description="Générer un rapport de toutes les attributions et retours pour un utilisateur spécifique."
                        onCsv={() => { setReportTypeForUser('csv'); setUserModalOpen(true); }}
                        onPdf={() => { setReportTypeForUser('pdf'); setUserModalOpen(true); }}
                    />
                    <ReportCard 
                        icon="update"
                        title="Équipement Vieillissant"
                        description="Lister tous les équipements de plus de 3 ans pour la planification de l'amortissement."
                        onCsv={() => {
                            const { headers, data } = getAgingEquipmentData();
                            exportToCsv('equipement_vieillissant', [headers[0], ...data]);
                        }}
                        onPdf={() => {
                            const { headers, data } = getAgingEquipmentData();
                            exportToPdf("Équipement Vieillissant (> 3 ans)", headers, data);
                        }}
                    />
                    <ReportCard 
                        icon="shield"
                        title="Expiration des Garanties"
                        description="Voir les équipements dont la garantie expire dans les 90 prochains jours."
                        onCsv={() => {
                            const { headers, data } = getWarrantyExpiryData();
                            exportToCsv('expiration_garanties', [headers[0], ...data]);
                        }}
                        onPdf={() => {
                            const { headers, data } = getWarrantyExpiryData();
                            exportToPdf("Expiration des Garanties (< 90 jours)", headers, data);
                        }}
                    />
                </div>
            </main>

            {isUserModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setUserModalOpen(false)}>
                    <div className="surface-card surface-card-gradient w-full max-w-sm p-6 rounded-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight mb-4">Sélectionner un utilisateur</h2>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-200 mb-2" htmlFor="user-select">Utilisateur</label>
                            <select
                                id="user-select"
                                value={selectedUserId}
                                onChange={e => setSelectedUserId(e.target.value)}
                                className="w-full rounded-md border border-secondary-200 dark:border-secondary-700 bg-white/90 dark:bg-secondary-900/60 text-secondary-800 dark:text-secondary-100 shadow-[var(--shadow-elev-1)] focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="" disabled>Sélectionner un utilisateur...</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <Button variant="ghost" onClick={() => setUserModalOpen(false)} className="border border-secondary-200 dark:border-secondary-700 bg-transparent text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100/60 dark:hover:bg-secondary-900/50">Annuler</Button>
                            <Button onClick={handleUserReportGeneration} disabled={!selectedUserId}>Générer</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;