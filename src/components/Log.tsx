import { Flame, Trash2 } from "lucide-react";
import { formatTime, streak, type WorkoutData } from "../lib/workout";
import { card } from "./ui";

export function Log({ data, onChange, today }: { data: WorkoutData; onChange: (d: WorkoutData) => void; today: string }) {
  const days = streak(data.log, today);
  const week = data.log.filter((l) => l.date > new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10));
  const recent = [...data.log].reverse().slice(0, 30);

  return (
    <section aria-labelledby="log-h" className="flex flex-col gap-4">
      <h2 id="log-h" className="text-xl font-extrabold">
        Log
      </h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        <p className={card}>
          <Flame size={18} aria-hidden="true" className="mx-auto text-rose-700" />
          <span className="block text-2xl font-black tabular-nums">{days}</span>
          <span className="text-sm text-slate-600">day streak</span>
        </p>
        <p className={card}>
          <span className="block text-2xl font-black tabular-nums">{week.length}</span>
          <span className="text-sm text-slate-600">this week</span>
        </p>
        <p className={card}>
          <span className="block text-2xl font-black tabular-nums">{Math.round(week.reduce((n, l) => n + l.seconds, 0) / 60)}</span>
          <span className="text-sm text-slate-600">minutes this week</span>
        </p>
      </div>
      {recent.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 ring-1 ring-slate-200">Finish a workout and save it to start your streak.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {recent.map((l) => (
            <li key={l.id} className="flex items-center gap-3 rounded-xl bg-white py-1 pl-3 pr-1 ring-1 ring-slate-200">
              <span className="w-24 tabular-nums text-slate-600">{l.date}</span>
              <span className="flex-1 font-semibold">{l.name}</span>
              <span className="tabular-nums">{formatTime(l.seconds)}</span>
              <button
                type="button"
                onClick={() => onChange({ ...data, log: data.log.filter((x) => x.id !== l.id) })}
                aria-label={`Delete ${l.name} on ${l.date}`}
                className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
