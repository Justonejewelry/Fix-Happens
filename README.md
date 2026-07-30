# Fix Happens

**Shit breaks. Fix Happens.**

Cross-platform **Field Diagnostic Operating System** for technicians and support engineers.  
Turn vague symptoms into structured cases: evidence → ranked hypotheses → recommended tests → verification → closed knowledge.

| | |
|---|---|
| **Platforms** | macOS (Electron) · Android (Flutter) |
| **Version** | **[1.2.1](https://github.com/Justonejewelry/Fix-Happens/releases)** — first release |
| **License** | MIT |
| **Status** | Active · offline-first field workflow |
| **Repo** | [Justonejewelry/Fix-Happens](https://github.com/Justonejewelry/Fix-Happens) |

---

## Description

Fix Happens is an offline-friendly diagnostic companion for real-world IT and field service work. Instead of ad-hoc notes, every problem becomes a **case** with:

- Symptom and asset context
- Typed evidence (notes, command output, screenshots)
- Hypothesis ranking powered by a shared diagnostic engine (`causes.json` v3)
- Recommended next tests with one-tap copy
- Knowledge packs + diagnostic **plugins**
- Opt-in **allowlisted** network scan runner (macOS)
- Verification checklist through repair confirmation
- Design system: **Clear Crystal Liquid Glass** (accent `#FF5AA5`)

Built as a monorepo so macOS and Android share the same diagnostic logic and case workflow.

---

## Features

### macOS (Electron)
- 3-column **Case Workspace** (sidebar · hero/timeline · evidence stack)
- Create / close cases · CaseArtifact **export & import**
- Live hypothesis re-scoring as evidence is added
- Durable JSON store in Electron `userData`
- Preload bridge to `core/diagnosticEngine.js`
- Knowledge drawer + contextual **Field tips**
- Privileged scans (opt-in): ARP, interfaces, ping, traceroute, port check, Wi-Fi survey
- Host/port parameter editor · scan output attaches as evidence
- Keyboard shortcuts: **N** next test · **E** evidence · **⌘K** search
- Solid surfaces toggle (reduced transparency)

### Android (Flutter)
- Offline **case list** + workspace
- SQLite persistence + photo evidence (camera / gallery)
- Dart diagnostic engine loads `assets/causes.json` (parity with JS)
- Knowledge tab + contextual Field tips in the case workspace
- Verification checklist + progress ring
- Copy next test and commands

### Shared core
- `core/diagnosticEngine.js` — keyword scoring, confidence, next-test recommendations
- `core/plugin*` — manifest validation, loader, registry, executor
- `core/scanRunner.js` — allowlisted privileged diagnostics
- `core/caseContract.js` — CaseArtifact v1
- `knowledge/` + `plugins/` — packs and diagnostic providers
- `database/schema.sql` — assets, cases, evidence, hypotheses, repair history

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
Changelog: **[CHANGELOG.md](CHANGELOG.md)**  
Release notes: **[docs/RELEASE_v1.2.1.md](docs/RELEASE_v1.2.1.md)**  
Error map: **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)**

---

## Case workflow

1. Create case  
2. Gather evidence  
3. Generate hypotheses  
4. Rank by confidence  
5. Recommend tests  
6. Execute tests (copy commands or privileged scans)  
7. Verify results  
8. Close case  
9. Export CaseArtifact / archive knowledge  

Details: [docs/CASE_WORKFLOW.md](docs/CASE_WORKFLOW.md)

---

## Repository layout

```
apps/
  macos/       Electron desktop (main, preload, UI, storage)
  android/     Flutter field companion
core/          Shared JS engines (diagnostic, plugins, scan, knowledge)
database/      SQLite schema
design/        Liquid Glass tokens + checklist
docs/          Architecture, run, release notes
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
| Persistence | JSON userData (macOS) · SQLite (Android) |
| License | MIT |

---

## Project status

- **v1.2.1** — first release: full case workflow, plugins, knowledge packs, opt-in scan runner, CaseArtifact import/export, CI tests
- Next: macOS SQLite migration, signed knowledge packs, Android companion scan assist
- Contributions and field feedback welcome via Issues

---

## Author

**Justonejewelry** — [github.com/Justonejewelry](https://github.com/Justonejewelry)

---

## License

MIT — see [LICENSE](LICENSE)
