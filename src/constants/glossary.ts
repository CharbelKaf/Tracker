/**
 * Glossaire officiel - Termes standardisés de l'application
 */
export const GLOSSARY = {
  // Entités
  EQUIPMENT: 'Équipement',
  EQUIPMENT_PLURAL: 'Équipements',
  USER: 'Utilisateur',
  USER_PLURAL: 'Utilisateurs',
  LOCATION: 'Emplacement',
  LOCATION_PLURAL: 'Emplacements',
  
  // Actions
  ADD: 'Ajouter',
  SAVE: 'Enregistrer',
  CANCEL: 'Annuler',
  CONFIRM: 'Confirmer',
  DELETE: 'Supprimer',
  ASSIGN: 'Attribuer',
  RETURN: 'Retourner',
  EXPORT: 'Exporter',
  IMPORT: 'Importer',
  
  // Pages
  DASHBOARD: 'Tableau de bord',
  INVENTORY: 'Inventaire',
  USERS: 'Utilisateurs',
  APPROVALS: 'Approbations',
  MANAGEMENT: 'Gestion',
  LOCATIONS: 'Emplacements',
  AUDIT: 'Audit',
  REPORTS: 'Rapports',
  SETTINGS: 'Paramètres',
  
  // Messages
  SUCCESS_CREATE: (entity: string) => `${entity} ajouté avec succès`,
  SUCCESS_UPDATE: (entity: string) => `${entity} modifié avec succès`,
  SUCCESS_DELETE: (entity: string) => `${entity} supprimé avec succès`,
  ERROR_REQUIRED: 'Ce champ est requis',
  ERROR_INVALID_EMAIL: 'Adresse e-mail invalide',
  ERROR_SERVER: 'Une erreur est survenue. Veuillez réessayer.',
  
  // Placeholders
  SEARCH_PLACEHOLDER: 'Rechercher...',
  EXAMPLE_PREFIX: 'Ex :',
} as const;
