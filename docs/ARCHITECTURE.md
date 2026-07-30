# Fix Happens — System Architecture (FDOS)

**Field Diagnostic Operating System** — production architecture.

## Goals

1. Offline-first case management on macOS and Android
2. Shared diagnostic brain (`core/causes.json` + engines)
3. Extensible domain plugins and knowledge packs
4. Clear Crystal Liquid Glass UX consistency
5. Durable local persistence with exportable case artifacts

## Layer diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation                                               │
│  apps/macos (Electron + Liquid Glass)                       │
│  apps/android (Flutter + shared widgets)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │ IPC / service calls
┌───────────────────────────▼─────────────────────────────────┐
│  Application services                                       │
│  Case lifecycle · Verification · Search · Export            │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Domain core                                                │
│  diagnosticEngine · pluginRegistry · knowledgeLoader        │
│  causes.json · knowledge/*.json · plugins/*                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Persistence                                                │
│  macOS: userData JSON (schema-aligned)                      │
│  Android: SQLite (schema.sql)                               │
│  Export: CaseArtifact v1 JSON                               │
└─────────────────────────────────────────────────────────────┘
```

## Case lifecycle states

`New` → `Investigating` → `Testing` → `Resolved` (closed)

Optional future: `Blocked`, `Waiting`, `Archived`.

## Data contract

See `core/caseContract.js` for the canonical CaseArtifact shape used for export/import and cross-platform parity checks.

## Plugin model

Plugins live under `plugins/<id>/` with:

- `manifest.json` — id, version, platforms, permissions, entryPoint
- `index.js` — exports `{ id, diagnose(context) }`

Load path: `pluginLoader` → `pluginManifestValidator` → `pluginRegistry` → `pluginExecutor`.

Plugins **must not** execute shell commands by default. They return suggested tests and hypothesis boosts only unless a future capability flag is granted.

## Knowledge packs

JSON files under `knowledge/` with tips and relatedCauses. Loaded by `knowledgeLoader.listPacks()` / `loadKnowledgePack()`.

## Security posture

- No network required for core diagnostics
- Local DB only; export is explicit user action
- Plugins sandboxed to pure functions in v1
- Solid surfaces mode for accessibility

## Trade-offs (Benjamin)

| Decision | Choice | Why | Cost |
|----------|--------|-----|------|
| Shared rules | JSON causes file | Easy parity macOS/Android | Manual Dart/asset sync |
| macOS store | JSON in userData | No native rebuild | Not true SQL yet |
| Android store | SQLite | Field durability | Schema migrations needed |
| Plugins | Directory + manifest | Extensible domains | No remote install yet |
| UI | Dual native | Best UX per platform | Two codebases |
