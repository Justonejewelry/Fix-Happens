# Development progress

Last updated: 2026-07-30 · **v1.2.0**

## Completed

- [x] Monorepo foundation (apps / core / design / docs / knowledge / plugins)
- [x] Shared diagnostic engine + causes.json **v3**
- [x] Clear Crystal Liquid Glass UI (macOS + Android)
- [x] Durable persistence (macOS JSON userData, Android SQLite)
- [x] Plugin system + 7 plugins including `network-scan-map`
- [x] Knowledge packs (7) + contextual tips (macOS + Android)
- [x] Privileged allowlisted scan runner (opt-in)
- [x] **Scan host/port parameter editor**
- [x] CaseArtifact export + CI (engine / plugins / scan)
- [x] Swarm sprints 2–3

## Next

- [ ] macOS SQLite migration (JSON remains v1 store)
- [ ] Android: optional companion-assisted remote scan later
- [ ] Signed / remote knowledge pack install
- [ ] Evidence list live-reload after scan attach on macOS (`reloadActiveCase` hook in app.js)

## Verify

```bash
npm test && npm start
```
