/**
 * Utility functions for Financial Calculations with Inheritance Support
 */

// Taux de change fixes pour la démo (Base : 1 EUR)
const EXCHANGE_RATES: Record<string, number> = {
  'EUR': 1,
  'USD': 1.05,    // 1 EUR = 1.05 USD
  'XOF': 655.957, // 1 EUR = 655.957 FCFA (Taux fixe)
  'GBP': 0.85,    // 1 EUR = 0.85 GBP
  'JPY': 160      // 1 EUR = 160 JPY
};

export interface DepreciationConfig {
  method: 'linear' | 'degressive';
  years: number;
  salvagePercent: number;
  source: 'global' | 'category' | 'equipment';
}

/**
 * Résout la configuration finale d'amortissement selon la hiérarchie de priorité.
 * Ordre : Équipement (Override) > Catégorie > Paramètres Globaux
 */
export function resolveDepreciationConfig(
  equipmentOverride: Partial<DepreciationConfig> | null,
  categoryConfig: { method: 'linear' | 'degressive'; years: number; salvageValuePercent: number } | null | undefined,
  globalConfig: Omit<DepreciationConfig, 'source'>
): DepreciationConfig {
  // Priorité 1 : Override manuel sur l'équipement
  if (equipmentOverride && equipmentOverride.years && equipmentOverride.years > 0) {
    return {
      method: equipmentOverride.method || 'linear',
      years: equipmentOverride.years,
      salvagePercent: equipmentOverride.salvagePercent ?? 0,
      source: 'equipment',
    };
  }
  
  // Priorité 2 : Configuration par défaut de la catégorie
  if (categoryConfig && categoryConfig.years > 0) {
    return {
      method: categoryConfig.method,
      years: categoryConfig.years,
      salvagePercent: categoryConfig.salvageValuePercent,
      source: 'category',
    };
  }
  
  // Priorité 3 : Paramètres globaux du système
  return { 
    ...globalConfig, 
    source: 'global' 
  };
}

/**
 * Calcul de l'amortissement linéaire
 */
export function calculateLinearDepreciation(
  purchasePrice: number,
  purchaseDate: string | Date,
  depreciationYears: number,
  salvagePercent: number
) {
  const pDate = typeof purchaseDate === 'string' ? new Date(purchaseDate) : purchaseDate;
  const salvageValue = purchasePrice * (salvagePercent / 100);
  const depreciableAmount = purchasePrice - salvageValue;
  
  if (depreciationYears <= 0) {
      return {
          purchasePrice,
          salvageValue,
          currentValue: purchasePrice,
          totalDepreciation: 0,
          monthlyDepreciation: 0,
          progressPercent: 0,
          isFullyDepreciated: false,
      };
  }

  const annualDepreciation = depreciableAmount / depreciationYears;
  const monthlyDepreciation = annualDepreciation / 12;
  
  // Calcul des mois écoulés
  const monthsElapsed = getMonthsDifference(pDate, new Date());
  
  const totalDepreciation = Math.min(
    monthlyDepreciation * monthsElapsed,
    depreciableAmount
  );
  
  const currentValue = purchasePrice - totalDepreciation;
  
  return {
    purchasePrice,
    salvageValue,
    currentValue: Number(currentValue.toFixed(2)),
    totalDepreciation: Number(totalDepreciation.toFixed(2)),
    monthlyDepreciation: Number(monthlyDepreciation.toFixed(2)),
    progressPercent: depreciableAmount > 0 ? (totalDepreciation / depreciableAmount) * 100 : 100,
    isFullyDepreciated: totalDepreciation >= depreciableAmount,
  };
}

/**
 * Helper : différence en mois entre deux dates
 */
function getMonthsDifference(startDate: Date, endDate: Date): number {
  if (isNaN(startDate.getTime())) return 0;
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth())
  );
}

/**
 * Formatage monétaire standardisé avec support dynamique de la conversion et de la devise.
 * Convertit automatiquement le montant (supposé en EUR) vers la devise cible.
 * 
 * @param amount Montant en devise de base (EUR)
 * @param currency Code devise cible (ex: 'XOF', 'USD')
 * @param compact Si true, utilise la notation compacte (ex: 2K, 1.5M)
 */
export const formatCurrency = (amount: number, currency = 'EUR', compact = false) => {
  let locale = 'fr-FR';
  
  // Configuration Locale
  if (currency === 'USD') locale = 'en-US';
  if (currency === 'GBP') locale = 'en-GB';
  if (currency === 'JPY') locale = 'ja-JP';
  
  // 1. Appliquer le taux de change (Conversion de EUR vers Target)
  const rate = EXCHANGE_RATES[currency] || 1;
  const convertedAmount = amount * rate;

  // 2. Définir les décimales (0 pour XOF/JPY, 2 pour les autres)
  const digits = (currency === 'XOF' || currency === 'JPY') ? 0 : 2;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: compact ? 0 : digits,
    maximumFractionDigits: compact ? 1 : digits,
    notation: compact ? 'compact' : 'standard',
    compactDisplay: 'short',
    useGrouping: true // Assure le séparateur de milliers
  }).format(convertedAmount);
};

/**
 * Formatage de nombres simples (compteurs, stats)
 */
export const formatNumber = (amount: number, compact = false) => {
    return new Intl.NumberFormat('fr-FR', {
        notation: compact ? 'compact' : 'standard',
        compactDisplay: 'short',
        useGrouping: true,
        maximumFractionDigits: 1
    }).format(amount);
};
