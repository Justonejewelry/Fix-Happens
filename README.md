# Fix Happens

**Shit breaks. Fix Happens.**

Cross-platform field diagnostic system for macOS and Android.

Turns symptoms into structured troubleshooting cases. Tracks evidence, hypotheses, verification steps, commands, repair history, and knowledge packs.

## Current status (v0.8.4)

- Shared core architecture (diagnostic, plugin, knowledge, verification engines)
- **Clear Crystal Liquid Glass** design system (tokens, checklist, accessibility fallbacks)
- macOS Electron **Case Workspace** — 3-column UI, live hypothesis scoring, copy commands, keyboard shortcuts, case switcher, solid-surface toggle
- Android Flutter companion — Case Workspace skeleton + `pubspec.yaml`
- Client-side persistence helper (`apps/macos/storage.js`) toward SQLite
- Example networking knowledge pack + plugin
- Issues #4 and #5 closed; #1–#3 remain open with progress comments

## Quick start (macOS)

```bash
npm install
npm start
```

Launches the Electron app with the Liquid Glass Case Workspace.

## Android (Flutter)

```bash
cd apps/android
flutter pub get
flutter run
```

Requires a Flutter SDK. `lib/main.dart` is the Case Workspace field UI.

## Repository layout

```
apps/
  macos/          # Electron desktop (main.js, index.html, storage.js)
  android/        # Flutter field companion (main.dart, pubspec.yaml)
core/             # Shared JS engines
database/         # SQLite schema
design/           # Tokens, components, checklist, accessibility, fallbacks
docs/             # Architecture, roadmap, workflow, UI guidelines
knowledge/        # JSON knowledge packs
plugins/          # Diagnostic plugins
```

## Design system

**Clear Crystal Liquid Glass**
- Translucent crystal surfaces + soft blur + depth
- Pink accent only (`#FF5AA5`)
- Tokens: `design/tokens.json`
- Checklist: [`design/LIQUID_GLASS_CHECKLIST.md`](design/LIQUID_GLASS_CHECKLIST.md)

## Case workflow

1. Create Case → 2. Gather Evidence → 3. Generate Hypotheses → 4. Rank by confidence  
5. Recommend tests → 6. Execute → 7. Verify → 8. Close → 9. Archive knowledge

See `docs/` for architecture, plugin model, and roadmap.
