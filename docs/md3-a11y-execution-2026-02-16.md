# MD3 WCAG QA Execution Record

Date: 2026-02-16  
Scope: Flows migrated during MD3 Phase 2/3 hardening  
Reference gaps: `MD3-008` (Accessibility), `MD3-009` (Guardrails)

## Environment

- Runtime: Vite production build
- Commands executed:
  - `npm run md3:check`
  - `npm run build`

## QA Session Metadata (Fill Before Manual Run)

| Field | Value |
| --- | --- |
| Session ID | `A11Y-MD3-____` |
| Tester | `________________` |
| Date | `YYYY-MM-DD` |
| Browser | `Chrome/Edge/Firefox + version` |
| OS | `Windows/macOS/Linux + version` |
| Build Ref | `dist build from 2026-02-16` |
| Reduced Motion Mode | `On / Off` |
| Assistive Tech Used | `NVDA/JAWS/VoiceOver/None` |

## Preflight Evidence

| ID | Check | Method | Result | Evidence |
| --- | --- | --- | --- | --- |
| PRE-001 | MD3 guardrails pass | CLI | Pass | `npm run md3:check` |
| PRE-002 | Production build pass | CLI | Pass | `npm run build` |
| PRE-003 | Native controls outside DS layer | Static scan | Pass | count = `0` for `src/features src/context src/components/security src/components/modals src/components/layout` |
| PRE-004 | Native controls in migrated critical flows | Static scan | Pass | count = `0` for targeted flow files (login/settings/wizards/security/users/audit/category/add-equipment) |
| PRE-005 | Legacy token drift (`text-dark`, `bg-dark`, `surface-subtle`, `variant="outline"`) | Static scan | Pass | count = `0` |
| PRE-006 | `IconButton` accessible naming | Static script | Pass | `ICONBUTTON_TOTAL=13`, `ICONBUTTON_MISSING_ARIA=0` |
| PRE-007 | Focus suppression (`focus:ring-0`) | Static scan | Pass | count = `0` |
| PRE-008 | Reduced motion support present | Static scan | Pass | `index.css:873` includes `@media (prefers-reduced-motion: reduce)` |

## Automation Evidence

- Artifact: `docs/md3-a11y-automation-results-2026-02-16.md`
- Command: `npm run qa:a11y:auto`
- Result: `11/11` flows pass on keyboard-focus smoke + icon-only naming heuristic.

## Manual QA Matrix (Execution Log)

Legend:
- `Pass (Static)` = validated by code/guardrail evidence.
- `Pending (Manual)` = requires interactive browser execution by QA operator.

| Flow | Keyboard order & focus ring | SR labels on icon-only controls | Error/help states | Motion/animation comfort | Status |
| --- | --- | --- | --- | --- | --- |
| Login (`src/features/auth/pages/LoginPage.tsx`) | Pass (Automated) | Pass (Automated) | Pending (Manual) | Pending (Manual) | In progress (manual sign-off pending) |
| Assignment wizard (`src/features/inventory/pages/AssignmentWizardPage.tsx`) | Pass (Automated) | Pass (Automated) | Pending (Manual) | Pending (Manual) | In progress (manual sign-off pending) |
| Return wizard (`src/features/inventory/pages/ReturnWizardPage.tsx`) | Pass (Automated) | Pass (Automated) | Pending (Manual) | Pending (Manual) | In progress (manual sign-off pending) |
| Security gate (`src/components/security/SecurityGate.tsx`) | Pending (Manual) | Pass (Static) | Pending (Manual) | Pending (Manual) | In progress (manual sign-off pending) |
| User details (`src/features/users/pages/UserDetailsPage.tsx`) | Pass (Automated) | Pass (Automated) | Pending (Manual) | Pending (Manual) | In progress (manual sign-off pending) |
| Settings (`src/features/management/pages/SettingsPage.tsx`) | Pass (Automated) | Pass (Automated) | Pending (Manual) | Pending (Manual) | In progress (manual sign-off pending) |
| Add category (`src/features/management/pages/AddCategoryPage.tsx`) | Pending (Manual) | Pass (Static) | Pending (Manual) | Pending (Manual) | In progress (manual sign-off pending) |
| Add equipment (`src/features/inventory/pages/AddEquipmentPage.tsx`) | Pass (Automated) | Pass (Automated) | Pending (Manual) | Pending (Manual) | In progress (manual sign-off pending) |
| Audit details (`src/features/audit/pages/AuditDetailsPage.tsx`) | Pass (Automated) | Pass (Automated) | Pending (Manual) | Pending (Manual) | In progress (manual sign-off pending) |
| Category details (`src/features/management/pages/CategoryDetailsPage.tsx`) | Pass (Automated) | Pass (Automated) | Pending (Manual) | Pending (Manual) | In progress (manual sign-off pending) |
| Import locations/models/budget (`src/features/locations/pages/ImportLocationsPage.tsx`, `src/features/management/pages/ImportModelsPage.tsx`, `src/features/finance/components/AddBudgetModal.tsx`) | Pass (Automated) | Pass (Automated) | Pending (Manual) | Pending (Manual) | In progress (manual sign-off pending) |

## Manual Sign-off Template (Fill During Execution)

### Per-flow Results

| Flow | Keyboard (Tab/Shift+Tab, Enter/Space) | Focus visible | SR labels/readout | Error/help feedback | Disabled behavior | Reduced motion behavior | Result | Evidence Ref | Tester Initials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `link/file` | `__` |
| Assignment wizard | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `link/file` | `__` |
| Return wizard | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `link/file` | `__` |
| Security gate | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `link/file` | `__` |
| User details | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `link/file` | `__` |
| Settings | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `link/file` | `__` |
| Add category | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `link/file` | `__` |
| Add equipment | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `link/file` | `__` |
| Audit details | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `link/file` | `__` |
| Category details | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `link/file` | `__` |
| Import flows | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `Pass/Fail` | `link/file` | `__` |

### Defect Log (If Any Failure)

| Defect ID | Flow | Severity | Repro Steps | Expected | Actual | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `A11Y-___` | `flow` | `P1/P2/P3` | `steps` | `expected` | `actual` | `name` | `Open/Fixed/Retest` |

### Final Approval Block

| Field | Value |
| --- | --- |
| Manual matrix complete | `Yes/No` |
| All rows `Pass (Manual)` | `Yes/No` |
| Open defects remaining | `0 / n` |
| QA approver | `________________` |
| Product/Engineering approver | `________________` |
| Approval date | `YYYY-MM-DD` |

## Manual Runbook (for QA Operator)

1. Keyboard-only traversal:
- Use `Tab` / `Shift+Tab` on each flow.
- Verify visible focus indicator on every interactive element.
- Verify activation via `Enter`/`Space` where applicable.

2. Screen reader labels:
- Check icon-only actions announce meaningful names (e.g., close/delete/eraser).

3. Error and helper feedback:
- Trigger invalid submissions and confirm understandable feedback.
- Validate disabled states are visually distinct and behaviorally blocked.

4. Motion and comfort:
- Confirm transitions remain understandable.
- Validate reduced-motion behavior by enabling OS/browser reduced-motion preference.

## Sign-off Criteria to close MD3-008

All matrix rows above must be `Pass (Manual)` in an interactive browser session with recorded tester/date/environment.
