# Development progress

Last updated: 2026-07-30 · **v1.2.1**

## Completed

- [x] Monorepo foundation (apps / core / design / docs / knowledge / plugins)
- [x] Shared diagnostic engine + causes.json **v3**
- [x] Clear Crystal Liquid Glass UI (macOS + Android)
- [x] Durable persistence (macOS JSON userData, Android SQLite)
- [x] Plugin system + 7 plugins including `network-scan-map`
- [x] Knowledge packs (7) + contextual tips (macOS + Android)
- [x] Privileged allowlisted scan runner (opt-in) + host/port params
- [x] **Evidence live-reload after scan** (`reloadActiveCase`)
- [x] **CaseArtifact import** (More → Import)
- [x] CaseArtifact export + CI (engine / plugins / scan)
- [x] Swarm sprints 2–3

## Next

- [ ] macOS SQLite migration (JSON remains v1 store; schema already aligned)
- [ ] Android: optional companion-assisted remote scan later
- [ ] Signed / remote knowledge pack install

## Verify

```bash
npm test && npm start
# Run privileged scan → evidence list should refresh automatically
# More → Import CaseArtifact JSON round-trips with Export
```
