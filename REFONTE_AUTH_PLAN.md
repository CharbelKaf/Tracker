# 🔐 Plan de refonte - Système d'authentification

## 📋 Analyse de l'existant

### Actuellement
- **Login:** Utilise le PIN (6 chiffres) comme mot de passe
- **Validation:** PIN pour valider les actions
- **Profil:** Bouton "Mot de passe" qui configure un PIN
- **Biométrie:** Empreinte digitale disponible mais pas intégrée

### Code actuel
```typescript
// Login.tsx ligne 53
if (user && user.pin === password) {
  // Login avec PIN au lieu de password
}

// User type
interface User {
  pin?: string;  // PIN 6 chiffres
  // Pas de champ password
}
```

---

## 🎯 Architecture cible

### 3 niveaux d'authentification

#### 1. **Mot de passe** (Password)
- **Usage:** Authentification initiale (login)
- **Format:** 8+ caractères, lettres + chiffres + symboles
- **Stockage:** Hashé avec bcrypt (backend)
- **UI:** Écran de login avec champ password classique

#### 2. **PIN** (6 chiffres)
- **Usage:** Validation rapide des actions dans l'app
- **Format:** 6 chiffres uniquement
- **Stockage:** Hashé localement
- **UI:** Clavier numérique 6 cases
- **Actions validées:**
  - Attribuer équipement
  - Retourner équipement
  - Approuver demande
  - Modifier données sensibles

#### 3. **Empreinte digitale** (Biométrie)
- **Usage:** Alternative au PIN pour validation
- **API:** Web Authentication API (WebAuthn)
- **Fallback:** PIN si biométrie non disponible
- **UI:** Icône empreinte + animation

---

## 📊 Modèle de données

### User (mis à jour)

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  
  // NOUVEAU: Authentification
  password: string;  // Hash bcrypt (backend)
  
  // Validation rapide
  pin?: string;      // Hash bcrypt (6 chiffres)
  
  // Biométrie
  fingerprintEnabled: boolean;
  fingerprintCredentialId?: string;  // WebAuthn credential
  
  // Existant
  role: string;
  department: string;
  avatarUrl: string;
  status: string;
}
```

---

## 🔄 Flux d'authentification

### 1. Login (première connexion)

```
┌─────────────┐
│ Écran Login │
│             │
│ Email       │
│ Password    │ ← Mot de passe (8+ chars)
│             │
│ [Connexion] │
└─────────────┘
       ↓
   Validation
       ↓
┌──────────────────┐
│ Configuration    │
│ initiale         │
│                  │
│ Créer PIN (opt.) │ ← 6 chiffres
│ Activer bio(opt.)│ ← Empreinte
└──────────────────┘
       ↓
   Dashboard
```

### 2. Validation d'action

```
Action sensible (ex: Attribuer équipement)
       ↓
┌──────────────────┐
│ Validation       │
│ requise          │
│                  │
│ [PIN]  [👆 Bio] │ ← Choix utilisateur
└──────────────────┘
       ↓
   Si PIN:
   ┌────────────┐
   │ 6 chiffres │
   └────────────┘
       ↓
   Si Biométrie:
   ┌────────────┐
   │ Scanner    │
   └────────────┘
       ↓
   Action validée
```

---

## 🛠️ Implémentation

### Phase 1: Modèle de données ✅

**Fichiers à modifier:**
- `types.ts` - Ajouter `password`, `fingerprintEnabled`, `fingerprintCredentialId`
- `data.ts` - Migrer users avec password par défaut
- `server/schemas/validation.ts` - Schémas password + PIN

### Phase 2: Backend API ✅

**Fichiers à modifier:**
- `server/routes/auth.ts` - Login avec password (pas PIN)
- `server/routes/users.ts` - Endpoints PIN + biométrie
- `server/auth/password.ts` - Validation password forte

**Nouveaux endpoints:**
```
POST /api/auth/login          - Email + Password
POST /api/auth/setup-pin      - Configurer PIN
POST /api/auth/validate-pin   - Valider PIN
POST /api/auth/setup-webauthn - Enregistrer biométrie
POST /api/auth/validate-webauthn - Valider biométrie
```

### Phase 3: Frontend - Login

**Fichiers à modifier:**
- `components/Login.tsx` - Password au lieu de PIN
- `components/LoginForm.tsx` - Idem pour nouveau composant

**Changements:**
```typescript
// AVANT
if (user && user.pin === password) { ... }

