#!/bin/bash
# Puts the TV back the way it was: original launcher, original apps, Home TV removed.
# Safe to run more than once. Usage: ./scripts/reset.sh
PKG=com.cleanframe.tv

if ! adb devices | awk 'NR>1 && $2=="device"' | grep -q .; then
  echo "No TV connected. Run: adb connect <TV-IP-address>"; exit 1
fi

echo "1/4  Turning the original launchers back on..."
for p in com.google.android.tvlauncher com.google.android.leanbacklauncher; do
  adb shell pm enable $p >/dev/null 2>&1 && echo "     enabled $p"
done

echo "2/4  Turning disabled Google services back on..."
for p in com.google.android.tvrecommendations \
         com.google.android.leanbacklauncher.recommendations \
         com.google.android.feedback \
         com.google.android.syncadapters.contacts \
         com.google.android.syncadapters.calendar; do
  adb shell pm enable $p >/dev/null 2>&1 && echo "     enabled $p"
done

echo "3/4  Restoring preinstalled apps that were removed..."
for p in tv.airtel.xstream.tvapp com.sonyliv com.mxtech.videoplayer.ad \
         com.mxtech.videoplayer.television com.graymatrix.did com.fancode.tv \
         com.jio.media.stb.ondemand com.apple.atve.androidtv.appletv; do
  out=$(adb shell cmd package install-existing $p 2>&1)
  case "$out" in *installed*|*Success*) echo "     restored $p";; esac
done

echo "4/4  Removing Home TV..."
adb uninstall $PKG >/dev/null 2>&1 && echo "     uninstalled $PKG"

echo
echo "Done. Press Home on the remote - the original launcher should open."
echo "If an app wasn't restored, install it from the Play Store. See docs/RESET.md."
