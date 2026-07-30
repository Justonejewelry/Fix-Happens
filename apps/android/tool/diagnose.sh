#!/usr/bin/env bash
# Print Fix Happens Android environment diagnostics for targeted debugging.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "======== Fix Happens Android diagnose ========"
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Dir:  $ROOT"
echo ""

echo "---- Flutter ----"
if command -v flutter >/dev/null 2>&1; then
  flutter --version 2>&1 | head -5
  echo ""
  flutter doctor 2>&1 | sed -n '1,40p'
  echo ""
  echo "Devices:"
  flutter devices 2>&1
else
  echo "ERROR: flutter not on PATH"
  echo "FIX: https://docs.flutter.dev/get-started/install"
fi

echo ""
echo "---- Project files ----"
for f in pubspec.yaml lib/main.dart android/app/src/main/AndroidManifest.xml; do
  if [[ -e "$f" ]]; then
    echo "OK   $f"
  else
    echo "MISS $f"
    if [[ "$f" == android/* ]]; then
      echo "     FIX: ./tool/bootstrap.sh"
    fi
  fi
done

echo ""
echo "---- pubspec deps (relevant) ----"
if [[ -f pubspec.yaml ]]; then
  grep -E 'shared_preferences|image_picker|uuid|path_provider|sdk:' pubspec.yaml || true
fi

echo ""
echo "---- AndroidManifest permissions ----"
MANIFEST="android/app/src/main/AndroidManifest.xml"
if [[ -f "$MANIFEST" ]]; then
  grep -E 'permission|package=' "$MANIFEST" | head -20 || true
  if ! grep -q 'android.permission.CAMERA' "$MANIFEST"; then
    echo "WARN: CAMERA permission missing → photo capture may fail"
    echo "FIX:  ./tool/bootstrap.sh  or see android_permissions_snippet.md"
  fi
else
  echo "MISS manifest — run ./tool/bootstrap.sh"
fi

echo ""
echo "---- local.properties / SDK ----"
if [[ -f android/local.properties ]]; then
  cat android/local.properties
else
  echo "MISS android/local.properties"
  if [[ -d "$HOME/Library/Android/sdk" ]]; then
    echo "FIX: echo sdk.dir=\$HOME/Library/Android/sdk > android/local.properties"
  fi
fi

echo ""
echo "---- adb (if present) ----"
if command -v adb >/dev/null 2>&1; then
  adb devices -l 2>&1
else
  echo "adb not on PATH (ok if using Android Studio only)"
fi

echo ""
echo "======== End diagnose ========"
echo "Next: flutter run -v 2>&1 | tee /tmp/fix-happens-flutter.log"
echo "Docs: docs/TROUBLESHOOTING.md"
