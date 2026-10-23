# Contributing to Home TV

Thanks for wanting to help! Pull requests, bug reports and "it works on my TV" reports are all welcome —
you don't need to be an Android developer. Most of the home screen is plain HTML, CSS and JavaScript.

## Good ways to help

- **Test it on your TV** and open a ["Works on" report](https://github.com/sagaragarwal94/home-tv/issues/new?template=tv_report.md) — every model helps.
- **Pick up an issue** labelled [`good first issue`](https://github.com/sagaragarwal94/home-tv/labels/good%20first%20issue) or [`help wanted`](https://github.com/sagaragarwal94/home-tv/labels/help%20wanted).
- **Improve the docs** — if a step confused you, it'll confuse someone else.
- **Share a screenshot** of your setup for the README.

## Getting started

1. Fork the repo and clone your fork.
2. Follow [docs/SETUP.md](docs/SETUP.md) to install Java 17, the Android SDK and adb.
3. Connect to your TV and run `./install.sh`.
4. Make your change on a new branch: `git checkout -b my-change`.

### Where things live

| Change | Edit |
| --- | --- |
| Look and layout | `app/src/main/assets/web/style.css`, `index.html` |
| Remote navigation, grid, menus, weather | `app/src/main/assets/web/app.js` |
| Talking to Android (launch apps, inputs, settings) | `app/src/main/java/com/cleanframe/tv/MainActivity.java` (`Bridge` class) |
| Install / reset | `install.sh`, `scripts/reset.sh` |

### Debugging

Open `chrome://inspect` in Chrome on your computer while the TV is connected and click **inspect** under Home TV.
You get the live page, console and CSS editor. Android logs: `adb logcat | grep HomeTV`.

## Guidelines

- **Keep it light.** It has to run smoothly on budget TV hardware: prefer transforms/opacity over blur filters,
  avoid big libraries, and keep the page plain JavaScript (no build step).
- **Remote first.** Every feature must work with arrows, OK, Back and Home alone.
- **No tracking, no ads, no extra network calls.** Weather (Open-Meteo) is the only request the app makes.
- **Reversible.** Anything that changes TV settings must be documented in `docs/RESET.md` and undone by `scripts/reset.sh`.
- **Assets** must be free to redistribute and credited in `THIRD_PARTY_NOTICES.md`.

## Pull requests

- One topic per PR; describe what changed and how you tested it (TV model).
- Include a screenshot for visual changes (`adb exec-out screencap -p > screen.png`).
- By contributing you agree your work is released under the [MIT License](LICENSE).

## Be kind

Be respectful and patient — many people here are setting up adb for the first time.
