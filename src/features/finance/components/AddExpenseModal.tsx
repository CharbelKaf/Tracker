import React, { useState } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import { TextArea } from '../../../components/ui/TextArea';
import SegmentedButton from '../../../components/ui/SegmentedButton';
import IconButton from '../../../components/ui/IconButton';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { extractExpenseDraftFromFile, ExtractedExpenseDraft } from '../../../lib/expenseExtraction';
import { FinanceExpenseType } from '../../../types';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AddExpenseMode = 'scan' | 'manual';

const EXPENSE_TYPE_OPTIONS = [
    { value: 'Purchase', label: 'Achat (CAPEX)' },
    { value: 'License', label: 'Licence' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Service', label: 'Service' },
    { value: 'Cloud', label: 'Cloud' },
];

const MODE_OPTIONS = [
    { value: 'scan', label: 'Scan IA', icon: 'auto_awesome' },
    { value: 'manual', label: 'Saisie', icon: 'description' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
    const { showToast } = useToast();
    const { settings, addFinanceExpense } = useData();

    const [mode, setMode] = useState<AddExpenseMode>('scan');
    const [isScanning, setIsScanning] = useState(false);
    const [scannedFile, setScannedFile] = useState<File | null>(null);
    const [extractionMeta, setExtractionMeta] = useState<Pick<ExtractedExpenseDraft, 'confidence' | 'warnings'> | null>(null);
    const [isLowConfidenceReviewed, setIsLowConfidenceReviewed] = useState(false);

    const [formData, setFormData] = useState({
        type: '',
        amount: '',
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        invoiceNumber: '',
    });

    const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'XOF' ? 'F' : '€';
    const requiresLowConfidenceReview = Boolean(scannedFile && extractionMeta?.confidence === 'low');

    const reset = () => {
        setMode('scan');
        setIsScanning(false);
        setScannedFile(null);
        setExtractionMeta(null);
        setIsLowConfidenceReviewed(false);
        setFormData({
            type: '',
            amount: '',
            supplier: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            invoiceNumber: '',
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleModeChange = (value: string | string[]) => {
        if (typeof value === 'string') {
            setMode(value as AddExpenseMode);
        }
    };

    const startScan = async (file: File) => {
        setScannedFile(file);
        setIsScanning(true);
        setIsLowConfidenceReviewed(false);

        try {
            const extracted = await extractExpenseDraftFromFile(file);

            setIsScanning(false);
            setMode('manual');
            setFormData({
                type: extracted.type,
                amount: extracted.amount,
                supplier: extracted.supplier,
                date: extracted.date,
                description: extracted.description,
                invoiceNumber: extracted.invoiceNumber,
            });
            setExtractionMeta({
                confidence: extracted.confidence,
                warnings: extracted.warnings,
            });

            if (extracted.confidence === 'high') {
                showToast('Facture analysée avec succès.', 'success');
            } else {
                showToast('Analyse partielle. Vérifiez les champs avant validation.', 'warning');
            }
        } catch {
            setIsScanning(false);
            setMode('manual');
            showToast('Impossible d’analyser ce fichier automatiquement.', 'error');
        }
    };

    const handleSubmit = () => {
        if (requiresLowConfidenceReview && !isLowConfidenceReviewed) {
            showToast('Confirmez la revue manuelle des champs avant validation.', 'warning');
            return;
        }

        if (!formData.amount || !formData.supplier || !formData.type) {
            showToast('Veuillez remplir les informations obligatoires.', 'error');
            return;
        }

        const parsedAmount = Number(formData.amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            showToast('Le montant doit être supérieur à zéro.', 'error');
            return;
        }

        const createdExpense = addFinanceExpense({
            date: formData.date,
            supplier: formData.supplier.trim(),
            amount: parsedAmount,
            type: formData.type as FinanceExpenseType,
            status: 'Paid',
            description: formData.description.trim() || `Facture ${formData.supplier.trim()}`,
            invoiceNumber: formData.invoiceNumber.trim() || undefined,
            sourceFileName: scannedFile?.name,
            extractionConfidence: extractionMeta?.confidence,
        });

        if (!createdExpense.ok) {
            showToast('Dépense déjà importée. Aucun doublon ajouté.', 'warning');
            handleClose();
            return;
        }

        showToast(`Dépense enregistrée (${createdExpense.expense?.supplier || formData.supplier}).`, 'success');
        handleClose();
    };

    const footer = (
        <>
            <Button variant="outlined" onClick={handleClose}>Annuler</Button>
            <Button
                variant="filled"
                onClick={handleSubmit}
                disabled={requiresLowConfidenceReview && !isLowConfidenceReviewed}
            >
                Enregistrer la dépense
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Enregistrer une dépense"
            footer={mode === 'manual' ? footer : undefined}
            maxWidth="max-w-5xl"
        >
            <div className="mb-6 rounded-xl border border-outline-variant bg-surface-container-low p-2">
                <SegmentedButton
                    options={MODE_OPTIONS}
                    value={mode}
                    onChange={handleModeChange}
                    className="w-full"
                />
            </div>

            {mode === 'scan' && (
                <div className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    {!isScanning ? (
                        <FileDropzone
                            onFileSelect={startScan}
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
                            label="Déposez votre facture ici"
                            subLabel="Notre IA extraira automatiquement le montant et le fournisseur"
                            className="w-full h-64 border-outline-variant hover:border-primary"
                        />
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-outline-variant flex items-center justify-center relative overflow-hidden">
                                    <MaterialIcon name="description" size={40} className="text-on-surface-variant" />
                                    <div
                                        className="absolute inset-0 bg-primary/20 animate-[spin_3s_linear_infinite]"
                                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <MaterialIcon name="document_scanner" size={48} className="text-primary animate-pulse" />
                                </div>
                            </div>
                            <h3 className="text-title-medium font-bold text-on-surface mt-6">Analyse en cours...</h3>
                            <div className="flex flex-col gap-1 mt-2 text-sm text-on-surface-variant">
                                <span className="animate-in fade-in slide-in-from-bottom-2 delay-100 flex items-center gap-2">
                                    <MaterialIcon name="check" size={12} className="text-tertiary" />
                                    Détection du fournisseur
                                </span>
                                <span className="animate-in fade-in slide-in-from-bottom-2 delay-500 flex items-center gap-2">
                                    <MaterialIcon name="check" size={12} className="text-tertiary" />
                                    Lecture des montants HT/TTC
                                </span>
                                <span className="animate-in fade-in slide-in-from-bottom-2 delay-1000 flex items-center gap-2">
                                    <MaterialIcon name="progress_activity" size={12} className="animate-spin text-primary" />
                                    Catégorisation...
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode === 'manual' && (
                <div className="animate-in slide-in-from-right-8 duration-300 space-y-4">
                    {scannedFile && (
                        <div className="bg-tertiary-container border border-tertiary/20 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-tertiary/20 rounded-lg text-on-tertiary-container">
                                    <MaterialIcon name="auto_awesome" size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-on-tertiary-container uppercase">Données extraites par IA</p>
                                    <p className="text-xs text-tertiary truncate max-w-[260px]">{scannedFile.name}</p>
                                    {extractionMeta && (
                                        <p className="text-[11px] text-on-tertiary-container/80 mt-0.5">
                                            Confiance: {extractionMeta.confidence === 'high' ? 'élevée' : extractionMeta.confidence === 'medium' ? 'moyenne' : 'faible'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <IconButton
                                icon="close"
                                variant="standard"
                                aria-label="Retirer le fichier scanné"
                                onClick={() => {
                                    setScannedFile(null);
                                    setExtractionMeta(null);
                                    setIsLowConfidenceReviewed(false);
                                }}
                            />
                        </div>
                    )}

                    {extractionMeta?.warnings?.length ? (
                        <div className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
                            {extractionMeta.warnings[0]}
                        </div>
                    ) : null}

                    {requiresLowConfidenceReview ? (
                        <label className="flex items-start gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4"
                                checked={isLowConfidenceReviewed}
                                onChange={(e) => setIsLowConfidenceReviewed(e.target.checked)}
                            />
                            <span>
                                Je confirme avoir verifie manuellement le fournisseur, le montant, la date et la reference.
                            </span>
                        </label>
                    ) : null}

                    <div className="grid grid-cols-1 expanded:grid-cols-2 gap-4">
                        <InputField
                            label="Date *"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                        <InputField
                            label="Fournisseur *"
                            value={formData.supplier}
                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            placeholder="Ex: Dell Technologies"
                            required
                        />
                        <SelectField
                            label="Type de dépense *"
                            name="expense-type"
                            options={EXPENSE_TYPE_OPTIONS}
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            placeholder="Sélectionner un type"
                            required
                        />
                        <InputField
                            label={`Montant (${currencySymbol}) *`}
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                            required
                        />
                        <InputField
                            label="N° Facture"
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            placeholder="INV-2024-001"
                        />
                        <div className="expanded:col-span-2">
                            <TextArea
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                placeholder="Détails de la dépense..."
                            />
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

