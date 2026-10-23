# Removing bloatware (optional)

Home TV doesn't need any of this; it hides junk from its own grid either way. But if you want
preinstalled apps and background services gone from the TV itself, this is how it was done on the
Vu TV this project was built on. Everything here is **reversible** - see [RESET.md](RESET.md).

## Two ways to remove things

| Command | What it does | Undo |
| --- | --- | --- |
| `adb shell pm uninstall -k --user 0 <package>` | Removes the app for your user. The original stays in the firmware. | `adb shell cmd package install-existing <package>` |
| `adb shell pm disable-user --user 0 <package>` | Switches the app off but leaves it installed. Safer for system apps. | `adb shell pm enable <package>` |

Use **uninstall** for ordinary preinstalled apps and **disable** for anything system-level.

## See what's installed

```bash
adb shell pm list packages -3     # third-party / preinstalled extras
adb shell pm list packages -s     # system packages
adb shell pm list packages -d     # currently disabled
```

## What was removed on the reference TV

### Preinstalled streaming apps (uninstalled)

```bash
for p in tv.airtel.xstream.tvapp com.sonyliv com.mxtech.videoplayer.ad \
         com.mxtech.videoplayer.television com.graymatrix.did com.fancode.tv \
         com.jio.media.stb.ondemand com.apple.atve.androidtv.appletv; do
  echo "$p: $(adb shell pm uninstall -k --user 0 $p)"
done
```

Airtel Xstream, SonyLIV, MX Player (×2), ZEE5, FanCode, JioCinema/Jio on-demand, Apple TV.
Keep any you use - delete its line first.

### Google extras (disabled)

```bash
for p in com.google.android.tvrecommendations \
         com.google.android.leanbacklauncher.recommendations \
         com.google.android.feedback \
         com.google.android.syncadapters.contacts \
         com.google.android.syncadapters.calendar; do
  echo "$p: $(adb shell pm disable-user --user 0 $p)"
done
```

Home-screen recommendation rows, feedback/crash reporting, and contact/calendar sync (unused on a TV).

## Never remove these

Removing these can break the picture, inputs, the remote, Wi-Fi or booting:

| Package | Does |
| --- | --- |
| `com.android.providers.downloads` | Downloads (Play Store needs it) |
| `com.mediatek.wwtv.tvcenter`, `com.mediatek.tv.agent`, `com.mediatek.androidbox` | HDMI inputs, picture, core TV software |
| `com.mediatek.hotkey.dispatcher`, `com.mediatek.autopair`, `com.hisense.kpad` | Remote buttons and pairing |
| `com.mediatek.wwtv.setupwizard` | Setup (removing can cause boot loops) |
| `com.mediatek.tv.factory`, `com.mediatek.network` | Factory menu, Wi-Fi |
| `com.mstar.android.tv.disclaimercustomization`, `com.mstar.netflixobserver` | Startup screens, Netflix button |
| `com.android.systemui`, `com.android.tv.settings`, `com.google.android.gms` | Android itself, Settings, Google Play services |
| `com.android.boot.fallbackhome` | Used briefly during boot |

**Optional:** `com.hisense.remoteupgrade` handles firmware updates. Disabling it stops updates from
reinstalling bloat, but you also lose security fixes. Left enabled on the reference TV.

## Good to know

- A **factory reset** brings back everything removed here.
- A **firmware update** may reinstall some apps. Just run the commands again.
- Unsure about a package? Disable rather than uninstall, test for a day, and re-enable if anything breaks.
