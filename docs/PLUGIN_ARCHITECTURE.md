# Plugin & Knowledge Architecture

## Goals
- Extend Fix Happens without modifying the core.
- Support offline-first operation.
- Allow community and vendor knowledge packs + diagnostic plugins.
- Optional **privileged scan runner** and **remediation runner** for allowlisted actions.

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
  platform: string,
  device: string
}) → {
  hypotheses: [{ cause: string, confidenceBoost: number }],
  tips: string[],
  nextTests: string[],
  recommendedScans?: [{ planId: string, params?: object, label?: string }],
  recommendedFixes?: [{ planId: string, params?: object, label?: string }]
}
```

Plugins **must not** execute shell commands. They may only **recommend** plan IDs from the scan or remediation catalogs.

### Shipped plugins

| ID | Domain |
|----|--------|
| `example-network` | Network (DHCP, DNS, VPN) |
| `network-scan-map` | Discovery, topology, path, ports, mDNS, VLAN, survey |
| **`system-network-booster`** | **DNS/proxy hygiene, Wi-Fi cycle, DHCP renew, performance boost + recommendedFixes** |
| `printer-diagnostics` | CUPS / queues / offline printers |
| `power-sleep` | Sleep, wake, battery, clamshell |
| `storage-disk` | Disk space, APFS, SMART |
| `display-graphics` | External display, GPU |
| `usb-peripheral` | USB hubs, HID, docks |

---

## Privileged scan runner

`core/scanRunner.js` — read-only diagnostics in Electron main.

| Control | Behavior |
|---------|----------|
| Default | **Off** |
| Catalog | Fixed plan IDs only |
| Execution | `spawn(file, args, { shell: false })` |
| Params | Strict host/port validation |
| Limits | Timeout, 64 KiB cap, no sudo |

---

## Remediation / auto-fix runner

`core/remediationRunner.js` — **mutating** but still allowlisted.

| Control | Behavior |
|---------|----------|
| Default | **Off** (shares `meta.privilegedScans` with scans) |
| Catalog | Fixed fix plan IDs only |
| Execution | `spawn(..., { shell: false })`; multi-step sequences supported |
| Params | Service names and interfaces from allowlists only |
| Confirm | UI requires confirm dialog before each fix |
| Evidence | Result attached as type `Remediation` |

### Allowlisted fix plans (v1)

| planId | Action |
|--------|--------|
| `flush-dns-cache` | `dscacheutil -flushcache` |
| `renew-dhcp` | `ipconfig set <en0–en6> DHCP` |
| `set-dns-cloudflare` | DNS → 1.1.1.1 / 1.0.0.1 |
| `set-dns-google` | DNS → 8.8.8.8 / 8.8.4.4 |
| `set-dns-dhcp` | DNS → Empty (DHCP) |
| `wifi-power-cycle` | Airport power off → on |
| `disable-web-proxy` | HTTP proxy off |
| `disable-secure-proxy` | HTTPS proxy off |
| `cancel-all-print-jobs` | `cancel -a` |
| `network-quality` | `networkQuality -s` (read-only measure) |
| `show-dns` | Show configured DNS servers |
| `purge-user-caches-hint` | Read-only `du` of user caches |

### IPC

| Channel | Role |
|---------|------|
| `fix:listPlans` | Catalog |
| `fix:status` | `{ available, enabled }` |
| `fix:suggest` | Map cause → plan suggestions |
| `fix:run` | `{ planId, params, caseId? }` → result |

Preload: `window.FixHappensFix`.

### UI

**Apply fix (auto-remediation)** panel under Field tips / scans:
1. Enable privileged mode
2. Plugin-recommended + common booster buttons
3. Confirm → run → attach evidence → live reload

---

## Knowledge packs

| File | Domain |
|------|--------|
| `network.json` | Wi-Fi / DHCP / DNS / VPN |
| `network-scan.json` | Scan / map |
| **`boost.json`** | **Booster sequence & performance tips** |
| `print.json` | Printers / CUPS |
| `power.json` | Sleep / battery |
| `storage.json` | Disk / APFS |
| `display.json` | Monitors / GPU |
| `usb.json` | USB / docks |
