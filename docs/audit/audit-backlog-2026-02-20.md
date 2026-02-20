# Audit Backlog - 2026-02-20

## P0 (immediat)

1. RBAC serveur/store sur actions destructives
- Scope: `deleteEquipment`, `deleteFinanceExpense`, mutations finance sensibles.
- Critere d'acceptation:
  - Refus explicite si role non autorise.
  - Message d'erreur coherent UI.
  - Journalisation `VIEW_SENSITIVE` ou `UPDATE` avec motif de refus.
- References: `src/context/DataContext.tsx:1123`, `src/context/DataContext.tsx:732`, `src/lib/businessRules.ts:473`.

2. Retrait des logs sensibles auth
- Scope: suppression des mots de passe temporaires en logs + flag demo login.
- Critere d'acceptation:
  - Aucun log de secret en clair.
  - Login demo inactive en mode production.
- References: `src/services/authService.ts:147`, `src/context/AuthContext.tsx:46`, `src/context/AuthContext.tsx:100`.

## P1 (court terme)

1. Normalisation des statuts workflow
- Scope: unifier `ApprovalStatus`/`AssignmentStatus` et labels.
- Critere d'acceptation:
  - Taxonomie canonique documentee.
  - Mapping legacy->canonique applique.
  - Badges cohérents (meme statut, meme libelle/couleur partout).
- References: `src/types/index.ts:259`, `src/lib/businessRules.ts:129`, `src/lib/businessRules.ts:159`.

2. Correctif responsive touch targets
- Scope: tous controles interactifs compact/medium.
- Critere d'acceptation:
  - Hit area >=48x48px pour boutons/icones interactifs.
  - `qa:devices:auto` sans fail touch target.
- References: `docs/md3-multidevice-audit-results-2026-02-20.md`.

3. Triage visual regression
- Scope: 24 ecrans changes vs baseline.
- Critere d'acceptation:
  - Liste "intentional vs bug" validee.
  - Baseline mise a jour uniquement pour changements approuves.
- References: `docs/md3-visual-regression-results-2026-02-20.md`.

4. Fix encodage textes budget
- Scope: `AddBudgetModal` et autres chaines accentuees degradees.
- Critere d'acceptation:
  - Aucun texte mojibake.
  - Relecture FR complete sur finance budget.
- References: `src/features/finance/components/AddBudgetModal.tsx:51`.

## P2 (moyen terme)

1. Refactor DataContext par domaine
- Scope: contexts separes inventory/users/finance/approvals + selectors memoises.
- Critere d'acceptation:
  - Diminution rerenders inutiles.
  - Code plus modulaire et testable.
- References: `src/context/DataContext.tsx:1359`, `src/hooks/useAccessControl.ts:37`.

2. Optimisation performance bundles
- Scope: lazy-load avancé des modules lourds PDF/XLSX.
- Critere d'acceptation:
  - Plus aucun warning >500kB.
  - Temps de chargement initial reduit.
- References: `docs/audit/audit-evidence-2026-02-20/auto/build.log`.

3. Harmonisation terminologie navigation
- Scope: remplacer toute divergence "Catalogue" / "Gestion".
- Critere d'acceptation:
  - Terminologie unique dans sidebar, topbar, titres, routes.
- References: `src/hooks/useAppNavigation.ts:19`, `src/components/layout/AppLayout.tsx:117`.

## Verification prevue
- `npm run lint`
- `npm run build`
- `npm run qa:a11y:auto`
- `npm run qa:devices:auto`
- `npm run qa:visual:auto`
