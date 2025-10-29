import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import Tooltip from './Tooltip';
import PageHeader, { PageFooter } from './PageHeader';
import { useToast } from '../contexts/ToastContext';
import { FormSection, FormField, Input, Select } from './Form';
import Button from './ui/Button';

interface AddUserFormProps {
  onSave: (user: Partial<User> & { avatarFile?: File | null }) => Promise<void>;
  onBack: () => void;
  users: User[];
  initialData?: Partial<User>;
}

const DEPARTMENTS = [
    'Engineering',
    'Human Resources',
    'Marketing',
    'Sales',
    'Design',
    'Product',
    'Management',
    'IT'
];

const AddUserForm: React.FC<AddUserFormProps> = ({ onSave, onBack, users, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    department: '',
    managerId: '',
    role: UserRole.EMPLOYEE,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  const isEditing = !!initialData?.id;

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        employeeId: initialData.employeeId || '',
        email: initialData.email || '',
        department: initialData.department || '',
        managerId: initialData.managerId || '',
        role: initialData.role || UserRole.EMPLOYEE,
      });
      if (initialData.avatarUrl) {
        setPreviewUrl(initialData.avatarUrl);
      }
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setAvatarFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (formData.name.trim() && formData.employeeId.trim() && formData.email.trim()) {
      setIsSaving(true);
      try {
        await onSave({ ...formData, avatarFile, id: initialData?.id });
      } catch (error) {
        addToast("La sauvegarde a échoué.", "error");
        setIsSaving(false);
      }
    }
  };
  
  const managers = users
    .filter(u => u.role === UserRole.ADMIN || u.role === UserRole.MANAGER)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <PageHeader title={isEditing ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'} onBack={onBack} />

      <main className="flex-grow p-4 overflow-y-auto pb-24">
        <form className="max-w-2xl mx-auto space-y-8" id="add-user-form" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center space-y-4 pt-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-600 shadow-md">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-5xl">person</span>
                )}
              </div>
              <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-primary-500 text-white rounded-full p-2 cursor-pointer hover:bg-primary-600 shadow-sm transition-transform hover:scale-110">
                <span className="material-symbols-outlined">edit</span>
                <input id="avatar-upload" name="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} aria-label="Changer l'avatar" />
              </label>
            </div>
          </div>

          <FormSection title="Informations de l'utilisateur">
            <FormField label="Nom complet" htmlFor="name" className="md:col-span-2">
                <Input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Entrer le nom complet de l'utilisateur" />
            </FormField>
            
            <FormField label="Adresse e-mail" htmlFor="email">
                <Input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Entrer l'e-mail de l'utilisateur" />
            </FormField>

            <FormField label="ID de l'employé" htmlFor="employeeId" help={
              <Tooltip content="Le numéro d'identification officiel de l'employé, souvent utilisé pour la paie ou les systèmes internes.">
                <button type="button" className="cursor-help" aria-label="Plus d'informations sur l'ID de l'employé">
                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-base">info</span>
                </button>
              </Tooltip>
            }>
                <Input type="text" id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleInputChange} required placeholder="Entrer l'ID de l'employé" />
            </FormField>
          </FormSection>

          <FormSection title="Organisation">
            <FormField label="Département" htmlFor="department">
                <Select id="department" name="department" value={formData.department} onChange={handleInputChange}>
                    <option value="">Sélectionner le département</option>
                    {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </Select>
            </FormField>

            <FormField label="Rôle" htmlFor="role">
                <Select id="role" name="role" value={formData.role} onChange={handleInputChange}>
                    {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                </Select>
            </FormField>
            
            <FormField label="Responsable" htmlFor="managerId" className="md:col-span-2">
                <Select id="managerId" name="managerId" value={formData.managerId} onChange={handleInputChange}>
                    <option value="">Sélectionner le responsable</option>
                    {managers.map(manager => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
                </Select>
            </FormField>
          </FormSection>
        </form>
      </main>

      <PageFooter contentClassName="max-w-2xl mx-auto">
          <Button variant="secondary" onClick={onBack}>Annuler</Button>
          <Button type="submit" form="add-user-form" loading={isSaving} disabled={isSaving}>
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
      </PageFooter>
    </div>
  );
};

export default AddUserForm;