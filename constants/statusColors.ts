import { EquipmentStatus, UserRole } from '../types';

/**
 * Couleurs de status pour les équipements
 * 
 * Logique :
 * - VERT (success): Équipement disponible et prêt à l'utilisation
 * - BLEU (info): Équipement en cours d'utilisation (attribué)
 * - JAUNE (warning): Attend une action (validation)
 * - ORANGE (action): Nécessite attention (réparation)
 * - GRIS (neutral): Hors service ou stocké
 */
export const EQUIPMENT_STATUS_COLORS = {
  [EquipmentStatus.AVAILABLE]: 'bg-status-success-100 text-status-success-800 dark:bg-status-success-900/50 dark:text-status-success-300',
  [EquipmentStatus.IN_STORAGE]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  [EquipmentStatus.ASSIGNED]: 'bg-status-info-100 text-status-info-800 dark:bg-status-info-900/50 dark:text-status-info-300',
  [EquipmentStatus.PENDING_VALIDATION]: 'bg-status-warning-100 text-status-warning-800 dark:bg-status-warning-900/50 dark:text-status-warning-300',
  [EquipmentStatus.IN_REPAIR]: 'bg-status-action-100 text-status-action-800 dark:bg-status-action-900/50 dark:text-status-action-300',
  [EquipmentStatus.DECOMMISSIONED]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
} as const;

/**
 * Couleurs de rôle pour les utilisateurs
 * 
 * Logique :
 * - BLEU (info): Admin - Pouvoir technique
 * - VERT (success): Manager - Responsabilité organisationnelle
 * - GRIS (neutral): Employé - Utilisateur standard
 */
export const USER_ROLE_COLORS = {
  [UserRole.ADMIN]: 'bg-status-info-100 text-status-info-800 dark:bg-status-info-900/50 dark:text-status-info-300',
  [UserRole.MANAGER]: 'bg-status-success-100 text-status-success-800 dark:bg-status-success-900/50 dark:text-status-success-300',
  [UserRole.EMPLOYEE]: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
} as const;

/**
 * Tailles d'icônes standardisées
 * 
 * Usage :
 * - sm: Badges, petits boutons, items de liste
 * - md: Navigation, boutons standards, headers
 * - lg: FAB, emphasis, hero sections
 */
export const ICON_SIZES = {
  sm: 'text-xl',   // 20px
  md: 'text-2xl',  // 24px (default)
  lg: 'text-3xl',  // 30px
} as const;

/**
 * Helper function pour obtenir la couleur d'un status équipement
 */
export const getEquipmentStatusColor = (status: EquipmentStatus): string => {
  return EQUIPMENT_STATUS_COLORS[status] || EQUIPMENT_STATUS_COLORS[EquipmentStatus.DECOMMISSIONED];
};

/**
 * Helper function pour obtenir la couleur d'un rôle utilisateur
 */
export const getUserRoleColor = (role: UserRole): string => {
  return USER_ROLE_COLORS[role] || USER_ROLE_COLORS[UserRole.EMPLOYEE];
};
