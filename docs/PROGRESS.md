# Development progress

Last updated: 2026-07-30

## Completed

- [x] Monorepo foundation (apps / core / design / docs / knowledge / plugins)
- [x] package.json + Electron entry (`npm start`)
- [x] Shared `core/diagnosticEngine.js` + causes.json parity
- [x] Clear Crystal Liquid Glass tokens + checklist + fallbacks
- [x] macOS Case Workspace (3-column Liquid Glass UI)
- [x] Durable JSON store (macOS) + SQLite store (Android)
- [x] Knowledge packs + knowledge UI (macOS drawer + Android screen)
- [x] Plugin system (loader / validator / registry / executor + IPC)
- [x] **5 high-value diagnostic plugins** (printer, power-sleep, storage-disk, display-graphics, usb-peripheral)
- [x] CaseArtifact v1 export
- [x] Plugin + engine tests + CI workflow

## In progress / next

- [ ] Wire plugin tips more deeply into Android case workspace
- [ ] macOS SQLite migration (JSON remains production v1)
- [ ] Additional knowledge packs matching the new plugin domains
- [ ] Formal verification checklist parity across platforms

## Plugin inventory (6 total)

| Plugin | Domain |
|--------|--------|
| `example-network` | Network (DHCP / DNS / VPN) |
| `printer-diagnostics` | CUPS / offline / drivers |
| `power-sleep` | Sleep / wake / battery / clamshell |
| `storage-disk` | Space / APFS / SMART / I/O |
| `display-graphics` | External monitors / GPU / scaling |
| `usb-peripheral` | Hubs / HID / enumeration / sleep |

Run `npm run test:plugins` to verify all six load and respond.
