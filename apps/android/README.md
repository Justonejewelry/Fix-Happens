# Fix Happens — Android field companion

Clear Crystal Liquid Glass UI for offline diagnostic cases.

## Run

```bash
# First time only — generates android/ platform
chmod +x tool/bootstrap.sh && ./tool/bootstrap.sh

flutter run
```

Full guide: [`../../docs/RUN.md`](../../docs/RUN.md)

## Features

- Open case list (offline, SharedPreferences)
- Create / close cases
- Evidence notes + photo capture
- Hypothesis ranking (Dart port of `core/diagnosticEngine.js`)
- Verification checklist
- Copy next test / commands
