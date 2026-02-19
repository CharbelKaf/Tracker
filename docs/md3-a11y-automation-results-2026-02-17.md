# MD3 A11Y Automation Results

Date: 2026-02-17
Base URL: http://127.0.0.1:4173

- Flows checked: 11
- Pass: 11
- Fail: 0

| Flow | Route | Interactive controls | Icon-only buttons missing label | Unique focus targets (Tab probe) | Visible focus detected | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Login | `/#/` | 11 | 0 | 10 | Yes | Pass |
| Settings | `/settings` | 26 | 0 | 12 | Yes | Pass |
| Assignment wizard | `/wizards/assignment` | 18 | 0 | 12 | Yes | Pass |
| Return wizard | `/wizards/return` | 20 | 0 | 12 | Yes | Pass |
| User details | `/users/1` | 21 | 0 | 12 | Yes | Pass |
| Add equipment | `/inventory/add` | 31 | 0 | 10 | Yes | Pass |
| Audit details | `/audit/details` | 27 | 0 | 6 | Yes | Pass |
| Category details | `/management/categories/1` | 16 | 0 | 12 | Yes | Pass |
| Import locations | `/locations/import` | 17 | 0 | 12 | Yes | Pass |
| Import models | `/management/models/import` | 17 | 0 | 12 | Yes | Pass |
| Finance | `/finance` | 17 | 0 | 12 | Yes | Pass |

Notes:
- This run validates keyboard/focus smoke and accessible naming heuristics.
- Screen-reader narration quality and business-rule error semantics still require human manual sign-off.
