# Changelog

All notable changes to **Fix Happens** are documented here.

## [1.3.0] — 2026-07-30

### Added — auto-remediation + System & Network Booster

- **`core/remediationRunner.js`** — allowlisted fix plans (DNS flush, DHCP renew, Wi-Fi power cycle, proxy off, public DNS, print queue clear, networkQuality)
- **`plugins/system-network-booster`** — comprehensive diagnose + `recommendedFixes` for slow/DNS/proxy/DHCP/Wi-Fi cases
- Plugin contract: `recommendedFixes[]` alongside `recommendedScans[]`
- Electron IPC `FixHappensFix` (`fix:listPlans`, `fix:status`, `fix:suggest`, `fix:run`)
- Case workspace **Apply fix** panel with confirm dialog; results attach as `Remediation` evidence
- Knowledge pack `boost.json` (macOS + Android assets)
- Causes: Stale DNS, Proxy residue, Wi-Fi instability, Performance degradation, User cache pressure
- Tests: `npm run test:fix` + booster plugin assertions

### Security

- Fixes still require explicit privileged enable (shared with scans)
- Fixed plan catalog only; `spawn(..., { shell: false })`
- Service / interface allowlists; no sudo; UI confirmation per fix

---

## [1.2.1] — 2026-07-30

### First public release

Cross-platform field diagnostic OS for macOS (Electron) and Android (Flutter).

### Added
- Shared diagnostic engine (`causes.json` **v3**)
- Case workflow + CaseArtifact export/import
- 7 plugins including `network-scan-map`
- Knowledge packs + Field tips
- Privileged allowlisted scan runner
- CI tests

---

## Links

- Repo: https://github.com/Justonejewelry/Fix-Happens
