# 🔄 Notes de Migration - Gestion du PIN

## ⚠️ Changements Breaking

### 1. Fonctions asynchrones

Les fonctions `hashPin` et `verifyPin` sont maintenant **asynchrones** car elles utilisent l'API Web Crypto :

#### Avant :
```typescript
const hashed = hashPin('123456');
const isValid = verifyPin('123456', hashed);
```

#### Après :
```typescript
const hashed = await hashPin('123456');
const isValid = await verifyPin('123456', hashed);
```

### 2. Utilisation dans les composants

Si vous utilisez ces fonctions dans vos composants, vous devez les appeler dans une fonction async :

```typescript
const handleSavePin = async (pin: string) => {
  const hashedPin = await hashPin(pin);
  // Sauvegarder hashedPin
};
```

## ✅ Pas de changement nécessaire

Les éléments suivants fonctionnent **sans modification** :

- ✅ `PinValidator` component
- ✅ `usePin` hook
- ✅ `validatePinFormat()`
- ✅ `isWeakPin()`
- ✅ `generateSecurePin()`
- ✅ `maskPin()`
- ✅ `isUserLockedOut()`
- ✅ `getLockoutTimeRemaining()`
- ✅ `recordPinAttempt()`
- ✅ `resetPinAttempts()`
- ✅ `formatLockoutTime()`

## 🔧 Pourquoi ce changement ?

### Problème
Le module `crypto` de Node.js n'est pas disponible dans le navigateur, causant l'erreur :
```
Module "crypto" has been externalized for browser compatibility
```

### Solution
Utilisation de l'**API Web Crypto** qui est :
- ✅ Native dans tous les navigateurs modernes
- ✅ Plus sécurisée (vraie aléatoire cryptographique)
- ✅ Asynchrone par nature
- ✅ Standard web

## 📊 Comparaison

| Fonctionnalité | Avant (Node.js) | Après (Web Crypto) |
|----------------|-----------------|---------------------|
| Hash | `createHash('sha256')` | `crypto.subtle.digest('SHA-256')` |
| Random | `Math.random()` | `crypto.getRandomValues()` |
| Async | ❌ Synchrone | ✅ Asynchrone |
| Navigateur | ❌ Non compatible | ✅ Compatible |
| Sécurité | ⚠️ Pseudo-aléatoire | ✅ Cryptographique |

## 🚀 Exemples de migration

### Exemple 1 : Sauvegarder un PIN

```typescript
// ❌ Avant
const savePin = (userId: string, pin: string) => {
  const hashed = hashPin(pin);
  dispatch({ type: 'SAVE_PIN', payload: { userId, pin: hashed } });
};

// ✅ Après
const savePin = async (userId: string, pin: string) => {
  const hashed = await hashPin(pin);
  dispatch({ type: 'SAVE_PIN', payload: { userId, pin: hashed } });
};
```

### Exemple 2 : Vérifier un PIN

```typescript
// ❌ Avant
const checkPin = (pin: string, hashedPin: string) => {
  return verifyPin(pin, hashedPin);
};

// ✅ Après
const checkPin = async (pin: string, hashedPin: string) => {
  return await verifyPin(pin, hashedPin);
};
```

### Exemple 3 : Dans un useEffect

```typescript
// ✅ Correct
useEffect(() => {
  const initPin = async () => {
    const newPin = generateSecurePin();
    const hashed = await hashPin(newPin);
    setHashedPin(hashed);
  };
  
  initPin();
}, []);
```

## 📝 Checklist de migration

- [ ] Identifier tous les appels à `hashPin()`
- [ ] Identifier tous les appels à `verifyPin()`
- [ ] Ajouter `async` aux fonctions appelantes
- [ ] Ajouter `await` devant les appels
- [ ] Tester le flux complet de validation PIN
- [ ] Vérifier que le verrouillage fonctionne
- [ ] Tester la génération de PIN sécurisé

## 🔍 Où chercher

Fichiers susceptibles d'être affectés :
- `components/Modals.tsx` (PinManagementModal)
- `contexts/AppContext.tsx` (SAVE_PIN action)
- `components/UserDetails.tsx`
- `components/Profile.tsx`
- Tout composant personnalisé utilisant le PIN

## 💡 Bonnes pratiques

### 1. Toujours hasher en production
```typescript
// ❌ Ne jamais stocker en clair
user.pin = '123456';

// ✅ Toujours hasher
user.hashedPin = await hashPin('123456');
```

### 2. Gérer les erreurs
```typescript
try {
  const hashed = await hashPin(pin);
  // Sauvegarder
} catch (error) {
  console.error('Erreur de hashing:', error);
  showToast('Erreur lors de la sauvegarde du PIN', 'error');
}
```

### 3. Validation avant hashing
```typescript
const validation = validatePinFormat(pin);
if (!validation.valid) {
  showToast(validation.error, 'error');
  return;
}

const hashed = await hashPin(pin);
```

## 🆘 Support

Si vous rencontrez des problèmes :

1. **Vérifier la console** : Erreurs async/await ?
2. **Vérifier les imports** : `import { hashPin } from '../utils/pinUtils'`
3. **Vérifier le contexte** : Fonction async ?
4. **Consulter la doc** : `docs/PIN_MANAGEMENT.md`

## ✨ Avantages de la nouvelle implémentation

1. **Compatibilité navigateur** : Fonctionne partout
2. **Sécurité renforcée** : Vraie aléatoire cryptographique
3. **Standard web** : API native, pas de dépendance
4. **Performance** : Optimisé pour le navigateur
5. **Future-proof** : Suit les standards web modernes

---

**Date de migration** : 30 octobre 2025  
**Version** : 1.0.0 → 1.1.0
