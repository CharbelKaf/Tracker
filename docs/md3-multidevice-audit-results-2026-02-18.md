# MD3 Multi-Device Audit Results

Date: 2026-02-18
Base URL: http://127.0.0.1:4173

- Devices checked: 6
- Flows checked: 60
- Pass: 20
- Fail: 40

## Device Summary

| Device | Viewport | Touch | Pass | Fail | Overflow issues | Touch target issues |
| --- | --- | --- | --- | --- | --- | --- |
| iPhone SE | 375x667 | Yes | 0 | 10 | 0 | 10 |
| iPhone 14 Pro | 393x852 | Yes | 0 | 10 | 0 | 10 |
| iPad Mini | 768x1024 | Yes | 0 | 10 | 0 | 10 |
| iPad Pro | 1024x1366 | Yes | 0 | 10 | 0 | 10 |
| Desktop 1440p | 1440x900 | No | 10 | 0 | 0 | 10 |
| Desktop 4K | 3840x2160 | No | 10 | 0 | 0 | 10 |

## Failures

| Device | Flow | Route | Overflow | Small touch targets | Icon-only buttons missing label | Focus targets |
| --- | --- | --- | --- | --- | --- | --- |
| iPhone SE | Settings | `/settings` | No | 5 | 0 | 10 |
| iPhone SE | Assignment wizard | `/wizards/assignment` | No | 5 | 0 | 10 |
| iPhone SE | Return wizard | `/wizards/return` | No | 5 | 0 | 10 |
| iPhone SE | User details | `/users/1` | No | 5 | 0 | 10 |
| iPhone SE | Add equipment | `/inventory/add` | No | 5 | 0 | 10 |
| iPhone SE | Audit details | `/audit/details` | No | 5 | 0 | 10 |
| iPhone SE | Category details | `/management/categories/1` | No | 5 | 0 | 10 |
| iPhone SE | Import locations | `/locations/import` | No | 5 | 0 | 10 |
| iPhone SE | Import models | `/management/models/import` | No | 5 | 0 | 10 |
| iPhone SE | Finance | `/finance` | No | 5 | 0 | 10 |
| iPhone 14 Pro | Settings | `/settings` | No | 5 | 0 | 10 |
| iPhone 14 Pro | Assignment wizard | `/wizards/assignment` | No | 5 | 0 | 10 |
| iPhone 14 Pro | Return wizard | `/wizards/return` | No | 5 | 0 | 10 |
| iPhone 14 Pro | User details | `/users/1` | No | 5 | 0 | 10 |
| iPhone 14 Pro | Add equipment | `/inventory/add` | No | 5 | 0 | 10 |
| iPhone 14 Pro | Audit details | `/audit/details` | No | 5 | 0 | 10 |
| iPhone 14 Pro | Category details | `/management/categories/1` | No | 5 | 0 | 10 |
| iPhone 14 Pro | Import locations | `/locations/import` | No | 5 | 0 | 10 |
| iPhone 14 Pro | Import models | `/management/models/import` | No | 5 | 0 | 10 |
| iPhone 14 Pro | Finance | `/finance` | No | 5 | 0 | 10 |
| iPad Mini | Settings | `/settings` | No | 5 | 0 | 10 |
| iPad Mini | Assignment wizard | `/wizards/assignment` | No | 5 | 0 | 10 |
| iPad Mini | Return wizard | `/wizards/return` | No | 5 | 0 | 10 |
| iPad Mini | User details | `/users/1` | No | 5 | 0 | 10 |
| iPad Mini | Add equipment | `/inventory/add` | No | 5 | 0 | 10 |
| iPad Mini | Audit details | `/audit/details` | No | 5 | 0 | 10 |
| iPad Mini | Category details | `/management/categories/1` | No | 5 | 0 | 10 |
| iPad Mini | Import locations | `/locations/import` | No | 5 | 0 | 10 |
| iPad Mini | Import models | `/management/models/import` | No | 5 | 0 | 10 |
| iPad Mini | Finance | `/finance` | No | 5 | 0 | 10 |
| iPad Pro | Settings | `/settings` | No | 5 | 0 | 10 |
| iPad Pro | Assignment wizard | `/wizards/assignment` | No | 5 | 0 | 10 |
| iPad Pro | Return wizard | `/wizards/return` | No | 5 | 0 | 10 |
| iPad Pro | User details | `/users/1` | No | 5 | 0 | 10 |
| iPad Pro | Add equipment | `/inventory/add` | No | 5 | 0 | 10 |
| iPad Pro | Audit details | `/audit/details` | No | 5 | 0 | 10 |
| iPad Pro | Category details | `/management/categories/1` | No | 5 | 0 | 10 |
| iPad Pro | Import locations | `/locations/import` | No | 5 | 0 | 10 |
| iPad Pro | Import models | `/management/models/import` | No | 5 | 0 | 10 |
| iPad Pro | Finance | `/finance` | No | 5 | 0 | 10 |

Notes:
- Touch target checks use a 48x48 CSS px minimum for visible interactive controls.
- Spacing checks are heuristic and reported in JSON for deeper triage.
- Manual visual verification remains required for nuanced readability and UX quality.
