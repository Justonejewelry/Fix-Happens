# Fix Happens

**Shit breaks. Fix Happens.**

Cross-platform field diagnostic system for macOS and Android.

Turns symptoms into structured troubleshooting cases. Tracks evidence, hypotheses, verification steps, commands, repair history, and knowledge packs.

## Run now

### macOS (Electron)

```bash
npm install
npm start
```

### Android (Flutter)

```bash
cd apps/android
chmod +x tool/bootstrap.sh && ./tool/bootstrap.sh   # first time only
flutter run
```

Step-by-step: **[docs/RUN.md](docs/RUN.md)**

## Current status (v0.8.7)

- Shared core architecture (diagnostic, plugin, knowledge, verification engines)
- **Clear Crystal Liquid Glass** design system
- macOS Electron **Case Workspace** — create/close cases, live scoring, persistence, core engine preload
- Android Flutter companion — case list, workspace, verification, photos, offline store
- Issues #4 and #5 closed; #1–#3 in progress with substantial implementation

## Repository layout

```
apps/
  macos/          # Electron desktop (main.js, preload, index.html, app.js, storage.js)
  android/        # Flutter field companion
core/             # Shared JS engines
database/         # SQLite schema
design/           # Tokens, checklist, accessibility
docs/             # Architecture, RUN guide, roadmap
knowledge/        # JSON knowledge packs
plugins/          # Diagnostic plugins
```

## Design system

**Clear Crystal Liquid Glass** — translucent surfaces, soft blur, pink accent `#FF5AA5` only.  
Checklist: [`design/LIQUID_GLASS_CHECKLIST.md`](design/LIQUID_GLASS_CHECKLIST.md)

## Case workflow

1. Create Case → 2. Gather Evidence → 3. Generate Hypotheses → 4. Rank by confidence  
5. Recommend tests → 6. Execute → 7. Verify → 8. Close → 9. Archive knowledge
