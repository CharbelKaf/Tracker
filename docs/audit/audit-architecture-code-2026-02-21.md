# Audit Architecture & Code - 2026-02-21

## Scope
- Category: Architecture & Code
- Focus: code quality, maintainability, technical debt, component structure, separation of concerns, documentation consistency.
- Codebase snapshot: `main` on 2026-02-21.

## Method
- Static review of high-impact files:
- `src/context/DataContext.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/hooks/useRouter.ts`
- `src/hooks/useAppNavigation.ts`
- `src/features/finance/pages/FinanceManagementPage.tsx`
- `src/features/management/pages/ManagementPage.tsx`
- `src/features/users/pages/UserDetailsPage.tsx`
- `src/features/inventory/pages/AssignmentWizardPage.tsx`
- `src/hooks/useAccessControl.ts`
- `tsconfig.json`
- `README.md`
- `AGENTS.md`

## Findings

### Critical
1. Monolithic domain store in `DataContext`
- Evidence: `src/context/DataContext.tsx:313`, `src/context/DataContext.tsx:498`, `src/context/DataContext.tsx:1397`.
- Observation: one provider currently owns users, equipment, approvals, finance, locations, settings, persistence, and business mutations.
- Risk: high coupling, broad rerenders, difficult testing, risky refactors.

2. Routing architecture divergence
- Evidence: `src/hooks/useRouter.ts:5`, `src/hooks/useAppNavigation.ts:42`, `src/components/layout/AppLayout.tsx:140`, `src/routes/index.ts:1`.
- Observation: React Router is declared in dependencies and AGENTS, but navigation is custom hash-routing with duplicated route/view mappings.
- Risk: inconsistent behavior, route drift, higher change cost.

### Major
3. Oversized feature pages
- Evidence: `src/features/finance/pages/FinanceManagementPage.tsx:133`, `src/features/management/pages/ManagementPage.tsx:52`, `src/features/users/pages/UserDetailsPage.tsx:36`, `src/features/inventory/pages/AssignmentWizardPage.tsx:28`.
- Observation: single files combine data derivation, workflow logic, modal orchestration, and rendering.
- Risk: low readability, high regression probability.

4. UI-layer business logic concentration
- Evidence: `src/features/finance/pages/FinanceManagementPage.tsx:273`, `src/features/finance/pages/FinanceManagementPage.tsx:350`, `src/features/finance/components/AddExpenseModal.tsx:146`, `src/features/finance/components/AddExpenseModal.tsx:235`.
- Observation: business workflows (dedupe/validation/import/review/delete policy) are largely orchestrated in UI components.
- Risk: duplicated behavior, uneven rules across screens.

5. Access control hook consistency gaps
- Evidence: `src/hooks/useAccessControl.ts:37`, `src/hooks/useAccessControl.ts:116`, `src/features/inventory/pages/InventoryPage.tsx:42`.
- Observation: access-control functions are recreated each render and one policy branch is explicitly undecided ("Fail safe or strict?").
- Risk: unstable memo dependencies, policy ambiguity in edge cases.

### Moderate
6. TypeScript guardrails are too permissive
- Evidence: `tsconfig.json:19`, `tsconfig.json:27`.
- Observation: `allowJs: true` and no strict compiler mode.
- Risk: weaker compile-time guarantees for a large codebase.

7. Documentation drift
- Evidence: `README.md:5`, `AGENTS.md:14`, `src/hooks/useRouter.ts:5`.
- Observation: README still presents generic AI Studio framing while runtime navigation is custom; docs mention React Router as primary routing.
- Risk: onboarding friction and incorrect implementation assumptions.

8. Residual lint artifact tracked in repository
- Evidence: `lint_report.txt` (removed in this update), `.gitignore:4`.
- Observation: obsolete lint output had been committed, while local lint currently passes.
- Risk: noise and confusion during audits/reviews.

## Priority action plan

### P1 (next sprint)
1. Split `DataContext` by domain (`Inventory`, `Users`, `Finance`, `Approvals`, `Settings`) and expose typed selectors.
2. Create a single canonical route map and remove duplicate view-title mappings.
3. Extract finance orchestration to dedicated hooks/services (`useFinanceExpenses`, `useExpenseImportFlow`).

### P2 (2-3 sprints)
1. Migrate hash router to React Router route config.
2. Add typed policy module for access control decisions and remove ambiguous branches.
3. Introduce incremental TypeScript hardening (`strict` rollout per folder).

### P3 (continuous)
1. Maintain architecture decision records for routing/state-management changes.
2. Keep audit docs synchronized with implementation (`README`, `AGENTS`, `docs/audit`).

## Verification gates
- `npm run lint`
- `npm run build`
- Manual smoke test: login, inventory, users, approvals, finance, settings.

## Update after cleanup (2026-02-21)
- `npm run lint`: OK (0 erreurs).
- `npm run build`: OK.
- `npx knip`: OK (plus aucun fichier/exports inutilisés signalé).

### Improvements completed
1. Finance state split
- Finance moved out of `DataContext` into dedicated `FinanceDataContext` for better separation of concerns.

2. Duplicate export cleanup
- Duplicate `default + named` exports removed across layout/UI components.
- Imports harmonized (named/default) to keep behavior unchanged.

3. Dead code cleanup
- Unused barrel files and legacy UI files removed.
- Obsolete lint artifact removed (`lint_report.txt` deleted, `lint_errors.log` no longer tracked).
- Internal-only constants/functions no longer exported.
- Removed unused backend stub functions:
  - `backend/functions/HttpTrigger_CreateUser/index.js`
  - `backend/functions/HttpTrigger_Login/index.js`

4. Type surface reduction
- Unused exported types/interfaces converted to internal types where appropriate.
- Public API surface reduced, lowering maintenance overhead.
