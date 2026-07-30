# Development progress

Last updated: 2026-07-30

## Completed

- [x] Monorepo foundation (apps / core / design / docs / knowledge / plugins)
- [x] package.json + Electron entry (`npm start`)
- [x] Shared `core/diagnosticEngine.js` + causes.json
- [x] Clear Crystal Liquid Glass tokens + checklist + fallbacks
- [x] macOS Case Workspace (Liquid Glass UI, durable JSON store)
- [x] Android Case Workspace + SQLite store + verification + photos
- [x] Plugin system (loader / registry / executor / manifest validator)
- [x] 6 diagnostic plugins (network, printer, power-sleep, storage, display, usb)
- [x] Knowledge packs (6 domains) + contextual `getRelevantTips`
- [x] macOS Field tips (plugin + knowledge) wired into case workspace
- [x] Android Knowledge screen loads all packs from assets
- [x] CaseArtifact export + plugin/knowledge tests in CI

## In progress / next

- [ ] Android: surface contextual field tips inside case workspace
- [ ] macOS SQLite migration (JSON store remains v1)
- [ ] Plugin capability flags for future privileged actions
- [ ] Remote / signed knowledge pack install (offline-first remains default)

## Verify

```bash
npm test
npm start          # macOS — open Knowledge drawer; add evidence → Field tips appear
cd apps/android && flutter run   # Knowledge tab shows 6 packs
```
