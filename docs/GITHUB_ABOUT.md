# Populate GitHub “About” sidebar

The Grok GitHub connector can push files and issues, but **cannot** set the repository About fields (description, homepage, topics). Run these once on your Mac after `npm install` works.

## Option A — GitHub CLI (recommended)

```bash
# Install if needed: brew install gh && gh auth login

gh repo edit Justonejewelry/Fix-Happens \
  --description "Shit breaks. Fix Happens. Cross-platform field diagnostic system for macOS (Electron) and Android (Flutter): cases, evidence, ranked hypotheses, verification, offline-first." \
  --homepage "https://github.com/Justonejewelry/Fix-Happens" \
  --add-topic diagnostics \
  --add-topic troubleshooting \
  --add-topic electron \
  --add-topic flutter \
  --add-topic android \
  --add-topic macos \
  --add-topic field-service \
  --add-topic liquid-glass \
  --add-topic offline-first \
  --add-topic IT-support
```

## Option B — Web UI

1. Open https://github.com/Justonejewelry/Fix-Happens  
2. Click the **gear** next to **About**  
3. Paste:

**Description** (≤350 chars):

```
Shit breaks. Fix Happens. Cross-platform field diagnostic system for macOS (Electron) and Android (Flutter): cases, evidence, ranked hypotheses, verification, offline-first.
```

**Website:**

```
https://github.com/Justonejewelry/Fix-Happens
```

**Topics** (add one by one):

```
diagnostics
troubleshooting
electron
flutter
android
macos
field-service
liquid-glass
offline-first
IT-support
```

Check **Releases**, **Packages**, and **Deployments** only if you use them.

## Option C — REST API with token

```bash
curl -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/Justonejewelry/Fix-Happens \
  -d '{
    "description": "Shit breaks. Fix Happens. Cross-platform field diagnostic system for macOS (Electron) and Android (Flutter): cases, evidence, ranked hypotheses, verification, offline-first.",
    "homepage": "https://github.com/Justonejewelry/Fix-Happens",
    "has_issues": true,
    "has_projects": true,
    "has_wiki": false
  }'

curl -X PUT \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/Justonejewelry/Fix-Happens/topics \
  -d '{"names":["diagnostics","troubleshooting","electron","flutter","android","macos","field-service","liquid-glass","offline-first","IT-support"]}'
```

Token needs `repo` scope (classic) or Administration + Metadata permissions (fine-grained).
