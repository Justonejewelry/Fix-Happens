#!/usr/bin/env bash
# Bootstrap Android platform so `flutter run` works.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v flutter >/dev/null 2>&1; then
  echo "Flutter SDK not found. Install: https://docs.flutter.dev/get-started/install"
  exit 1
fi

echo "→ Flutter: $(flutter --version | head -1)"
echo "→ Creating Android platform (preserves lib/ + pubspec.yaml)..."

flutter create . \
  --project-name fix_happens \
  --org com.fixhappens \
  --platforms=android

echo "→ flutter pub get"
flutter pub get

MANIFEST="android/app/src/main/AndroidManifest.xml"
if [[ -f "$MANIFEST" ]]; then
  if ! grep -q "android.permission.CAMERA" "$MANIFEST" 2>/dev/null; then
    echo "→ Adding CAMERA / storage permissions to AndroidManifest.xml"
    # Insert permissions before <application
    tmp="$(mktemp)"
    awk '
      /<application/ && !done {
        print "    <uses-permission android:name=\"android.permission.CAMERA\" />"
        print "    <uses-permission android:name=\"android.permission.READ_MEDIA_IMAGES\" />"
        print "    <uses-permission android:name=\"android.permission.READ_EXTERNAL_STORAGE\" android:maxSdkVersion=\"32\" />"
        done=1
      }
      { print }
    ' "$MANIFEST" > "$tmp" && mv "$tmp" "$MANIFEST"
  else
    echo "→ Permissions already present"
  fi
fi

echo ""
echo "Done. Start an emulator or plug in a device, then:"
echo "  cd apps/android && flutter run"
