# Fix Happens v1.2.1 — First release

**Shit breaks. Fix Happens.**

Published: 2026-07-30  
Commit: `main` @ release time  
Tag: **v1.2.1** (create on GitHub Releases if not yet published)

## Summary

First public release of the cross-platform Field Diagnostic Operating System for macOS (Electron) and Android (Flutter).

## What’s included

### Diagnostic core
- Shared hypothesis engine (`core/diagnosticEngine.js` + Dart port)
- `causes.json` **v3** — network, scan/map, print, power, storage
- Case lifecycle with verification checklist

### macOS app
- Liquid Glass Case Workspace
- Durable JSON store + CaseArtifact export/import
- Knowledge drawer + Field tips
- Privileged allowlisted scan runner (opt-in)
- Host/port scan parameter editor
- Live evidence reload after scans

### Android app
- Offline case list + workspace
- SQLite persistence + photo evidence
- Knowledge tab + contextual Field tips
- Causes loaded from assets for parity

### Plugins
| ID | Domain |
|----|--------|
| example-network | DHCP / DNS / VPN |
| network-scan-map | Discovery, topology, path, ports |
| printer-diagnostics | CUPS / queues |
| power-sleep | Sleep / battery / clamshell |
| storage-disk | Disk / APFS / SMART |
| display-graphics | Monitors / GPU |
| usb-peripheral | USB / HID / docks |

### Tests
```bash
npm test
```

## Install & run

```bash
git clone https://github.com/Justonejewelry/Fix-Happens.git
cd Fix-Happens
git checkout v1.2.1   # after the tag is published
npm install && npm start
```

Android: `cd apps/android && ./tool/bootstrap.sh && flutter run`

## Publish this release on GitHub

If the GitHub **Releases** UI is used (recommended when API create-release is unavailable):

1. Open https://github.com/Justonejewelry/Fix-Happens/releases/new
2. **Choose a tag** → create tag `v1.2.1` on `main`
3. **Release title:** `v1.2.1 — First release`
4. Paste the body from `CHANGELOG.md` section `[1.2.1]` (or this file)
5. Publish release

Direct link: https://github.com/Justonejewelry/Fix-Happens/releases/new?tag=v1.2.1&title=v1.2.1%20%E2%80%94%20First%20release
