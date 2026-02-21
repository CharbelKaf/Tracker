/**
 * Utilitaires de sécurité pour Tracker
 */

/**
 * Valide le code PIN administrateur.
 * En production, cette fonction appellerait une API pour vérifier le hash.
 */
export function validateAdminPIN(pin: string): boolean {
  // Mock pour la démo : le code est 123456
  return pin === '123456';
}

/**
 * Log une action sécurisée dans le journal d'audit global.
 */
export function logSecurityAction(
  action: string,
  userId: string,
  entityId: string,
  validationMethod: 'PIN' | 'PIN_SIGNATURE',
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED'
): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[SECURITY AUDIT][${timestamp}] User: ${userId} | Action: ${action} | Method: ${validationMethod} | Status: ${status}`;
  
  if (status === 'FAILED' || status === 'BLOCKED') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }
  
  // En production : appel API vers la table d'audit
}

