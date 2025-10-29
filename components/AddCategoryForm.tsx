
import React, { useState, useEffect } from 'react';
import type { Category } from '../types';
import PageHeader, { PageFooter } from './PageHeader';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';
import { FormField, Input, Textarea } from './Form';

interface AddCategoryFormProps {
  onSave: (category: { name: string; description: string; icon: string; id?: string }) => Promise<void>;
  onBack: () => void;
  initialData?: Category;
}

const AVAILABLE_ICONS = [
    'laptop_chromebook', 'desktop_windows', 'keyboard', 'mouse', 'dock', 
    'headphones', 'desktop_mac', 'print', 'devices_other', 'router', 
    'camera_alt', 'smartphone', 'tablet_mac', 'scanner', 'speaker', 'memory'
];


const AddCategoryForm: React.FC<AddCategoryFormProps> = ({ onSave, onBack, initialData }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(AVAILABLE_ICONS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setIcon(initialData.icon || AVAILABLE_ICONS[0]);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (name.trim()) {
      setIsSaving(true);
      try {
        await onSave({ name, description, icon, id: initialData?.id });
      } catch (error) {
        addToast("La sauvegarde a échoué.", "error");
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <PageHeader title={isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie'} onBack={onBack} />

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
            <form id="add-category-form" onSubmit={handleSubmit} className="space-y-6">
              <FormField label="Nom de la catégorie" htmlFor="category-name">
                <Input
                  id="category-name"
                  placeholder="ex: Ordinateurs portables, Moniteurs"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Description" htmlFor="description">
                <Textarea
                  id="description"
                  placeholder="Saisissez une brève description de la catégorie"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FormField>
               <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Icône</label>
                <div className="grid grid-cols-6 md:grid-cols-8 gap-2 rounded-lg border border-gray-300 bg-white p-2">
                  {AVAILABLE_ICONS.map(iconName => (
                    <button 
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`flex items-center justify-center aspect-square rounded-md transition-colors ${icon === iconName ? 'bg-primary-500 text-gray-900 ring-2 ring-offset-2 ring-primary-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                       aria-label={`Sélectionner l'icône ${iconName}`}
                       title={iconName.replace(/_/g, ' ')}
                    >
                      <span className="material-symbols-outlined">{iconName}</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
        </div>
      </main>

      <PageFooter contentClassName="max-w-2xl mx-auto">
        <Button type="submit" form="add-category-form" disabled={!name.trim() || isSaving} loading={isSaving}>
          {isSaving ? 'Enregistrement...' : (isEditing ? 'Enregistrer' : 'Créer')}
        </Button>
      </PageFooter>
    </div>
  );
};

export default AddCategoryForm;
