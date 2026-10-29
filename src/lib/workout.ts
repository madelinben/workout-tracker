export type StepKind = "warmup" | "work" | "rest" | "cooldown";

export interface Step {
  name: string;
  seconds: number;
  kind: StepKind;
}

export interface Workout {
  id: string;
  name: string;
  group: string;
  steps: Step[];
}

export interface IntervalSpec {
  warmup: number;
  work: number;
  rest: number;
  rounds: number;
  sets: number;
  setRest: number;
  cooldown: number;
  workName?: string;
  restName?: string;
}

export interface LogEntry {
  id: string;
  name: string;
  /** yyyy-mm-dd */
  date: string;
  seconds: number;
}

export interface WorkoutData {
  version: 1;
  custom: Workout[];
  log: LogEntry[];
}

export const EMPTY: WorkoutData = { version: 1, custom: [], log: [] };

/** Expand a work/rest pattern into steps; sets repeat the rounds with a longer rest between */
export function intervals(s: IntervalSpec): Step[] {
  const steps: Step[] = [];
  if (s.warmup) steps.push({ name: "Warm up", seconds: s.warmup, kind: "warmup" });
  for (let set = 0; set < s.sets; set++) {
    for (let r = 0; r < s.rounds; r++) {
      steps.push({ name: s.workName ?? "Work", seconds: s.work, kind: "work" });
      const last = r === s.rounds - 1;
      if (!last && s.rest)
        steps.push({ name: s.restName ?? "Rest", seconds: s.rest, kind: "rest" });
    }
    if (set < s.sets - 1 && s.setRest)
      steps.push({ name: "Set rest", seconds: s.setRest, kind: "rest" });
  }
  if (s.cooldown) steps.push({ name: "Cool down", seconds: s.cooldown, kind: "cooldown" });
  return steps;
}

const run = (seconds: number): Step => ({ name: "Run", seconds, kind: "work" });
const walk = (seconds: number): Step => ({ name: "Walk", seconds, kind: "rest" });
const c25k = (week: number, middle: Step[]): Workout => ({
  id: `c25k-${week}`,
  name: `Couch to 5k: week ${week}`,
  group: "Couch to 5k",
  steps: [
    { name: "Brisk walk", seconds: 300, kind: "warmup" },
    ...middle,
    { name: "Walk", seconds: 300, kind: "cooldown" },
  ],
});
const repeat = (n: number, steps: Step[]) => Array.from({ length: n }, () => steps).flat();
const preset = (id: string, name: string, group: string, spec: IntervalSpec): Workout => ({
  id,
  name,
  group,
  steps: intervals(spec),
});
const base = { warmup: 0, rest: 0, sets: 1, setRest: 0, cooldown: 0 };

export const PRESETS: readonly Workout[] = [
  preset("tabata", "Tabata (20s on, 10s off ×8)", "Intervals", {
    ...base,
    warmup: 60,
    work: 20,
    rest: 10,
    rounds: 8,
  }),
  preset("hiit-40-20", "HIIT 40/20 ×10", "Intervals", {
    ...base,
    warmup: 120,
    work: 40,
    rest: 20,
    rounds: 10,
    cooldown: 120,
  }),
  preset("emom-10", "EMOM 10 minutes", "Intervals", {
    ...base,
    work: 60,
    rounds: 10,
    workName: "Minute",
  }),
  preset("circuit", "Circuit: 8 stations ×3", "Intervals", {
    ...base,
    warmup: 180,
    work: 45,
    rest: 15,
    rounds: 8,
    sets: 3,
    setRest: 90,
    cooldown: 120,
    workName: "Station",
  }),
  preset("boxing", "Boxing: 6 × 3-minute rounds", "Combat", {
    ...base,
    work: 180,
    rest: 60,
    rounds: 6,
    workName: "Round",
  }),
  preset("bjj-rolls", "Grappling: 5 × 5-minute rolls", "Combat", {
    ...base,
    work: 300,
    rest: 60,
    rounds: 5,
    workName: "Roll",
  }),
  preset("stretch", "Stretch: 10 × 30s holds", "Mobility", {
    ...base,
    work: 30,
    rest: 5,
    rounds: 10,
    workName: "Hold",
    restName: "Switch",
  }),
  preset("plank", "Plank builder: 5 × 45s", "Mobility", {
    ...base,
    work: 45,
    rest: 30,
    rounds: 5,
    workName: "Plank",
  }),
  preset("swim-sets", "Swim: 10 × 100 m on 2:30", "Swim and row", {
    ...base,
    work: 150,
    rounds: 10,
    workName: "100 m",
  }),
  {
    id: "row-pyramid",
    name: "Row: 1-2-3-2-1 minute pyramid",
    group: "Swim and row",
    steps: [1, 2, 3, 2, 1].flatMap((m, i): Step[] => [
      ...(i ? [{ name: "Easy", seconds: 60, kind: "rest" as const }] : []),
      { name: `Row ${m} min`, seconds: m * 60, kind: "work" },
    ]),
  },
  c25k(1, repeat(8, [run(60), walk(90)])),
  c25k(2, repeat(6, [run(90), walk(120)])),
  c25k(3, repeat(2, [run(90), walk(90), run(180), walk(180)])),
  c25k(4, [run(180), walk(90), run(300), walk(150), run(180), walk(90), run(300)]),
  c25k(5, repeat(3, [run(300), walk(180)])),
  c25k(6, [run(300), walk(180), run(480), walk(180), run(300)]),
  c25k(7, [run(1500)]),
  c25k(8, [run(1680)]),
  c25k(9, [run(1800)]),
];

export const totalSeconds = (steps: readonly Step[]) => steps.reduce((n, s) => n + s.seconds, 0);

/** Where the timer is after `elapsed` seconds: step index (steps.length when finished) and seconds left in it */
export function position(
  steps: readonly Step[],
  elapsed: number
): { index: number; remaining: number } {
  let t = elapsed;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]?.seconds ?? 0;
    if (t < s) return { index: i, remaining: s - t };
    t -= s;
  }
  return { index: steps.length, remaining: 0 };
}

/** Seconds from the start to the beginning of a step (for skip) */
export const startOf = (steps: readonly Step[], index: number) =>
  totalSeconds(steps.slice(0, index));

/** Consecutive days with a workout, ending today or yesterday */
export function streak(log: readonly LogEntry[], today: string): number {
  const days = new Set(log.map((l) => l.date));
  const d = new Date(`${today}T12:00:00Z`);
  if (!days.has(today)) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (days.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function parseWorkout(raw: unknown): WorkoutData | null {
  if (typeof raw !== "object" || raw === null) return null;
  const d = raw as Partial<WorkoutData>;
  return d.version === 1 && Array.isArray(d.log)
    ? { version: 1, custom: d.custom ?? [], log: d.log }
    : null;
}
