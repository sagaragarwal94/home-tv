# Setup: Java, Android SDK, adb and connecting to the TV

You only need to do this once. The steps are written for **macOS**; Linux and Windows notes are at the end of each step.

| You need | Why |
| --- | --- |
| Java 17 (JDK) | To build the app |
| Android SDK | To build the app |
| adb (Android Debug Bridge) | To install the app and change settings on the TV |
| TV and computer on the **same Wi-Fi network** | adb connects over the network |

---

## Step 1 - Install Java 17

### Option A (easiest): Android Studio

Install **Android Studio** from <https://developer.android.com/studio>, open it once and finish the setup wizard
(choose **Standard**). It includes its own Java 17 and downloads the Android SDK for you, which also covers Step 2.
`install.sh` finds both automatically, so you never need to open Android Studio again.

### Option B: Homebrew (command line only)

If you don't have Homebrew, install it from <https://brew.sh>. Then:

```bash
brew install openjdk@17
```

Check it worked:

```bash
/opt/homebrew/opt/openjdk@17/bin/java -version
# openjdk version "17.x.x" ...
```

(On Intel Macs the path starts with `/usr/local/opt/` instead of `/opt/homebrew/opt/`.)

> **Linux:** `sudo apt install openjdk-17-jdk`
> **Windows:** install "Microsoft Build of OpenJDK 17" or Android Studio. `install.sh` needs a bash shell (Git Bash or WSL).

---

## Step 2 - Install the Android SDK

Skip this if you used Android Studio (Option A above).

```bash
brew install --cask android-commandlinetools
sdkmanager --licenses                  # type y to accept each licence
sdkmanager "platforms;android-34" "build-tools;34.0.0"
```

`install.sh` looks for the SDK in these places, in order:
`$ANDROID_HOME`, `~/Library/Android/sdk` (Android Studio), `/opt/homebrew/share/android-commandlinetools`,
`/usr/local/share/android-commandlinetools`, `~/Android/Sdk` (Linux). If yours is elsewhere:

```bash
export ANDROID_HOME=/path/to/your/sdk
```

---

## Step 3 - Install adb

```bash
brew install android-platform-tools
adb version
```

> If you installed Android Studio, adb is also at `~/Library/Android/sdk/platform-tools/adb`.
> **Linux:** `sudo apt install adb`  **Windows:** download "SDK Platform-Tools" from developer.android.com.

---

## Step 4 - Turn on debugging on the TV

1. On the TV open **Settings → System → About** (on some models **Settings → Device Preferences → About**).
2. Scroll to **Build** (or "Android TV OS build") and press **OK on it 7 times**. You'll see
   *"You are now a developer!"*
3. Go back to **Settings → System → Developer options**.
4. Turn on **USB debugging**. If you see **Network debugging** or **Wireless debugging**, turn that on too.
5. Find the TV's IP address: **Settings → Network & Internet → (your Wi-Fi network)**. It looks like `192.168.1.23`.

> **Tip:** give the TV a fixed IP in your router settings (often called "DHCP reservation") so the address
> doesn't change and you don't have to look it up each time.

---

## Step 5 - Connect to the TV

```bash
adb connect 192.168.1.23        # use your TV's IP
adb devices
```

The first time, a prompt appears **on the TV**: *"Allow USB debugging?"*. Tick **Always allow from this computer** and choose **OK**.

`adb devices` should now show:

```
List of devices attached
192.168.1.23:5555    device
```

| `adb devices` shows | Meaning |
| --- | --- |
| `device` | Connected. You're ready. |
| `unauthorized` | Accept the prompt on the TV, then run `adb devices` again |
| `offline` | Run `adb disconnect` then `adb connect <IP>` again |
| nothing | See [FAQ → "adb: no devices/emulators found"](FAQ.md#adb-no-devicesemulators-found) |

> **Android 11+ "Wireless debugging":** some TVs use a pairing code instead. In Developer options open
> **Wireless debugging → Pair device with pairing code**, then on the Mac run
> `adb pair <IP>:<pairing-port>` and enter the code, followed by `adb connect <IP>:<port-shown-on-screen>`.

---

## Step 6 - Build and install

From the project folder:

```bash
./install.sh
```

The first build downloads Gradle (~130 MB) and the Android build plugin, so it takes a few minutes.
Later builds take seconds. To reinstall without rebuilding: `./install.sh --no-build`.

Now go back to the [README](../README.md#quick-start) for making it your Home screen.
