# Workout Tracker

Interval timer for any workout: HIIT, Tabata, circuits, couch to 5k, boxing rounds, swim sets, with a log and streak.

- Presets: Tabata, HIIT 40/20, EMOM, circuits, boxing and grappling rounds, stretching and plank holds, swim sets, rowing pyramid, couch to 5k weeks 1 to 9
- Build your own: warm up, work, rest, rounds, sets, rest between sets, cool down
- Clock-based timer (never drifts), beeps for each step and the last three seconds, vibration, keeps the screen awake
- Log with day streak and weekly minutes
- Data stays in the browser (localStorage). Download a backup file and restore it on any device.

Two ways this repo ships, from the same `src/`:

| Target | How |
|---|---|
| **GitHub Pages** (`madelinben.github.io/workout-tracker/`) | `pnpm build:demo` builds `demo/` into `docs/` (Pages source: `main` / `/docs`) |
| **get-out-there** (Cloudflare) | imported as workspace package `@get-out-there/workout` (`WorkoutApp`) |

```bash
pnpm install
pnpm dev          # demo at http://localhost:3109/workout-tracker/
pnpm test         # logic unit tests
pnpm build:demo   # static site -> docs/
```

Package rules: no router/auth/app imports; Tailwind default palette only (no custom tokens); host must `@source` this folder. Peer deps: react, react-dom, lucide-react.

Host hook: `<WorkoutApp beforeExport={gate} />` runs `gate(label)` before a backup download or restore (e.g. an ad gate); reject to cancel.
