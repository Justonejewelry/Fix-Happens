# Fix Happens — phase progress

Last updated: 2026-07-30

| Phase | Name | Status |
|-------|------|--------|
| 0 | Runnable apps + close UI issues | ✅ Complete |
| 1 | Durable persistence (schema-aligned store) | ✅ Complete |
| 2 | One diagnostic brain (shared causes) | ✅ Complete |
| 3 | Field workflow completeness | 🔄 In progress |
| 4 | Platform polish / packaging | ⏳ Pending |
| 5 | Knowledge & plugins | ⏳ Pending |
| 6 | Hardening (tests, CI) | ⏳ Pending |

## Phase 0
- Issues #1 and #2 closed
- RUN.md + TROUBLESHOOTING.md + bootstrap/diagnose scripts
- User still runs: `npm install && npm start` / `flutter run` locally

## Phase 1
- `apps/macos/db.js` — durable JSON DB in Electron `userData` (schema-aligned)
- IPC via preload: `FixHappensDB`
- Android: `lib/services/sqlite_store.dart` + sqflite (schema-aligned)
- `database/schema.sql` remains the logical model

## Phase 2
- `core/causes.json` — single source of truth for causes
- `diagnosticEngine.js` loads causes.json
- Android `diagnostic_engine.dart` mirrors the same table
- Issue #3 ready to close when both clients call shared rules
