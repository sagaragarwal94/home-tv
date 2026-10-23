# Home TV

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/sagaragarwal94/home-tv)](https://github.com/sagaragarwal94/home-tv/releases)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A clean, Apple TV–style home screen for Android TV, built for and tested on a **Vu** TV
(Android TV with the Google TV launcher). No ads, no recommendation rows, no sponsored apps:
just your wallpaper, the time, the weather and your apps.

<!-- Screenshot: run  adb exec-out screencap -p > docs/screenshot.png  then add  ![Home TV](docs/screenshot.png)  here -->

## Features

- **Full-screen photo wallpaper** that softly blurs and dims when you scroll into your apps.
  15 photos included; the **Wallpaper** button cycles through them.
- **Time, date and live weather** in the top-right corner (Open-Meteo, no account or API key).
- **Apple TV–style app grid**: 5 per row, rounded tiles using each app's official TV banner,
  lift-and-shadow focus, app name under the selected tile.
- **Quick buttons** (top left): **Inputs** (switch HDMI), **Wi-Fi**, **Wallpaper**, **Settings**.
- **Hold OK on an app** for **Move**, **Hide from Home**, **App info** and **Show hidden apps**.
- System tools and non-TV apps are hidden automatically.
- Lightweight: a single Android activity hosting a local web page. No internet needed except for weather.

## Quick start

**Just want to try it?** Download `home-tv-v1.0.0.apk` from the [latest release](https://github.com/sagaragarwal94/home-tv/releases/latest), connect to your TV ([docs/SETUP.md](docs/SETUP.md) steps 3-5) and run `adb install home-tv-v1.0.0.apk`. Then do step 3 below. No Java or Android SDK needed.

**To build it yourself:**

You need a Mac (Linux works too), the TV and the Mac on the same Wi-Fi, and about 20 minutes.

1. **Set up the tools and connect to the TV** - follow [docs/SETUP.md](docs/SETUP.md)
   (Java 17, Android SDK, adb, and turning on debugging on the TV).
2. **Build and install:**
   ```bash
   adb connect <TV-IP-address>
   ./install.sh
   ```
3. **Make it the Home screen.** `install.sh` tries this automatically. If the old launcher still
   opens when you press Home, disable it (you can undo this any time - see [docs/RESET.md](docs/RESET.md)):
   ```bash
   adb shell pm disable-user --user 0 com.google.android.tvlauncher
   ```
   On older Android TV models the launcher is `com.google.android.leanbacklauncher` instead.

Something went wrong? See **[docs/FAQ.md](docs/FAQ.md)**.
Want everything back the way it was? See **[docs/RESET.md](docs/RESET.md)** or run `./scripts/reset.sh`.

## Remote control

| Button | On an app | On the top-left buttons | In a menu |
| --- | --- | --- | --- |
| ◀ ▶ ▲ ▼ | Move around the grid (▲ from the first row goes to the buttons) | Move between buttons (▼ back to apps) | ▲ ▼ choose |
| **OK** (press) | Open the app | Use the button | Choose |
| **OK** (hold) | App menu: Move, Hide, App info, Show hidden apps | - | - |
| **Back** | Jump to the first app | Back to the apps | Close |
| **Home** | Return here from any app; if already here, jump to the first app | | |

**Moving an app:** hold OK → **Move**, then use the arrows, and press OK to drop it.

## Customising

Everything you see lives in `app/src/main/assets/web/`. After any change, run `./install.sh` again.

| What | Where |
| --- | --- |
| Weather city | `CITY` at the top of `app.js` (name, latitude, longitude) |
| Apps shown first on a fresh install | `FAVOURITES` in `app.js` (Android package names) |
| Apps hidden automatically | `HIDE_BY_DEFAULT` in `app.js` |
| Apps per row, tile spacing | `COLS`, `COL_W`, `ROW_H` in `app.js` and `.cell`/`.tile` sizes in `style.css` |
| Colours, fonts, sizes | `style.css` |
| Wallpapers | Add a 1920×1080 JPG to `wallpapers/`, a small blurred copy to `wallpapers/blur/`, and an entry in `wallpapers.js` |

Find an app's package name with `adb shell pm list packages | grep -i <name>`.

**Live debugging:** with the TV connected, open `chrome://inspect` in Chrome on your Mac and click
**inspect** under Home TV to see the page, console errors and styles in real time.

## How it works

```
app/src/main/
├── java/com/cleanframe/tv/MainActivity.java   Full-screen WebView + "TV" bridge:
│                                              list apps & banners, launch apps,
│                                              list/switch HDMI inputs, open settings
├── assets/web/                                The home screen itself
│   ├── index.html, style.css, app.js          Layout, look, remote navigation, weather
│   ├── wallpapers.js, wallpapers/             Photos and their credits
│   └── fonts/                                 Manrope
└── AndroidManifest.xml                        Registers the app as a Home screen
```

The page is laid out at a fixed 1920×1080 and scaled to fit the screen. Your app order, hidden
apps and wallpaper choice are saved on the TV (WebView local storage) and survive updates.

The Android package id is `com.cleanframe.tv` (a leftover from the CleanFrame port). It's kept so
existing installs update in place; see the FAQ if you want to change it.

## Docs

- [docs/SETUP.md](docs/SETUP.md) - install Java, the Android SDK and adb; connect to the TV
- [docs/DEBLOAT.md](docs/DEBLOAT.md) - removing preinstalled apps and services safely
- [docs/RESET.md](docs/RESET.md) - undo everything and go back to the original TV
- [docs/FAQ.md](docs/FAQ.md) - errors and fixes
- [CHANGELOG.md](CHANGELOG.md) - what changed in each release

## Contributing

Pull requests are welcome! Bug reports, "works on my TV" reports, docs fixes and new features all help.
See [CONTRIBUTING.md](CONTRIBUTING.md) to get started, or browse the
[open issues](https://github.com/sagaragarwal94/home-tv/issues) - look for `good first issue`.

## Credits and licence

Home TV is released under the [MIT License](LICENSE).

It began as a port of [CleanFrame](https://github.com/nthnclrk/CleanFrame) by Nathan Clark (MIT),
a home screen for Samsung The Frame. Wallpapers are Unsplash photographs, the font is Manrope (OFL),
and weather is from Open-Meteo. Full details in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Use at your own risk. Everything here is reversible, but you are changing system settings on your TV.
