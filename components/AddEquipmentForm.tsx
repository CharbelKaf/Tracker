
import React, { useState, useMemo, useEffect } from 'react';
import type { Equipment, Category, Model, QrScanData, Country, Site, Department } from '../types';
import { EquipmentStatus } from '../types';
import Tooltip from './Tooltip';
import PageHeader, { PageFooter } from './PageHeader';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';
import { GoogleGenAI } from "@google/genai";
import { FormSection, FormField, Input, Select, Textarea } from './Form';

interface AddEquipmentFormProps {
  onSave: (equipment: Partial<Equipment>) => Promise<void>;
  onBack: () => void;
  categories: Category[];
  models: Model[];
  countries: Country[];
  sites: Site[];
  departments: Department[];
  initialData?: Partial<Equipment>;
}

const AddEquipmentForm: React.FC<AddEquipmentFormProps> = ({ onSave, onBack, categories, models, countries, sites, departments, initialData }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    modelId: '',
    assetTag: '',
    purchaseDate: '',
    warrantyStartDate: '',
    warrantyEndDate: '',
    status: EquipmentStatus.AVAILABLE,
    siteId: '',
    departmentId: '',
    os: '',
    ram: '',
    storage: '',
    agentS1: '',
    agentM42: 'Non',
    agentME: 'Non',
    notes: '',
    operationalStatus: 'Actif',
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const isEditing = !!initialData?.id;

  useEffect(() => {
    const newEquipmentData = sessionStorage.getItem('new-equipment-from-scan');
    if (newEquipmentData) {
        try {
            const parsedData: QrScanData = JSON.parse(newEquipmentData);
            setFormData(prev => ({
                ...prev,
                assetTag: parsedData.serialNumber,
                name: parsedData.hostname || '',
                os: parsedData.os || '',
                ram: parsedData.ramTotalGB ? `${parsedData.ramTotalGB} Go` : '',
            }));
            addToast("Pré-rempli à partir du scan QR.", "info");
        } catch (e) {
            console.error("Failed to parse new equipment data from scan", e);
        } finally {
            sessionStorage.removeItem('new-equipment-from-scan');
        }
    } else if (initialData) {
        const model = models.find(m => m.id === initialData.modelId);
        if (model) {
            setSelectedCategoryId(model.categoryId);
        }
        
        const site = sites.find(s => s.id === initialData.siteId);
        if (site) {
            setSelectedCountryId(site.countryId);
        }

        setFormData({
            name: initialData.name || '',
            modelId: initialData.modelId || '',
            assetTag: initialData.assetTag || '',
            purchaseDate: initialData.purchaseDate || '',
            warrantyStartDate: initialData.warrantyStartDate || '',
            warrantyEndDate: initialData.warrantyEndDate || '',
            status: initialData.status || EquipmentStatus.AVAILABLE,
            siteId: initialData.siteId || '',
            departmentId: initialData.departmentId || '',
            os: initialData.os || '',
            ram: initialData.ram || '',
            storage: initialData.storage || '',
            agentS1: initialData.agentS1 || '',
            agentM42: initialData.agentM42 || 'Non',
            agentME: initialData.agentME || 'Non',
            notes: initialData.notes || '',
            operationalStatus: initialData.operationalStatus || 'Actif',
        });
    }
  }, [initialData, models, sites, addToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
    setFormData(prev => ({ ...prev, modelId: '' }));
  };
  
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedCountryId(e.target.value);
      setFormData(prev => ({ ...prev, siteId: '', departmentId: '' }));
  };
  
  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, siteId: e.target.value, departmentId: '' }));
  };

  const fetchEquipmentDetails = async () => {
    if (!formData.assetTag.trim()) {
        addToast('Veuillez entrer un numéro de série.', 'info');
        return;
    }
    setIsFetchingDetails(true);
    addToast('Recherche des informations sur l\'appareil...', 'info');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const categoryList = categories.map(c => c.name).join(', ');
        const prompt = `Based on the device serial number "${formData.assetTag}", perform a web search to find its specifications. Provide the information you find in a "Key: Value" format on separate lines. Focus on these keys: "Model Name", "Brand", "Warranty End Date", "OS", "RAM", "Storage". If you cannot find a specific piece of information, omit the key.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const text = response.text;
        const details: { [key: string]: string } = {};
        const lines = text.split('\n');

        for (const line of lines) {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex > 0) {
                const key = line.substring(0, separatorIndex).trim();
                const value = line.substring(separatorIndex + 1).trim();
                if (value && value.toLowerCase() !== 'n/a') {
                    details[key] = value;
                }
            }
        }
        
        let detailsFound = false;
        const newFormData = { ...formData };

        if (details['Model Name']) {
            const foundModel = models.find(m => m.name.toLowerCase() === details['Model Name'].toLowerCase());
            if (foundModel) {
                newFormData.modelId = foundModel.id;
                setSelectedCategoryId(foundModel.categoryId);
                detailsFound = true;
            } else {
                addToast(`Modèle "${details['Model Name']}" non trouvé dans la base de données.`, 'info');
            }
        }
        if (details['Warranty End Date']) {
            // Check for valid date format before setting
            if (!isNaN(new Date(details['Warranty End Date']).getTime())) {
                newFormData.warrantyEndDate = new Date(details['Warranty End Date']).toISOString().split('T')[0];
                detailsFound = true;
            }
        }
        if (details['OS']) { newFormData.os = details['OS']; detailsFound = true; }
        if (details['RAM']) { newFormData.ram = details['RAM']; detailsFound = true; }
        if (details['Storage']) { newFormData.storage = details['Storage']; detailsFound = true; }

        setFormData(newFormData);
        if (detailsFound) {
            addToast('Détails de l\'appareil pré-remplis !', 'success');
        } else {
            addToast('Impossible de trouver des détails supplémentaires.', 'info');
        }
    } catch (error) {
        console.error("Error fetching equipment details:", error);
        addToast("Erreur lors de la recherche des détails.", 'error');
    } finally {
        setIsFetchingDetails(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (formData.modelId.trim() && formData.assetTag.trim()) {
      setIsSaving(true);
      const dataToSave: Partial<Equipment> = { ...formData };
      if (isEditing) {
          dataToSave.id = initialData?.id;
      }
      try {
        await onSave(dataToSave);
      } catch (error) {
        addToast("La sauvegarde a échoué.", "error");
        setIsSaving(false);
      }
    }
  };
  
  const filteredModels = useMemo(() => {
    if (!selectedCategoryId) return [];
    return models.filter(model => model.categoryId === selectedCategoryId);
  }, [models, selectedCategoryId]);
  
  const filteredSites = useMemo(() => {
      if (!selectedCountryId) return [];
      return sites.filter(s => s.countryId === selectedCountryId);
  }, [sites, selectedCountryId]);

  const filteredDepartments = useMemo(() => {
      if (!formData.siteId) return [];
      return departments.filter(d => d.siteId === formData.siteId);
  }, [departments, formData.siteId]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <PageHeader title={isEditing ? "Modifier l'équipement" : 'Ajouter un équipement'} onBack={onBack} />

      <main className="flex-grow p-4 overflow-y-auto pb-24">
        <form className="max-w-4xl mx-auto space-y-8" id="add-equipment-form" onSubmit={handleSubmit}>
          
          <FormSection title="Informations générales">
            <FormField label="Catégorie" htmlFor="category">
                <Select id="category" name="category" value={selectedCategoryId} onChange={handleCategoryChange}>
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
            </FormField>
             <FormField label="Modèle" htmlFor="modelId">
                <Select id="modelId" name="modelId" value={formData.modelId} onChange={handleInputChange} disabled={!selectedCategoryId} required>
                  <option value="">Sélectionner un modèle</option>
                  {filteredModels.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                </Select>
             </FormField>
             <FormField label="Numéro de série" htmlFor="assetTag">
                 <div className="relative">
                    <Input type="text" id="assetTag" name="assetTag" value={formData.assetTag} onChange={handleInputChange} required className="pr-12" placeholder="N° de série du fabricant" />
                    <button
                        type="button"
                        onClick={fetchEquipmentDetails}
                        disabled={isFetchingDetails || !formData.assetTag.trim()}
                        className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-primary-600 hover:bg-primary-50 rounded-r-md disabled:text-gray-400 disabled:cursor-not-allowed"
                        title="Rechercher les détails avec Gemini"
                        aria-label="Rechercher les détails avec Gemini"
                    >
                        {isFetchingDetails ? (
                            <span className="material-symbols-outlined animate-spin">autorenew</span>
                        ) : (
                            <span className="material-symbols-outlined">auto_awesome</span>
                        )}
                    </button>
                </div>
            </FormField>
            <FormField label="Nom AD (Hostname)" htmlFor="name" help={
                <Tooltip content="Le nom réseau de l'appareil (ex: LFW-4CE202CKM5)."><button type="button" className="cursor-help" aria-label="Plus d'informations sur le nom AD (Hostname)"><span className="material-symbols-outlined text-gray-400 text-base">info</span></button></Tooltip>
            }>
                <Input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nom de l'appareil sur le réseau" />
            </FormField>
          </FormSection>
          
          <FormSection title="Acquisition & Garantie">
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField label="Date d'achat" htmlFor="purchaseDate">
                    <Input type="date" id="purchaseDate" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} />
                </FormField>
                <FormField label="Début garantie" htmlFor="warrantyStartDate">
                    <Input type="date" id="warrantyStartDate" name="warrantyStartDate" value={formData.warrantyStartDate} onChange={handleInputChange} />
                </FormField>
                <FormField label="Fin garantie" htmlFor="warrantyEndDate">
                    <Input type="date" id="warrantyEndDate" name="warrantyEndDate" value={formData.warrantyEndDate} onChange={handleInputChange} />
                </FormField>
              </div>
          </FormSection>
          
          <FormSection title="Spécifications techniques">
             <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField label="Système d'exploitation" htmlFor="os">
                    <Input type="text" id="os" name="os" value={formData.os} onChange={handleInputChange} placeholder="ex: Windows 11 Pro" />
                </FormField>
                <FormField label="RAM" htmlFor="ram">
                    <Input type="text" id="ram" name="ram" value={formData.ram} onChange={handleInputChange} placeholder="ex: 16 Go" />
                </FormField>
                <FormField label="Disque dur" htmlFor="storage">
                    <Input type="text" id="storage" name="storage" value={formData.storage} onChange={handleInputChange} placeholder="ex: 512 Go SSD" />
                </FormField>
              </div>
          </FormSection>
          
          <FormSection title="Localisation & Statut">
            <FormField label="Pays" htmlFor="countryId">
                <Select id="countryId" name="countryId" value={selectedCountryId} onChange={handleCountryChange}>
                     <option value="">Sélectionner un pays</option>
                     {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </Select>
            </FormField>
            <FormField label="Site" htmlFor="siteId">
                <Select id="siteId" name="siteId" value={formData.siteId} onChange={handleSiteChange} disabled={!selectedCountryId}>
                     <option value="">Sélectionner un site</option>
                     {filteredSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </Select>
            </FormField>
            <FormField label="Service / Département" htmlFor="departmentId">
                <Select id="departmentId" name="departmentId" value={formData.departmentId} onChange={handleInputChange} disabled={!formData.siteId}>
                     <option value="">Sélectionner un service</option>
                     {filteredDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                 </Select>
            </FormField>
            <FormField label="Statut d'affectation" htmlFor="status">
                <Select id="status" name="status" value={formData.status} onChange={handleInputChange}>
                  {Object.values(EquipmentStatus).map(status => <option key={status} value={status}>{status}</option>)}
                </Select>
            </FormField>
            <FormField label="Statut Opérationnel" htmlFor="operationalStatus" className="md:col-span-2">
                <Select id="operationalStatus" name="operationalStatus" value={formData.operationalStatus} onChange={handleInputChange}>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="En réparation">En réparation</option>
                  <option value="En stock">En stock</option>
                </Select>
            </FormField>
          </FormSection>

          <FormSection title="Agents & Observations">
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField label="Agent SentinelOne" htmlFor="agentS1">
                    <Input type="text" id="agentS1" name="agentS1" value={formData.agentS1} onChange={handleInputChange} placeholder="Version de l'agent" />
                </FormField>
                <FormField label="Agent Matrix42" htmlFor="agentM42">
                    <Select id="agentM42" name="agentM42" value={formData.agentM42} onChange={handleInputChange}>
                        <option>Non</option>
                        <option>Oui</option>
                    </Select>
                </FormField>
                <FormField label="Agent ManageEngine" htmlFor="agentME">
                    <Select id="agentME" name="agentME" value={formData.agentME} onChange={handleInputChange}>
                        <option>Non</option>
                        <option>Oui</option>
                    </Select>
                </FormField>
            </div>
             <FormField label="Observations" htmlFor="notes" className="md:col-span-2">
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} rows={4} placeholder="Ajouter des notes ou des observations pertinentes..." />
            </FormField>
          </FormSection>
        </form>
      </main>

      <PageFooter contentClassName="max-w-4xl mx-auto">
          <Button variant="secondary" onClick={onBack}>Annuler</Button>
          <Button type="submit" form="add-equipment-form" loading={isSaving} disabled={isSaving}>
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
      </PageFooter>
    </div>
  );
};

export default AddEquipmentForm;
