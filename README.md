# Fix Happens

**Shit breaks. Fix Happens.**

Cross-platform **field diagnostic system** for technicians and support engineers.  
Turn vague symptoms into structured cases: evidence → ranked hypotheses → recommended tests → verification → closed knowledge.

| | |
|---|---|
| **Platforms** | macOS (Electron) · Android (Flutter) |
| **Version** | 0.8.7 |
| **License** | MIT |
| **Status** | Active development |
| **Repo** | [Justonejewelry/Fix-Happens](https://github.com/Justonejewelry/Fix-Happens) |

---

## Description

Fix Happens is an offline-friendly diagnostic companion for real-world IT and field service work. Instead of ad-hoc notes, every problem becomes a **case** with:

- Symptom and asset context
- Typed evidence (notes, command output, screenshots)
- Hypothesis ranking powered by a shared diagnostic engine
- Recommended next tests with one-tap copy
- Verification checklist through repair confirmation
- Design system: **Clear Crystal Liquid Glass** (accent `#FF5AA5`)

Built as a monorepo so macOS and Android share the same diagnostic logic and case workflow.

---

## Features

### macOS (Electron)
- 3-column **Case Workspace** (sidebar · hero/timeline · evidence stack)
- Create / close cases
- Live hypothesis re-scoring as evidence is added
- localStorage persistence (cases, evidence, solid-surface preference)
- Preload bridge to `core/diagnosticEngine.js`
- Keyboard shortcuts: **N** next test · **E** evidence · **⌘K** search
- Solid surfaces toggle (reduced transparency)

### Android (Flutter)
- Offline **case list** + workspace
- Create / close cases
- SharedPreferences persistence
- Dart port of the JS diagnostic engine (parity scoring)
- Verification checklist + progress bar
- Photo evidence (camera / gallery)
- Copy next test and commands

### Shared core
- `core/diagnosticEngine.js` — keyword scoring, confidence, next-test recommendations
- `database/schema.sql` — assets, cases, evidence, hypotheses, repair history
- Knowledge packs + plugin-oriented layout under `knowledge/` and `plugins/`

---

## Run now

### macOS

```bash
git clone https://github.com/Justonejewelry/Fix-Happens.git
cd Fix-Happens
npm install
npm start
```

If you see `EACCES` on npm cache:

```bash
sudo chown -R $(whoami) ~/.npm
npm install && npm start
```

### Android

```bash
cd apps/android
chmod +x tool/bootstrap.sh && ./tool/bootstrap.sh   # first time
flutter run
```

Full guide: **[docs/RUN.md](docs/RUN.md)**  
Error map: **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)**  
About / topics setup: **[docs/GITHUB_ABOUT.md](docs/GITHUB_ABOUT.md)**

---

## Case workflow

1. Create case  
2. Gather evidence  
3. Generate hypotheses  
4. Rank by confidence  
5. Recommend tests  
6. Execute tests  
7. Verify results  
8. Close case  
9. Archive knowledge  

Details: [docs/CASE_WORKFLOW.md](docs/CASE_WORKFLOW.md)

---

## Repository layout

```
apps/
  macos/       Electron desktop (main, preload, UI, storage)
  android/     Flutter field companion
core/          Shared JS diagnostic engine
database/      SQLite schema
design/        Liquid Glass tokens + checklist
docs/          Architecture, run, troubleshooting
knowledge/     JSON knowledge packs
plugins/       Diagnostic plugins
```

---

## Design system

**Clear Crystal Liquid Glass** — translucent surfaces, soft blur, single accent `#FF5AA5`, 28px radii, solid-surface accessibility fallback.  
Checklist: [design/LIQUID_GLASS_CHECKLIST.md](design/LIQUID_GLASS_CHECKLIST.md)

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Desktop | Electron, HTML/CSS/JS |
| Mobile | Flutter / Dart |
| Scoring | Shared JS engine + Dart port |
| Persistence | localStorage (macOS) · SharedPreferences (Android) · SQLite schema planned |
| License | MIT |

---

## Project status

- **v0.8.7** — case management on both platforms, verification + photos on Android, core engine preload on macOS
- Open issues track remaining polish (SQLite, issue closure, etc.)
- Contributions and field feedback welcome via Issues

---

## Author

**Justonejewelry** — [github.com/Justonejewelry](https://github.com/Justonejewelry)

---

## License

MIT — see [LICENSE](LICENSE)
