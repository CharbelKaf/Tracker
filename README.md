<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1QyX_oitTPynZbneip75S5O7UIGzw9yAy

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## MD3 Review Checklist (Required)

Before opening or reviewing a PR, use the MD3 checklist in `docs/md3-checklist.md`.

Minimum merge requirements:
- No open critical MD3 blocker (P0)
- `npm run build` passes
- Keyboard focus remains visible on all interactive elements touched by the PR
- Touch targets remain at least `48x48dp` where required
- ARIA links are present for form errors (`aria-invalid`, `aria-describedby`) when applicable

For UI changes, include:
- Before/after screenshots
- Manual verification notes for impacted flows
- Accessibility notes (keyboard and screen reader impact)

## MD3 Audit Deliverables

- Audit report: `docs/md3-audit-report-2026-02-14.md`
- Anomalies register: `docs/md3-anomalies-register.md`
- Migration plan: `docs/md3-migration-plan.md`
- Review checklist: `docs/md3-checklist.md`