// APRÈS
// Appel API backend
const response = await api.login(email, password);
```

### Phase 4: Frontend - Validation

**Fichiers à modifier:**
- `components/PinValidator.tsx` - Garder tel quel (déjà bon)
- `components/FingerprintValidator.tsx` - Intégrer WebAuthn

**Nouveau composant:**
```typescript
// components/ActionValidator.tsx
// Combine PIN + Biométrie avec choix utilisateur
```

### Phase 5: Frontend - Profil

**Fichiers à modifier:**
- `components/Profile.tsx` - Séparer Password / PIN / Bio
- `components/UserDetails.tsx` - Idem pour admin
- `components/Modals.tsx` - Modals séparés

**UI Profil:**
```
┌─────────────────────────────┐
│ Sécurité                    │
├─────────────────────────────┤
│ 🔑 Mot de passe             │
│    Dernière modif: 15/01    │
│    [Modifier]               │
├─────────────────────────────┤
│ 🔢 Code PIN                 │
│    Un code PIN est défini   │
│    [Modifier]               │
├─────────────────────────────┤
│ 👆 Empreinte digitale       │
│    Activée                  │
│    [Gérer]                  │
└─────────────────────────────┘
```

---

## 🔒 Sécurité

### Password
- ✅ Min 8 caractères
- ✅ Lettres + chiffres requis
- ✅ Hash bcrypt (12 rounds)
- ✅ Stocké backend uniquement
- ✅ Validation Zod

### PIN
- ✅ 6 chiffres uniquement
- ✅ Pas de séquences (123456, 111111)
- ✅ Hash bcrypt local
- ✅ Rate limiting (5 tentatives)
- ✅ Timeout après échecs

### Biométrie
- ✅ WebAuthn API standard
- ✅ Credential stocké côté navigateur
- ✅ Challenge backend
- ✅ Fallback PIN si échec

---

## 📱 UX

### Onboarding
1. **Premier login:** Password obligatoire
2. **Setup optionnel:** "Voulez-vous configurer un PIN pour validation rapide ?"
3. **Biométrie:** "Activer l'empreinte digitale ?" (si supporté)

### Validation d'action
```
┌──────────────────────────┐
│ Valider l'action         │
├──────────────────────────┤
│                          │
│   [🔢 Code PIN]          │ ← Par défaut
│                          │
│   [👆 Empreinte]         │ ← Si activé
│                          │
│   Annuler                │
└──────────────────────────┘
```

### Gestion dans profil
- **Password:** Modal avec ancien + nouveau + confirmation
- **PIN:** Modal avec 6 chiffres + confirmation
- **Bio:** Enregistrement WebAuthn + test

---

## 🧪 Tests

### Scénarios
1. ✅ Login avec password
2. ✅ Login avec mauvais password
3. ✅ Configurer PIN
4. ✅ Valider action avec PIN
5. ✅ Valider action avec bio
6. ✅ Fallback bio → PIN
7. ✅ Modifier password
8. ✅ Modifier PIN
9. ✅ Désactiver biométrie

---

## 📦 Migration

### Données existantes

```typescript
// Migration users
users.forEach(user => {
  // PIN existant devient le password temporaire
  user.password = hashPassword(user.pin || '111111');
  
  // PIN reste pour validation
  user.pin = user.pin || null;
  
  // Biométrie désactivée par défaut
  user.fingerprintEnabled = false;
});
```

### Message utilisateurs
```
⚠️ Mise à jour de sécurité

Votre code PIN est maintenant utilisé uniquement
pour valider les actions rapides.

Veuillez configurer un mot de passe sécurisé
pour vous connecter.

Mot de passe temporaire: [votre ancien PIN]
```

---

## ⏱️ Estimation

- **Phase 1:** Modèle données - 30min
- **Phase 2:** Backend API - 2h
- **Phase 3:** Login frontend - 1h
- **Phase 4:** Validation frontend - 2h
- **Phase 5:** Profil UI - 1.5h
- **Tests:** 1h

**Total:** ~8h

---

## 🎯 Priorités

### Must-have (MVP)
1. ✅ Password pour login
2. ✅ PIN pour validation
3. ✅ Séparation UI profil

### Nice-to-have
1. ⏳ Biométrie WebAuthn
2. ⏳ Remember device
3. ⏳ 2FA optionnel

---

## 🚀 Prochaine étape

**Commencer par Phase 1:**
1. Modifier `types.ts` - Ajouter champs User
2. Migrer `data.ts` - Ajouter passwords
3. Tester compilation

**Voulez-vous que je commence l'implémentation ?**
