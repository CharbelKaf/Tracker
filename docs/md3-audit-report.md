# MD3 Compliance Audit Report

Date: 2026-02-16  
Scope: Entire React application (`src/**`)  
Target: Material Design 3 strict + WCAG AA

## Executive Summary

The codebase has an established MD3 token foundation and custom MD3 component primitives, but drift existed in implementation usage.  
This implementation pass focused on P0 controls and foundation hardening:

- Replaced legacy visual tokens in source (`text-dark`, `bg-dark`, `surface-subtle`, `variant="outline"`).
- Introduced dynamic MD3 theme generation from accent seed color.
- Added MD3 guardrails script and integrated it into `npm run lint`.
- Standardized button variant compatibility (`outlined` and legacy `outline` alias).

## Current Metrics

- Feature page files: 29
- UI primitive component files: 38
- Legacy token violations (`text-dark`, `bg-dark`, `surface-subtle`, `variant="outline"`): 0
- Hex color literals in `src`: 13
- Native control usage (`<button|input|select|textarea>`): 25
- Native controls outside DS layer (`features/context/layout/modals/security`): 0
- Design-system primitive usage (`<Button|InputField|SelectField|TextArea|Checkbox|RadioButton|Toggle|IconButton|SegmentedButton|Chip|Slider|FileDropzone>`): 240

## What Was Implemented

1. Dynamic MD3 theming:
- Added `src/lib/md3Theme.ts`.
- Replaced manual accent overrides in `src/context/DataContext.tsx` with generated scheme roles.
- Added system theme change listener (`prefers-color-scheme`) for live token sync when `theme = system`.

2. Legacy drift cleanup:
- Replaced legacy classes in `src/**`:
  - `text-dark` -> semantic MD3 tokens (`text-on-surface` / `text-on-primary` as applicable)
  - `bg-dark` -> `bg-surface-container-high`
  - `surface-subtle` -> `surface-container-low`
  - `border-dark` -> `border-on-surface`

3. Component API consistency:
- `src/components/ui/Button.tsx` now supports `outline` as backward-compatible alias of `outlined`.
- Updated usage in `src/features/management/pages/SettingsPage.tsx` to `variant="outlined"`.

4. Guardrails:
- Added `scripts/check-md3-compliance.mjs`.
- Added `npm run md3:check`.
- Added `npm run lint:md3` to chain ESLint + MD3 guardrails.

5. Native-control boundary hardening:
- Migrated remaining app-surface upload controls to `FileDropzone`:
  - `src/features/finance/components/AddBudgetModal.tsx`
  - `src/features/locations/pages/ImportLocationsPage.tsx`
  - `src/features/management/pages/ImportModelsPage.tsx`
- Extended guardrails to fail when native controls are introduced outside `src/components/ui/**`.

6. Accessibility execution evidence:
- Added QA execution record: `docs/md3-a11y-execution-2026-02-16.md`.
- Recorded preflight evidence (focus suppression scan, icon-button accessible naming, reduced-motion presence, build/guardrail pass).
- Added browser automation artifact: `docs/md3-a11y-automation-results-2026-02-16.md` (`11/11` flows pass for keyboard/focus smoke + icon-only naming heuristic).
- Manual interactive browser sign-off remains required to close `MD3-008` (SR narration quality + error semantics by flow).

## Remaining Gaps

1. Hex literals still present (allowed):
- Brand logos in `src/features/auth/pages/LoginPage.tsx`.
- Accent seed definitions in `src/lib/md3Theme.ts`.

2. Runtime Tailwind strategy:
- Current application still relies on runtime utility generation path from `index.html`. Full build-time utility unification remains pending.

3. Accessibility evidence:
- WCAG AA intent exists in components, but exhaustive scenario evidence is still pending (keyboard-only, focus order, SR labels, contrast and error messaging by flow).

## Acceptance Status (This Pass)

- P0 legacy token elimination: Complete
- P0 dynamic accent theme correctness: Complete
- P0 linter guardrails introduced: Complete
- Full screen-by-screen behavioral MD3 parity (app surfaces): Complete
- Full WCAG AA verification across all flows: In progress
