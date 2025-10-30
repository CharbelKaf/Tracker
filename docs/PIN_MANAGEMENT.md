# 📌 Gestion des Codes PIN - Guide Complet

## Vue d'ensemble

Le système de gestion des codes PIN dans Neemba Tracker permet une validation sécurisée des actions sensibles (approbations, retours d'équipement, etc.) tout en maintenant une expérience utilisateur fluide.

## 🔐 Sécurité

### Fonctionnalités de sécurité

1. **Limitation des tentatives**
   - Maximum 3 tentatives échouées
   - Verrouillage automatique après dépassement
   - Durée de verrouillage : 5 minutes

2. **Validation du format**
   - Longueur : 4 à 8 chiffres (par défaut 6)
   - Uniquement des chiffres
   - Détection des PINs faibles :
     - Répétitions (111111, 000000)
     - Séquences croissantes (123456, 234567)
     - Séquences décroissantes (654321, 987654)

3. **Feedback utilisateur**
   - Compteur de tentatives restantes
   - Timer de verrouillage en temps réel
   - Messages d'erreur clairs
   - Vibration haptique sur erreur (mobile)

## 📚 Utilisation

### 1. Composant PinValidator

Le composant principal pour valider un PIN :

```tsx
import PinValidator from './components/PinValidator';

<PinValidator
  onValidated={(isValid) => {
    if (isValid) {
      // Action à effectuer après validation
      handleApproval();
    }
  }}
  correctPin={user.pin}
  userName={user.name}
  userId={user.id}
  autoFocus={true}
  onLockout={(timeRemaining) => {
    console.log(`Verrouillé pour ${timeRemaining} secondes`);
  }}
/>
```

#### Props

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `onValidated` | `(isValid: boolean) => void` | ✅ | Callback appelé après validation |
| `correctPin` | `string` | ❌ | Le PIN correct à vérifier |
| `userName` | `string` | ❌ | Nom de l'utilisateur (pour personnalisation) |
| `userId` | `string` | ❌ | ID utilisateur (pour tracking des tentatives) |
| `autoFocus` | `boolean` | ❌ | Focus automatique sur le premier champ |
| `onLockout` | `(time: number) => void` | ❌ | Callback lors d'un verrouillage |

### 2. Hook usePin

Hook personnalisé pour une gestion avancée :

```tsx
import { usePin } from '../hooks/usePin';

function MyComponent() {
  const {
    isLocked,
    lockoutTimeRemaining,
    isValidating,
    validatePin,
    resetAttempts,
    checkLockout,
    generatePin,
    validateFormat,
    formatLockoutTime,
  } = usePin({
    userId: currentUser.id,
    onLockout: (time) => {
      showToast(`Verrouillé pour ${formatLockoutTime(time)}`);
    },
    onSuccess: () => {
      showToast('PIN validé !');
    },
    onError: (error) => {
      showToast(error, 'error');
    },
  });

  const handleSubmit = async (pin: string) => {
    const isValid = await validatePin(pin, currentUser.pin);
    if (isValid) {
      // Continuer le processus
    }
  };

  return (
    <div>
      {isLocked && (
        <p>Verrouillé pour {formatLockoutTime(lockoutTimeRemaining)}</p>
      )}
      {/* ... */}
    </div>
  );
}
```

### 3. Utilitaires PIN

Fonctions utilitaires disponibles dans `utils/pinUtils.ts` :

```tsx
import {
  validatePinFormat,
  isWeakPin,
  hashPin,
  verifyPin,
  generateSecurePin,
  maskPin,
  isUserLockedOut,
  getLockoutTimeRemaining,
  recordPinAttempt,
  resetPinAttempts,
  formatLockoutTime,
  PIN_CONFIG,
} from '../utils/pinUtils';

// Valider le format
const validation = validatePinFormat('123456');
if (!validation.valid) {
  console.error(validation.error);
}

// Vérifier si PIN faible
if (isWeakPin('111111')) {
  console.log('PIN trop simple');
}

// Générer un PIN sécurisé
const newPin = generateSecurePin(6); // Ex: "473829"

// Masquer un PIN
const masked = maskPin('123456', 2); // "••••56"

// Hasher un PIN (pour stockage)
const hashed = hashPin('123456');
// Vérifier
const isValid = verifyPin('123456', hashed);

// Vérifier le verrouillage
if (isUserLockedOut(userId)) {
  const remaining = getLockoutTimeRemaining(userId);
  console.log(`Verrouillé pour ${formatLockoutTime(remaining)}`);
}

// Réinitialiser les tentatives (admin)
resetPinAttempts(userId);
```

## ⚙️ Configuration

Configuration par défaut dans `utils/pinUtils.ts` :

```typescript
export const PIN_CONFIG = {
  LENGTH: 6,                    // Longueur par défaut
  MIN_LENGTH: 4,                // Longueur minimale
  MAX_LENGTH: 8,                // Longueur maximale
  PATTERN: /^\d+$/,             // Regex de validation
  MAX_ATTEMPTS: 3,              // Tentatives max avant verrouillage
  LOCKOUT_DURATION_MS: 5 * 60 * 1000,  // 5 minutes
  VALIDATION_DELAY_MS: 500,     // Délai de simulation
} as const;
```

## 🎨 Personnalisation UI

### États visuels

Le composant PinValidator affiche différents états :

1. **Idle** (repos)
   - Bordure grise
   - Fond blanc/gris foncé

2. **Validating** (validation en cours)
   - Bordure bleue (primary)
   - Fond bleu clair
   - Spinner animé

3. **Success** (succès)
   - Bordure verte
   - Fond vert clair
   - Icône check_circle

4. **Error** (erreur)
   - Bordure rouge
   - Fond rouge clair
   - Animation shake
   - Vibration haptique

5. **Locked** (verrouillé)
   - Bordure jaune
   - Fond jaune clair
   - Icône lock
   - Timer décompte

### Personnaliser les styles

```tsx
// Modifier les classes dans PinValidator.tsx
const getStatusClasses = () => {
  switch(status) {
    case 'success': 
      return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    case 'error': 
      return 'border-red-500 bg-red-50 dark:bg-red-900/20 animate-shake';
    // ...
  }
};
```

## 🔄 Workflow typique

### Validation d'une action

```
1. Utilisateur clique sur "Approuver"
   ↓
2. Modal de validation s'ouvre avec PinValidator
   ↓
3. Utilisateur saisit son PIN (6 chiffres)
   ↓
4. Validation automatique après 6ème chiffre
   ↓
5a. ✅ PIN correct
    → Animation de succès
    → Action exécutée
    → Modal se ferme
    
5b. ❌ PIN incorrect
    → Animation shake
    → Vibration
    → Message d'erreur avec tentatives restantes
    → Champs réinitialisés
    → Focus sur premier champ
    
5c. 🔒 Trop de tentatives
    → Verrouillage 5 minutes
    → Timer décompte affiché
    → Champs désactivés
```

## 🧪 Tests

### Tests unitaires

```typescript
// tests/unit/utils/pinUtils.test.ts
describe('PIN Utils', () => {
  it('should validate correct PIN format', () => {
    const result = validatePinFormat('123456');
    expect(result.valid).toBe(true);
  });

  it('should detect weak PINs', () => {
    expect(isWeakPin('111111')).toBe(true);
    expect(isWeakPin('123456')).toBe(true);
    expect(isWeakPin('473829')).toBe(false);
  });

  it('should lockout after max attempts', () => {
    const userId = 'test-user';
    
    // 3 tentatives échouées
    recordPinAttempt(userId, false);
    recordPinAttempt(userId, false);
    recordPinAttempt(userId, false);
    
    expect(isUserLockedOut(userId)).toBe(true);
  });
});
```

### Tests d'intégration

```typescript
// tests/integration/pin-validation.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react';
import PinValidator from '../components/PinValidator';

test('validates PIN correctly', async () => {
  const onValidated = jest.fn();
  const { getByLabelText } = render(
    <PinValidator
      onValidated={onValidated}
      correctPin="123456"
      userId="test-user"
    />
  );

  // Saisir le PIN
  for (let i = 0; i < 6; i++) {
    const input = getByLabelText(`PIN digit ${i + 1}`);
    fireEvent.change(input, { target: { value: String(i + 1) } });
  }

  await waitFor(() => {
    expect(onValidated).toHaveBeenCalledWith(true);
  });
});
```

## 📊 Monitoring

### Statistiques des tentatives

```typescript
import { getPinAttemptStats } from '../utils/pinUtils';

const stats = getPinAttemptStats(userId);
console.log({
  totalAttempts: stats.totalAttempts,
  failedAttempts: stats.failedAttempts,
  successRate: stats.successRate,
  lastAttempt: new Date(stats.lastAttempt),
});
```

## 🚀 Bonnes pratiques

### ✅ À faire

1. **Toujours hasher les PINs** en production
   ```typescript
   const hashedPin = hashPin(userPin);
   // Stocker hashedPin, pas userPin
   ```

2. **Utiliser userId unique** pour tracking
   ```typescript
   <PinValidator userId={user.id} />
   ```

3. **Gérer les callbacks**
   ```typescript
   onLockout={(time) => {
     // Notifier l'utilisateur
     // Logger l'événement
     // Désactiver les actions
   }}
   ```

4. **Valider côté serveur** également
   ```typescript
   // Frontend: validation UX
   // Backend: validation sécurité
   ```

### ❌ À éviter

1. **Ne pas stocker les PINs en clair**
   ```typescript
   // ❌ Mauvais
   user.pin = '123456';
   
   // ✅ Bon
   user.hashedPin = hashPin('123456');
   ```

2. **Ne pas ignorer les verrouillages**
   ```typescript
   // ❌ Mauvais
   if (pin === correctPin) { /* ... */ }
   
   // ✅ Bon
   if (!isUserLockedOut(userId) && pin === correctPin) { /* ... */ }
   ```

3. **Ne pas utiliser de PINs faibles par défaut**
   ```typescript
   // ❌ Mauvais
   const defaultPin = '000000';
   
   // ✅ Bon
   const defaultPin = generateSecurePin();
   ```

## 🔮 Améliorations futures

- [ ] Intégration avec backend pour persistance
- [ ] Support biométrique (Touch ID, Face ID)
- [ ] Historique des tentatives dans l'UI admin
- [ ] Notifications push lors de verrouillage
- [ ] Récupération de PIN par email/SMS
- [ ] PIN temporaire pour réinitialisation
- [ ] Analyse des patterns d'utilisation
- [ ] Support multi-facteur (PIN + biométrie)

## 📞 Support

Pour toute question ou problème :
- Consulter les tests unitaires pour exemples
- Vérifier la console pour les erreurs
- Utiliser `PIN_CONFIG` pour ajuster les paramètres
