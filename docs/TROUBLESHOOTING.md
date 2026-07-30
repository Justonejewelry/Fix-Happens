# Troubleshooting — specific errors → targeted fixes

Copy the **exact** error line from your terminal into this page (Ctrl/Cmd+F).

---

## Flutter / emulator

### `No supported devices connected`
**Cause:** No emulator or device online.  
**Fix:**
```bash
flutter devices
# Android Studio → Device Manager → start an AVD
flutter run
```

### `Waiting for another flutter command to release the startup lock`
**Cause:** Stuck Flutter lock file.  
**Fix:**
```bash
rm -f $(dirname $(which flutter))/../bin/cache/lockfile
# or
killall -9 dart flutter 2>/dev/null; flutter run
```

### `Error: No pubspec.yaml file found`
**Cause:** Wrong directory.  
**Fix:**
```bash
cd apps/android   # must contain pubspec.yaml
flutter run
```

### `Target of URI doesn't exist` / `Error: Couldn't resolve the package`
**Cause:** Dependencies not fetched, or platform not created.  
**Fix:**
```bash
cd apps/android
flutter pub get
./tool/bootstrap.sh   # if android/ folder missing
```

### `FAILURE: Build failed with an exception` + `minSdkVersion`
**Cause:** Plugin needs higher minSdk.  
**Fix:** In `android/app/build.gradle` or `build.gradle.kts`:
```gradle
minSdk = 21
```
Then:
```bash
flutter clean && flutter pub get && flutter run
```

### `SDK location not found` / `sdk.dir is missing`
**Cause:** `local.properties` missing.  
**Fix (macOS):**
```bash
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

### `Android license status unknown` / licenses not accepted
**Fix:**
```bash
flutter doctor --android-licenses
# press y for each
```

### `Gradle task assembleDebug failed` / `Java heap space`
**Fix:** Create `android/gradle.properties` if missing:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
```

### `INSTALL_FAILED_INSUFFICIENT_STORAGE`
**Fix:** Wipe emulator data (AVD Manager → Wipe Data) or free space.

### `Error connecting to the service protocol` / lost connection
**Cause:** Emulator crashed or restarted mid-run.  
**Fix:** Cold Boot AVD, then `flutter run` again.

### `Exception: Gradle build failed to produce an .apk file`
**Fix:**
```bash
cd apps/android
flutter clean
cd android && ./gradlew clean && cd ..
flutter pub get && flutter run
```

---

## Fix Happens app (runtime)

### Red screen: `type 'Null' is not a subtype of type ...`
**Cause:** Old SharedPreferences JSON before `verification` / `photoPaths`.  
**Fix:**
```bash
adb shell pm clear com.fixhappens.fix_happens
# If that package id fails, check applicationId in android/app/build.gradle
flutter run
```
Or in-app: clear app storage from emulator Settings.

### SnackBar: `Could not add photo: ...`
| Substring in message | Fix |
|----------------------|-----|
| `Permission` / `denied` | Grant Camera / Photos in emulator Settings → Apps → Fix Happens |
| `MissingPluginException` | Full restart (not hot reload): stop app, `flutter run` again after adding plugins |
| `Unsupported operation` on desktop | Photos need a real Android emulator/device |

### `CAMERA` permission / gallery empty
**Fix:** Ensure manifest has permissions (re-run bootstrap):
```bash
cd apps/android && ./tool/bootstrap.sh
```
See `apps/android/android_permissions_snippet.md`.

### Cases list empty after update
**Cause:** Corrupt store or all cases closed.  
**Fix:** Clear app data (above) to reload seed cases, or tap **New case**.

---

## Electron (macOS)

### `electron: command not found` / `Cannot find module 'electron'`
**Fix:**
```bash
# from repo root
npm install
npm start
```

### Blank window
**Fix:** Run from **repo root** (where `package.json` is). Check terminal for path errors loading `apps/macos/index.html`.

### Badge shows `Browser engine` not `Core engine`
**Cause:** Preload failed to load `core/diagnosticEngine.js`.  
**Fix:** Confirm file exists at `core/diagnosticEngine.js`; restart with `npm start` from root.

---

## Capture output for help

```bash
cd apps/android
./tool/diagnose.sh
flutter run -v 2>&1 | tee /tmp/fix-happens-flutter.log
# Send the last 40 lines of the log + diagnose.sh output
```
