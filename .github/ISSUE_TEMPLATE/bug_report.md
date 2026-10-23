---
name: Bug report
about: Something doesn't work on your TV
title: "[Bug] "
labels: bug
---

**What happened**
<!-- e.g. "Pressing OK on Netflix does nothing" -->

**What you expected**

**TV details**
- Brand / model: <!-- e.g. Vu 55GloLED -->
- Android TV version: <!-- Settings → System → About -->
- Launcher you replaced: <!-- com.google.android.tvlauncher / leanbacklauncher -->
- Home TV version: <!-- e.g. v1.0.0 -->

**Logs** (very helpful)
```
# press the button that fails, then run:
adb logcat -d | grep -iE "HomeTV|chromium|AndroidRuntime|ActivityManager: START" | tail -40
```

**Screenshot** (optional)
`adb exec-out screencap -p > screen.png`

- [ ] I checked [docs/FAQ.md](https://github.com/sagaragarwal94/home-tv/blob/main/docs/FAQ.md) first
