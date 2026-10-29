import { History, Timer as TimerIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DataBackup } from "./components/DataBackup";
import { Log } from "./components/Log";
import { Timer } from "./components/Timer";
import { Workouts } from "./components/Workouts";
import { type BeforeExport, load, save } from "./lib/storage";
import { EMPTY, parseWorkout, type Workout, type WorkoutData } from "./lib/workout";

const KEY = "workout-tracker";
type Tab = "workouts" | "log";

const TABS = [
  { id: "workouts", label: "Workouts", Icon: TimerIcon },
  { id: "log", label: "Log", Icon: History },
] as const;

const today = () => new Date().toISOString().slice(0, 10);

export function WorkoutApp({ beforeExport }: { beforeExport?: BeforeExport }) {
  const [tab, setTab] = useState<Tab>("workouts");
  const [data, setData] = useState<WorkoutData>(EMPTY);
  const [active, setActive] = useState<Workout | null>(null);
  const [ready, setReady] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  // Load after mount: localStorage is unavailable during SSR and would cause a hydration mismatch.
  useEffect(() => {
    setData(parseWorkout(load<unknown>(KEY, null)) ?? EMPTY);
    setReady(true);
  }, []);

  const update = (next: WorkoutData) => {
    setData(next);
    save(KEY, next);
  };
  const go = (t: Tab) => {
    setTab(t);
    scroller.current?.scrollTo({ top: 0 });
  };

  if (!ready) return <div className="h-full animate-pulse bg-slate-100" />;

  if (active) {
    return (
      <Timer
        key={active.id}
        workout={active}
        onExit={() => setActive(null)}
        onDone={(seconds) => {
          update({ ...data, log: [...data.log, { id: crypto.randomUUID(), name: active.name, date: today(), seconds }] });
          setActive(null);
          go("log");
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4">
          {tab === "workouts" && <Workouts data={data} onChange={update} onStart={setActive} />}
          {tab === "log" && (
            <>
              <Log data={data} onChange={update} today={today()} />
              <DataBackup filename="workout-tracker.json" data={data} parse={parseWorkout} onRestore={update} beforeExport={beforeExport} />
            </>
          )}
        </div>
      </div>
      <nav aria-label="Workout Tracker" className="grid grid-cols-2 gap-1 border-t border-slate-200 bg-white p-1.5">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? "page" : undefined}
            onClick={() => go(id)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition active:scale-[0.97] ${tab === id ? "bg-rose-700 text-white" : "text-slate-700 hover:bg-slate-100"}`}
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
