import { Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  formatTime,
  type IntervalSpec,
  intervals,
  PRESETS,
  totalSeconds,
  type Workout,
  type WorkoutData,
} from "../lib/workout";
import { card, field, primary } from "./ui";

const FIELDS: { key: keyof Omit<IntervalSpec, "workName" | "restName">; label: string }[] = [
  { key: "warmup", label: "Warm up (s)" },
  { key: "work", label: "Work (s)" },
  { key: "rest", label: "Rest (s)" },
  { key: "rounds", label: "Rounds" },
  { key: "sets", label: "Sets" },
  { key: "setRest", label: "Rest between sets (s)" },
  { key: "cooldown", label: "Cool down (s)" },
];

interface Props {
  data: WorkoutData;
  onChange: (d: WorkoutData) => void;
  onStart: (w: Workout) => void;
}

export function Workouts({ data, onChange, onStart }: Props) {
  const [name, setName] = useState("");
  const [spec, setSpec] = useState<IntervalSpec>({
    warmup: 60,
    work: 30,
    rest: 15,
    rounds: 8,
    sets: 1,
    setRest: 60,
    cooldown: 60,
  });
  const steps = intervals(spec);
  const all = [...data.custom.map((w) => ({ ...w, group: "Your workouts" })), ...PRESETS];
  const groups = [...new Set(all.map((w) => w.group))];

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!steps.length) return;
    const w: Workout = {
      id: crypto.randomUUID(),
      name: name.trim().slice(0, 60) || `${spec.work}/${spec.rest} ×${spec.rounds}`,
      group: "Your workouts",
      steps,
    };
    onChange({ ...data, custom: [w, ...data.custom] });
    setName("");
    onStart(w);
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <section key={g} aria-labelledby={`g-${g}`} className="flex flex-col gap-2">
          <h2 id={`g-${g}`} className="text-lg font-extrabold">
            {g}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {all
              .filter((w) => w.group === g)
              .map((w) => (
                <li key={w.id} className={`${card} flex items-center gap-2 p-2`}>
                  <button
                    type="button"
                    onClick={() => onStart(w)}
                    className="flex min-h-12 flex-1 items-center gap-3 rounded-xl px-2 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-rose-700"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-rose-700 text-white">
                      <Play size={16} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-bold">{w.name}</span>
                      <span className="text-sm tabular-nums text-slate-600">
                        {formatTime(totalSeconds(w.steps))}
                      </span>
                    </span>
                  </button>
                  {g === "Your workouts" && (
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ ...data, custom: data.custom.filter((x) => x.id !== w.id) })
                      }
                      aria-label={`Delete ${w.name}`}
                      className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
          </ul>
        </section>
      ))}

      <form onSubmit={save} className={`${card} flex flex-col gap-3`}>
        <h2 className="text-lg font-extrabold">Build your own</h2>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Leg day finisher"
            className={field}
          />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1 text-sm font-semibold">
              {f.label}
              <input
                type="number"
                inputMode="numeric"
                min={f.key === "rounds" || f.key === "sets" ? 1 : 0}
                max={f.key === "rounds" || f.key === "sets" ? 50 : 3600}
                value={spec[f.key]}
                onChange={(e) =>
                  setSpec({
                    ...spec,
                    [f.key]: Math.max(0, Math.min(3600, Number(e.target.value) || 0)),
                  })
                }
                className={`${field} tabular-nums`}
              />
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={!steps.length || !spec.work || !spec.rounds || !spec.sets}
          className={primary}
        >
          <Plus size={16} aria-hidden="true" /> Save and start · {formatTime(totalSeconds(steps))}
        </button>
      </form>
    </div>
  );
}
