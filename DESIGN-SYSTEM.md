# Design System - Neemba Tracker

## 🎨 Vue d'ensemble

Ce document définit les standards UI/UX pour Neemba Tracker. Suivez ces guidelines pour maintenir une expérience utilisateur cohérente.

---

## 🎨 Couleurs

### Palette principale

**Primary (Jaune/Or)**
- Usage : Accent, CTA, éléments interactifs
- Tokens : `designTokens.colors.primary[50-900]`
- CSS vars : `var(--color-primary-50)` → `var(--color-primary-900)`
- Exemple : Boutons d'action, liens actifs, highlights

**Status Colors**
- Tokens : `designTokens.colors.status.success|info|warning|action|danger`
- Helpers : `constants/statusColors.ts`
- CSS vars recommandées : `var(--color-status-success-500)` etc.

| Status | Couleur | Usage | Tokens |
|--------|---------|-------|--------|
| **Success** | Vert | Disponible, positif, validé | `designTokens.colors.status.success` |
| **Info** | Bleu | Attribué, informatif, admin | `designTokens.colors.status.info` |
| **Warning** | Jaune | Attend action, attention | `designTokens.colors.status.warning` |
| **Action** | Orange | Nécessite intervention | `designTokens.colors.status.action` |
| **Danger** | Rouge | Erreur, suppression, critique | `designTokens.colors.status.danger` |
| **Neutral** | Gris | Inactif, désactivé, neutre | `gray-*` (Tailwind) |

#### Exemples d'utilisation

```tsx
import { designTokens } from '../constants/designTokens';

// Exemple d'utilisation côté TS/React
const PrimaryCard = () => (
  <div
    style={{
      backgroundColor: designTokens.colors.primary[50],
      boxShadow: designTokens.elevations.elev1,
      borderRadius: designTokens.radii.card,
    }}
    className="p-4"
  >
    <h3 className="text-sm font-semibold text-gray-900">Titre</h3>
    <p className="text-sm text-gray-600">Contenu de la carte…</p>
  </div>
);
```

```css
/* Exemple d'utilisation via variables CSS */
.btn-primary {
  background-color: var(--color-primary-500);
  color: #111827;
  border-radius: var(--radius-button);
  box-shadow: var(--shadow-elev-1);
}
```

### Logique des status équipements

```typescript
AVAILABLE       → Vert (success)   - Prêt à être utilisé
IN_STORAGE      → Gris (neutral)   - Stocké, disponible mais pas prioritaire
ASSIGNED        → Bleu (info)      - En cours d'utilisation
PENDING_VALIDATION → Jaune (warning) - Attend une action
DECOMMISSIONED  → Gris (neutral)   - Hors service

## 🎨 Design Tokens

### Palette secondaire

| Catégorie | Token | Valeur | Notes |
|-----------|-------|--------|-------|
| Couleurs secondaires | `var(--color-secondary-500)` | `#6e87a7` | Neutres froids pour équilibrer le jaune |

### Typography

| Catégorie | Token | Valeur | Notes |
|-----------|-------|--------|-------|
| Font | `font-family: var(--font-sans)` | `Inter` | Base (line-height 1.7)
MANAGER  → Vert (success)  - Responsabilité organisationnelle
EMPLOYEE → Gris (neutral)  - Utilisateur standard
```

---

## 📐 Typography

### Hiérarchie des titres

```tsx
// Page title (Header)
<h1 className="text-lg font-bold">Titre principal</h1>

// Section title
<h2 className="text-base md:text-lg font-bold">Section</h2>

// Card/Widget title
<h3 className="text-sm font-semibold">Carte</h3>

// Subtitle / Description
<p className="text-xs text-gray-500 dark:text-gray-400">Subtitle</p>
```

### Tailles de texte

| Taille | Classe | Usage |
|--------|--------|-------|
| XS | `text-xs` | Labels, badges, captions |
| SM | `text-sm` | Body text, descriptions |
| Base | `text-base` | Default, paragraphs |
| LG | `text-lg` | Page titles, emphasis |
| XL | `text-xl` | Hero, large titles |

---

## 🔘 Components

### PageHeader

**Standard avec subtitle**
```tsx
<PageHeader 
    title="Tableau de bord" 
    subtitle="Bienvenue, Jean Dupont"
>
    <PageHeaderActions actions={actions} />
</PageHeader>
```

**Avec retour**
```tsx
<PageHeader 
    title="Détails équipement" 
    onBack={() => window.location.hash = '#/inventory'}
>
    <PageHeaderActions actions={actions} />
</PageHeader>
```

**Mode sélection**
```tsx
<SelectionHeader 
    count={selectedIds.size} 
    onCancel={() => setSelectedIds(new Set())} 
    onDelete={handleBulkDelete} 
