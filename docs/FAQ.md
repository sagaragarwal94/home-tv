# FAQ and troubleshooting

Find your error message or symptom below. Most fixes are one or two commands.

**Contents**
- Building: [Gradle download timeout](#gradle-download-timeout) · [Java not found](#java-17-not-found) · [Android SDK not found / licences](#android-sdk-not-found-or-licences-not-accepted) · [Build fails with a long error](#the-build-fails-with-some-other-error)
- Connecting: [no devices found](#adb-no-devicesemulators-found) · [unauthorized](#adb-devices-says-unauthorized) · [connection refused / timed out](#failed-to-connect--connection-refused--timed-out) · [daemon restarted](#daemon-not-running-starting-now-and-then-no-devices)
- Installing: [INSTALL_FAILED_UPDATE_INCOMPATIBLE](#install_failed_update_incompatible) · [INSTALL_FAILED_INSUFFICIENT_STORAGE](#install_failed_insufficient_storage)
- On the TV: [old launcher still opens](#home-still-opens-the-old-launcher) · [only the top-left of the screen shows](#only-the-wallpaper-and-clock-show-the-rest-is-missing-or-everything-is-huge) · [apps don't open](#pressing-ok-on-an-app-does-nothing) · [stuck inside a system app](#im-stuck-inside-a-strange-system-screen) · [an app is missing](#an-app-is-missing-from-the-grid) · [junk apps showing](#junk--system-apps-show-in-the-grid) · [weather missing](#the-weather-doesnt-show) · [inputs don't switch](#inputs-doesnt-switch-to-hdmi) · [slow](#it-feels-slow) · [black screen](#black-screen-after-installing)
- After changes: [bloat came back](#removed-apps-came-back) · [changing the package id](#can-i-change-the-package-id)

---

## Building

### Gradle download timeout

```
Downloading https://services.gradle.org/distributions/gradle-8.7-bin.zip
Exception in thread "main" java.io.IOException: ... failed: timeout
```

Your connection to Gradle's server is slow or blocked. Try these in order:

1. **Just retry** - `./install.sh` again. The timeout is already set to 120 s.
2. **Download it yourself** and point the project at the file:
   ```bash
   curl -L --retry 5 -o ~/Downloads/gradle-8.7-bin.zip https://services.gradle.org/distributions/gradle-8.7-bin.zip
   sed -i '' "s#^distributionUrl=.*#distributionUrl=file\\\\:$HOME/Downloads/gradle-8.7-bin.zip#" gradle/wrapper/gradle-wrapper.properties
   ./install.sh
   ```
   (On Linux use `sed -i` without the `''`.) Don't commit this change - it points at your own Downloads folder.
3. **Switch network** - a phone hotspot or VPN for the first build. After that everything is cached in `~/.gradle`.

If a later step times out downloading from `dl.google.com` or `maven.google.com`, it's the same problem; use option 3.

### Java 17 not found

```
Java 17 not found. See docs/SETUP.md (step 1).
```

Install Java 17 ([SETUP step 1](SETUP.md#step-1---install-java-17)). If it's installed somewhere unusual:

```bash
export JAVA_HOME=/path/to/jdk-17
./install.sh
```

Newer Java versions (21+) usually work too. Java 11 or older will not.

### Android SDK not found, or licences not accepted

```
Android SDK not found.            or
Failed to install the following Android SDK packages as some licences have not been accepted.
```

Install the SDK ([SETUP step 2](SETUP.md#step-2---install-the-android-sdk)), then accept the licences:

```bash
sdkmanager --licenses
# Android Studio users:
~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager --licenses
```

If you don't have `cmdline-tools` in Android Studio: **Settings → Languages & Frameworks → Android SDK → SDK Tools →
Android SDK Command-line Tools** → Apply.

### The build fails with some other error

Run the build alone with more detail and read the first line that says `What went wrong`:

```bash
./gradlew assembleDebug --stacktrace
```

Common ones: `Unsupported class file major version` → wrong Java version (use 17).
`SDK location not found` → run `./install.sh` (it writes `local.properties`) or set `ANDROID_HOME`.
Still stuck: `./gradlew clean` and try again.

---

## Connecting

### adb: no devices/emulators found

adb isn't connected to the TV. This happens after the TV restarts, the Mac sleeps, or adb restarts.

```bash
adb connect <TV-IP-address>
adb devices
```

Still nothing? Check that:
- the TV is **on** (not standby) and on the **same Wi-Fi** as the Mac;
- the IP hasn't changed (**Settings → Network & Internet** on the TV);
- **USB debugging / Network debugging** is still on - some TVs switch it off after a restart.

### adb devices says "unauthorized"

Look at the TV - there's a prompt asking to allow debugging. Tick **Always allow from this computer** and press OK.
If there's no prompt: on the TV, **Developer options → Revoke USB debugging authorisations**, then on the Mac:

```bash
adb kill-server
adb connect <TV-IP-address>
```

and accept the new prompt.

### failed to connect / connection refused / timed out

- Network debugging is off on the TV - turn it back on in Developer options.
- Wrong IP - check it again on the TV.
- Your router isolates devices ("AP isolation", "client isolation", common on guest networks) - use the main network.
- Android 11+ wireless debugging uses a **different port** each time - use the port shown on the TV
  (`adb connect <IP>:<port>`), or pair first (see [SETUP step 5](SETUP.md#step-5---connect-to-the-tv)).

### "daemon not running; starting now" and then no devices

adb restarted on your Mac and forgot the TV. Just reconnect: `adb connect <TV-IP-address>`.
Then `./install.sh --no-build` installs the build you already have.

---

## Installing

### INSTALL_FAILED_UPDATE_INCOMPATIBLE

```
Failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE: ... signatures do not match]
```

The version on the TV was built on a different computer (different debug key). Remove it and reinstall.
**Re-enable the original launcher first** so Home keeps working:

```bash
adb shell pm enable com.google.android.tvlauncher
adb uninstall com.cleanframe.tv
./install.sh --no-build
adb shell pm disable-user --user 0 com.google.android.tvlauncher
```

Your app order and hidden apps are lost (they're stored inside the app).

### INSTALL_FAILED_INSUFFICIENT_STORAGE

The TV is nearly full. Clear space (uninstall unused apps, or **Settings → Apps → (app) → Clear cache**) and try again.
Home TV needs about 25 MB.

---

## On the TV

### Home still opens the old launcher

Check which Home apps exist and which one Android uses:

```bash
adb shell cmd package query-activities -a android.intent.action.MAIN -c android.intent.category.HOME | grep packageName
adb shell cmd package resolve-activity -a android.intent.action.MAIN -c android.intent.category.HOME | grep packageName
```

Disable the Google launcher that's listed (only these two - never the others):

```bash
adb shell pm disable-user --user 0 com.google.android.tvlauncher        # Google TV launcher
adb shell pm disable-user --user 0 com.google.android.leanbacklauncher  # older Android TV launcher
```

Leave `com.android.boot.fallbackhome` and `com.android.tv.settings` alone - they show up in the list but don't compete.
If a "Choose Home app" prompt appears, pick **Home** and **Always**. The launcher can come back after a firmware
update; just run the command again.

### Only the wallpaper and clock show, the rest is missing (or everything is huge)

The page isn't being scaled to the screen. This was fixed in v1.0 (fixed 1920 layout + wide viewport). Make sure
you've installed the latest build:

```bash
./install.sh
adb shell am force-stop com.cleanframe.tv
```

then press Home. If it persists, open `chrome://inspect` on your Mac, inspect Home TV and run
`[innerWidth, innerHeight]` in the console - send those numbers with a bug report.

### Pressing OK on an app does nothing

1. Make sure you're on the latest build (apps are launched from the main thread since v1.0).
2. See what Android did:
   ```bash
   adb logcat -c
   # press OK on an app now
   adb logcat -d | grep -E "HomeTV|ActivityManager: START|Displayed" | tail -20
   ```
   - `HomeTV: Starting ...` then `Displayed ...` → the app did open. If the screen didn't change, it's the
     scaling issue above.
   - `HomeTV: Couldn't start ...` → the app can't be launched from outside; open it from **Settings → Apps** instead.
   - Nothing from `HomeTV` → the remote's OK isn't reaching the page. Try `adb shell input keyevent 23`; if that
     works but the remote doesn't, open an issue with your TV model.

**Hold vs press:** a short press opens the app; holding OK for about half a second opens the app menu instead.

### I'm stuck inside a strange system screen

Some system tools (for example *Netflix Observer* or *Disclaimer Customization*) aren't meant to be opened and
ignore Back. Press **Home**. If that doesn't work:

```bash
adb shell am force-stop com.mstar.android.tv.disclaimercustomization
adb shell am force-stop com.mstar.netflixobserver
# or, for anything:  adb shell am force-stop <package>
```

Home TV hides these automatically. If something else like this shows up, hold OK on it → **Hide from Home**.

### An app is missing from the grid

It's probably hidden. Hold OK on any app → **Show hidden apps** → choose it.
Newly installed apps appear automatically the next time you return to Home.
Apps that have no TV version (phone-only apps you sideloaded) are hidden by default - unhide them the same way.

### Junk / system apps show in the grid

Hold OK on it → **Hide from Home**. To hide something for everyone who uses your build, add its package name to
`HIDE_BY_DEFAULT` in `app/src/main/assets/web/app.js`.

### The weather doesn't show

The weather box stays hidden until the first successful update.
- Check the TV has internet (open YouTube).
- `api.open-meteo.com` may be blocked by your network/DNS (e.g. Pi-hole) - allow it.
- Change the city in `CITY` at the top of `app.js`, then `./install.sh`.
- In `chrome://inspect` → Console you'll see any network error.

### Inputs doesn't switch to HDMI

TVs expose their inputs differently. Use **TV & inputs app** at the bottom of the Inputs list, which opens the TV's own
input screen. If the list is empty, that option is all there is on your model. Check what your TV reports:

```bash
adb shell dumpsys tv_input | grep -iE "id=|label"
```

### It feels slow

- The first launch after installing builds images for every app's banner - give it 10-20 seconds once.
- The wallpaper fade and tile lift use simple GPU transforms; if your model still struggles, set the
  transitions in `style.css` to `none`.
- Settings → Developer options → set **Window/Transition/Animator animation scale** to 0.5×.

### Black screen after installing

Wait 10 seconds (first-run banner caching). Then:

```bash
adb shell am force-stop com.cleanframe.tv
adb shell am start -n com.cleanframe.tv/.MainActivity
adb logcat -d | grep -iE "chromium|HomeTV|AndroidRuntime" | tail -30
```

Make sure **Android System WebView** is up to date in the Play Store. If you need the TV usable right now,
re-enable the original launcher ([RESET 2a](RESET.md#2a-just-get-the-original-launcher-back-keep-home-tv-installed)).

---

## After changes

### Removed apps came back

A factory reset restores everything, and firmware updates can reinstall apps or re-enable the original launcher.
Re-run the commands from [DEBLOAT.md](DEBLOAT.md) and, if needed, disable the launcher again.

### Can I change the package id?

Yes - change `applicationId` and `namespace` in `app/build.gradle`, move `MainActivity.java` to the matching folder,
update its `package` line, and update `PKG` in `install.sh` and `scripts/reset.sh` plus the commands in these docs.
It installs as a **new app**, so: re-enable the original launcher, uninstall `com.cleanframe.tv`, install the new
one, then set it as Home again.
