# Fix Happens

**Shit breaks. Fix Happens.**

Cross-platform field diagnostic system for macOS and Android.

Turns symptoms into structured troubleshooting cases. Tracks evidence, hypotheses, verification steps, commands, repair history, and knowledge packs.

## Current status (v0.8 macOS shell)

- Shared core architecture (diagnostic, plugin, knowledge, verification engines)
- Liquid Glass design system (tokens + crystal UI + checklist)
- macOS Electron shell with **Case Workspace** layout shipped
- Android Flutter companion skeleton
- SQLite schema for assets / cases / evidence / hypotheses / repairs
- Example networking knowledge pack + plugin
- Open issues track the remaining 0.8–1.0 work

## Quick start (macOS)

```bash
npm install
npm start
```

This launches the Electron app with the clear-crystal Liquid Glass Case Workspace.

## Repository layout

```
apps/
  macos/          # Electron desktop app (main.js + index.html)
  android/        # Flutter field companion (main.dart)
core/             # Shared JS engines (diagnostic, plugins, knowledge, verification)
database/         # SQLite schema
design/           # Tokens, components, checklist, accessibility, fallbacks
docs/             # Architecture, roadmap, workflow, UI guidelines
knowledge/        # JSON knowledge packs (networking, …)
plugins/          # Extensible diagnostic plugins
```

## Planned modules

- macOS desktop app (case management, command library, SQLite)
- Android companion (offline cases, photo/voice, knowledge browsing)
- Shared workflow + evidence + hypothesis + verification engines
- Knowledge packs: networking, HVAC, electrical, plumbing, general repair

## Design system

**Clear Crystal Liquid Glass**
- Translucent crystal surfaces + soft blur + depth
- Pink accent only (`#FF5AA5`)
- Shared radii / shadows / spacing tokens in `design/tokens.json`
- Full checklist: [`design/LIQUID_GLASS_CHECKLIST.md`](design/LIQUID_GLASS_CHECKLIST.md)

## Case workflow

1. Create Case → 2. Gather Evidence → 3. Generate Hypotheses → 4. Rank by confidence  
5. Recommend tests → 6. Execute → 7. Verify → 8. Close → 9. Archive knowledge

See `docs/` for full architecture, plugin model, and roadmap.
