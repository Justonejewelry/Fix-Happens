# Development progress

Last updated: 2026-07-30

## Completed

- [x] Monorepo foundation (apps / core / design / docs / knowledge / plugins)
- [x] package.json + Electron entry (`npm start`)
- [x] Strengthened `core/diagnosticEngine.js`
- [x] Clear Crystal Liquid Glass tokens + checklist + fallbacks
- [x] macOS Case Workspace (3-column Liquid Glass UI)
- [x] Copy commands, keyboard shortcuts, confidence meters, timeline connector
- [x] Case switcher, solid-surface toggle, live re-score on evidence
- [x] Android Case Workspace skeleton + pubspec.yaml
- [x] Issues #4 (design system) and #5 (workspace layout) closed

## In progress

- [ ] Wire `apps/macos/storage.js` into `index.html` (localStorage)
- [ ] Formal open / close case actions (issue #1)
- [ ] Electron `require` of real diagnosticEngine instead of inlined copy (issue #3)
- [ ] Android offline case list + photos (issue #2)

## Next recommended commits

1. Load `storage.js` from index.html and persist evidence / solid mode / active case
2. Add Create Case / Close Case controls on macOS
3. Bridge Electron preload → `core/diagnosticEngine.js`
4. Expand Android with case list screen and shared token constants
5. Seed second knowledge pack (e.g. HVAC or electrical)
