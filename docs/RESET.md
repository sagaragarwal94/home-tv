# Reset: going back to the original TV

Everything Home TV and [DEBLOAT.md](DEBLOAT.md) change can be undone. Pick the level you need.

> Connect to the TV first: `adb connect <TV-IP-address>` and check `adb devices` shows `device`.

---

## Option 1 - One command (recommended)

```bash
./scripts/reset.sh
```

It turns the original launchers back on, re-enables the Google services that were disabled,
restores the preinstalled apps that were removed, and uninstalls Home TV. It's safe to run more than once.
Press **Home** afterwards - the original Google TV launcher should open.

---

## Option 2 - Step by step

### 2a. Just get the original launcher back (keep Home TV installed)

```bash
adb shell pm enable com.google.android.tvlauncher
adb shell pm enable com.google.android.leanbacklauncher   # older models; harmless if missing
```

Press **Home**. If a "Choose Home app" prompt appears, pick the original launcher and choose **Always**.
Home TV stays installed; you can still open it from the app list.

### 2b. Remove Home TV completely

```bash
adb shell pm enable com.google.android.tvlauncher
adb uninstall com.cleanframe.tv
```

Always re-enable the original launcher **before** uninstalling, so the Home button has something to open.

### 2c. Turn the disabled Google services back on

```bash
for p in com.google.android.tvrecommendations \
         com.google.android.leanbacklauncher.recommendations \
         com.google.android.feedback \
         com.google.android.syncadapters.contacts \
         com.google.android.syncadapters.calendar; do
  adb shell pm enable $p
done
```

### 2d. Bring back removed preinstalled apps

```bash
for p in tv.airtel.xstream.tvapp com.sonyliv com.mxtech.videoplayer.ad \
         com.mxtech.videoplayer.television com.graymatrix.did com.fancode.tv \
         com.jio.media.stb.ondemand com.apple.atve.androidtv.appletv; do
  adb shell cmd package install-existing $p
done
```

`install-existing` restores the copy built into the firmware. If one says it doesn't exist, install
it from the Play Store instead.

### 2e. Anything else you disabled

List everything currently disabled, then enable what you want back:

```bash
adb shell pm list packages -d
adb shell pm enable <package>
```

---

## Option 3 - Turn off developer access

Once you're done with adb:

1. **Settings → System → Developer options** → turn off **USB debugging** / **Network debugging**.
2. Optionally turn **Developer options** off at the top of that screen.

This doesn't undo anything above; it just closes adb access to the TV.

---

## Option 4 - Factory reset (last resort)

If the TV is in a state you can't fix with the commands above:

**Settings → System → About → Factory reset** (on some models **Settings → Device Preferences → Reset**).

This erases **everything**: apps, accounts, Wi-Fi, settings. The TV returns exactly to how it came out of the box,
including all the original bloatware.

> **If the TV won't boot to a usable screen:** most Vu/Android TVs have a recovery mode. With the TV off,
> hold the **Power** button on the TV itself (not the remote) while plugging it in, and keep holding until
> a menu appears. Choose **Wipe data / factory reset**. The exact buttons vary by model - check Vu support
> for yours. You should never need this for anything in this project.
