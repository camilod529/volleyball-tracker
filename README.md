# Volleyball Tracker

A mobile app for coaches to log volleyball match stats live, in 2–3 taps per action — replacing a paper scoresheet. Built with Expo/React Native, works on iOS and Android, phone and tablet, portrait and landscape. Everything is stored locally on-device; there's no server today (see [`docs/SYNC.md`](./docs/SYNC.md) for what that would take).

## Features

- Team and roster management, with players able to hold multiple positions and a manually-orderable roster (e.g. starters first)
- Live match recording: Player → Action → Outcome in three taps, with a running scoreboard derived automatically from what's logged
- Automatic set/match completion detection, plus manual "end early" for forfeits/injuries/time
- Correct a mistake anywhere in the log, not just the last tap — scores recalculate automatically
- Per-player and per-team stats (serve rating, attack efficiency, passer rating, assists, and more)
- CSV export of the raw action log, for a single match or a whole team's season
- English and Colombian Spanish, with a full volleyball-specific glossary
- Light/dark/system theme

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Expo (managed) + React Native, TypeScript |
| Navigation | Expo Router (file-based) |
| UI | Tamagui |
| Local database | expo-sqlite + Drizzle ORM |
| State | Zustand |
| Localization | i18next / react-i18next |
| Export | expo-file-system + expo-sharing |
| Tests | Jest (`jest-expo` preset) |

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer, and npm
- For iOS: a Mac with Xcode installed (App Store), plus its command-line tools and a simulator
- For Android: [Android Studio](https://developer.android.com/studio) with an emulator configured, or a physical device with USB debugging enabled
- An [Expo account](https://expo.dev/) — free, only needed for cloud builds via EAS (see below), not for local development

## Getting started

```bash
git clone <this-repo>
cd volleyball-tracker
npm install
```

## Development

Start the dev server:

```bash
npm start
```

**Expo Go will very likely not work** — this app tracks the latest Expo SDK, and the Expo Go app on the App/Play Store is usually a version or two behind, so it will refuse to open the project ("Project is incompatible with this version of Expo Go"). Instead, build a native development client once:

```bash
npm run ios       # builds and launches on the iOS Simulator
npm run android   # builds and launches on an Android emulator/device
```

The first run compiles the native project and takes a few minutes; after that, `npm start` + pressing `i`/`a` reuses the same dev client and is fast. You only need to re-run `npm run ios`/`npm run android` (not just `npm start`) after adding a package with native code.

```bash
npm run web       # runs in a browser via react-native-web (not an officially supported target, but works for quick UI checks)
```

## Environment variables

The app is fully local and doesn't currently read any environment variables. `.env.example` documents the shape a future cloud-sync backend would need — see [`docs/SYNC.md`](./docs/SYNC.md) for why that isn't built yet. If you do start that work: `cp .env.example .env` and fill in real values; `.env` is gitignored.

## Testing

```bash
npm test         # Jest — domain logic, repositories, CSV export, i18n coverage (runs headless, no simulator needed)
npm run typecheck # tsc --noEmit
npm run lint      # eslint
```

Anything about how a screen actually looks or behaves (layout, gestures, native modules) needs a real simulator/device — run the app via `npm run ios`/`npm run android` and check it manually. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the fuller testing philosophy.

## Building / compiling a release version

Two ways to get an installable build, depending on whether you want it done on your machine or in the cloud.

### Locally

Requires the full native toolchain (Xcode for iOS, Android Studio/Gradle for Android) already set up as in Prerequisites.

```bash
npx expo run:ios --configuration Release
npx expo run:android --variant release
```

This produces a release-configured build on your machine — good for testing a production build without needing an Expo account, but you're responsible for your own signing certificates/keystores.

### With EAS Build (recommended)

[EAS Build](https://docs.expo.dev/build/introduction/) compiles in the cloud and manages signing credentials for you. `eas.json` in this repo already defines three profiles:

```bash
npx eas login                        # once, needs a free Expo account
npx eas build --platform ios --profile preview       # internal-distribution build for testing
npx eas build --platform android --profile preview
npx eas build --platform ios --profile production     # store-ready build
```

- `development` — a dev client build (like `npm run ios`/`android`, but shareable/installable without a Mac/Android Studio)
- `preview` — internal distribution, for testing a release build on a real device before shipping
- `production` — store-ready, auto-increments the build number

To publish to the App Store / Play Store afterward: `npx eas submit --platform ios` / `--platform android` (needs store-specific credentials configured first — see [EAS Submit docs](https://docs.expo.dev/submit/introduction/)).

## Project structure

```
app/                  # Expo Router screens (file-based routing)
src/
  db/                 # Drizzle schema, SQLite client, migrations
  repositories/        # Data-access layer (Repository<T> pattern) — all writes go through here
  domain/              # Pure business logic: action/outcome taxonomy, scoring, stats (fully unit tested)
  components/           # UI components, grouped by feature (recording/, roster/, stats/, shared/)
  state/                # Zustand stores (session state, settings, active team)
  export/               # CSV building + sharing
  hooks/, utils/, i18n/, theme/
locales/               # en.json / es.json — full glossary, including Colombian Spanish volleyball terms
docs/                  # SYNC.md — the sync-backend seam that's deliberately not built yet
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
