# Changelog

All notable changes to **Fix Happens** are documented here.

## [1.2.1] — 2026-07-30

### First public release

**Shit breaks. Fix Happens.** Cross-platform field diagnostic OS for macOS (Electron) and Android (Flutter).

### Added
- Shared diagnostic engine with `causes.json` **v3** (JS + Dart asset parity)
- Case workspace: evidence, ranked hypotheses, next-test, verification checklist
- Durable persistence: macOS JSON userData · Android SQLite
- Plugin system (loader / registry / executor / validator)
- Seven diagnostic plugins including `network-scan-map`
- Knowledge packs (7) + contextual Field tips (macOS + Android)
- Privileged allowlisted scan runner (opt-in, main-process only)
- Host/port parameter editor for scan plans
- CaseArtifact v1 **export** and **import**
- Live evidence reload after privileged scans (`reloadActiveCase`)
- CI: engine, plugin, and scan runner tests

### Security
- Plugins return suggestions only; no shell execution from plugin code
- Scans require explicit enable; fixed plan catalog; `spawn(..., { shell: false })`
- Strict host/port validation; timeouts and output caps

### Docs
- Architecture, plugin model, run guide, swarm sprint reports

---

## Links

- Repo: https://github.com/Justonejewelry/Fix-Happens
- Tag target: `v1.2.1` on `main`
