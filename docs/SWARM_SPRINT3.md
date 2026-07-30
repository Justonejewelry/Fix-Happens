# Swarm sprint 3 — shipped

Date: 2026-07-30  
Version: **1.2.0**

| Track | Owner role | Item | Status |
|-------|------------|------|--------|
| A | Harper (UI) | Host/port parameter editor on privileged scan panel | ✅ |
| B | Benjamin (Core) | `causes.json` v3 + Dart engine loads asset JSON | ✅ |
| C | Lucas (Android) | Contextual Field tips in case workspace | ✅ |
| — | CI | `scanRunner.test.js` in GitHub Actions | ✅ |

## Harper — scan params

Under **Privileged scans**:

1. Enable the toggle
2. Set **Host** / **Port** fields
3. Run **Ping host**, **Traceroute**, **DNS lookup**, or **Port check**

UI values override plugin preset params for parameterized plans. Values persist across tip refreshes.

## Benjamin — causes v3

New ranked causes (shared JS + Android asset):

- Incomplete Host Discovery
- Path / Routing Anomaly
- Port / Service Unreachable
- VLAN / L2 Isolation
- Duplicate IP Address
- Disk Space Critical

Android `DiagnosticEngine` now loads `assets/causes.json` (fallback embedded if missing).

## Lucas — Android field tips

- `FieldTipsService` mirrors knowledge pack keyword scoring
- Case workspace shows a **Field tips** card when symptom/evidence matches packs
- Tips refresh after adding evidence

## Verify

```bash
npm test
npm start   # enable scans → set host → Ping host
cd apps/android && flutter run
```
