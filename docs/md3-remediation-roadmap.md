# MD3 Remediation Roadmap

## Goal
Reach strict MD3 compliance and WCAG AA across all screens without regressions.

## Phase 1 (Completed)

1. Remove legacy token drift from code.
2. Implement dynamic MD3 role generation from accent seed.
3. Add compliance guardrails to lint pipeline.
4. Normalize button variant API.

## Phase 2 (Completed)

1. Migrated remaining native controls on app surfaces to DS primitives.
2. Standardized upload entry points with `FileDropzone` for import flows.
3. Completed screen-by-screen conformance migration for:
- `auth`
- `dashboard`
- `inventory`
- `approvals`
- `users`
- `locations`
- `management`
- `finance`
- `audit`
- `reports`

## Phase 3 (Completed)

1. Done: Execute accessibility QA matrix on migrated flows (keyboard/focus/disabled/error/assistive text).
- Artifacts: `docs/md3-a11y-execution-2026-02-16.md`, `docs/md3-a11y-automation-results-2026-02-16.md`
2. Done: Add accessibility scenario checklist execution records per screen.
- Artifact: `docs/md3-a11y-automation-results-2026-02-16.json`
3. Done: Replace runtime Tailwind utility generation with build-time unified configuration.
- Implementation: removed `tailwindcss.com` runtime script from `index.html`, enabled `@tailwindcss/vite` in `vite.config.ts`, and switched stylesheet bootstrap in `index.css`.
4. Done: Add multi-device MD3 checks (Compact / Medium / Expanded / Large / XL coverage).
- Artifacts: `docs/md3-multidevice-audit-results-2026-02-16.md`, `docs/md3-multidevice-audit-results-2026-02-16.json`
5. Done: Add visual regression snapshots for key MD3 components.
- Runner: `scripts/run-md3-visual-regression.mjs`
- Commands: `npm run qa:visual:auto`, `npm run qa:visual:update`
- CI enforcement:
  - PR auto-check: `.github/workflows/md3-compliance.yml` job `md3-visual-pr`
  - Baseline update (manual): `.github/workflows/md3-visual-baseline-update.yml` (`workflow_dispatch`)
- Artifacts:
  - `docs/md3-visual-regression-results-2026-02-16.md`
  - `docs/md3-visual-regression-results-2026-02-16.json`
  - `docs/md3-visual-baseline/`
  - `docs/md3-visual-current/2026-02-16/`

## Verification Gates

1. `npm run md3:check`
2. `npm run lint`
3. `npm run build`
4. Manual smoke test:
- Login flow
- Navigation shell
- Theme switching (light, dark, system)
- Accent switching
- Primary CRUD paths in inventory/users/management
