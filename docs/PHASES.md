# Fix Happens — phase progress

Last updated: 2026-07-30

| Phase | Name | Status |
|-------|------|--------|
| 0 | Runnable apps + close UI issues | ✅ Complete |
| 1 | Durable persistence | ✅ Complete |
| 2 | One diagnostic brain | ✅ Complete |
| 3 | Field workflow completeness | ✅ Complete |
| 4 | Platform polish / packaging | ✅ Complete |
| 5 | Knowledge & plugins | ✅ Complete |
| 6 | Hardening (tests, CI) | ✅ Complete |
| — | **UI fully on durable DB** | ✅ Complete |

## Durable UI wiring

### macOS
- `app.js` prefers `window.FixHappensDB` (Electron IPC → `db.js` userData store)
- Create / close / evidence / hypotheses / search / solid toggle all hit DB when available
- localStorage only if opened outside Electron
- Engine badge shows `· DB` when durable store is active

### Android
- `CaseStore` is SQLite-only (`SqliteStore`) — no SharedPreferences for cases
- List / create / close / add evidence go through SQLite
- Workspace receives `store` and persists mutations immediately
