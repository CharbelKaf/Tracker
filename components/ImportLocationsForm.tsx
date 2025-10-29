
import React, { useState, useMemo } from 'react';
import type { Country, Site, Department } from '../types';
import { useToast } from '../contexts/ToastContext';
import PageHeader from './PageHeader';
import Button from './ui/Button';

interface ImportLocationsFormProps {
  countries: Country[];
  sites: Site[];
  onImport: (data: { countries: Partial<Country>[], sites: Partial<Site>[], departments: Partial<Department>[] }) => Promise<void>;
  onBack: () => void;
}

type ParsedRow = { [key: string]: string };
type ValidationStatus = 'valid' | 'error';
interface ValidationResult {
  status: ValidationStatus;
  message?: string;
  data: {
    type: string;
    name: string;
    parentName?: string;
    parentId?: string;
  };
}

const REQUIRED_HEADERS = ['type', 'name'];
const ALL_HEADERS = ['type', 'name', 'parentName'];

const ImportLocationsForm: React.FC<ImportLocationsFormProps> = ({ countries, sites, onImport, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();
  
  const countryMapByName = useMemo(() => new Map(countries.map(c => [c.name.toLowerCase(), c])), [countries]);
  const siteMapByName = useMemo(() => new Map(sites.map(s => [s.name.toLowerCase(), s])), [sites]);

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
            setIsProcessing(false);
            return;
        }

        const headerLine = lines.shift()!.trim();
        const headers = headerLine.split(',').map(h => h.trim());

        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
            addToast(`En-têtes manquants dans le CSV: ${missingHeaders.join(', ')}`, 'error');
            setIsProcessing(false);
            return;
        }

        const results: ValidationResult[] = lines.map((line) => {
            const values = line.split(',');
            const row: ParsedRow = headers.reduce((obj, header, i) => {
                obj[header] = values[i]?.trim() || '';
                return obj;
            }, {} as ParsedRow);
            
            const type = row.type?.toLowerCase();
            const name = row.name;
            const parentName = row.parentName;
            
            const baseData = { type: type || '', name: name || '', parentName: parentName || ''};

            if (!type || !name) {
                return { status: 'error', message: '`type` et `name` sont requis.', data: baseData };
            }
    
            switch (type) {
                case 'country':
                    if (countryMapByName.has(name.toLowerCase())) {
                        return { status: 'error', message: `Le pays "${name}" existe déjà.`, data: baseData };
                    }
                    return { status: 'valid', data: baseData };
                case 'site':
                    if (!parentName) {
                        return { status: 'error', message: '`parentName` est requis pour un site.', data: baseData };
                    }
                    const parentCountry = countryMapByName.get(parentName.toLowerCase());
                    if (!parentCountry) {
                        return { status: 'error', message: `Pays parent "${parentName}" non trouvé.`, data: baseData };
                    }
                    if (siteMapByName.has(name.toLowerCase())) {
                        return { status: 'error', message: `Le site "${name}" existe déjà.`, data: baseData };
                    }
                    return { status: 'valid', data: { ...baseData, parentId: parentCountry.id } };
                case 'department':
                    if (!parentName) {
                        return { status: 'error', message: '`parentName` est requis pour un service.', data: baseData };
                    }
                    const parentSite = siteMapByName.get(parentName.toLowerCase());
                    if (!parentSite) {
                        return { status: 'error', message: `Site parent "${parentName}" non trouvé.`, data: baseData };
                    }
                    return { status: 'valid', data: { ...baseData, parentId: parentSite.id } };
                default:
                    return { status: 'error', message: `Type invalide: "${row.type}". Doit être 'country', 'site', ou 'department'.`, data: baseData };
            }
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
    link.setAttribute("download", "import_locations_template.csv");
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
      const importData = {
          countries: validItems.filter(item => item.type === 'country').map(({ name }) => ({ name })),
          sites: validItems.filter(item => item.type === 'site').map(({ name, parentId }) => ({ name, countryId: parentId })),
          departments: validItems.filter(item => item.type === 'department').map(({ name, parentId }) => ({ name, siteId: parentId })),
      };

      try {
        await onImport(importData);
      } catch (error) {
        addToast("L'importation a échoué.", "error");
        setIsSaving(false);
      }
    } else {
      addToast('Aucune localisation valide à importer.', 'info');
    }
  };

  const validCount = validationResults.filter(r => r.status === 'valid').length;
  const errorCount = validationResults.length - validCount;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
        <PageHeader title="Importer des localisations" onBack={onBack} />

        <main className="flex-grow p-4 overflow-y-auto pb-24">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/60 dark:border-white/10 p-4 rounded-lg shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Étape 1: Télécharger le fichier CSV</h2>
                    <p className="text-gray-600 mt-2">Le fichier doit contenir les colonnes: <code>type</code> (country, site, or department), <code>name</code>, et <code>parentName</code> (pour les sites et services).</p>
                    <button onClick={handleDownloadTemplate} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
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
                        <p className="text-gray-600 mt-2">Nous avons validé votre fichier. {validCount} localisation(s) prête(s) à être importée(s), {errorCount} erreur(s) trouvée(s).</p>
                        <div className="mt-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Statut</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Type</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Nom</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Parent</th>
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
                                            <td className="px-4 py-2 text-gray-700 capitalize">{result.data.type || 'N/A'}</td>
                                            <td className="px-4 py-2 text-gray-700">{result.data.name || 'N/A'}</td>
                                            <td className="px-4 py-2 text-gray-700">{result.data.parentName || '-'}</td>
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
                    {isSaving ? 'Importation...' : `Importer ${validCount > 0 ? `(${validCount})` : ''} localisation(s)`}
                </Button>
            </div>
        </footer>
    </div>
  );
};

export default ImportLocationsForm;
