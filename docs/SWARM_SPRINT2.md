# Swarm sprint 2 — shipped

Date: 2026-07-30

| Item | Status |
|------|--------|
| macOS Knowledge drawer (`knowledge-ui.js` + IPC) | ✅ |
| Plugin tip strip under hero | ✅ |
| CaseArtifact export (`case:export` IPC → JSON download) | ✅ |
| Android Knowledge screen + bottom nav | ✅ |
| macOS SQLite migration | ⏳ Deferred (JSON store remains v1; schema-aligned) |

## How to use (macOS)

1. `npm start`
2. Click **Knowledge** in the sidebar → pack drawer
3. Add evidence matching network keywords → **Plugin tips** appear
4. **More → Export case notes** now exports CaseArtifact JSON (via knowledge-ui hook)

## How to use (Android)

1. `flutter run`
2. Bottom nav → **Knowledge**
3. Network pack tips load from `assets/knowledge/network.json`

## Files

- `apps/macos/main.js`, `preload.js`, `knowledge-ui.js`
- `apps/android/lib/screens/knowledge_screen.dart`, `home_shell.dart`, `main.dart`
