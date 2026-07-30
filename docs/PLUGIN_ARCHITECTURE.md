# Plugin & Knowledge Architecture

## Goals
- Extend Fix Happens without modifying the core.
- Support offline-first operation.
- Allow community and vendor knowledge packs + diagnostic plugins.
- Optional **privileged scan runner** for allowlisted read-only diagnostics.

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
  nextTests: string[],
  recommendedScans?: [{ planId: string, params?: object, label?: string }]
}
```

Plugins **must not** execute shell commands themselves. They may only **recommend** plan IDs from the allowlisted scan catalog.

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
| `network-scan-map` | Host discovery, topology, path, ports, mDNS, VLAN, wireless survey (+ scan recommendations) |
| `printer-diagnostics` | CUPS / queues / offline printers |
| `power-sleep` | Sleep, wake, battery, clamshell |
| `storage-disk` | Disk space, APFS, SMART, external volumes |
| `display-graphics` | External display, GPU, resolution |
| `usb-peripheral` | USB hubs, HID, Thunderbolt docks |

---

## Privileged scan runner

Implemented in `core/scanRunner.js`. Runs **only** in the Electron main process.

### Security model

| Control | Behavior |
|---------|----------|
| Default | **Off** (`meta.privilegedScans === false`) |
| Catalog | Fixed plan IDs only — never arbitrary command strings from plugins or UI |
| Execution | `spawn(file, args, { shell: false })` |
| Params | Host/port validated with strict regex; rejects shell metacharacters |
| Limits | Per-plan timeout, 64 KiB stdout/stderr cap, no sudo |
| Evidence | Optional attach of command output to the active case |

### Allowlisted plans (v1)

| planId | Command |
|--------|---------|
| `local-interfaces` | `ifconfig` |
| `arp-table` | `arp -a` |
| `route-default` | `route -n get default` |
| `wifi-info` | `networksetup -getinfo Wi-Fi` |
| `airport-scan` | `airport -s` |
| `ping-host` | `ping -c 3 <host>` |
| `traceroute-host` | `traceroute -n -w 2 -m 12 <host>` |
| `dns-lookup` | `dscacheutil -q host -a name <host>` |
| `nc-port` | `nc -vz -G 3 <host> <port>` |

### IPC

| Channel | Role |
|---------|------|
| `scan:listPlans` | Catalog metadata |
| `scan:status` | `{ available, enabled }` |
| `scan:setEnabled` | Persist `meta.privilegedScans` |
| `scan:run` | `{ planId, params, caseId? }` → structured result |

Preload bridge: `window.FixHappensScan`.

### UI

Case workspace **Privileged scans** panel (under Field tips):
1. Toggle **Enable** (opt-in)
2. One-click buttons for plugin-recommended plans
3. Output preview; auto-attach to case evidence when a case is active

---

## Knowledge packs

JSON files under `knowledge/` (mirrored to `apps/android/assets/knowledge/`).

### Loader API (`core/knowledgeLoader.js`)

- `listPacks()` / `loadKnowledgePack(name)` / `loadAll()`
- `getRelevantTips({ symptom, evidence, causes })`

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
