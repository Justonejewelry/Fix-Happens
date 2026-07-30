# Plugin Architecture

## Goals
- Extend Fix Happens without modifying the core.
- Support offline-first operation.
- Allow community and vendor knowledge packs.
- Keep plugins pure (suggestions only) so they stay safe on both macOS and Android.

## Plugin Types
- Diagnostic providers (current focus)
- Knowledge packs
- Command libraries (future)
- Verification modules (future)
- Report exporters (future)

## Plugin Manifest
Required fields:
- `id` — lowercase alphanumeric with `. _ -`
- `name`
- `version`
- `entryPoint` (usually `index.js`)

Optional:
- `description`
- `supportedPlatforms` — `macos`, `android`, `windows`, or `all`
- `permissions` — reserved for future capability gating
- `capabilities` — defaults to `["suggest"]`

## Contract

Every plugin must export a `diagnose(context)` function (either as the module itself or as `module.exports.diagnose`).

```js
/**
 * @param {{ symptom: string, evidence: string[], platform?: string, device?: string }} context
 * @returns {{
 *   hypotheses?: Array<{ cause: string, confidenceBoost: number }>,
 *   tips?: string[],
 *   nextTests?: string[]
 * }}
 */
function diagnose(context) { ... }
```

Plugins **must not** execute shell commands or mutate case data. They only return soft suggestions that the UI and core engine can surface.

## Lifecycle
1. Discover (`plugins/*/manifest.json`)
2. Validate (`pluginManifestValidator`)
3. Load (`pluginLoader` → `require(entryPoint)`)
4. Register (`pluginRegistry`)
5. Execute (`pluginExecutor.runAll(context)`)
6. Unload (registry clear on demand)

## Shipped High-Value Plugins (v1)

| ID | Domain | Primary value |
|----|--------|---------------|
| `example-network` | Network | DHCP, DNS, VPN route corruption |
| `printer-diagnostics` | Print | CUPS queues, offline state, drivers, USB/network printers |
| `power-sleep` | Power | Sleep/wake, battery, clamshell, Power Nap, assertions |
| `storage-disk` | Storage | Disk space, APFS snapshots, SMART, external volumes, I/O |
| `display-graphics` | Display | External monitors, GPU hangs, resolution, brightness |
| `usb-peripheral` | USB / HID | Hubs, keyboards/mice, enumeration, sleep disconnects |

All six load automatically on macOS Electron startup and are exercised by `npm run test:plugins`.

## Adding a new plugin

1. Create `plugins/<id>/manifest.json` + `index.js`
2. Implement pure `diagnose(context)`
3. Run `npm run test:plugins`
4. Commit — no core changes required
