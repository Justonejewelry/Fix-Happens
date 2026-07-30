# Plugin & Knowledge Architecture

## Goals
- Extend Fix Happens without modifying the core.
- Support offline-first operation.
- Allow community and vendor knowledge packs + diagnostic plugins.

## Plugin model

Plugins live under `plugins/<id>/` with:

| File | Role |
|------|------|
| `manifest.json` | id, name, version, entryPoint, supportedPlatforms, permissions, capabilities |
| `index.js` | exports `{ id, name, version, description, diagnose(context) }` |

### Diagnose contract

```js
diagnose({
  symptom: string,
  evidence: string[],
  platform: string,   // 'macos' | 'android' | …
  device: string
}) → {
  hypotheses: [{ cause: string, confidenceBoost: number }],
  tips: string[],
  nextTests: string[]
}
```

Plugins **must not** execute shell commands. They return soft suggestions only.

### Lifecycle
1. Discover (`plugins/*/`)
2. Validate manifest
3. Load entry module
4. Register in `pluginRegistry`
5. Execute via `pluginExecutor.runAll(context)`

### Shipped plugins

| ID | Domain |
|----|--------|
| `example-network` | Network (DHCP, DNS, VPN) |
| `network-scan-map` | Host discovery, topology, path, ports, mDNS, VLAN, wireless survey |
| `printer-diagnostics` | CUPS / queues / offline printers |
| `power-sleep` | Sleep, wake, battery, clamshell |
| `storage-disk` | Disk space, APFS, SMART, external volumes |
| `display-graphics` | External display, GPU, resolution |
| `usb-peripheral` | USB hubs, HID, Thunderbolt docks |

---

## Knowledge packs

JSON files under `knowledge/` (mirrored to `apps/android/assets/knowledge/`).

### Pack shape

```json
{
  "id": "network-basics",
  "title": "Network diagnostics",
  "version": 2,
  "category": "network",
  "tips": ["…"],
  "relatedCauses": ["DHCP Failure", "…"],
  "keywords": ["wifi", "dhcp", "…"],
  "scenarios": [ /* optional richer playbooks */ ]
}
```

### Loader API (`core/knowledgeLoader.js`)

- `listPacks()` → pack name list
- `loadKnowledgePack(name)` → normalized pack
- `loadAll()` → `{ packs, errors }`
- `getRelevantTips({ symptom, evidence, causes })` → ranked tips for the active case

### Wiring

| Surface | Behavior |
|---------|----------|
| macOS Knowledge drawer | Lists all packs via `knowledge:list` IPC |
| macOS case workspace | **Field tips** = plugin tips + `getRelevantTips` (IPC `knowledge:relevant`) |
| Android Knowledge tab | Loads all packs from `assets/knowledge/` |

### Shipped packs

| File | Domain |
|------|--------|
| `network.json` | Wi-Fi / DHCP / DNS / VPN |
| `network-scan.json` | Scan / map / ARP / traceroute / VLAN / survey |
| `print.json` | Printers / CUPS |
| `power.json` | Sleep / battery / clamshell |
| `storage.json` | Disk space / APFS / SMART |
| `display.json` | Monitors / GPU / scaling |
| `usb.json` | USB / HID / docks |