/>
```

---

### Buttons & Actions

#### Pattern 1: PageHeaderActions (Desktop + Mobile)

**Usage**: Actions principales dans le header de page

```tsx
const actions = [
    { label: 'Ajouter', icon: 'add', onClick: handleAdd },
    { label: 'Importer', icon: 'upload', onClick: handleImport },
    { label: 'Paramètres', icon: 'settings', onClick: handleSettings },
];

<PageHeaderActions actions={actions} />
```

- Desktop: Menu trois points (⋮) en haut à droite
- Mobile: Même comportement, toujours visible

---

#### Pattern 2:### Floating Action Button
 (Mobile uniquement)

**Usage**: Action principale rapide (Ajouter)

```tsx
const fabActions = [
{{ ... }}
- [ ] **Icons**: Utilise les tailles standardisées
- [ ] **Loading**: Affiche un skeleton si applicable
- [ ] **Accessibility**: Labels, ARIA, keyboard navigation
- [ ] **Dark mode**: Support light/dark
- [ ] **Animations**: Transitions fluides
- [ ] **Pattern**: Suit les patterns existants

### Animations

#### Mobile Navigation

- `components/MobileNav.tsx`
- `motion.footer` pour l'entrée (spring `y` + `opacity`).
- Boutons en `motion.button` avec `whileTap` (0.94) et `whileHover` (1.02), transitions `spring` `stiffness:320` `damping:22`.
- Respecter les classes actives pour la couleur; les animations ne doivent pas altérer le style actif.

#### Dropdown menus

- `components/DropdownMenu.tsx` (mobile sheet) : overlay fade, contenu slide-up (spring). Boutons animés `whileTap`/`whileHover`.
- `ListItemCard` (desktop) : popover `AnimatePresence` avec fade + translate, boutons animés identiquement.
- Garder `AnimatePresence` pour gérer la sortie et éviter clignements.

### Toolbars & menus enregistrés

- `components/FilterToolbar.tsx` (`Vues`) : panneau enregistré animé via `AnimatePresence` + `motion.div` (fade + scale + translate). Actions internes utilisent des feedbacks `whileTap`/`whileHover`.

### Surfaces & Dashboard

- `index.css` : utilitaires `surface-card`, `surface-card-gradient` (blur léger, hover elevé, gradient primaire/secondaire).
- `components/Dashboard.tsx` : widgets adoptent ces surfaces + typographie `tracking-tight`, badges stats en `bg-secondary-100` / `dark:bg-secondary-800/40`.
- `components/ui/Modal.tsx` : modales Radix appliquent `surface-card` + gradient, titre `text-xl tracking-tight`, footer séparé (border secondaire).

### Gestion des emplacements

- `components/Locations.tsx` : explorateur à colonnes (Pays → Sites → Services) en `surface-card surface-card-gradient`, actions via `Button` partagé et panneau de détails contextuel.
- `SelectAuditLocation.tsx` : sélection d'audit reprise avec surfaces harmonisées, progress bars dégradées et CTA `Button` (`Commencer/Continuer/Rapport`).

### Tooltips

- `components/Tooltip.tsx` : gradient secondaire (`bg-gradient-to-br from-secondary-900 ...`), border translucide et blur, flèche synchronisée avec les couleurs.

### Tabs & navigation secondaires

- `components/PageHeader.tsx` (`Tabs`) : boutons tabbés en `motion.button` avec feedback `whileTap`. Barre active partagée via `layoutId="tab-active-indicator"` pour animer la transition.

### Toasts & notifications

- `components/Toast.tsx` : apparition/disparition via `AnimatePresence` + `motion.div` (spring + fade). Barre de progression animée en `motion.div` (ease linear). Boutons d'action/fermeture utilisent `whileTap`/`whileHover`.


- Utiliser `transition` courts (`duration < 0.25s`) sur mobile pour garder la fluidité.
- Les animations doivent être optionnelles et accessibles (éviter flashes). Penser à exposer un toggle ultérieur dans les préférences si nécessaire.
- Préférer `AnimatePresence` pour gérer le cycle de vie (entrée/sortie) des overlays/menus.
- ✅ Dark mode support partout

### DON'T ❌

- ❌ Hardcoder les couleurs de status dans les composants
{{ ... }}
- ❌ FAB sur desktop (utiliser PageHeaderActions)
- ❌ Formulaires longs sans wizard
- ❌ Modals différentes pour même usage
- ❌ Breakpoints incohérents

---

## 📚 Références

- **Types**: `types.ts`
- **Constants**: `constants/statusColors.ts`
- **Composants**: `components/`
- **Exemples**:
  - PageHeader: `Dashboard.tsx`, `Inventory.tsx`
  - FloatingActionButton: `Management.tsx`
  - Modals: `SettingsSheet.tsx`, `Modals.tsx`
  - Forms: `AssignmentWizard.tsx`, `AddEquipmentForm.tsx`

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2025-10-10  
**Maintenu par**: Équipe Neemba Tracker
