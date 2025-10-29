import React, { useState, useMemo } from 'react';
import type { Equipment, Model } from '../types';
import { EquipmentStatus } from '../types';
import { useToast } from '../contexts/ToastContext';
import PageHeader from './PageHeader';
import Button from './ui/Button';

interface ImportEquipmentFormProps {
  models: Model[];
  onImport: (newEquipment: Partial<Equipment>[]) => Promise<void>;
  onBack: () => void;
}

type ParsedRow = { [key: string]: string };
type ValidationStatus = 'valid' | 'error';
interface ValidationResult {
  status: ValidationStatus;
  message?: string;
  data: Partial<Equipment>;
}

const REQUIRED_HEADERS = ['modelName', 'assetTag'];
const ALL_HEADERS = ['modelName', 'assetTag', 'name', 'purchaseDate', 'warrantyStartDate', 'warrantyEndDate', 'status', 'location'];

const ImportEquipmentForm: React.FC<ImportEquipmentFormProps> = ({ models, onImport, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();
  
  const modelMapByName = useMemo(() => new Map(models.map(m => [m.name.toLowerCase(), m])), [models]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        await processFile(selectedFile);
    }
  };

  const processFile = async (fileToProcess: File) => {
    setIsProcessing(true);
    setValidationResults([]);
    try {
        const text = await fileToProcess.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            addToast('Le fichier CSV doit contenir des en-têtes et au moins une ligne de données.', 'error');
            return;
        }

        const headerLine = lines.shift()!.trim();
        const headers = headerLine.split(',').map(h => h.trim());

        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
            addToast(`En-têtes manquants dans le CSV: ${missingHeaders.join(', ')}`, 'error');
            return;
        }

        const results: ValidationResult[] = lines.map((line, index) => {
            const values = line.split(',');
            const row: ParsedRow = headers.reduce((obj, header, i) => {
                obj[header] = values[i]?.trim() || '';
                return obj;
            }, {} as ParsedRow);

            // Validation logic
            if (!row.modelName || !row.assetTag) {
                return { status: 'error', message: 'modelName et assetTag sont requis.', data: {} };
            }
            
            const model = modelMapByName.get(row.modelName.toLowerCase());
            if (!model) {
                return { status: 'error', message: `Modèle "${row.modelName}" non trouvé.`, data: {} };
            }

            const status = row.status && Object.values(EquipmentStatus).includes(row.status as EquipmentStatus)
                ? row.status as EquipmentStatus
                : EquipmentStatus.AVAILABLE;

            const equipmentData: Partial<Equipment> = {
                modelId: model.id,
                assetTag: row.assetTag,
                name: row.name || undefined,
                purchaseDate: row.purchaseDate || undefined,
                warrantyStartDate: row.warrantyStartDate || undefined,
                warrantyEndDate: row.warrantyEndDate || undefined,
                status: status,
                location: row.location || undefined,
            };

            return { status: 'valid', data: equipmentData };
        });

        setValidationResults(results);
    } catch (error) {
        console.error("Error processing file:", error);
        addToast('Échec du traitement du fichier.', 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + ALL_HEADERS.join(',');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleImport = async () => {
    if (isSaving) return;
    const validItems = validationResults
      .filter(r => r.status === 'valid')
      .map(r => r.data);
    if (validItems.length > 0) {
      setIsSaving(true);
      try {
        await onImport(validItems);
      } catch (error) {
        addToast("L'importation a échoué.", 'error');
      } finally {
        setIsSaving(false);
      }
    } else {
      addToast('Aucun équipement valide à importer.', 'info');
    }
  };
  const validCount = validationResults.filter(r => r.status === 'valid').length;
  const errorCount = validationResults.length - validCount;
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <PageHeader title="Importer des équipements" onBack={onBack} />
      <main className="flex-grow p-4 overflow-y-auto pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/60 dark:border-white/10 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Étape 1: Télécharger le fichier CSV</h2>
            <p className="text-gray-600 mt-2">Pour commencer, téléchargez notre modèle CSV pour vous assurer que vos données sont correctement formatées.</p>
            <button onClick={handleDownloadTemplate} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
              <span className="material-symbols-outlined">download</span>
              Télécharger le modèle
            </button>
            <div className="mt-6">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">Télécharger votre fichier</label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <span className="material-symbols-outlined text-4xl text-gray-400">cloud_upload</span>
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez</p>
                    <p className="text-xs text-gray-500">{file ? file.name : 'CSV (MAX. 5MB)'}</p>
                  </div>
                  <input id="file-upload" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>

          {isProcessing && <p className="text-center text-gray-600">Traitement du fichier...</p>}

          {validationResults.length > 0 && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/60 dark:border-white/10 p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Étape 2: Prévisualiser et valider</h2>
              <p className="text-gray-600 mt-2">Nous avons validé votre fichier. {validCount} équipement(s) prêt(s) à être importé(s), {errorCount} erreur(s) trouvée(s).</p>
              <div className="mt-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Statut</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Modèle</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">N° Inventaire</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {validationResults.map((result, index) => (
                      <tr key={index} className={result.status === 'error' ? 'bg-red-50' : 'bg-white'}>
                        <td className="px-4 py-2">
                          {result.status === 'valid' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Valide</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Erreur</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-700">{result.data.modelId ? models.find(m => m.id === result.data.modelId)?.name : 'N/A'}</td>
                        <td className="px-4 py-2 text-gray-700">{result.data.assetTag || 'N/A'}</td>
                        <td className="px-4 py-2 text-gray-500">{result.message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex justify-end">
          <Button onClick={handleImport} disabled={validCount === 0 || isProcessing || isSaving} loading={isSaving} icon="cloud_upload">
            {isSaving ? 'Importation...' : `Importer ${validCount > 0 ? `(${validCount})` : ''} équipement(s)`}
          </Button>
        </div>
      </footer>
    </div>
  );
  };

export default ImportEquipmentForm;
