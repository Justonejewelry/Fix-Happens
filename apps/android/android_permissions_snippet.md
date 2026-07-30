# AndroidManifest permissions (photos)

After `flutter create`, ensure `android/app/src/main/AndroidManifest.xml` includes these **inside** `<manifest>`, before `<application>`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
```

The bootstrap script (`tool/bootstrap.sh`) inserts these automatically when possible.

Without them, **Take photo** / **Gallery** may fail at runtime on a physical device; notes and the rest of the case workflow still work.
