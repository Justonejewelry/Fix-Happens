# Packaging (Phase 4)

## macOS Electron

```bash
npm install
npm start          # dev
```

Production packaging (optional toolchain):

```bash
npm install --save-dev electron-builder
npx electron-builder --mac dir
```

Configure `build` in package.json when you are ready for signed `.dmg` / notarization.

## Android

```bash
cd apps/android
flutter build apk --debug
flutter build apk --release   # requires signing config
```

Install debug APK on a device:

```bash
flutter install
```

## Icons / branding

Replace default Electron/Flutter icons under platform projects after bootstrap.
