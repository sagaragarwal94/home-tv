#!/bin/bash
# Builds Home TV and installs it as the Home screen on the TV connected over adb.
# Usage: ./install.sh              (build + install)
#        ./install.sh --no-build   (install the last build)
#        ./install.sh --build-only (just build the APK, no TV needed)
set -e
cd "$(dirname "$0")"
PKG=com.cleanframe.tv
APK=app/build/outputs/apk/debug/app-debug.apk

# --- Check the TV is connected ---------------------------------------------
if [ "$1" != "--build-only" ]; then
command -v adb >/dev/null || { echo "adb not found. See docs/SETUP.md (step 3)."; exit 1; }
if ! adb devices | awk 'NR>1 && $2=="device"' | grep -q .; then
  echo "No TV connected over adb."
  echo "Run: adb connect <TV-IP-address>   then try again. See docs/FAQ.md if it fails."
  exit 1
fi
fi

if [ "$1" != "--no-build" ]; then
  # --- Java 17 ---------------------------------------------------------------
  if [ -z "$JAVA_HOME" ]; then
    for j in "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
             "$(/usr/libexec/java_home -v 17 2>/dev/null)" \
             "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" \
             "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" \
             "/usr/lib/jvm/java-17-openjdk-amd64"; do
      if [ -n "$j" ] && [ -x "$j/bin/java" ]; then export JAVA_HOME="$j"; break; fi
    done
  fi
  [ -n "$JAVA_HOME" ] || { echo "Java 17 not found. See docs/SETUP.md (step 1)."; exit 1; }

  # --- Android SDK -----------------------------------------------------------
  if [ -z "$ANDROID_HOME" ]; then
    for s in "$HOME/Library/Android/sdk" "$HOME/Android/Sdk" \
             "/opt/homebrew/share/android-commandlinetools" "/usr/local/share/android-commandlinetools"; do
      if [ -d "$s" ]; then export ANDROID_HOME="$s"; break; fi
    done
  fi
  [ -n "$ANDROID_HOME" ] || { echo "Android SDK not found. See docs/SETUP.md (step 2)."; exit 1; }
  echo "sdk.dir=$ANDROID_HOME" > local.properties

  # --- Gradle 8.7: reuse a copy already on this Mac before downloading ----------
  # The wrapper only reuses a download made from the exact same URL, so look for
  # any Gradle 8.7 that's already unpacked (or a zip in Downloads) and run it directly.
  GRADLE_VER=8.7
  LOCAL_GRADLE_DIR="$HOME/.gradle/home-tv/gradle-$GRADLE_VER"
  find_gradle() {
    for g in "$HOME"/.gradle/wrapper/dists/gradle-$GRADLE_VER-bin/*/gradle-$GRADLE_VER/bin/gradle \
             "$HOME"/.gradle/wrapper/dists/gradle-$GRADLE_VER-all/*/gradle-$GRADLE_VER/bin/gradle \
             "$LOCAL_GRADLE_DIR/bin/gradle"; do
      [ -x "$g" ] && { echo "$g"; return 0; }
    done
    return 1
  }
  unpack_gradle() {   # $1 = path to gradle-8.7-bin.zip
    mkdir -p "$HOME/.gradle/home-tv"
    unzip -qo "$1" -d "$HOME/.gradle/home-tv" && chmod +x "$LOCAL_GRADLE_DIR/bin/gradle"
  }

  GRADLE="$(find_gradle || true)"
  if [ -z "$GRADLE" ] && [ -f "$HOME/Downloads/gradle-$GRADLE_VER-bin.zip" ]; then
    echo "Using ~/Downloads/gradle-$GRADLE_VER-bin.zip"
    unpack_gradle "$HOME/Downloads/gradle-$GRADLE_VER-bin.zip" && GRADLE="$(find_gradle || true)"
  fi

  if [ -n "$GRADLE" ]; then
    echo "Using Gradle at $GRADLE"
    "$GRADLE" --no-daemon assembleDebug
  else
    chmod +x gradlew
    if ! ./gradlew --no-daemon assembleDebug; then
      echo
      echo "Gradle wrapper couldn't download Gradle. Trying curl instead..."
      ZIP="$HOME/Downloads/gradle-$GRADLE_VER-bin.zip"
      curl -fL --retry 5 --retry-delay 3 --connect-timeout 30 -o "$ZIP" \
        "https://services.gradle.org/distributions/gradle-$GRADLE_VER-bin.zip" \
        || { echo "Download failed. See docs/FAQ.md -> 'Gradle download timeout'."; exit 1; }
      unpack_gradle "$ZIP"
      GRADLE="$(find_gradle)"
      echo "Using Gradle at $GRADLE"
      "$GRADLE" --no-daemon assembleDebug
    fi
  fi
fi

if [ "$1" = "--build-only" ]; then [ -f "$APK" ] && { echo "Built: $APK"; exit 0; } || { echo "Build finished but no APK at $APK"; exit 1; }; fi

[ -f "$APK" ] || { echo "No APK at $APK - run ./install.sh without --no-build."; exit 1; }

# --- Install and make it the Home screen -------------------------------------
adb install -r "$APK"
adb shell cmd package set-home-activity $PKG/.MainActivity >/dev/null 2>&1 || true
adb shell am force-stop $PKG
adb shell am start -n $PKG/.MainActivity >/dev/null
echo
echo "Installed. Press Home on the remote."
echo "If the old launcher still opens, see docs/FAQ.md -> 'Home still opens the old launcher'."
