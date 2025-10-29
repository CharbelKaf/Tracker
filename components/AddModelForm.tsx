



import React, { useState, useEffect } from 'react';
import type { Category, Model, ModelFormData } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { useToast } from '../contexts/ToastContext';
import PageHeader, { PageFooter } from './PageHeader';
import Button from './ui/Button';
import { FormField, Input, Select, Textarea } from './Form';


interface AddModelFormProps {
  onSave: (model: ModelFormData) => Promise<void>;
  onBack: () => void;
  categories: Category[];
  initialData?: Partial<Model>;
}

const AddModelForm: React.FC<AddModelFormProps> = ({ onSave, onBack, categories, initialData }) => {
  const [modelName, setModelName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<string>('');
  const [specifications, setSpecifications] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isFetchingSpecs, setIsFetchingSpecs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  const isEditing = !!initialData?.id;

  useEffect(() => {
    if (initialData) {
      setModelName(initialData.name || '');
      setBrand(initialData.brand || '');
      setType(initialData.categoryId || '');
      setSpecifications(initialData.specifications || '');
      setModelNumber(initialData.modelNumber || '');
    }
  }, [initialData]);

  const fetchModelSpecifications = async () => {
    if (!modelName.trim()) {
        addToast('Veuillez entrer un nom de modèle.', 'info');
        return;
    }

    setIsFetchingSpecs(true);
    addToast('Recherche des spécifications...', 'info');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                brand: { type: Type.STRING, description: 'La marque de l\'appareil (par exemple, Dell, Apple).' },
                category: { type: Type.STRING, description: 'La catégorie générale de l\'appareil (par exemple, Laptop, Monitor, Keyboard).' },
                specifications: { type: Type.STRING, description: 'Un bref résumé des spécifications techniques clés (par exemple, 14 pouces, Intel Core i7, 16 Go de RAM, 512 Go SSD).' }
            },
            required: ['brand', 'category', 'specifications']
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `À partir du nom de modèle "${modelName}", fournissez la marque, la catégorie et un résumé de ses spécifications clés.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        
        const jsonStr = response.text.trim();
        const specs = JSON.parse(jsonStr);

        setBrand(specs.brand || '');
        setSpecifications(specs.specifications || '');

        const lowerCaseCategory = (specs.category || '').toLowerCase();
        const matchedCategory = categories.find(c => c.name.toLowerCase() === lowerCaseCategory);
        if (matchedCategory) {
            setType(matchedCategory.id);
        } else {
             addToast(`Catégorie "${specs.category}" non trouvée. Veuillez la sélectionner manuellement.`, 'info');
        }

        addToast('Spécifications pré-remplies !', 'success');
    } catch (error) {
        console.error("Error fetching model specs:", error);
        addToast('Erreur lors de la récupération des spécifications.', 'error');
    } finally {
        setIsFetchingSpecs(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (modelName.trim() && brand.trim() && type) {
      setIsSaving(true);
      try {
        await onSave({
          modelName,
          modelNumber,
          brand,
          type,
          specifications,
          image,
          id: initialData?.id,
          imageUrl: initialData?.imageUrl
        });
      } catch (error) {
        addToast("La sauvegarde a échoué.", "error");
        setIsSaving(false);
      }
    }
  };
  
  const isFormValid = modelName.trim() && brand.trim() && type;

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <div className="flex-grow flex flex-col">
        <PageHeader title={isEditing ? 'Modifier le modèle' : 'Nouveau modèle'} onBack={onBack} />

        <main className="flex-1 p-4 space-y-6 overflow-y-auto">
          <form id="add-model-form" onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
            <FormField label="Nom du modèle" htmlFor="model-name">
              <div className="relative">
                <Input 
                  id="model-name" 
                  placeholder="ex: Dell Latitude 7420" 
                  type="text"
                  value={modelName}
                  onChange={e => setModelName(e.target.value)}
                />
                <button
                    type="button"
                    onClick={fetchModelSpecifications}
                    disabled={isFetchingSpecs || !modelName.trim()}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-primary-600 hover:bg-primary-50 rounded-r-md disabled:text-gray-400 disabled:cursor-not-allowed"
                    title="Remplir automatiquement les spécifications"
                    aria-label="Remplir automatiquement les spécifications"
                >
                    {isFetchingSpecs ? (
                        <span className="material-symbols-outlined animate-spin">autorenew</span>
                    ) : (
                        <span className="material-symbols-outlined">auto_awesome</span>
                    )}
                </button>
              </div>
            </FormField>
            <FormField label="Numéro de modèle" htmlFor="model-number">
              <Input
                id="model-number" 
                placeholder="ex: 20XLS11C002" 
                type="text"
                value={modelNumber}
                onChange={e => setModelNumber(e.target.value)}
              />
            </FormField>
            <FormField label="Marque" htmlFor="brand">
              <Input
                id="brand" 
                placeholder="ex: Apple" 
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
              />
            </FormField>
            <FormField label="Catégorie" htmlFor="type">
              <Select
                id="type"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                <option value="" disabled>Sélectionner une catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Spécifications" htmlFor="specifications">
              <Textarea
                id="specifications" 
                placeholder="ex: 16 pouces, M2 Pro, 16Go RAM, 512Go SSD" 
                rows={4}
                value={specifications}
                onChange={e => setSpecifications(e.target.value)}
              />
            </FormField>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-white">
                <div className="space-y-1 text-center">
                  <span className="material-symbols-outlined text-5xl text-gray-400"> cloud_upload </span>
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500" htmlFor="file-upload">
                      <span>Télécharger un fichier</span>
                      <input className="sr-only" id="file-upload" name="file-upload" type="file" onChange={e => setImage(e.target.files ? e.target.files[0] : null)} />
                    </label>
                    <p className="pl-1">ou glisser-déposer</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF jusqu'à 10MB</p>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
      
      <PageFooter contentClassName="max-w-2xl mx-auto">
        <Button type="submit" form="add-model-form" disabled={!isFormValid || isSaving} loading={isSaving}>
          {isSaving ? 'Enregistrement...' : (isEditing ? 'Enregistrer' : 'Créer')}
        </Button>
      </PageFooter>
    </div>
  );
};

export default AddModelForm;