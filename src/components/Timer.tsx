import { Pause, Play, SkipForward, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  formatTime,
  position,
  type StepKind,
  startOf,
  totalSeconds,
  type Workout,
} from "../lib/workout";

const COLOUR = {
  warmup: "bg-amber-700",
  work: "bg-rose-700",
  rest: "bg-sky-800",
  cooldown: "bg-teal-800",
} satisfies Record<StepKind, string>;

interface Props {
  workout: Workout;
  onDone: (seconds: number) => void;
  onExit: () => void;
}

/** Full-screen countdown. Time comes from the clock, not from counting ticks, so it never drifts. */
export function Timer({ workout, onDone, onExit }: Props) {
  const { steps } = workout;
  const total = totalSeconds(steps);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const audio = useRef<AudioContext | null>(null);
  const lastCue = useRef("");
  /** performance.now() at elapsed 0; moved on resume and skip */
  const origin = useRef(0);
  const { index, remaining } = position(steps, elapsed);
  const step = steps[index];
  const next = steps[index + 1];
  const finished = index >= steps.length;

  // Frame loop while running: an external clock, so an effect is the right tool.
  // biome-ignore lint/correctness/useExhaustiveDependencies: elapsed is only the resume point, re-running per tick would restart the loop
  useEffect(() => {
    if (!running || finished) return;
    origin.current = performance.now() - elapsed * 1000;
    let frame = requestAnimationFrame(function tick(now) {
      setElapsed(Math.floor((now - origin.current) / 100) / 10);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [running, finished]);

  // Keep the screen on while the timer runs.
  useEffect(() => {
    if (!running || finished) return;
    let lock: WakeLockSentinel | undefined;
    navigator.wakeLock
      ?.request("screen")
      .then((l) => {
        lock = l;
      })
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [running, finished]);

  // Beep on each new step and the last three seconds; buzz phones that support it.
  const cue = `${index}:${Math.ceil(remaining)}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: cue changes once per second or step, the rest is read from the same render
  useEffect(() => {
    if (!running || finished) return;
    const starting = !lastCue.current.startsWith(`${index}:`);
    lastCue.current = cue;
    if (!starting && Math.ceil(remaining) > 3) return;
    audio.current ??= new AudioContext();
    const ctx = audio.current;
    const osc = ctx.createOscillator();
    osc.frequency.value = starting ? 880 : 520;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (starting ? 0.35 : 0.12));
    if (starting) navigator.vibrate?.(200);
  }, [cue]);

  function skip() {
    const to = startOf(steps, index + 1);
    origin.current = performance.now() - to * 1000;
    setElapsed(to);
  }

  if (finished) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-emerald-800 p-6 text-center text-white">
        <p className="text-4xl font-black">Done</p>
        <p className="text-lg">
          {workout.name} · {formatTime(total)}
        </p>
        <button
          type="button"
          onClick={() => onDone(total)}
          className="min-h-12 rounded-xl bg-white px-6 font-bold text-emerald-900"
        >
          Save to log
        </button>
        <button type="button" onClick={onExit} className="min-h-11 text-sm font-semibold underline">
          Close without saving
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full flex-col p-4 text-white transition-colors ${COLOUR[step?.kind ?? "work"]}`}
    >
      <p className="text-sm font-semibold opacity-90">{workout.name}</p>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-2xl font-extrabold uppercase tracking-wide" aria-live="polite">
          {step?.name}
        </p>
        <p className="font-black tabular-nums leading-none [font-size:min(30vw,9rem)]">
          {formatTime(remaining)}
        </p>
        <p className="text-sm opacity-90">
          Step {index + 1} of {steps.length}
          {next && ` · next: ${next.name} ${formatTime(next.seconds)}`}
        </p>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/30" aria-hidden="true">
        <div className="h-full bg-white" style={{ width: `${(elapsed / total) * 100}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onExit}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-black/25 font-bold"
        >
          <Square size={18} aria-hidden="true" /> Stop
        </button>
        <button
          type="button"
          onClick={() => setRunning(!running)}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-white font-bold text-slate-900"
        >
          {running ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
          {running ? "Pause" : "Resume"}
        </button>
        <button
          type="button"
          onClick={skip}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-black/25 font-bold"
        >
          <SkipForward size={18} aria-hidden="true" /> Skip
        </button>
      </div>
    </div>
  );
}
