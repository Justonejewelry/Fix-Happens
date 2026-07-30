# Development progress

Last updated: 2026-07-30 · **v1.3.0**

## Completed

- [x] Monorepo foundation (apps / core / design / docs / knowledge / plugins)
- [x] Shared diagnostic engine + causes.json **v3**
- [x] Clear Crystal Liquid Glass UI (macOS + Android)
- [x] Durable persistence (macOS JSON userData, Android SQLite)
- [x] Plugin system + **8 plugins** including `network-scan-map` + **`system-network-booster`**
- [x] Knowledge packs (8) + contextual tips (macOS + Android)
- [x] Privileged allowlisted scan runner (opt-in) + host/port params
- [x] **Allowlisted auto-remediation runner** (`core/remediationRunner.js`)
- [x] **Apply fix panel** in case workspace (confirm → run → evidence)
- [x] Evidence live-reload after scan/fix
- [x] CaseArtifact export + import
- [x] CI tests: engine / plugins / scan / remediation

## Next

- [ ] macOS SQLite migration (JSON remains v1 store; schema already aligned)
- [ ] Android: optional companion-assisted remote scan later
- [ ] Signed / remote knowledge pack install
- [ ] Multi-step guided “boost playbooks” with before/after scoring

## Verify

```bash
npm test && npm start
# Enable privileged mode → Apply fix: Flush DNS / Network quality
# Symptom "network is slow, need a boost" should surface booster tips + fixes
```
