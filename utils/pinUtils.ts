/**
 * Utilitaires pour la gestion sécurisée des codes PIN
 */

// Configuration du PIN
export const PIN_CONFIG = {
  LENGTH: 6,
  MIN_LENGTH: 4,
  MAX_LENGTH: 8,
  PATTERN: /^\d+$/,
  MAX_ATTEMPTS: 3,
  LOCKOUT_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  VALIDATION_DELAY_MS: 500,
} as const;

// Types
export interface PinAttempt {
  userId: string;
  timestamp: number;
  success: boolean;
}

export interface PinLockout {
  userId: string;
  lockedUntil: number;
  attempts: number;
}

// Stockage des tentatives (en production, utiliser une vraie DB)
const attemptStore = new Map<string, PinAttempt[]>();
const lockoutStore = new Map<string, PinLockout>();

/**
 * Valide le format d'un PIN
 */
export const validatePinFormat = (pin: string): { valid: boolean; error?: string } => {
  if (!pin) {
    return { valid: false, error: 'Le code PIN est requis.' };
  }

  if (pin.length < PIN_CONFIG.MIN_LENGTH || pin.length > PIN_CONFIG.MAX_LENGTH) {
    return { 
      valid: false, 
      error: `Le code PIN doit contenir entre ${PIN_CONFIG.MIN_LENGTH} et ${PIN_CONFIG.MAX_LENGTH} chiffres.` 
    };
  }

  if (!PIN_CONFIG.PATTERN.test(pin)) {
    return { valid: false, error: 'Le code PIN ne doit contenir que des chiffres.' };
  }

  // Vérifier les patterns faibles
  if (isWeakPin(pin)) {
    return { 
      valid: false, 
      error: 'Ce code PIN est trop simple. Évitez les séquences (123456) ou répétitions (111111).' 
    };
  }

  return { valid: true };
};

/**
 * Détecte les PINs faibles
 */
export const isWeakPin = (pin: string): boolean => {
  // Tous les chiffres identiques (111111, 000000)
  if (/^(\d)\1+$/.test(pin)) {
    return true;
  }

  // Séquences croissantes (123456, 234567)
  const isAscending = pin.split('').every((digit, i, arr) => {
    if (i === 0) return true;
    return parseInt(digit) === parseInt(arr[i - 1]) + 1;
  });

  // Séquences décroissantes (654321, 987654)
  const isDescending = pin.split('').every((digit, i, arr) => {
    if (i === 0) return true;
    return parseInt(digit) === parseInt(arr[i - 1]) - 1;
  });

  return isAscending || isDescending;
};

/**
 * Hash un PIN pour le stockage sécurisé
 * Note: En production, utiliser bcrypt ou argon2 côté serveur
 * Utilise Web Crypto API pour compatibilité navigateur
 */
export const hashPin = async (pin: string, salt?: string): Promise<string> => {
  const pinSalt = salt || generateSalt();
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + pinSalt);
  
  // Utiliser Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${pinSalt}:${hashHex}`;
};

/**
 * Vérifie un PIN contre son hash
 */
export const verifyPin = async (pin: string, hashedPin: string): Promise<boolean> => {
  const [salt, hash] = hashedPin.split(':');
  const newHash = await hashPin(pin, salt);
  return newHash === hashedPin;
};

/**
 * Génère un salt aléatoire sécurisé
 */
const generateSalt = (): string => {
  // Utiliser crypto.getRandomValues pour plus de sécurité
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Vérifie si un utilisateur est verrouillé
 */
export const isUserLockedOut = (userId: string): boolean => {
  const lockout = lockoutStore.get(userId);
  if (!lockout) return false;

  const now = Date.now();
  if (now < lockout.lockedUntil) {
    return true;
  }

  // Lockout expiré, nettoyer
  lockoutStore.delete(userId);
  attemptStore.delete(userId);
  return false;
};

/**
 * Obtient le temps restant de verrouillage en secondes
 */
export const getLockoutTimeRemaining = (userId: string): number => {
  const lockout = lockoutStore.get(userId);
  if (!lockout) return 0;

  const now = Date.now();
  const remaining = Math.max(0, lockout.lockedUntil - now);
  return Math.ceil(remaining / 1000);
};

/**
 * Enregistre une tentative de PIN
 */
export const recordPinAttempt = (userId: string, success: boolean): void => {
  const attempts = attemptStore.get(userId) || [];
  const now = Date.now();

  // Ajouter la nouvelle tentative
  attempts.push({ userId, timestamp: now, success });

  // Garder seulement les tentatives récentes (dernière heure)
  const recentAttempts = attempts.filter(
    a => now - a.timestamp < 60 * 60 * 1000
  );

  attemptStore.set(userId, recentAttempts);

  // Vérifier si verrouillage nécessaire
  if (!success) {
    checkAndApplyLockout(userId, recentAttempts);
  }
};

/**
 * Vérifie et applique un verrouillage si nécessaire
 */
const checkAndApplyLockout = (userId: string, attempts: PinAttempt[]): void => {
  // Compter les échecs récents (dernières 5 minutes)
  const now = Date.now();
  const recentFailures = attempts.filter(
    a => !a.success && now - a.timestamp < 5 * 60 * 1000
  ).length;

  if (recentFailures >= PIN_CONFIG.MAX_ATTEMPTS) {
    lockoutStore.set(userId, {
      userId,
      lockedUntil: now + PIN_CONFIG.LOCKOUT_DURATION_MS,
      attempts: recentFailures,
    });
  }
};

/**
 * Réinitialise les tentatives d'un utilisateur (après succès ou admin reset)
 */
export const resetPinAttempts = (userId: string): void => {
  attemptStore.delete(userId);
  lockoutStore.delete(userId);
};

/**
 * Génère un PIN aléatoire sécurisé
 * Utilise crypto.getRandomValues pour une vraie aléatoire cryptographique
 */
export const generateSecurePin = (length: number = PIN_CONFIG.LENGTH): string => {
  let pin = '';
  let attempts = 0;
  const maxAttempts = 100;

  do {
    pin = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      // Convertir en chiffre 0-9
      pin += randomValues[i] % 10;
    }
    attempts++;
  } while (isWeakPin(pin) && attempts < maxAttempts);

  return pin;
};

/**
 * Masque un PIN pour l'affichage
 */
export const maskPin = (pin: string, visibleDigits: number = 0): string => {
  if (!pin) return '';
  
  if (visibleDigits === 0) {
    return '•'.repeat(pin.length);
  }

  const masked = '•'.repeat(Math.max(0, pin.length - visibleDigits));
  const visible = pin.slice(-visibleDigits);
  return masked + visible;
};

/**
 * Obtient les statistiques des tentatives
 */
export const getPinAttemptStats = (userId: string): {
  totalAttempts: number;
  failedAttempts: number;
  successRate: number;
  lastAttempt: number | null;
} => {
  const attempts = attemptStore.get(userId) || [];
  const totalAttempts = attempts.length;
  const failedAttempts = attempts.filter(a => !a.success).length;
  const successRate = totalAttempts > 0 
    ? ((totalAttempts - failedAttempts) / totalAttempts) * 100 
    : 0;
  const lastAttempt = attempts.length > 0 
    ? attempts[attempts.length - 1].timestamp 
    : null;

  return {
    totalAttempts,
    failedAttempts,
    successRate,
    lastAttempt,
  };
};

/**
 * Formate le temps de verrouillage restant
 */
export const formatLockoutTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  return `${minutes}m ${remainingSeconds}s`;
};
