# Development progress

Last updated: 2026-07-30

## Completed

- [x] Monorepo foundation (apps / core / design / docs / knowledge / plugins)
- [x] Shared diagnostic engine + causes.json
- [x] Clear Crystal Liquid Glass UI (macOS + Android)
- [x] Durable persistence (macOS JSON userData, Android SQLite)
- [x] Plugin system (loader / registry / executor / validator)
- [x] 7 diagnostic plugins including `network-scan-map`
- [x] Knowledge packs (7) + contextual `getRelevantTips`
- [x] macOS Field tips (plugin + knowledge)
- [x] **Privileged allowlisted scan runner** (opt-in, main-process only)
- [x] CaseArtifact export + CI tests (engine / plugins / scan)

## Next

- [ ] Android: contextual field tips + (optional) remote scan via companion later
- [ ] macOS SQLite migration
- [ ] Parameter editor in UI for host/port plans (beyond preset defaults)
- [ ] Signed / remote knowledge pack install

## Verify

```bash
npm test
npm start
# Enable Privileged scans under Field tips → run ARP / ifconfig / ping
```
